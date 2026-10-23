'use strict';
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const mock=`
window.mockStore={
 'alunos/a':{nome:'Ana Teste',escola:'Escola Horizonte',turma:'3º A',professorUid:'prof-teste',turno:'Matutino'},
 'alunos/b':{nome:'Bruno Teste',professorUid:'prof-teste'},
 'alunos/a/registros/antigo':{date:'2026-10-20',text:'Relato anterior sem metas.'}
};
window.mockWrites=[];window.mockListeners={};window.mockDeny=false;window.mockMetaError=false;window.mockPendingMeta=null;let nextId=0;
const clone=data=>data==null?data:JSON.parse(JSON.stringify(data));
const doc=(id,data)=>({id,exists:!!data,data:()=>clone(data)});
const snapshot=docs=>({docs,empty:docs.length===0,forEach:fn=>docs.forEach(fn)});
function getSnapshot(parts,filter){const prefix=parts.join('/')+'/';return snapshot(Object.entries(mockStore).filter(([key,data])=>key.startsWith(prefix)&&key.split('/').length===parts.length+1&&(!filter||data[filter.key]===filter.value)).map(([key,data])=>doc(key.split('/').at(-1),data)));}
function emit(id){mockListeners[id]?.ok(getSnapshot(['alunos',id,'registros']));}
function ref(parts){return {
 path:parts.join('/'),doc(id){return ref([...parts,id]);},collection(name){return ref([...parts,name]);},
 where(key,op,value){return {...this,filter:{key,value}};},orderBy(){return this;},limit(){return this;},
 async get(){
  if(parts.at(-1)==='metas'){
   if(mockMetaError)throw new Error('Falha simulada');
   if(parts[1]==='a'&&mockPendingMeta)return await mockPendingMeta;
  }
  return parts.length%2===0?doc(parts.at(-1),mockStore[this.path]):getSnapshot(parts,this.filter);
 },
 onSnapshot(ok,error){mockListeners[parts[1]]={ok,error};ok(getSnapshot(parts));return ()=>{};},
 async set(data,options){mockStore[this.path]=options?.merge?{...mockStore[this.path],...clone(data)}:clone(data);mockWrites.push({path:this.path,data:clone(data)});},
 async add(data){const id='novo-'+(++nextId);const key=this.path+'/'+id;mockStore[key]=clone(data);mockWrites.push({path:key,data:clone(data)});if(parts.at(-1)==='registros')emit(parts[1]);return {id};}
};}
window.mockDb={collection:name=>ref([name]),async runTransaction(fn){
 const pending=[];
 await fn({get:reference=>reference.get(),set:(reference,data)=>pending.push({path:reference.path,data:clone(data)})});
 if(mockDeny)throw Object.assign(new Error('Negado'),{code:'permission-denied'});
 for(const write of pending){mockStore[write.path]=write.data;mockWrites.push(write);}
}};
window.mockAuth={currentUser:null,onAuthStateChanged(fn){fn(null);return ()=>{};},async signOut(){}};
window.firebase={initializeApp(){},auth:()=>mockAuth,firestore:()=>mockDb,storage:()=>({}),app:()=>({options:{}})};
firebase.firestore.FieldValue={serverTimestamp:()=>new Date(),delete:()=>null};
`;
let total=0;function check(a,b){assert.deepEqual(a,b);total++;}
(async()=>{
 const server=http.createServer((req,res)=>{
  const filename=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(filename));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{
   const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();
   if(/vendor\/firebase-.*\/firebase-app-compat.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:mock});
   if(/vendor\/firebase-.*\.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:''});
   return route.continue();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
  await page.evaluate(()=>{professorUid='prof-teste';turnoAtual='Matutino';mockAuth.currentUser={uid:'prof-teste',email:'teste@example.com'};goNewStudent();});
  check((await page.locator('#metasAluno').textContent()).includes('Salve o cadastro'),true);
  await page.evaluate(()=>openStudent('a'));
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('0 meta'));
  check(await page.evaluate(()=>mockWrites.length),0);
  await page.getByRole('button',{name:'Metas e acompanhamento',exact:true}).click();
  check(await page.evaluate(()=>document.activeElement.id),'metasAluno');
  await page.locator('#metasEditor summary').click();
  await page.locator('#meta-objetivo').fill('Realizar sequência de duas etapas com apoio visual.');
  await page.locator('#meta-situacaoInicial').fill('Realiza uma etapa com demonstração.');
  await page.locator('#meta-criterio').fill('Observar as etapas realizadas e os apoios oferecidos nas atividades.');
  await page.locator('#meta-estrategias').fill('Usar sequência ilustrada.');
  await page.locator('#meta-apoios').fill('Apoio visual e orientação verbal quando necessário.');
  await page.locator('#meta-responsavel').fill('Professora fictícia');
  await page.locator('#meta-revisao').fill('2000-01-01');
  await page.getByRole('button',{name:'Salvar meta',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.startsWith('Meta salva'));
  const metaId=await page.evaluate(()=>Object.keys(mockStore).find(key=>key.startsWith('alunos/a/metas/')).split('/').at(-1));
  check(await page.evaluate(id=>[mockStore['alunos/a/metas/'+id].revision,mockStore['alunos/a/metas/'+id].alunoId],metaId),[1,'a']);
  check(await page.locator('.meta-review').textContent(),'Revisão pendente');
  check(await page.locator('#metasVinculoAtendimento input[type=checkbox]').count(),1);
  await page.locator('#metasVinculoAtendimento input[type=checkbox]').check();
  await page.locator('#entryText').fill('Realizou duas etapas com a sequência ilustrada.');
  await page.locator('#btnSalvarRegistro').click();
  check(await page.evaluate(()=>Object.entries(mockStore).find(([key,value])=>key.includes('/registros/')&&value.text==='Realizou duas etapas com a sequência ilustrada.')[1].metaIds),[metaId]);
  check(await page.evaluate(()=>Object.entries(mockStore).find(([key,value])=>key.includes('/registros/')&&value.text==='Realizou duas etapas com a sequência ilustrada.')[1].metaVinculos[0].objetivo),'Realizar sequência de duas etapas com apoio visual.');
  check(await page.locator('#metasVinculoAtendimento input[type=checkbox]').isChecked(),false);
  check(await page.locator('.meta-entry-tag').textContent(),'Realizar sequência de duas etapas com apoio visual.');
  check(await page.locator('.meta-evidence summary').textContent(),'1 atendimento(s) vinculado(s)');
  await page.locator('.meta-evidence summary').click();
  check((await page.locator('.meta-evidence').textContent()).includes('Realizou duas etapas'),true);
  await page.locator('#entryText').fill('Atendimento sem vínculo com metas.');await page.locator('#btnSalvarRegistro').click();
  check(await page.evaluate(()=>Object.entries(mockStore).find(([key,value])=>key.includes('/registros/')&&value.text==='Atendimento sem vínculo com metas.')[1].metaIds||null),null);
  check(await page.evaluate(()=>mockStore['alunos/a/registros/antigo']),{date:'2026-10-20',text:'Relato anterior sem metas.'});
  await page.getByRole('button',{name:'Editar meta',exact:true}).click();
  await page.locator('#meta-objetivo').fill('Realizar duas etapas com recursos visuais nas atividades.');
  await page.locator('#meta-status').selectOption('concluida');await page.getByRole('button',{name:'Salvar meta',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.startsWith('Meta salva'));
  check(await page.locator('#metasVinculoAtendimento input[type=checkbox]').count(),0);
  await page.locator('#metasFiltro').selectOption('todas');
  check(await page.locator('.meta-badge').first().textContent(),'Concluída');
  check(await page.locator('.meta-evidence summary').textContent(),'1 atendimento(s) vinculado(s)');
  check(await page.locator('.meta-entry-tag').textContent(),'Realizar sequência de duas etapas com apoio visual.');
  await page.getByRole('button',{name:'Editar meta',exact:true}).click();await page.locator('#meta-status').selectOption('arquivada');
  await page.getByRole('button',{name:'Salvar meta',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.startsWith('Meta salva'));
  check(await page.evaluate(id=>mockStore['alunos/a/metas/'+id].status,metaId),'arquivada');
  check(await page.locator('.meta-evidence summary').textContent(),'1 atendimento(s) vinculado(s)');
  // Conflito de edição preserva o preenchimento e não gera escrita.
  await page.getByRole('button',{name:'Editar meta',exact:true}).click();
  await page.locator('#meta-objetivo').fill('Alteração que deve permanecer somente na tela.');
  const before=await page.evaluate(()=>mockWrites.length);
  await page.evaluate(id=>{mockStore['alunos/a/metas/'+id].revision++;},metaId);
  await page.getByRole('button',{name:'Salvar meta',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('outra aba'));
  check(await page.evaluate(()=>mockWrites.length),before);
  check(await page.locator('#meta-objetivo').inputValue(),'Alteração que deve permanecer somente na tela.');
  page.once('dialog',d=>d.dismiss());await page.evaluate(()=>openStudent('b'));
  check(await page.evaluate(()=>currentStudentId),'a');
  await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();
  await page.getByRole('button',{name:'Atualizar metas',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('1 meta'));
  await page.getByRole('button',{name:'Editar meta',exact:true}).click();await page.locator('#meta-status').selectOption('ativa');
  await page.evaluate(()=>{mockDeny=true;});await page.getByRole('button',{name:'Salvar meta',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('Sem permissão'));
  check(await page.evaluate(()=>mockWrites.length),before);
  check(await page.locator('#meta-status').inputValue(),'ativa');
  await page.getByRole('button',{name:'Cancelar edição',exact:true}).click();await page.evaluate(()=>{mockDeny=false;});
  // Troca de aluno limpa a seleção e descarta consulta atrasada.
  await page.evaluate(()=>{mockPendingMeta=new Promise(resolve=>window.concluirMetas=resolve);});
  await page.evaluate(()=>openStudent('a'));await page.evaluate(()=>openStudent('b'));
  await page.evaluate(()=>concluirMetas({docs:[{id:'errada',data:()=>({objetivo:'NÃO EXIBIR',status:'ativa'})}]}));
  check((await page.locator('#metasAluno').textContent()).includes('NÃO EXIBIR'),false);
  check(await page.locator('#metasVinculoAtendimento input[type=checkbox]').count(),0);
  await page.evaluate(()=>{mockPendingMeta=null;mockMetaError=true;});await page.evaluate(()=>openStudent('a'));
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('Não foi possível carregar'));
  check(await page.locator('#metasStatus.metas-error').count(),1);
  await page.evaluate(()=>{mockMetaError=false;});await page.getByRole('button',{name:'Atualizar metas',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('1 meta'));
  await page.locator('#metasFiltro').selectOption('todas');
  fs.mkdirSync('/tmp/site-results',{recursive:true});
  await page.locator('#metasAluno').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/site-results/metas-aluno-desktop.png'});
  for(const width of [390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/site-results/metas-aluno-celular.png'});
  check(errors,[]);
  console.log(total+' verificações de metas e vínculo dos atendimentos aprovadas; somente Firebase simulado.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
