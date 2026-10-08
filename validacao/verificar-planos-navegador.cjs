'use strict';
const {chromium} = require('playwright-core');
const {Document, Paragraph, Packer} = require('docx');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function mockFirebase() {
  let authCallbacks = [], listeners = [], counter = 0;
  const records = new Map(), files = new Map();
  const timestamp = value => ({toMillis:() => value, toDate:() => new Date(value)});
  const auth = {currentUser:null, onAuthStateChanged(callback) {authCallbacks.push(callback); queueMicrotask(() => callback(this.currentUser));}, async signOut() {this.currentUser=null; authCallbacks.forEach(callback=>callback(null));}};
  function snapshot() {return {docs:[...records.entries()].sort((a,b)=>b[1].uploadedAt.toMillis()-a[1].uploadedAt.toMillis()).map(([id,data])=>({id,data:()=>data})),forEach(){}};}
  function emit() {listeners.forEach(callback=>callback(snapshot()));}
  function reference(id) {return {id, async get(){return {exists:records.has(id),data:()=>records.get(id)};}};}
  const shared = {doc(id){return reference(id || 'plano-'+(++counter));},orderBy(){return this;},onSnapshot(callback){listeners.push(callback);queueMicrotask(()=>callback(snapshot()));return ()=>{listeners=listeners.filter(item=>item!==callback);};}};
  const db = {collection(name){if(name==='planosAula')return shared;return {where(){return this;},async get(){return {docs:[],forEach(){}};}};},async runTransaction(callback){const actions=[];const transaction={get:reference=>reference.get(),set(reference,data){actions.push(()=>records.set(reference.id,data));},update(reference,data){actions.push(()=>records.set(reference.id,{...records.get(reference.id),...data}));},delete(reference){actions.push(()=>records.delete(reference.id));}};await callback(transaction);actions.forEach(action=>action());emit();}};
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
    browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(mockFirebase);
    await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});
    await page.goto(origin+'/index.html');
    await page.evaluate(()=>{PlanosAula.activate();});await assert.match(await page.locator('#planosStatus').textContent(),/Entre no Diário/);
    await page.evaluate(()=>{__test.login('professor-a');selecionarTurno('Matutino');switchTab('planos');});
    const bytes=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph('Plano: leitura compartilhada')]}]}));
    await page.locator('#planoTitulo').fill('Leitura em equipe');await page.locator('#planoTema').fill('Alfabetização');await page.locator('#planoDescricao').fill('Prática com livros');
    await page.locator('#planoArquivo').setInputFiles({name:'leitura.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});
    await page.locator('#planoSalvar').click();await page.waitForFunction(()=>document.getElementById('planosStatus').textContent.includes('Plano cadastrado'));
    assert.equal(await page.locator('.plano-item').count(),1);assert.match(await page.locator('.plano-item').textContent(),/Upload:.*\d{2}\/\d{2}\/\d{4}/);
    await page.locator('#planosBusca').fill('alfabetizacao');assert.equal(await page.locator('.plano-item').count(),1);
    await page.locator('#planosBusca').fill('inexistente');assert.equal(await page.locator('.plano-item').count(),0);await page.locator('#planosBusca').fill('');
    await page.getByRole('button',{name:'Visualizar',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('planoViewer').hidden);
    assert.match(await page.locator('#planoPreview').getAttribute('srcdoc'),/leitura compartilhada/);assert.equal(await page.locator('#planoPreview').getAttribute('sandbox'),'');
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Baixar DOCX'}).click()]);assert.equal(download.suggestedFilename(),'leitura.docx');assert.deepEqual(fs.readFileSync(await download.path()),bytes);
    await page.evaluate(()=>{__test.login('professor-b');selecionarTurno('Matutino');switchTab('planos');});await page.waitForFunction(()=>document.querySelectorAll('.plano-item').length===1);
    assert.equal(await page.getByRole('button',{name:'Editar',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Excluir',exact:true}).count(),0);
    await page.getByRole('button',{name:'Visualizar',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('planoViewer').hidden);
    await page.evaluate(()=>{__test.login('professor-a');selecionarTurno('Vespertino');switchTab('planos');});await page.getByRole('button',{name:'Editar',exact:true}).click();await page.locator('#planoTitulo').fill('Leitura revisada');await page.locator('#planoSalvar').click();await page.waitForFunction(()=>document.getElementById('planosStatus').textContent.includes('Alterações salvas'));
    assert.match(await page.locator('.plano-item h3').textContent(),/revisada/);
    await page.getByRole('button',{name:'Editar',exact:true}).click();await page.locator('#planoArquivo').setInputFiles({name:'revisado.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});await page.locator('#planoSalvar').click();await page.waitForFunction(()=>document.getElementById('planosStatus').textContent.includes('Alterações salvas'));
    assert.equal(await page.evaluate(()=>__test.files.size),1);assert.match(await page.locator('.plano-item').textContent(),/revisado.docx/);
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Excluir',exact:true}).click();await page.waitForFunction(()=>document.getElementById('planosStatus').textContent==='Plano excluído.');assert.equal(await page.evaluate(()=>__test.files.size),0);
    await page.locator('#planoTitulo').fill('Inválido');await page.locator('#planoTema').fill('Tema');await page.locator('#planoDescricao').fill('Descrição');await page.locator('#planoArquivo').setInputFiles({name:'falso.docx',mimeType:'application/octet-stream',buffer:Buffer.from('isto não é DOCX')});await page.locator('#planoSalvar').click();await page.waitForFunction(()=>document.getElementById('planosStatus').textContent.includes('não é um DOCX válido'));assert.equal(await page.evaluate(()=>__test.records.size),0);
    await page.evaluate(()=>firebase.auth().signOut());assert.equal(await page.locator('.plano-item').count(),0);assert.equal(await page.evaluate(()=>__test.listenerCount()),0);assert.equal(await page.locator('#planoTitulo').inputValue(),'');
    assert.deepEqual(errors,[]);await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{__test.login('professor-a');selecionarTurno('Vespertino');switchTab('planos');});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    console.log('Banco de Planos: cadastro, busca, prévia isolada, download original, segundo professor, edição, substituição, exclusão, DOCX inválido, logout e layout móvel passaram com Firebase simulado.');
  } finally {if(browser)await browser.close();if(server)server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
