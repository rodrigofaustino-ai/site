'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
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
    await page.locator('#freqSemana').selectOption('s1');check(await page.locator('.freq-mark').count(),1);
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
    check(await page.locator('#freqBusca').inputValue(),'ana');check(await page.locator('#freqSemana').inputValue(),'s1');
    await page.locator('#freqDia').selectOption('Segunda');
    check(await page.locator('.freq-mark').count(),2);
    check(await page.locator('.freq-mark small').count(),2);
    await page.locator('#freqSemana').selectOption('s2');
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
    fs.mkdirSync('/tmp/site-results',{recursive:true});await page.locator('#tabFrequencia').screenshot({path:'/tmp/site-results/frequencia-conferencia.png'});
    for(const width of [390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
    // Uma consulta antiga não pode reaparecer depois da troca de conta.
    await page.evaluate(()=>{window.pendingLoad=new Promise(resolve=>window.resumeLoad=resolve);window.pendingRender=renderFrequencia();professorUid=null;mockAuth.currentUser=null;limparFrequencia();resumeLoad({docs:[],forEach(){}});});
    await page.evaluate(()=>pendingRender);check(await page.locator('#freqWrap').textContent(),'');check(await page.locator('#freqConferencia').textContent(),'');
    check(errors,[]);console.log(count+' verificações de frequência no Chromium aprovadas; Firebase simulado e pedidos externos bloqueados.');await context.close();
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
