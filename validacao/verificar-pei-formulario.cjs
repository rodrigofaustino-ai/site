'use strict';
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const mock=`
window.mockWrites=[];window.mockDeny=false;
window.mockOriginal={peiHtml:'<h1>PEI anterior</h1><p>Texto original preservado.</p><script>parent.executou=true</script>',peiComprimido:false,peiData:'2026-10-20T12:00:00.000Z',professorUid:'prof-teste',peiNomeArquivo:'original.docx'};
window.mockStore={
 'alunos/a':{nome:'Ana Teste',dataNasc:'2015-03-14',escola:'Escola Horizonte',turma:'3º A',periodo:'Matutino',professorUid:'prof-teste'},
 'alunos/b':{nome:'Aluno de outro professor',professorUid:'outro'},
 'alunos/c':{nome:'Aluno Novo',professorUid:'prof-teste'},
 'alunos/a/pei/atual':mockOriginal
};
const clone=data=>data==null?data:JSON.parse(JSON.stringify(data));
function ref(parts){return {
 path:parts.join('/'),
 doc(id){return ref([...parts,id]);},collection(name){return ref([...parts,name]);},where(key,op,value){return {...this,filter:{key,value}};},
 async get(){
  const name=parts.join('/');
  if(parts.length%2===0)return {id:parts.at(-1),exists:!!mockStore[name],data:()=>clone(mockStore[name])};
  const docs=Object.entries(mockStore).filter(([key,data])=>key.startsWith(name+'/')&&key.split('/').length===parts.length+1&&(!this.filter||data[this.filter.key]===this.filter.value)).map(([key,data])=>({id:key.split('/').at(-1),data:()=>clone(data)}));
  return {docs};
 }
};}
window.mockDb={collection:name=>ref([name]),async runTransaction(fn){
 const pending=[];
 await fn({get:reference=>reference.get(),set:(reference,data,options)=>pending.push({path:reference.path,data:clone(data),options})});
 if(mockDeny)throw Object.assign(new Error('Negado'),{code:'permission-denied'});
 for(const write of pending){mockStore[write.path]=write.options?.merge?{...mockStore[write.path],...write.data}:write.data;mockWrites.push(write);}
}};
window.authCallbacks=[];
window.mockAuth={currentUser:{uid:'prof-teste',email:'professor@example.com'},onAuthStateChanged(fn){authCallbacks.push(fn);Promise.resolve().then(()=>{
 if(!mockOriginal.peiComprimido){mockOriginal.peiHtml=LZString.compressToUTF16(mockOriginal.peiHtml);mockOriginal.peiComprimido=true;}
 fn(this.currentUser);
});return ()=>{};},async signOut(){this.currentUser=null;for(const fn of authCallbacks)await fn(null);},async signInWithEmailAndPassword(){}};
window.firebase={initializeApp(){},auth:()=>mockAuth,firestore:()=>mockDb};
`;
let total=0;function check(a,b){assert.deepEqual(a,b);total++;}
(async()=>{
 const server=http.createServer((req,res)=>{
  const filename=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(filename));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(!url.startsWith(origin+'/'))return route.abort();
   if(/vendor\/firebase-.*\/firebase-app-compat.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:mock});
   if(/vendor\/firebase-.*\.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:''});
   return route.continue();
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/pei_formulario.html?alunoId=a&nome=Ignorar',{waitUntil:'networkidle'});
  await page.locator('#pei-editor').waitFor({state:'visible'});
  const field=key=>page.locator('[data-path="'+key+'"]');
  check(await field('identificacao.nome').inputValue(),'Ana Teste');
  check(await field('identificacao.dataNascimento').inputValue(),'2015-03-14');
  check(await field('identificacao.escola').inputValue(),'Escola Horizonte');
  check(await field('identificacao.anoEscolar').inputValue(),'3º A');
  check(await field('identificacao.turno').inputValue(),'Matutino');
  check(await page.locator('[data-path]').count(),23);
  check(await page.locator('textarea').count(),10);
  check(await page.evaluate(()=>mockWrites.length),0);
  check(await page.locator('#legacy-note').isVisible(),true);
  // Orientações originais estão disponíveis sem virar respostas fictícias.
  check(await field('contextoEscolar.socioafetivos').inputValue(),'');
  check((await page.locator('#sec-escolar').textContent()).includes('capacitismo'),true);
  await page.locator('#btn-history').click();
  await page.locator('#pei-history-list button').first().click();
  check((await page.locator('#pei-legacy-preview').getAttribute('srcdoc')).includes('Texto original preservado.'),true);
  check((await page.locator('#pei-legacy-preview').getAttribute('srcdoc')).includes('<script>'),false);
  check(await page.evaluate(()=>!!window.executou),false);
  await field('contextoEscolar.socioafetivos').fill('Participa de atividades em pequenos grupos.');
  await field('contextoEscolar.linguagemOral').fill('Comunica preferências com apoio visual.');
  await field('estrategias.objetivosMetas').fill('Ampliar a participação nas atividades propostas.');
  await field('estrategias.adaptacoes').fill('Oferecer sequência visual e materiais acessíveis.');
  await field('contextoFamiliar.texto').fill('A família compartilhou informações sobre a rotina.');
  await field('assinaturas.regente').fill('Professora Fictícia');
  await field('assinaturas.data').fill('2026-10-23');
  await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await page.evaluate(()=>mockStore['alunos/a/pei/atual'].peiFormulario.contextoEscolar.linguagemOral),'Comunica preferências com apoio visual.');
  check(await page.evaluate(()=>Object.entries(mockStore).filter(([key])=>key.startsWith('alunos/a/pei/versao-')).map(([,data])=>JSON.stringify(data)===JSON.stringify(mockOriginal))),[true]);
  check(await page.evaluate(()=>mockStore['alunos/a/pei/atual'].peiComprimido),false);
  check(await page.evaluate(()=>mockWrites.length),2);
  // Reabertura do documento salvo sem novo salvamento automático.
  await page.locator('#btn-back-list').click();await page.locator('#student-grid .student-card').filter({hasText:'Ana Teste'}).getByRole('button',{name:'Abrir PEI',exact:true}).click();
  check(await field('contextoEscolar.socioafetivos').inputValue(),'Participa de atividades em pequenos grupos.');
  check(await field('assinaturas.regente').inputValue(),'Professora Fictícia');
  check(await page.evaluate(()=>mockWrites.length),2);
  check(await page.locator('#legacy-note').isVisible(),false);
  // Exportação usa os campos atuais, mesmo antes de salvar.
  await field('estrategias.objetivosMetas').fill('Objetivo fictício ainda não salvo — participação e comunicação.');
  fs.mkdirSync('/tmp/site-results',{recursive:true});
  for(const format of ['docx','odt']){
   const [download]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.locator('#btn-export-'+format).click()]);
   check(download.suggestedFilename().endsWith('.'+format),true);
   await download.saveAs('/tmp/site-results/pei-formulario.'+format);
  }
  check(await page.evaluate(()=>mockWrites.length),2);
  // Conflito: não sobrescreve a alteração de outra sessão e mantém o texto digitado.
  await page.evaluate(()=>{mockStore['alunos/a/pei/atual'].peiData='2026-10-24T12:00:00Z';});
  await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#peiError').textContent.includes('outra aba'));
  check(await page.evaluate(()=>mockWrites.length),2);
  check(await field('estrategias.objetivosMetas').inputValue(),'Objetivo fictício ainda não salvo — participação e comunicação.');
  // Descartar para recarregar e testar falha atômica de permissão.
  page.once('dialog',d=>d.accept());await page.locator('#btn-back-list').click();await page.locator('#student-grid .student-card').filter({hasText:'Ana Teste'}).getByRole('button',{name:'Abrir PEI',exact:true}).click();
  await field('estrategias.processoAvaliativo').fill('Observação contínua com registro descritivo.');
  await page.evaluate(()=>{mockDeny=true;});await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#peiError').textContent.includes('Sem permissão'));
  check(await page.evaluate(()=>mockWrites.length),2);
  check(await field('estrategias.processoAvaliativo').inputValue(),'Observação contínua com registro descritivo.');
  await page.evaluate(()=>{mockDeny=false;});await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await page.evaluate(()=>Object.keys(mockStore).filter(key=>key.startsWith('alunos/a/pei/versao-')).length),2);
  // Sem mudanças, salvar não acumula versões iguais.
  await page.locator('#btn-save').click();
  check(await page.evaluate(()=>mockWrites.length),4);
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'/tmp/site-results/pei-formulario-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/site-results/pei-formulario-celular.png'});
  await page.locator('#btn-logout').click();
  check(await page.locator('#app-shell').isVisible(),false);
  check(await page.locator('[data-path]').count(),0);
  // Aluno de outra conta não é exibido pelo formulário.
  const other=await context.newPage();
  await other.goto(origin+'/pei_formulario.html?alunoId=b',{waitUntil:'networkidle'});
  check((await other.locator('#peiError').textContent()).includes('não encontrado'),true);
  check(await other.locator('[data-path]').count(),0);
  const fresh=await context.newPage();
  await fresh.goto(origin+'/pei_formulario.html?alunoId=c',{waitUntil:'networkidle'});
  check(await fresh.locator('#legacy-note').isVisible(),false);
  check(await fresh.locator('[data-path="contextoEscolar.academicos"]').inputValue(),'');
  await fresh.locator('[data-path="identificacao.nome"]').fill('');
  await fresh.locator('#btn-save').click();
  check((await fresh.locator('#peiError').textContent()).includes('Informe o nome'),true);
  check(await fresh.evaluate(()=>mockWrites.length),0);
  await fresh.locator('[data-path="identificacao.nome"]').fill('Aluno Novo');
  await fresh.locator('#btn-save').click();
  await fresh.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await fresh.evaluate(()=>mockWrites.map(w=>w.path)),['alunos/c/pei/atual']);
  check(errors,[]);
  console.log(total+' verificações do formulário PEI aprovadas; DOCX/ODT baixados; Firebase simulado.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
