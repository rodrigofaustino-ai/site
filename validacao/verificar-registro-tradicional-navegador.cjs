'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function mock(){
 const callbacks=[],entries=[];
 const auth={currentUser:null,onAuthStateChanged(fn){callbacks.push(fn);queueMicrotask(()=>fn(this.currentUser));},async signOut(){this.currentUser=null;callbacks.forEach(fn=>fn(null));}};
 const empty={where(){return this;},orderBy(){return this;},limit(){return this;},onSnapshot(fn){queueMicrotask(()=>fn({docs:[]}));return ()=>{};},async get(){return {docs:[],forEach(){}};}};
 const db={collection(name){
  if(name==='alunos')return {...empty,doc(id){return {async set(){},collection(){return {async add(data){entries.push(JSON.parse(JSON.stringify(data)));return {id:'entry-'+entries.length};}};}};}};
  return empty;
 }};
 function firestore(){return db;}firestore.FieldValue={serverTimestamp:()=>0};window.firebase={initializeApp(){},auth:()=>auth,firestore,storage:()=>({})};
 window.__test={entries,login(){auth.currentUser={uid:'a',email:'a@example.test'};callbacks.forEach(fn=>fn(auth.currentUser));}};
}
(async()=>{let server,browser;try{
 server=http.createServer((req,res)=>{const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(filename));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(mock);await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});await page.goto(origin+'/index.html');await page.evaluate(()=>{__test.login();currentStudentId='aluno-a';showScreen('profile');});
 assert.equal(await page.locator('#registroMetas').count(),0);assert.equal(await page.evaluate(()=>typeof window.RegistroMetas),'undefined');
 await page.locator('#entryText').fill('Observação do atendimento tradicional');await page.locator('#entryDate').fill('2026-10-16');await page.locator('#btnSalvarRegistro').click();await page.waitForFunction(()=>__test.entries.length===1);
 const entry=await page.evaluate(()=>__test.entries[0]);assert.equal(entry.text,'Observação do atendimento tradicional');assert.equal('registroRapido' in entry,false);
 await page.evaluate(()=>{currentEntries=[{_id:'antigo',date:'2026-10-15',text:'Evidência já salva antes da alteração.',registroRapido:{metas:[{id:'legado',descricao:'Meta antiga'}]}}];renderEntriesList();});assert.match(await page.locator('#entriesList').textContent(),/Evidência já salva antes da alteração/);assert.deepEqual(errors,[]);
 console.log('Formulário tradicional: sem metas/ficha rápida, registro salvo normalmente e histórico anterior preservado (Firebase simulado).');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
