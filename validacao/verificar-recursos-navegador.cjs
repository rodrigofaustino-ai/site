'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function mockFirebase() {
  let authCallbacks = [], listeners = [], counter = 0;
  const records = new Map(), files = new Map();
  const timestamp = value => ({toMillis:() => value, toDate:() => new Date(value)});
  const auth = {currentUser:null, onAuthStateChanged(callback) {authCallbacks.push(callback); queueMicrotask(() => callback(this.currentUser));}, async signOut() {this.currentUser=null; authCallbacks.forEach(callback=>callback(null));}};
  function snapshot() {return {docs:[...records.entries()].sort((a,b)=>b[1].createdAt.toMillis()-a[1].createdAt.toMillis()).map(([id,data])=>({id,data:()=>data})),forEach(){}};}
  function emit() {listeners.forEach(callback=>callback(snapshot()));}
  function reference(id) {return {id, async get(){return {exists:records.has(id),data:()=>records.get(id)};}};}
  const shared = {doc(id){return reference(id || 'plano-'+(++counter));},orderBy(){return this;},onSnapshot(callback){listeners.push(callback);queueMicrotask(()=>callback(snapshot()));return ()=>{listeners=listeners.filter(item=>item!==callback);};}};
  const db = {collection(name){if(name==='chatEquipe')return {orderBy(){return this;},limit(){return this;},onSnapshot(callback){queueMicrotask(()=>callback({docs:[]}));return ()=>{};}};if(name==='recursosDidaticos')return shared;return {where(){return this;},async get(){return {docs:[],forEach(){}};}};},async runTransaction(callback){const actions=[];const transaction={get:reference=>reference.get(),set(reference,data){actions.push(()=>records.set(reference.id,data));},update(reference,data){actions.push(()=>records.set(reference.id,{...records.get(reference.id),...data}));},delete(reference){actions.push(()=>records.delete(reference.id));}};await callback(transaction);actions.forEach(action=>action());emit();}};
  function firestore(){return db;}
  firestore.FieldValue={serverTimestamp:()=>timestamp(Date.now())};
  const storage={ref(name){return {bucket:'demo.test',async put(file){files.set(name,await file.arrayBuffer());},async delete(){files.delete(name);}};}};
  window.firebase={initializeApp(){},auth:()=>auth,firestore,storage:()=>storage};
  window.__test={login(uid){auth.currentUser={uid,email:uid+'@example.test',getIdToken:async()=> 'test-token-'+uid};authCallbacks.forEach(callback=>callback(auth.currentUser));},records,files,listenerCount:()=>listeners.length};
  const originalFetch=window.fetch;
  window.fetch=async(url, options)=>{
    if(!url.startsWith('https://firebasestorage.googleapis.com/'))return originalFetch(url,options);
    if(!auth.currentUser || options.headers.Authorization !== 'Firebase test-token-'+auth.currentUser.uid)throw new Error('Teste: falta autenticação');
    if(url.includes('token='))throw new Error('Teste: URL pública não permitida');
    const name=decodeURIComponent(new URL(url).pathname.split('/o/')[1]);
    return files.has(name)?new Response(files.get(name)):new Response('',{status:404});
  };
}
(async()=>{
let server,browser;
try {
server=http.createServer((req,res)=>{const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(filename));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(mockFirebase);
await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});
await page.goto(origin+'/index.html');await page.evaluate(()=>RecursosDidaticos.activate());assert.match(await page.locator('#recursosStatus').textContent(),/Entre no Diário/);
await page.evaluate(()=>{__test.login('professor-a');selecionarTurno('Matutino');switchTab('recursos');});
await page.locator('#recursoDescricao').fill('Atividades de alfabetização <script>alert(1)</script>');await page.locator('#recursoLink').fill('https://example.org/materiais');await page.locator('#recursoSalvar').click();await page.waitForFunction(()=>document.getElementById('recursosStatus').textContent.includes('Recurso cadastrado'));
assert.equal(await page.locator('#recursosLista article').count(),1);assert.equal(await page.locator('#recursosLista script').count(),0);assert.match(await page.locator('#recursosLista').textContent(),/Inserido em:.*\d{2}\/\d{2}\/\d{4}/);
const originalDate=await page.evaluate(()=>[...__test.records.values()][0].createdAt.toMillis());assert.equal(await page.locator('#recursosLista a').getAttribute('href'),'https://example.org/materiais');assert.equal(await page.locator('#recursosLista a').getAttribute('rel'),'noopener noreferrer');
await page.locator('#recursosBusca').fill('alfabetizacao');assert.equal(await page.locator('#recursosLista article').count(),1);await page.locator('#recursosBusca').fill('inexistente');assert.equal(await page.locator('#recursosLista article').count(),0);await page.locator('#recursosBusca').fill('');
await page.evaluate(()=>{__test.login('professor-b');selecionarTurno('Vespertino');switchTab('recursos');});await page.waitForFunction(()=>document.querySelectorAll('#recursosLista article').length===1);assert.equal(await page.locator('#recursosLista button').count(),0);assert.equal(await page.locator('#recursosLista a').count(),1);
await page.evaluate(()=>{__test.login('professor-a');selecionarTurno('Matutino');switchTab('recursos');});await page.locator('#recursosLista button').filter({hasText:'Editar'}).click();await page.locator('#recursoDescricao').fill('Descrição atualizada');await page.locator('#recursoLink').fill('https://example.org/novo');await page.locator('#recursoSalvar').click();await page.waitForFunction(()=>document.getElementById('recursosStatus').textContent==='Alterações salvas.');assert.equal(await page.evaluate(()=>[...__test.records.values()][0].createdAt.toMillis()),originalDate);
await page.locator('#recursoDescricao').fill('Recurso inválido');await page.locator('#recursoLink').fill('javascript:alert(1)');await page.locator('#recursoSalvar').click();await page.waitForFunction(()=>document.getElementById('recursosStatus').textContent.includes('Use um endereço'));assert.equal(await page.evaluate(()=>__test.records.size),1);
await page.locator('#recursoLink').fill('https://usuario:senha@example.org/');await page.locator('#recursoSalvar').click();assert.match(await page.locator('#recursosStatus').textContent(),/sem senha/);
page.once('dialog',dialog=>dialog.accept());await page.locator('#recursosLista button').filter({hasText:'Excluir'}).click();await page.waitForFunction(()=>document.getElementById('recursosStatus').textContent==='Recurso excluído.');assert.equal(await page.evaluate(()=>__test.records.size),0);
await page.evaluate(()=>firebase.auth().signOut());assert.equal(await page.locator('#recursosLista article').count(),0);assert.equal(await page.locator('#recursoDescricao').inputValue(),'');assert.equal(await page.evaluate(()=>__test.listenerCount()),0);
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{__test.login('professor-a');selecionarTurno('Matutino');switchTab('recursos');});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
console.log('Recursos Didáticos: cadastro, data automática, busca, dois professores/turnos, link seguro, edição, data preservada, exclusão, logout e celular passaram (Firebase simulado).');
}finally{if(browser)await browser.close();if(server)server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
