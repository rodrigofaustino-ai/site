'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let total=0;const check=(a,b)=>{assert.deepEqual(a,b);total++;};
function mock(){
 const callbacks=[],store={
  'alunos/aluno-a':{nome:'Aluno fictício A',professorUid:'a',professorEmail:'a@example.test',ultimoRegistro:'2026-10-20'},
  'alunos/aluno-b':{nome:'Aluno fictício B',professorUid:'a',professorEmail:'a@example.test'}
 };let next=0;
 const clone=data=>data==null?data:JSON.parse(JSON.stringify(data));
 const auth={currentUser:null,onAuthStateChanged(fn){callbacks.push(fn);queueMicrotask(()=>fn(this.currentUser));},async signOut(){this.currentUser=null;callbacks.forEach(fn=>fn(null));}};
 const state={store,deny:false,ackLost:false,pause:null,calls:0};
 function ref(parts,filter){return {path:parts.join('/'),doc:id=>ref([...parts,id]),collection:name=>ref([...parts,name]),where:(key,op,value)=>ref(parts,{key,value}),orderBy(){return this;},limit(){return this;},onSnapshot(fn){queueMicrotask(()=>fn({docs:[],forEach(){}}));return ()=>{};},
  async get(){const value=store[this.path];if(parts.length%2===0)return {exists:!!value,data:()=>clone(value)};
   const docs=Object.entries(store).filter(([p,d])=>p.startsWith(this.path+'/')&&p.split('/').length===parts.length+1&&(!filter||d[filter.key]===filter.value)).map(([p,d])=>({id:p.split('/').at(-1),data:()=>clone(d)}));return {docs,forEach:fn=>docs.forEach(fn)};
  },async add(data){const id='novo-'+(++next);store[this.path+'/'+id]=clone(data);return {id};},async set(data,options){store[this.path]=options?.merge?{...store[this.path],...clone(data)}:clone(data);}
 };}
 const db={collection:name=>ref([name]),async runTransaction(fn){state.calls++;const ops=[];await fn({get:r=>r.get(),set:(r,d)=>ops.push({path:r.path,data:clone(d)}),update:(r,d)=>ops.push({path:r.path,data:clone(d),merge:true})});
  if(state.pause)await state.pause;if(state.deny)throw new Error('Falha antes de gravar');for(const op of ops)store[op.path]=op.merge?{...store[op.path],...op.data}:op.data;if(state.ackLost)throw new Error('Confirmação de gravação perdida');
 }};
 function firestore(){return db;}firestore.FieldValue={serverTimestamp:()=>0};window.firebase={initializeApp(){},auth:()=>auth,firestore,storage:()=>({})};
 state.auth=auth;window.__test=state;
}
(async()=>{let server,browser;try{
 server=http.createServer((req,res)=>{const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(filename));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(mock);await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/firebase-.*-compat\.js/.test(url))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{professorUid='a';turnoAtual='Matutino';__test.auth.currentUser={uid:'a',email:'a@example.test'};await openStudent('aluno-a');});
 fs.mkdirSync('/tmp/site-results',{recursive:true});await page.screenshot({path:'/tmp/site-results/ficha-visual-desktop.png'});
 const records=()=>page.evaluate(()=>Object.entries(__test.store).filter(([p])=>p.startsWith('alunos/aluno-a/registros/')).map(([id,data])=>({id,data})));
 await page.locator('#entryText').fill('Observação do atendimento tradicional');await page.locator('#entryDate').fill('2026-10-16');await page.locator('#registradoPor').fill('Profissional de teste');
 await page.locator('#btnSalvarRegistro').click();await page.getByText('Registro salvo. O relato está disponível no histórico abaixo.',{exact:true}).waitFor();
 const first=(await records())[0].data;check(first.text,'Observação do atendimento tradicional');check('registroRapido' in first,false);
 check(await page.evaluate(()=>__test.store['alunos/aluno-a'].ultimoRegistro),'2026-10-20');check(await page.locator('#entryText').inputValue(),'');
 // Roteiro só acrescenta texto depois de prévia e confirmação, sem sobrescrever.
 await page.locator('#entryText').fill('Texto anterior mantido.');await page.locator('#registroAssistido summary').click();
 await page.locator('#roteiro-atividades').fill('Organizou materiais por cores.');await page.locator('#roteiro-apoios').fill('Utilizou pistas visuais.');
 await page.getByRole('button',{name:'Conferir prévia do roteiro',exact:true}).click();
 check(await page.locator('#entryText').inputValue(),'Texto anterior mantido.');check((await records()).length,1);
 fs.mkdirSync('/tmp/site-results',{recursive:true});await page.locator('#registroAssistido').screenshot({path:'/tmp/site-results/registro-roteiro-previa.png'});
 await page.locator('#btnSalvarRegistro').click();check((await records()).length,1);
 check((await page.locator('#registroStatus').textContent()).includes('ainda não foi acrescentado'),true);
 await page.getByRole('button',{name:'Acrescentar ao relato',exact:true}).click();
 const joined=await page.locator('#entryText').inputValue();check(joined.startsWith('Texto anterior mantido.'),true);check(joined.includes('Organizou materiais por cores.'),true);check(joined.includes('Respostas observadas:'),false);
 check(await page.getByRole('button',{name:'Acrescentar ao relato',exact:true}).isDisabled(),true);
 page.once('dialog',dialog=>dialog.dismiss());await page.evaluate(()=>goHome());check(await page.evaluate(()=>currentStudentId),'aluno-a');check(await page.locator('#entryText').inputValue(),joined);
 // Salvamento bloqueia o formulário; clique repetido não cria outra operação.
 await page.locator('#entryDate').fill('2026-10-21');await page.evaluate(()=>{__test.pause=new Promise(resolve=>window.resumeSave=resolve);});
 await page.locator('#btnSalvarRegistro').click();await page.waitForFunction(()=>RegistroAssistido.salvando());
 check(await page.locator('#entryText').isDisabled(),true);check(await page.locator('#entryDate').isDisabled(),true);
 const calls=await page.evaluate(()=>__test.calls);await page.evaluate(()=>saveEntry());check(await page.evaluate(()=>__test.calls),calls);
 await page.evaluate(()=>goHome());check(await page.evaluate(()=>currentStudentId),'aluno-a');
 await page.evaluate(()=>{resumeSave();__test.pause=null;});await page.getByText('Registro salvo. O relato está disponível no histórico abaixo.',{exact:true}).waitFor();
 check((await records()).length,2);check(await page.locator('#entryText').isDisabled(),false);check(await page.evaluate(()=>__test.store['alunos/aluno-a'].ultimoRegistro),'2026-10-21');
 // Rejeição mantém o texto; confirmação perdida é recuperada sem duplicar.
 await page.locator('#entryText').fill('Texto que precisa ser preservado.');await page.locator('#entryDate').fill('2026-10-22');await page.evaluate(()=>{__test.deny=true;});
 await page.locator('#btnSalvarRegistro').click();await page.waitForFunction(()=>document.querySelector('#registroStatus').classList.contains('metas-error'));
 check(await page.locator('#entryText').inputValue(),'Texto que precisa ser preservado.');check((await records()).length,2);check(await page.evaluate(()=>__test.store['alunos/aluno-a'].ultimoRegistro),'2026-10-21');
 await page.evaluate(()=>{__test.deny=false;__test.ackLost=true;});await page.locator('#btnSalvarRegistro').click();
 await page.waitForFunction(()=>!RegistroAssistido.salvando());check((await records()).length,3);check(await page.locator('#entryText').inputValue(),'Texto que precisa ser preservado.');
 const ids=(await records()).map(r=>r.id);await page.evaluate(()=>{__test.ackLost=false;});await page.locator('#btnSalvarRegistro').click();
 await page.getByText('Registro salvo. O relato está disponível no histórico abaixo.',{exact:true}).waitFor();check((await records()).map(r=>r.id),ids);check(await page.locator('#entryText').inputValue(),'');
 // IA atrasada não substitui um relato que já mudou.
 await page.locator('#entryText').fill('Texto enviado para revisão.');await page.evaluate(()=>{window.puter={ai:{chat:()=>new Promise(resolve=>window.resolveIA=resolve)}};});
 await page.locator('#btnMelhorarIA').click();await page.locator('#entryText').fill('Texto alterado enquanto aguarda.');await page.evaluate(()=>resolveIA('Sugestão antiga.'));
 await page.waitForFunction(()=>!iaRegistroEmCurso());check(await page.locator('#aiSuggestionBox').isVisible(),false);check(await page.locator('#entryText').inputValue(),'Texto alterado enquanto aguarda.');
 // Trocar aluno descarta o roteiro somente após confirmação e guarda só o nome do profissional.
 await page.locator('#roteiro-respostas').fill('RASCUNHO QUE NÃO PODE IR PARA OUTRO ALUNO');await page.getByRole('button',{name:'Conferir prévia do roteiro',exact:true}).click();
 page.once('dialog',dialog=>dialog.accept());await page.evaluate(()=>openStudent('aluno-b'));
 check(await page.locator('#entryText').inputValue(),'');check(await page.locator('#registradoPor').inputValue(),'Profissional de teste');check(await page.locator('#roteiro-respostas').inputValue(),'');
 await page.locator('#registroAssistido summary').click();check(await page.getByRole('button',{name:'Acrescentar ao relato',exact:true}).isDisabled(),true);
 // Salvar um novo cadastro não descarta relato digitado antes de existir alunoId.
 await page.evaluate(()=>goNewStudent());await page.locator('#nomeAluno').fill('Novo aluno fictício');await page.locator('#entryText').fill('Rascunho anterior ao cadastro.');
 await page.locator('#btnSalvarPerfil').click();await page.waitForFunction(()=>currentStudentId&&currentStudentId.startsWith('novo-'));
 check(await page.locator('#entryText').inputValue(),'Rascunho anterior ao cadastro.');
 await page.evaluate(()=>{currentEntries=[{_id:'antigo',date:'2026-10-15',text:'Evidência já salva antes da alteração.',registroRapido:{metas:[{id:'legado',descricao:'Meta antiga'}]}}];renderEntriesList();});check((await page.locator('#entriesList').textContent()).includes('Evidência já salva antes da alteração.'),true);
 // Filtros locais: interseção, datas inclusivas, acentos e isolamento do aluno.
 await page.evaluate(()=>{currentEntries=[
  {_id:'h1',date:'2026-10-15',text:'Organização de materiais',por:'José',metaIds:['m1'],metaVinculos:[{id:'m1',objetivo:'Autonomia'}]},
  {_id:'h2',date:'2026-10-16',text:'Leitura compartilhada',por:'Ana'},
  {_id:'h3',date:'inválida',text:'Relato sem data',por:'José'}
 ];centralRegistrosStatus='pronto';renderEntriesList();});
 const cards=()=>page.locator('#entriesList .entry-card').count();
 check(await cards(),3);
 const callsAntes=await page.evaluate(()=>__test.calls);
 await page.locator('#historicoBusca').fill('JOSE autonomia');check(await cards(),1);
 check((await page.locator('#entriesList').textContent()).includes('Organização'),true);
 await page.locator('#historicoLimpar').click();check(await cards(),3);
 await page.locator('#historicoInicio').fill('2026-10-15');await page.locator('#historicoFim').fill('2026-10-15');check(await cards(),1);
 check((await page.locator('#historicoResultado').textContent()).includes('sem data válida'),true);
 await page.locator('#historicoMetas').selectOption('sem');check(await cards(),0);
 await page.locator('#historicoLimpar').click();await page.locator('#historicoMetas').selectOption('sem');check(await cards(),2);
 await page.locator('#historicoInicio').fill('2026-10-17');await page.locator('#historicoFim').fill('2026-10-15');
 check(await cards(),0);check((await page.locator('#historicoResultado').textContent()).includes('Confira o período'),true);
 check(await page.evaluate(()=>currentEntries.length),3);check(await page.evaluate(()=>__test.calls),callsAntes);
 await page.locator('#historicoLimpar').click();await page.locator('#historicoBusca').fill('<script>');check(await cards(),0);
 await page.evaluate(()=>{centralRegistrosStatus='erro';renderEntriesList();});check((await page.locator('#historicoResultado').textContent()).includes('Não foi possível'),true);
 await page.evaluate(()=>{centralRegistrosStatus='pronto';currentStudentId='aluno-b';currentEntries=[];renderEntriesList();});
 check(await page.locator('#historicoBusca').inputValue(),'');check(await page.locator('#historicoMetas').inputValue(),'');check(await cards(),0);
 fs.mkdirSync('/tmp/site-results',{recursive:true});await page.locator('#registroAssistido').screenshot({path:'/tmp/site-results/registro-assistido.png'});
 if(!await page.locator('#registroAssistido details').evaluate(d=>d.open))await page.locator('#registroAssistido summary').click();
 for(const width of [390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.evaluate(()=>__test.auth.signOut());check(await page.locator('#entryText').inputValue(),'');check(await page.locator('#registradoPor').inputValue(),'');check(errors,[]);
 console.log(total+' verificações do registro assistido e tradicional passaram no Chromium; Firebase e IA simulados, pedidos externos bloqueados.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
