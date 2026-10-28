'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'verificar-chat-navegador.cjs'),'utf8');
const mock=source.slice(source.indexOf('function mockFirebase(){'),source.indexOf('\n(async()=>'))+'\nmockFirebase();';
let count=0;const check=(a,b)=>{assert.deepEqual(a,b);count++;};
(async()=>{let server,browser;try{
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const pages=[],records=new Map(),receipts=new Map(),errors=[],attempts=[];let clock=Date.now(),failBefore=false,ackLost=false,pauseRead=null,pauseSend=null,queries=0;
 const seed=(id,texto,createdAt,respostaId)=>{const m={id,texto,createdAt,autorUid:'b',autorNome:'Professor B',autorEmail:'b@example.test'};if(respostaId)m.respostaId=respostaId;records.set(id,m);};
 seed('original','Combinado original: revisar as metas na próxima reunião.',clock-86400000);seed('remota','Original remoto para testar consulta atrasada',clock-86400001);
 for(let i=0;i<105;i++)seed('h-'+i,'Mensagem de histórico '+i,clock-120000+i*500);
 seed('texto-seguro','Texto de teste <img src=x onerror=alert(1)>',clock-90000);seed('outra','Outro assunto da equipe',clock-60000);seed('citacao','Resposta já cadastrada',clock-10000,'original');seed('ausente-ref','Resposta com original ausente',clock-9000,'inexistente');seed('remota-ref','Resposta com original remoto',clock-8000,'remota');
 const list=()=>[...records.values()].sort((a,b)=>b.createdAt-a.createdAt);
 const emit=async()=>{await Promise.all(pages.map(p=>p.evaluate(rows=>__chatEmit(rows),list())));};
 async function session(uid){const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(mock);await page.exposeFunction('chatRPC',async(action,data)=>{
  if(action==='list'){queries++;if(pauseRead)await pauseRead;return list();}
  if(action==='receipts')return [...receipts.values()];if(action==='getReceipt')return receipts.get(data.messageId+'/'+data.uid)||null;
  if(data.kind==='receipt'){receipts.set(data.messageId+'/'+data.id,{...data,lidoEm:++clock});return;}
  attempts.push(data.id);if(pauseSend)await pauseSend;if(failBefore){failBefore=false;throw Error('Falha antes da gravação');}
  records.set(data.id,{...data,createdAt:++clock});await emit();if(ackLost){ackLost=false;throw Error('Confirmação perdida');}
 });await page.route('**/*',r=>{const u=r.request().url();if(!u.startsWith(origin+'/'))return r.abort();if(/firebase-.*-compat\.js/.test(u))return r.fulfill({contentType:'application/javascript',body:''});return r.continue();});await page.goto(origin+'/index.html',{waitUntil:'networkidle'});pages.push(page);await page.evaluate(uid=>{__test.login(uid);selecionarTurno('Matutino');},uid);await page.locator('#chatAbrir').click();await page.waitForFunction(()=>document.querySelectorAll('#chatMensagens article').length===100);return page;}
 const a=await session('a'),b=await session('b');const card=(p,id)=>p.locator('[data-message-id="'+id+'"]');const replyTo=async(p,id)=>{await card(p,id).locator('.chat-responder').click();};
 const before=records.size,reads=queries;check((await card(a,'citacao').locator('.chat-referencia').textContent()).includes('mensagem anterior'),true);
 await card(a,'citacao').locator('.chat-referencia').click();await a.waitForFunction(()=>document.querySelector('[data-message-id="original"]'));
 check(queries,reads+1);check(records.size,before);check(await a.locator('.chat-original-destaque').getAttribute('data-message-id'),'original');check(await a.locator('#chatMensagens img').count(),0);
 const knownReads=queries;await card(a,'citacao').locator('.chat-referencia').click();check(queries,knownReads);check(await a.locator('#chatStatus').textContent(),'Mensagem original localizada.');
 await a.locator('#chatTexto').fill('Texto já digitado.');await replyTo(a,'texto-seguro');check(await a.locator('#chatTexto').inputValue(),'Texto já digitado.');check((await a.locator('#chatRespostaTrecho').textContent()).includes('<img'),true);check(await a.locator('#chatResposta img').count(),0);
 await a.getByRole('button',{name:'Cancelar resposta',exact:true}).click();check(await a.locator('#chatResposta').isHidden(),true);check(await a.locator('#chatTexto').inputValue(),'Texto já digitado.');
 await replyTo(a,'original');await a.getByRole('button',{name:'Ampliar painel do chat',exact:true}).click();fs.mkdirSync('/tmp/site-results',{recursive:true});await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-resposta-previa.png'});
 for(const width of [390,320]){await a.setViewportSize({width,height:844});check(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);check(await a.locator('#chatMensagens').evaluate(el=>el.clientHeight>=60),true);await a.locator('#chatPainel').screenshot({path:'/tmp/site-results/chat-resposta-previa-'+width+'.png'});}
 await a.setViewportSize({width:1440,height:1000});await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');
 const first=[...records.values()].find(m=>m.texto==='Texto já digitado.');check(first.respostaId,'original');check(first.autorUid,'a');check(first.texto,'Texto já digitado.');check('respostaTexto' in first,false);check(await a.locator('#chatResposta').isHidden(),true);
 await card(b,first.id).locator('.chat-referencia').waitFor();check((await card(b,first.id).locator('.chat-referencia').textContent()).includes('mensagem anterior'),true);
 await card(b,first.id).locator('.chat-referencia').click();await b.waitForFunction(()=>!!document.querySelector('[data-message-id="original"]'));check((await card(b,first.id).locator('.chat-referencia').textContent()).includes('Combinado original'),true);
 await card(a,first.id).screenshot({path:'/tmp/site-results/chat-resposta-enviada.png'});
 // Falha antes de gravar preserva referência e texto; repetir usa o mesmo ID.
 await replyTo(a,'outra');await a.locator('#chatTexto').fill('Resposta para tentar novamente.');failBefore=true;const n=records.size;
 await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent.includes('referência foram mantidos'));
 const failedId=attempts.at(-1);check(records.size,n);check(await a.locator('#chatTexto').inputValue(),'Resposta para tentar novamente.');check((await a.locator('#chatRespostaTrecho').textContent()).includes('Outro assunto'),true);
 await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');check(attempts.at(-1),failedId);check([...records.values()].filter(m=>m.texto==='Resposta para tentar novamente.').length,1);
 // Confirmação perdida não duplica a resposta já persistida.
 await replyTo(a,'original');await a.locator('#chatTexto').fill('Resposta com confirmação perdida.');ackLost=true;
 await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent.includes('referência foram mantidos'));const committed=attempts.at(-1);
 await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');check([...records.values()].filter(m=>m.texto==='Resposta com confirmação perdida.').length,1);check(records.get(committed).respostaId,'original');
 // Alterar a referência cria outra tentativa, mantendo o corpo da mensagem.
 await replyTo(a,'original');await a.locator('#chatTexto').fill('Mesmo texto com outra referência.');failBefore=true;await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent.includes('referência foram mantidos'));const changed=attempts.at(-1);
 await a.locator('#chatRespostaCancelar').click();await replyTo(a,'outra');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');check(attempts.at(-1)!==changed,true);check(records.get(attempts.at(-1)).respostaId,'outra');
 await replyTo(a,'original');await a.locator('#chatTexto').fill('Mensagem comum após cancelar.');await a.locator('#chatRespostaCancelar').click();await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');check('respostaId' in [...records.values()].find(m=>m.texto==='Mensagem comum após cancelar.'),false);
 await a.locator('#chatTexto').fill('Rascunho para preservar.');await card(a,'ausente-ref').locator('.chat-referencia').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent==='Mensagem original não encontrada.');check(await a.locator('#chatTexto').inputValue(),'Rascunho para preservar.');
 // Fechar/reabrir conserva o rascunho com referência, sem enviar.
 await replyTo(a,'outra');const same=records.size;await a.locator('#chatFechar').click();await a.locator('#chatAbrir').click();check((await a.locator('#chatRespostaTrecho').textContent()).includes('Outro assunto'),true);check(records.size,same);
 await a.locator('#chatRespostaCancelar').click();
 let resumeRead;pauseRead=new Promise(r=>resumeRead=r);const q=queries;await card(a,'remota-ref').locator('.chat-referencia').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent==='Consultando mensagem original…');check(queries,q+1);await a.evaluate(()=>firebase.auth().signOut());resumeRead();pauseRead=null;await a.waitForTimeout(100);check(await a.locator('#chatMensagens article').count(),0);check(await a.locator('#chatResposta').isHidden(),true);
 // Resposta de uma sessão anterior não pode limpar o novo rascunho/seleção.
 await a.evaluate(()=>{__test.login('a');selecionarTurno('Matutino');});await a.locator('#chatAbrir').click();await a.waitForFunction(()=>document.querySelector('[data-message-id="outra"]'));
 await replyTo(a,'outra');await a.locator('#chatTexto').fill('Envio da sessão anterior.');let resumeSend;pauseSend=new Promise(r=>resumeSend=r);await a.locator('#chatEnviar').click();check(await a.locator('#chatRespostaCancelar').isDisabled(),true);check(await a.locator('#chatTexto').isDisabled(),true);
 await a.evaluate(()=>{__test.login('c');selecionarTurno('Matutino');});await a.locator('#chatAbrir').click();await a.waitForFunction(()=>document.querySelector('[data-message-id="outra"]'));check(await a.locator('#chatResposta').isHidden(),true);await replyTo(a,'outra');await a.locator('#chatTexto').fill('Rascunho da nova conta.');resumeSend();pauseSend=null;await a.waitForTimeout(200);
 check(await a.locator('#chatTexto').inputValue(),'Rascunho da nova conta.');check(await a.locator('#chatResposta').isVisible(),true);check(errors,[]);
 console.log(count+' verificações de respostas do chat no Chromium passaram; Firebase simulado, dados fictícios e pedidos externos bloqueados.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
