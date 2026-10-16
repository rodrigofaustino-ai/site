'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function mockFirebase(){
 let callbacks=[],listeners=[];const auth={currentUser:null,onAuthStateChanged(fn){callbacks.push(fn);queueMicrotask(()=>fn(this.currentUser));},async signOut(){this.currentUser=null;callbacks.forEach(fn=>fn(null));}};
 const stamp=value=>({toMillis:()=>value,toDate:()=>new Date(value)});
 const convert=records=>({docs:records.map(record=>({id:record.id,data:()=>({...record,createdAt:stamp(record.createdAt)})})),metadata:{fromCache:false}});
 const emit=records=>listeners.forEach(fn=>fn(convert(records.slice(0,100))));window.__chatEmit=emit;
 const reference=id=>({id,async get(){const records=await window.chatRPC('list');const record=records.find(item=>item.id===id);return {exists:!!record,data:()=>record};}});
 const shared={doc(id){return reference(id||crypto.randomUUID());},orderBy(){return this;},limit(){return this;},onSnapshot(fn){listeners.push(fn);window.chatRPC('list').then(records=>{if(listeners.includes(fn))fn(convert(records.slice(0,100)));});return ()=>{listeners=listeners.filter(item=>item!==fn);};},startAfter(cursor){return {limit(){return this;},async get(){const records=await window.chatRPC('list');return convert(records.slice(records.findIndex(record=>record.id===cursor.id)+1).slice(0,50));}};}};
 const other={where(){return this;},async get(){return {docs:[],forEach(){}};}};
 const db={collection(name){return name==='chatEquipe'?shared:other;},async runTransaction(fn){const actions=[];await fn({get:ref=>ref.get(),set(ref,data){actions.push({id:ref.id,...data});}});for(const data of actions)await window.chatRPC('send',data);}};
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
  const pages=[],records=new Map(),errors=[];let clock=Date.now(),failNext=false;
  const list=()=>[...records.values()].sort((a,b)=>b.createdAt-a.createdAt);
  async function emit(){await Promise.all(pages.map(page=>page.evaluate(rows=>window.__chatEmit(rows),list())));}
  async function session(){const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(mockFirebase);await page.exposeFunction('chatRPC',async(action,data)=>{if(action==='list')return list();if(failNext){failNext=false;throw Error('Falha fictícia de rede');}records.set(data.id,{...data,createdAt:++clock});await emit();});await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});await page.goto(origin+'/index.html');pages.push(page);return page;}
  const a=await session(),b=await session();assert.equal(await a.locator('#chatEquipe').isVisible(),false);
  for(const [page,uid] of [[a,'a'],[b,'b']])await page.evaluate(uid=>{__test.login(uid);selecionarTurno(uid==='a'?'Matutino':'Vespertino');},uid);
  assert.equal(await a.locator('#chatEquipe').isVisible(),true);
  await a.locator('#chatAbrir').click();await a.locator('#chatTexto').fill('Olá equipe <script>alert(1)</script>');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent==='Mensagem enviada.');
  await b.waitForFunction(()=>!document.getElementById('chatNaoLidas').hidden);assert.equal(await b.locator('#chatNaoLidas').textContent(),'1');
  await b.locator('#chatAbrir').click();assert.match(await b.locator('#chatMensagens').textContent(),/Olá equipe/);assert.equal(await b.locator('#chatMensagens script').count(),0);assert.equal(await b.locator('#chatNaoLidas').isVisible(),false);assert.match(await b.locator('.chat-mensagem small').textContent(),/\d{2}\/\d{2}\/\d{4}/);
  await b.locator('#chatTexto').fill('Recebido!');await b.locator('#chatEnviar').click();await a.waitForFunction(()=>document.querySelectorAll('.chat-mensagem').length===2);assert.match(await a.locator('#chatMensagens').textContent(),/Recebido!/);
  await b.locator('#chatFechar').click();await a.locator('#chatTexto').fill('Mais uma mensagem');await a.locator('#chatEnviar').click();await b.waitForFunction(()=>document.getElementById('chatNaoLidas').textContent==='1');
  failNext=true;await a.locator('#chatTexto').fill('Tentar novamente');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatStatus').textContent.includes('Seu texto foi mantido'));assert.equal(await a.locator('#chatTexto').inputValue(),'Tentar novamente');await a.locator('#chatEnviar').click();await a.waitForFunction(()=>document.getElementById('chatTexto').value==='');assert.equal([...records.values()].filter(item=>item.texto==='Tentar novamente').length,1);
  for(let i=0;i<105;i++)records.set('historico-'+i,{id:'historico-'+i,texto:'Histórico '+i,autorUid:'b',autorNome:'Professor B',autorEmail:'b@example.test',createdAt:++clock});
  await a.evaluate(()=>firebase.auth().signOut());assert.equal(await a.locator('#chatEquipe').isVisible(),false);assert.equal(await a.locator('#chatMensagens article').count(),0);assert.equal(await a.evaluate(()=>__test.listenerCount()),0);
  await a.evaluate(()=>{__test.login('a');selecionarTurno('Matutino');});await a.locator('#chatAbrir').click();await a.waitForFunction(()=>document.querySelectorAll('#chatMensagens article').length===100);await a.locator('#chatHistorico').click();await a.waitForFunction(()=>document.querySelectorAll('#chatMensagens article').length===109);assert.equal(await a.locator('#chatHistorico').isVisible(),false);
  await a.setViewportSize({width:390,height:844});assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const box=await a.locator('#chatPainel').boundingBox();assert(box.x>=0&&box.x+box.width<=390);
  await a.locator('#chatTexto').fill('Rascunho privado');await a.evaluate(()=>__test.login('c'));assert.equal(await a.locator('#chatTexto').inputValue(),'');assert.equal(await a.locator('#chatPainel').isVisible(),false);assert.deepEqual(errors,[]);
  console.log('Chat: duas sessões, atualização em tempo real, envio explícito, não lidas, texto seguro, data, falha/reenvio sem duplicação, histórico, logout/troca de conta e celular passaram (Firebase simulado).');
 }finally{if(browser)await browser.close();if(server)server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
