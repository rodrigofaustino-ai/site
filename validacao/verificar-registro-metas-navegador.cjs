'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function mock(){
 const callbacks=[],goals=new Map(),entries=[],listeners=[];let counter=0;
 const auth={currentUser:null,onAuthStateChanged(fn){callbacks.push(fn);queueMicrotask(()=>fn(this.currentUser));},async signOut(){this.currentUser=null;callbacks.forEach(fn=>fn(null));}};
 const timestamp=()=>({toMillis:()=>Date.now(),toDate:()=>new Date()});
 const snapshot=filters=>({docs:[...goals].filter(([,data])=>filters.every(([key,value])=>data[key]===value)).map(([id,data])=>({id,data:()=>data}))});
 const emit=()=>listeners.forEach(({filters,fn})=>fn(snapshot(filters)));
 function metaQuery(filters=[]){return {where(key,op,value){return metaQuery([...filters,[key,value]]);},onSnapshot(fn){const item={filters,fn};listeners.push(item);queueMicrotask(()=>fn(snapshot(filters)));return ()=>{const index=listeners.indexOf(item);if(index>=0)listeners.splice(index,1);};},async add(data){const id='meta-'+(++counter);goals.set(id,data);emit();return {id};},doc(id){return {async update(data){goals.set(id,{...goals.get(id),...data});emit();}};}};}
 const empty={where(){return this;},orderBy(){return this;},limit(){return this;},onSnapshot(fn){queueMicrotask(()=>fn({docs:[]}));return ()=>{};},async get(){return {docs:[],forEach(){}};}};
 const db={collection(name){
   if(name==='metasAtendimento')return metaQuery();
   if(name==='alunos')return {...empty,doc(id){return {
     async set(){},
     collection(){return {async add(data){entries.push(JSON.parse(JSON.stringify(data)));return {id:'entry-'+entries.length};}};}
   };}};
   return empty;
 }};
 function firestore(){return db;}firestore.FieldValue={serverTimestamp:timestamp};window.firebase={initializeApp(){},auth:()=>auth,firestore,storage:()=>({})};
 window.__test={goals,entries,login(uid){auth.currentUser={uid,email:uid+'@example.test'};callbacks.forEach(fn=>fn(auth.currentUser));}};
}
(async()=>{let server,browser;try{
 server=http.createServer((req,res)=>{const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(filename));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(mock);await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});await page.goto(origin+'/index.html');await page.evaluate(()=>{__test.login('a');currentStudentId='aluno-a';showScreen('profile');RegistroMetas.abrir('aluno-a');});
 await page.locator('#registroMetas>details>summary').click();await page.locator('#registroMetas details details summary').click();await page.locator('#metaDescricao').fill('Expressar uma escolha com figuras');await page.locator('#metaCriterio').fill('Em diferentes atividades');await page.locator('#metaReferencia').fill('PEI 2026, meta 2');await page.locator('#metaFonte').selectOption('PEI');await page.locator('#metaCadastrar').click();await page.waitForFunction(()=>document.querySelectorAll('#metasLista input').length===1);
 await page.locator('#metasLista input').check();await page.locator('#rapidoAtividade').fill('Escolha entre dois jogos');await page.locator('#rapidoApoios').fill('Figuras e tempo de espera');await page.locator('#rapidoObservacao').fill('Escolheu em três oportunidades');await page.locator('#rapidoProximo').fill('Ampliar para outra atividade');await page.locator('#entryText').fill('Relato complementar');await page.locator('#entryDate').fill('2026-10-16');await page.locator('#btnSalvarRegistro').click();await page.waitForFunction(()=>__test.entries.length===1);
 const entry=await page.evaluate(()=>__test.entries[0]);assert.equal(entry.registroRapido.metas[0].fonte,'PEI');assert.equal(entry.registroRapido.metas[0].referencia,'PEI 2026, meta 2');assert.match(entry.text,/Relato complementar/);assert.match(entry.text,/Escolheu em três oportunidades/);assert.equal(await page.locator('#rapidoAtividade').inputValue(),'');
 await page.evaluate(()=>RegistroMetas.historico(__test.entries));assert.match(await page.locator('#metasPercurso').textContent(),/1 atendimento/);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#metasLista button').click();await page.waitForFunction(()=>document.querySelectorAll('#metasLista input').length===0);assert.equal(await page.evaluate(()=>__test.entries[0].registroRapido.metas[0].descricao),'Expressar uma escolha com figuras');
 await page.locator('#entryText').fill('Relato tradicional sem ficha rápida');await page.locator('#btnSalvarRegistro').click();await page.waitForFunction(()=>__test.entries.length===2);assert.equal(await page.evaluate(()=>!!__test.entries[1].registroRapido),false);
 await page.locator('#rapidoAtividade').fill('Rascunho anterior');await page.evaluate(()=>RegistroMetas.abrir('aluno-b'));assert.equal(await page.locator('#rapidoAtividade').inputValue(),'');await page.evaluate(()=>firebase.auth().signOut());assert.equal(await page.locator('#metasLista input').count(),0);assert.deepEqual(errors,[]);
 console.log('Metas e registro rápido: cadastro, seleção, vínculo ao PEI, relato/exportação em texto, evidências, percurso, arquivamento preservando histórico, modo tradicional e limpeza entre alunos passaram.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
