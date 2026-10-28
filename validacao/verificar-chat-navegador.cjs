'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function mockFirebase(){
 let callbacks=[],listeners=[],readerListeners=new Map();const auth={currentUser:null,onAuthStateChanged(fn){callbacks.push(fn);queueMicrotask(()=>fn(this.currentUser));},async signOut(){this.currentUser=null;callbacks.forEach(fn=>fn(null));}};
 const stamp=value=>({toMillis:()=>value,toDate:()=>new Date(value)});
 const convert=records=>({docs:records.map(record=>({id:record.id,data:()=>({...record,createdAt:stamp(record.createdAt)})})),metadata:{fromCache:false}});
 const emit=records=>listeners.forEach(fn=>fn(convert(records.slice(0,100))));window.__chatEmit=emit;
 const receiptRef=(messageId,uid)=>({id:uid,kind:'receipt',messageId,async get(){const data=await window.chatRPC('getReceipt',{messageId,uid});return {exists:!!data};}});
 window.__chatReceiptsEmit=rows=>readerListeners.forEach((callbacks,id)=>callbacks.forEach(fn=>fn({docs:rows.filter(row=>row.messageId===id).map(row=>({id:row.id,data:()=>({...row,lidoEm:stamp(row.lidoEm)})}))})));
 const reference=id=>({id,collection(){return {doc:uid=>receiptRef(id,uid),orderBy(){return this;},limit(){return this;},onSnapshot(fn){const group=readerListeners.get(id)||[];group.push(fn);readerListeners.set(id,group);window.chatRPC('receipts').then(rows=>window.__chatReceiptsEmit(rows));return ()=>readerListeners.set(id,(readerListeners.get(id)||[]).filter(item=>item!==fn));}};},async get(){const records=await window.chatRPC('list');const record=records.find(item=>item.id===id);return {exists:!!record,data:()=>record};}});
 const shared={doc(id){return reference(id||crypto.randomUUID());},orderBy(){return this;},limit(){return this;},onSnapshot(fn){listeners.push(fn);window.chatRPC('list').then(records=>{if(listeners.includes(fn))fn(convert(records.slice(0,100)));});return ()=>{listeners=listeners.filter(item=>item!==fn);};},startAfter(cursor){return {limit(){return this;},async get(){const records=await window.chatRPC('list');return convert(records.slice(records.findIndex(record=>record.id===cursor.id)+1).slice(0,50));}};}};
 const other={where(){return this;},async get(){return {docs:[],forEach(){}};}};
 const db={collection(name){return name==='chatEquipe'?shared:other;},async runTransaction(fn){const actions=[];await fn({get:ref=>ref.get(),set(ref,data){actions.push({id:ref.id,kind:ref.kind,messageId:ref.messageId,...data});}});for(const data of actions)await window.chatRPC('send',data);}};
 function firestore(){return db;}firestore.FieldValue={serverTimestamp:()=>0};
 window.firebase={initializeApp(){},auth:()=>auth,firestore,storage:()=>({})};
 window.__test={login(uid){auth.currentUser={uid,email:uid+'@example.test'};callbacks.forEach(fn=>fn(auth.currentUser));},listenerCount:()=>listeners.length};
}
(async()=>{
 let browser,server;
 try{
  server=http.createServer((req,res)=>{const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(filename));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const pages=[],records=new Map(),receipts=new Map(),errors=[];let clock=Date.now(),failNext=false,consultas=0;
  const list=()=>[...records.values()].sort((a,b)=>b.createdAt-a.createdAt);
  async function emit(){await Promise.all(pages.map(page=>page.evaluate(rows=>window.__chatEmit(rows),list())));}
  async function session(){const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(mockFirebase);await page.exposeFunction('chatRPC',async(action,data)=>{if(action==='list'){consultas++;return list();}if(action==='receipts')return [...receipts.values()];if(action==='getReceipt')return receipts.get(data.messageId+'/'+data.uid)||null;if(data.kind==='receipt'){const key=data.messageId+'/'+data.id;if(!receipts.has(key))receipts.set(key,{...data,lidoEm:++clock});await Promise.all(pages.map(p=>p.evaluate(rows=>window.__chatReceiptsEmit(rows),[...receipts.values()])));return;}if(failNext){failNext=false;throw Error('Falha fictícia de rede');}records.set(data.id,{...data,createdAt:++clock});await emit();});await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});await page.goto(origin+'/index.html');pages.push(page);return page;}
  const a=await session(),b=await session();assert.equal(await a.locator('#chatEquipe').isVisible(),false);
  for(const [page,uid] of [[a,'a'],[b,'b']])await page.evaluate(uid=>{__test.login(uid);selecionarTurno(uid==='a'?'Matutino':'Vespertino');},uid);
  assert.equal(await a.locator('#chatEquipe').isVisible(),true);
  await a.locator('#chatAbrir').click();await a.locator('#chatTexto').fill('Olá equipe <script>alert(1)</script>');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent==='Mensagem enviada.');
  await b.waitForFunction(()=>!document.getElementById('chatNaoLidas').hidden);assert.equal(await b.locator('#chatNaoLidas').textContent(),'1');
  assert.equal(receipts.size,0);await b.evaluate(()=>Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}));await b.locator('#chatAbrir').click();await b.waitForTimeout(850);assert.equal(receipts.size,0);await b.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});assert.match(await b.locator('#chatMensagens').textContent(),/Olá equipe/);assert.equal(await b.locator('#chatMensagens script').count(),0);await b.waitForFunction(()=>document.getElementById('chatNaoLidas').hidden);assert.equal(await b.locator('#chatNaoLidas').isVisible(),false);assert.match(await b.locator('.chat-mensagem small').textContent(),/\d{2}\/\d{2}\/\d{4}/);
  await b.waitForTimeout(800);assert.equal([...receipts.values()].filter(row=>row.uid==='b').length,1);await a.locator('.chat-ver-leituras').first().click();await a.waitForFunction(()=>document.getElementById('chatLeiturasLista').textContent.includes('b'));assert(!await a.locator('#chatLeiturasLista').textContent().then(text=>text.includes('@')));await a.locator('#chatLeiturasFechar').click();
  await b.locator('#chatTexto').fill('Recebido!');await b.locator('#chatEnviar').click();await a.waitForFunction(()=>document.querySelectorAll('.chat-mensagem').length===2);assert.match(await a.locator('#chatMensagens').textContent(),/Recebido!/);
  await b.locator('#chatFechar').click();await a.locator('#chatTexto').fill('Mais uma mensagem');await a.locator('#chatEnviar').click();await b.waitForFunction(()=>document.getElementById('chatNaoLidas').textContent==='1');
  failNext=true;await a.locator('#chatTexto').fill('Tentar novamente');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent.includes('Seu texto foi mantido'));assert.equal(await a.locator('#chatTexto').inputValue(),'Tentar novamente');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');assert.equal([...records.values()].filter(item=>item.texto==='Tentar novamente').length,1);
  const meioDia=new Date();meioDia.setHours(12,0,0,0);
  for(let i=0;i<105;i++)records.set('historico-'+i,{id:'historico-'+i,texto:i===0?'Pauta única da reunião pedagógica':'Histórico '+i,autorUid:'b',autorNome:i===0?'Professora Áurea':'Professor B',autorEmail:'b@example.test',createdAt:meioDia.getTime()-(i<50?2:1)*86400000+i*1000});
  await a.evaluate(()=>firebase.auth().signOut());assert.equal(await a.locator('#chatEquipe').isVisible(),false);assert.equal(await a.locator('#chatMensagens article').count(),0);assert.equal(await a.evaluate(()=>__test.listenerCount()),0);
  await a.evaluate(()=>{__test.login('a');selecionarTurno('Matutino');});await a.locator('#chatAbrir').click();await a.waitForFunction(()=>document.querySelectorAll('#chatMensagens article').length===100);// Busca limitada ao que já foi carregado, sem consultas automáticas.
  await a.locator('#chatBusca summary').click();await a.getByLabel('Buscar no texto ou autor das mensagens carregadas').fill('pauta unica');
  assert.match(await a.locator('#chatBuscaResultado').textContent(),/Nenhum resultado/);assert.match(await a.locator('#chatBuscaEscopo').textContent(),/100 mensagens/);
  assert.equal(await a.getByRole('button',{name:'Próximo resultado',exact:true}).isDisabled(),true);
  const consultasBusca=consultas,tamanhoBusca=records.size;
  await a.locator('#chatBuscaTermo').fill('PAUTA UNICA');assert.equal(consultas,consultasBusca);
  await a.locator('#chatHistorico').click();await a.waitForFunction(()=>document.querySelectorAll('#chatMensagens article').length===109);assert.equal(await a.locator('#chatHistorico').isVisible(),false);
  assert.match(await a.locator('#chatBuscaResultado').textContent(),/1 resultado/);assert.match(await a.locator('#chatBuscaEscopo').textContent(),/109 mensagens/);assert.equal(consultas,consultasBusca+1);
  await a.waitForTimeout(850);assert.equal(receipts.has('historico-0/a'),false);
  await a.getByRole('button',{name:'Próximo resultado',exact:true}).click();assert.equal(await a.locator('.chat-busca-atual').getAttribute('data-message-id'),'historico-0');
  await a.waitForFunction(async()=>Boolean(await window.chatRPC('getReceipt',{messageId:'historico-0',uid:'a'})));
  await a.locator('#chatBuscaTermo').fill('AUREA');assert.match(await a.locator('#chatBuscaResultado').textContent(),/1 resultado/);await a.locator('#chatBuscaTermo').press('Enter');assert.equal(await a.locator('.chat-busca-atual').getAttribute('data-message-id'),'historico-0');
  await a.locator('#chatBuscaTermo').fill('<script>');assert.match(await a.locator('#chatBuscaResultado').textContent(),/1 resultado/);assert.equal(await a.locator('#chatMensagens script').count(),0);
  await a.locator('#chatBuscaTermo').fill('não existe esse assunto');assert.equal(await a.getByRole('button',{name:'Resultado anterior',exact:true}).isDisabled(),true);
  await a.locator('#chatBuscaTermo').fill('histórico');assert.match(await a.locator('#chatBuscaResultado').textContent(),/104 resultado/);await a.getByRole('button',{name:'Resultado anterior',exact:true}).click();assert.match(await a.locator('#chatBuscaResultado').textContent(),/Resultado 104 de 104/);await a.getByRole('button',{name:'Próximo resultado',exact:true}).click();assert.match(await a.locator('#chatBuscaResultado').textContent(),/Resultado 1 de 104/);
  await a.locator('#chatTexto').fill('Rascunho preservado durante a busca');await a.locator('#chatBuscaTermo').fill('pauta unica');await a.locator('#chatBuscaTermo').press('Enter');
  assert.equal(await a.locator('#chatTexto').inputValue(),'Rascunho preservado durante a busca');assert.equal(records.size,tamanhoBusca);assert.equal(consultas,consultasBusca+1);
  await a.getByRole('button',{name:'Ampliar painel do chat',exact:true}).click();fs.mkdirSync('/tmp/site-results',{recursive:true});await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-busca.png'});
  for(const width of [390,320]){await a.setViewportSize({width,height:844});assert(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await a.locator('#chatMensagens').evaluate(el=>el.clientHeight>=60));await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-busca-'+width+'.png'});}
  await a.setViewportSize({width:1280,height:720});await a.getByRole('button',{name:'Reduzir painel do chat',exact:true}).click();
  await a.getByRole('button',{name:'Limpar busca',exact:true}).click();assert.equal(await a.locator('#chatBuscaTermo').inputValue(),'');assert.equal(await a.locator('.chat-encontrada').count(),0);await a.locator('#chatBusca summary').click();
  await a.locator('#chatBusca summary').click();await a.locator('#chatBuscaTermo').fill('pauta unica');await a.locator('#chatFechar').click();assert.equal(await a.locator('#chatBuscaTermo').inputValue(),'');assert.equal(await a.locator('#chatBusca').evaluate(el=>el.open),false);assert.equal(await a.locator('#chatTexto').inputValue(),'Rascunho preservado durante a busca');await a.locator('#chatAbrir').click();assert.equal(consultas,consultasBusca+1);
  await a.locator('[data-message-id="historico-0"]').scrollIntoViewIfNeeded();await a.waitForFunction(async()=>Boolean(await window.chatRPC('getReceipt',{messageId:'historico-0',uid:'a'})));
  fs.mkdirSync('/tmp/site-results',{recursive:true});
  // Agrupamento por data, posição preservada e aviso apenas para novidades.
  assert.equal(await a.locator('#chatNovas').isHidden(),true);
  assert.equal(await a.locator('.chat-dia').count(),3);
  assert.equal(await a.locator('#chatOnlineTotal').isHidden(),true);
  assert.equal(await a.locator('#chatOnlineRotulo').textContent(),'Presença indisponível');
  await a.evaluate(()=>document.dispatchEvent(new CustomEvent('diario:online',{detail:{available:true,users:[{apelido:'Professora fictícia'}]}})));
  assert.equal(await a.locator('#chatOnlineTotal').textContent(),'1');assert.equal(await a.locator('#chatOnlineLista li').count(),1);
  await a.evaluate(()=>document.dispatchEvent(new CustomEvent('diario:online',{detail:{available:false,users:[{apelido:'DADO ANTIGO'}]}})));
  assert.equal(await a.locator('#chatOnlineTotal').isHidden(),true);assert.equal(await a.locator('#chatOnlineLista li').count(),0);
  const anchor=()=>a.evaluate(()=>{const list=document.getElementById('chatMensagens'),top=list.getBoundingClientRect().top,node=[...list.querySelectorAll('[data-message-id]')].find(el=>el.getBoundingClientRect().bottom>top);return {id:node.dataset.messageId,offset:node.getBoundingClientRect().top-top};});
  const anterior=await anchor();
  records.set('nova-1',{id:'nova-1',texto:'Nova mensagem enquanto lê o histórico',autorUid:'b',autorNome:'Professor B',autorEmail:'b@example.test',createdAt:++clock});await emit();
  await a.waitForFunction(()=>!document.getElementById('chatNovas').hidden);
  const depois=await anchor();assert.equal(depois.id,anterior.id);assert(Math.abs(depois.offset-anterior.offset)<2);
  assert.match(await a.locator('#chatNovas').textContent(),/^1 nova/);
  await a.waitForTimeout(850);assert.equal(receipts.has('nova-1/a'),false);
  await a.locator('#chatBusca summary').click();await a.locator('#chatBuscaTermo').fill('sem interromper');assert.match(await a.locator('#chatBuscaResultado').textContent(),/Nenhum resultado/);
  records.set('nova-2',{id:'nova-2',texto:'Segunda novidade sem interromper a leitura',autorUid:'b',autorNome:'Professor B',autorEmail:'b@example.test',createdAt:++clock});await emit();await emit();
  assert.match(await a.locator('#chatNovas').textContent(),/^2 nova/);assert.match(await a.locator('#chatBuscaResultado').textContent(),/1 resultado/);assert.equal(await a.locator('.chat-busca-atual').count(),0);await a.locator('#chatBuscaLimpar').click();await a.locator('#chatBusca summary').click();
  await a.locator('#chatTexto').fill('Rascunho preservado ao ampliar');
  const tamanho=records.size;await a.getByRole('button',{name:'Ampliar painel do chat',exact:true}).click();
  assert.equal(await a.locator('#chatAmpliar').getAttribute('aria-pressed'),'true');assert.equal(records.size,tamanho);assert.equal(await a.locator('#chatTexto').inputValue(),'Rascunho preservado ao ampliar');
  const posAmpla=await anchor();assert.equal(posAmpla.id,anterior.id);assert(Math.abs(posAmpla.offset-anterior.offset)<2);
  const amplo=await a.locator('#chatPainel').boundingBox();assert(amplo.width>550&&amplo.x>=0&&amplo.x+amplo.width<=1280);
  await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-ampliado.png'});
  await a.getByRole('button',{name:'Reduzir painel do chat',exact:true}).click();assert.equal(await a.locator('#chatAmpliar').getAttribute('aria-pressed'),'false');
  await a.locator('#chatNovas').click();assert.equal(await a.locator('#chatNovas').isHidden(),true);
  await a.waitForFunction(async()=>Boolean(await window.chatRPC('getReceipt',{messageId:'nova-2',uid:'a'})));
  assert(await a.locator('#chatMensagens').evaluate(el=>el.scrollHeight-el.scrollTop-el.clientHeight<5));
  records.set('nova-3',{id:'nova-3',texto:'Mensagem acompanhada no fim da conversa',autorUid:'b',autorNome:'Professor B',autorEmail:'b@example.test',createdAt:++clock});await emit();
  assert.equal(await a.locator('#chatNovas').isHidden(),true);assert(await a.locator('#chatMensagens').evaluate(el=>el.scrollHeight-el.scrollTop-el.clientHeight<5));
  await a.getByRole('button',{name:'Ampliar painel do chat',exact:true}).click();await a.keyboard.press('Escape');assert.equal(await a.locator('#chatPainel').isHidden(),true);assert(await a.locator('#chatAbrir').evaluate(el=>el===document.activeElement));
  await a.locator('#chatAbrir').click();assert.equal(await a.locator('#chatAmpliar').getAttribute('aria-pressed'),'true');
  fs.mkdirSync('/tmp/site-results',{recursive:true});
  await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-visual.png'});
  for(const width of [390,320]){
   await a.setViewportSize({width,height:844});assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const box=await a.locator('#chatPainel').boundingBox();assert(box.x>=0&&box.x+box.width<=width);
   assert(await a.locator('#chatEnviar').evaluate(el=>el.getBoundingClientRect().height>=44));
   await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-visual-'+width+'.png'});
  }
  assert.equal(records.size,tamanho+1);
  await a.locator('#chatBusca summary').click();await a.locator('#chatBuscaTermo').fill('NÃO TRANSPORTAR A CONSULTA');
  await a.locator('#chatTexto').fill('Rascunho privado');await a.evaluate(()=>__test.login('c'));assert.equal(await a.locator('#chatTexto').inputValue(),'');assert.equal(await a.locator('#chatPainel').isVisible(),false);assert.equal(await a.locator('#chatAmpliar').getAttribute('aria-pressed'),'false');assert.equal(await a.locator('#chatNovas').isHidden(),true);assert.equal(await a.locator('#chatBuscaTermo').inputValue(),'');assert.equal(await a.locator('.chat-encontrada').count(),0);assert.deepEqual(errors,[]);
  console.log('Busca: texto/autor, acentos/maiúsculas, escopo limitado, histórico carregado depois, navegação circular, Enter, texto seguro, rascunho, nenhuma consulta automática e celular passaram.');
  console.log('Leituras: não registra chat fechado/aba oculta/mensagem fora da área de leitura, confirma após exposição, lista leitor com apelido sem @.');
  console.log('Novidades: agrupamento por três datas, aviso sem duplicação, leitura preservada, confirmação somente após exposição, ampliar/reduzir, Escape e presença indisponível passaram.');
  console.log('Chat: duas sessões, atualização em tempo real, envio explícito, não lidas, texto seguro, data, falha/reenvio sem duplicação, histórico, logout/troca de conta e celular passaram (Firebase simulado).');
 }finally{if(browser)await browser.close();if(server)server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
