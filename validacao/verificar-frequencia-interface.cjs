'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const JSZip=require('../vendor/jszip.min.js');
const root=path.resolve(__dirname,'..');let count=0;const check=(a,b)=>{assert.deepEqual(a,b);count++;};
const mock=`
window.store={
 'alunos/a':{professorUid:'prof',turno:'Matutino',nome:'Ána fictícia',atendimentos:[{dia:'Segunda',horario:'1º Horário'},{dia:'Segunda',horario:'2º Horário'},{dia:'Quinta',horario:'1º Horário'}]},
 'alunos/b':{professorUid:'prof',turno:'Matutino',nome:'Bruno fictício',atendimentos:[{dia:'Terça',horario:'1º Horário'}]},
 'frequenciaSemanas/s1':{professorUid:'prof',turno:'Matutino',label:'Semana 1',dataInicio:'2026-10-19',ordem:1,status:{a:'presente',b__Terça:'falta'}},
 'frequenciaSemanas/s2':{professorUid:'prof',turno:'Matutino',label:'Semana 2',dataInicio:'2026-10-26',ordem:2,status:{a__Segunda:'presente',a__Quinta:'justificado'}}
};window.writes=[];window.reads=0;window.deny=false;window.pause=null;window.pendingLoad=null;
const clone=d=>d==null?d:JSON.parse(JSON.stringify(d));
function ref(parts,filter){return {path:parts.join('/'),collection:name=>ref([...parts,name]),doc:id=>ref([...parts,id]),where:(key,op,value)=>ref(parts,{key,value}),
 async get(){reads++;if(window.pendingLoad&&this.path==='alunos')return await pendingLoad;
  if(parts.length%2===0){const value=store[this.path];return {exists:!!value,data:()=>clone(value)};}
  const docs=Object.entries(store).filter(([p,d])=>p.startsWith(this.path+'/')&&p.split('/').length===parts.length+1&&(!filter||d[filter.key]===filter.value)).map(([p,d])=>({id:p.split('/').at(-1),data:()=>clone(d)}));return {docs,forEach:fn=>docs.forEach(fn)};
 },onSnapshot(){return ()=>{};}
};}
const apply=(record,patch)=>{for(const [key,value]of Object.entries(patch)){if(key.startsWith('status.')){record.status??={};record.status[key.slice(7)]=value;}else record[key]=value;}};
window.mockDb={collection:name=>ref([name]),async runTransaction(fn){const pending=[];await fn({get:r=>r.get(),update:(r,d)=>pending.push({path:r.path,data:clone(d)})});if(pause)await pause;if(deny)throw Object.assign(new Error('Negado'),{code:'permission-denied'});for(const p of pending){apply(store[p.path],p.data);writes.push(p);}}};
window.mockAuth={currentUser:null,onAuthStateChanged(fn){fn(null);return ()=>{};}};
window.firebase={initializeApp(){},auth:()=>mockAuth,firestore:()=>mockDb,storage:()=>({}),app:()=>({options:{}})};firebase.firestore.FieldValue={serverTimestamp:()=>null,delete:()=>null};
`;
async function main(){
  const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;let browser;
  try{
    browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1440,height:1000}});
    await context.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(/\/vendor\/firebase-.*\/firebase-app-compat.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:mock});if(url.includes('/vendor/firebase-'))return route.fulfill({contentType:'application/javascript',body:''});return route.continue();});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
    await page.evaluate(async()=>{professorUid='prof';turnoAtual='Matutino';mockAuth.currentUser={uid:'prof',email:'prof@example.test'};showScreen('home');switchTab('frequencia');await renderFrequencia();});
    check(await page.evaluate(()=>writes.length),0);
    check(await page.locator('.freq-mark').count(),8); // duas semanas, quatro linhas ocupadas.
    check(await page.locator('.linha-vazia').count(),0);
    check(await page.locator('.freq-indicadores strong').allTextContents(),['1','1','1','0','1']);
    check((await page.locator('#freqConferencia').textContent()).includes('1 registro(s) semanal(is) antigo(s)'),true);
    const reads=await page.evaluate(()=>window.reads);
    await page.locator('#freqBusca').fill('ana');check(await page.locator('.freq-mark').count(),6);
    await page.locator('#freqDia').selectOption('Quinta');check(await page.locator('.freq-mark').count(),2);
    await page.locator('.freq-colunas summary').click();
    await page.getByRole('button',{name:'Ocultar todas',exact:true}).click();
    await page.locator('.freq-coluna-check input[value=s1]').check();check(await page.locator('.freq-mark').count(),1);
    check(await page.evaluate(()=>window.reads),reads);
    const cell=()=>page.locator('.freq-mark').first();
    check((await cell().getAttribute('aria-label')).includes('registro semanal antigo'),true);
    await cell().focus();await page.keyboard.press('Enter');
    check(await page.locator('.freq-popover button[aria-pressed=true]').textContent(),'Presente');
    await page.keyboard.press('Escape');check(await page.locator('.freq-popover').count(),0);
    check(await cell().evaluate(b=>b===document.activeElement),true);
    // Limpar apenas Quinta não remove o registro semanal antigo de Segunda.
    await cell().click();await page.getByRole('button',{name:'Limpar marcação deste dia',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#freqSalvamento').textContent.startsWith('Salvo:'));
    check(await page.evaluate(()=>store['frequenciaSemanas/s1'].status),{a:'presente',b__Terça:'falta',a__Quinta:null});
    check((await cell().textContent()).includes('Não lançado'),true);
    check(await page.locator('#freqBusca').inputValue(),'ana');check(await page.locator('.freq-coluna-check input:checked').evaluateAll(inputs=>inputs.map(i=>i.value)),['s1']);
    await page.locator('#freqDia').selectOption('Segunda');
    check(await page.locator('.freq-mark').count(),2);
    check(await page.locator('.freq-mark small').count(),2);
    await page.getByRole('button',{name:'Ocultar todas',exact:true}).click();
    await page.locator('.freq-coluna-check input[value=s2]').check();
    // Alteração de um dos horários reflete a única marcação diária nos dois.
    await cell().click();await page.getByRole('button',{name:'Falta',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#freqSalvamento').textContent.includes('· Falta.'));
    check(await page.locator('.freq-mark .falta').count(),2);
    check(await page.locator('.freq-indicadores strong').allTextContents(),['0','1','0','0','0']);
    const before=await page.evaluate(()=>writes.length);
    await page.evaluate(()=>{deny=true;});await cell().click();await page.getByRole('button',{name:'Presente',exact:true}).click();
    await page.getByText('Não foi possível salvar. A marcação anterior foi mantida. Tente novamente.',{exact:true}).waitFor();
    check(await page.evaluate(()=>writes.length),before);check(await page.locator('.freq-mark .falta').count(),2);
    await page.evaluate(()=>{deny=false;});
    // Proteção contra edição concorrente do mesmo dia.
    await cell().click();await page.evaluate(()=>{store['frequenciaSemanas/s2'].status.a__Segunda='sem_atend';});
    await page.getByRole('button',{name:'Presente',exact:true}).click();
    await page.getByText('A marcação mudou em outra aba. Reabra a frequência antes de tentar novamente.',{exact:true}).waitFor();check(await page.evaluate(()=>writes.length),before);
    await page.evaluate(()=>renderFrequencia());check(await page.locator('.freq-mark .sem_atend').count(),2);
    // Salvamento pendente bloqueia novas marcações até a confirmação.
    await page.evaluate(()=>{pause=new Promise(resolve=>window.resumeWrite=resolve);});
    await cell().click();await page.getByRole('button',{name:'Presente',exact:true}).click();
    check(await page.locator('.freq-mark:disabled').count(),2);
    check(await page.locator('#freqSalvamento').textContent(),'Salvando marcação…');
    await page.evaluate(()=>{resumeWrite();pause=null;});await page.waitForFunction(()=>document.querySelector('#freqSalvamento').textContent.includes('· Presente.'));
    check(await page.locator('.freq-mark:disabled').count(),0);
    await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();check(await page.locator('.freq-mark').count(),8);
    await page.locator('#freqOcultarVazios').uncheck();check((await page.locator('.linha-vazia').count())>0,true);
    await page.locator('#freqOcultarVazios').check();
    // Relatório: cada dia contado uma vez, legado separado e arquivo individual.
    check(await page.evaluate(()=>{
      const a=store['alunos/a'],w1={...store['frequenciaSemanas/s1'],id:'s1'},w2={...store['frequenciaSemanas/s2'],id:'s2'};
      const out=FrequenciaInterface.apurar({...a,id:'a'},[w1,w2]);
      return [out.diarios,out.antigos];
    }),[{presente:1,falta:0,justificado:1,sem_atend:0,vazio:1,desconhecido:0},{presente:1,falta:0,justificado:0,sem_atend:0,vazio:0,desconhecido:0}]);
    check(await page.evaluate(()=>{
      const out=FrequenciaInterface.apurar({id:'a',atendimentos:[{dia:'Segunda'}]},[{id:'x',status:{a__Quinta:'falta',a__Segunda:'presente','a__Sem dia':'presente'}}]);
      return [out.diarios.presente,out.diarios.falta,out.diarios.vazio,out.semDia.presente];
    }),[1,1,0,1]);
    check(await page.evaluate(()=>FrequenciaInterface.dataValida('2024-02-29')),true);
    check(await page.evaluate(()=>FrequenciaInterface.dataValida('2024-02-30')),false);
    await page.evaluate(()=>{store['frequenciaSemanas/invalida']={professorUid:'prof',turno:'Matutino',dataInicio:'2026-10-32',label:'SEMANA INVÁLIDA',status:{a__Segunda:'falta'}};});
    const antesExport=await page.evaluate(()=>writes.length);
    for(const formato of ['docx','odt']){
      await page.evaluate(()=>abrirModalRelatorioFreq());
      await page.locator('#freqRelAluno').selectOption('a');
      await page.locator('#freqRelDe').fill('2026-10-19');await page.locator('#freqRelAte').fill('2026-11-01');
      const promise=page.waitForEvent('download');
      await page.locator('#genModalBox button').filter({hasText:'Gerar '+formato.toUpperCase()}).click();
      const download=await promise;fs.mkdirSync('/tmp/site-results',{recursive:true});
      const file='/tmp/site-results/frequencia-revisada.'+formato;await download.saveAs(file);
      const zip=await JSZip.loadAsync(fs.readFileSync(file)),xml=await zip.file(formato==='docx'?'word/document.xml':'content.xml').async('string');
      check(xml.includes('Segunda: P'),true);check(xml.includes('Quinta: J'),true);
      check(xml.includes('Semanal antigo: P'),true);check(xml.includes('Bruno fictício'),false);
      check(xml.includes('SEMANA INVÁLIDA'),false);check(xml.includes('50%'),true);
      if(formato==='docx'){
        const cells=await page.evaluate(xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');const tables=d.getElementsByTagNameNS('*','tbl');const rows=tables[1].getElementsByTagNameNS('*','tr');return [...rows[2].getElementsByTagNameNS('*','tc')].map(c=>[...c.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join(''));},xml);
        check(cells,['Ána fictícia','1','0','1','0','1','50%']);
      }
    }
    check(await page.evaluate(()=>writes.length),antesExport);
    // Colunas não consecutivas, atalhos e preferência independente dos registros.
    await page.evaluate(()=>{
      for(const [id,data,ordem]of [['s3','2026-11-02',3],['s4','2026-11-09',4],['s5','2026-11-16',5]])
        store['frequenciaSemanas/'+id]={professorUid:'prof',turno:'Matutino',label:'Semana '+ordem,dataInicio:data,ordem,status:{}};
    });
    await page.evaluate(()=>renderFrequencia());
    if(!await page.locator('.freq-colunas').evaluate(d=>d.open))await page.locator('.freq-colunas summary').click();
    const readsColunas=await page.evaluate(()=>reads),writesColunas=await page.evaluate(()=>writes.length);
    await page.getByRole('button',{name:'Ocultar todas',exact:true}).click();
    check(await page.locator('.freq-mark').count(),0);
    check((await page.locator('#freqWrap').textContent()).includes('Nenhuma semana selecionada'),true);
    await page.locator('.freq-coluna-check input[value=s1]').check();await page.locator('.freq-coluna-check input[value=s4]').check();
    check(await page.locator('.freq-week-label').evaluateAll(inputs=>inputs.map(i=>i.value)),['Semana 1','Semana 4']);
    check(await page.locator('.freq-mark').count(),8);
    check(await page.evaluate(()=>store['frequenciaSemanas/s2'].status.a__Segunda),'presente');
    await page.getByRole('button',{name:'4 mais recentes',exact:true}).click();
    check(await page.locator('.freq-coluna-check input:checked').evaluateAll(inputs=>inputs.map(i=>i.value)),['s2','s3','s4','s5']);
    check(await page.evaluate(()=>reads),readsColunas);check(await page.evaluate(()=>writes.length),writesColunas);
    await page.evaluate(async()=>{store['frequenciaSemanas/s6']={professorUid:'prof',turno:'Matutino',label:'Semana 6',dataInicio:'2026-11-23',ordem:6,status:{}};await renderFrequencia();});
    check(await page.locator('.freq-coluna-check input:checked').evaluateAll(inputs=>inputs.map(i=>i.value)),['s3','s4','s5','s6']);
    await page.getByRole('button',{name:'Ocultar todas',exact:true}).click();
    await page.locator('.freq-coluna-check input[value=s1]').check();await page.locator('.freq-coluna-check input[value=s4]').check();
    await page.evaluate(async()=>{FrequenciaInterface.limpar();await renderFrequencia();});
    check(await page.locator('.freq-coluna-check input:checked').evaluateAll(inputs=>inputs.map(i=>i.value)),['s1','s4']);
    await page.evaluate(async()=>{professorUid='outra-conta';mockAuth.currentUser={uid:'outra-conta'};await renderFrequencia();});
    check(await page.locator('.freq-coluna-check').count(),0);
    await page.evaluate(async()=>{professorUid='prof';mockAuth.currentUser={uid:'prof'};await renderFrequencia();});
    check(await page.locator('.freq-coluna-check input:checked').evaluateAll(inputs=>inputs.map(i=>i.value)),['s1','s4']);
    check(await page.evaluate(()=>writes.length),writesColunas);
    await page.locator('#toast').evaluate(el=>{el.classList.remove('show');el.style.transition='none';});
    fs.mkdirSync('/tmp/site-results',{recursive:true});await page.locator('#tabFrequencia').screenshot({path:'/tmp/site-results/frequencia-conferencia.png'});
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.locator('#freqWrap').evaluate(el=>el.scrollLeft=el.scrollWidth);
      check(await page.locator('.td-aluno:not(.vazio)').first().evaluate(el=>{const r=el.getBoundingClientRect(),wrap=document.getElementById('freqWrap').getBoundingClientRect();return r.left>=wrap.left&&r.right<wrap.right;}),true);
      check(await page.locator('.td-dia').first().evaluate(el=>getComputedStyle(el).position),'static');
      await page.locator('#tabFrequencia').screenshot({path:'/tmp/site-results/frequencia-visual-'+width+'.png'});
    }
    // Uma consulta antiga não pode reaparecer depois da troca de conta.
    await page.evaluate(()=>{window.pendingLoad=new Promise(resolve=>window.resumeLoad=resolve);window.pendingRender=renderFrequencia();professorUid=null;mockAuth.currentUser=null;limparFrequencia();resumeLoad({docs:[],forEach(){}});});
    await page.evaluate(()=>pendingRender);check(await page.locator('#freqWrap').textContent(),'');check(await page.locator('#freqConferencia').textContent(),'');
    check(errors,[]);console.log(count+' verificações de frequência no Chromium aprovadas; Firebase simulado e pedidos externos bloqueados.');await context.close();
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
