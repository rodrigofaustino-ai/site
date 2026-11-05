'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');let total=0;const check=(a,b)=>{assert.deepEqual(a,b);total++;};
const source=fs.readFileSync(path.join(__dirname,'verificar-registro-tradicional-navegador.cjs'),'utf8');
const mock=source.slice(source.indexOf('function mock(){'),source.indexOf('\n(async()=>')).replace('async get(){',"async get(){window.__agendaReads=(window.__agendaReads||0)+1;if(this.path==='alunos'&&window.__agendaDeny)throw new Error('Falha de leitura fictícia');if(this.path==='alunos'&&window.__agendaPause)return await window.__agendaPause;")+'\nmock();';
(async()=>{let browser,server;try{
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Sao_Paulo'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(mock);await page.route('**/*',r=>{const u=r.request().url();if(!u.startsWith(origin+'/'))return r.abort();if(/firebase-.*-compat\.js/.test(u))return r.fulfill({contentType:'application/javascript',body:''});return r.continue();});await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
 check(await page.locator('#agendaDia').isHidden(),true);
 await page.evaluate(async()=>{professorUid='a';turnoAtual='Matutino';__test.auth.currentUser={uid:'a',email:'a@example.test'};
 Object.assign(__test.store,{
  'alunos/aluno-a':{professorUid:'a',nome:'Ana fictícia',atendimentos:[{dia:'Segunda',horario:'1º Horário'},{dia:'Segunda',horario:'1º Horário'},{dia:'Segunda',horario:'2º Horário'}]},
  'alunos/aluno-b':{professorUid:'a',nome:'Bruno fictício',diaAtendimento:'Segunda',horarioAtendimento:'1º Horário'},
  'alunos/c':{professorUid:'a',nome:'Aluno vespertino',turno:'Vespertino',atendimentos:[{dia:'Segunda',horario:'3º Horário'}]},
  'alunos/d':{professorUid:'outra',nome:'NÃO MOSTRAR OUTRA CONTA',atendimentos:[{dia:'Segunda',horario:'1º Horário'}]},
  'alunos/e':{professorUid:'a',nome:'Sem horário válido',atendimentos:[{dia:'Segunda',horario:'inexistente'}]}
 });showScreen('home');await renderStudentList();});

 await page.evaluate(()=>{__test.store['frequenciaSemanas/s1']={professorUid:'a',turno:'Matutino',dataInicio:'2026-10-26',dataFim:'2026-10-30',label:'26/10 a 30/10',status:{'aluno-a__Terça':'justificado'}};});
 await page.locator('#agendaData').fill('2026-10-26');
 const p=page.getByRole('button',{name:'Presente · Ana fictícia',exact:true}).first();
 await p.waitFor();await page.waitForFunction(()=>!document.querySelector('.agenda-marca.presente').disabled);
 await p.click();await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.startsWith('Frequência salva'));
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']),'presente');
 check(await page.getByRole('button',{name:'Presente · Ana fictícia',exact:true}).last().getAttribute('aria-pressed'),'true');
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Terça']),'justificado');
 await page.getByRole('button',{name:'Sem atendimento pedagógico · 1º Horário',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.startsWith('Frequência salva'));
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']),'sem_atend');
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-b__Segunda']),'sem_atend');
 await page.evaluate(()=>{__test.deny=true;});await p.click();await page.waitForFunction(()=>!document.querySelector('.agenda-marca.presente').disabled);
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']),'sem_atend');
 await page.evaluate(()=>{__test.deny=false;__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']='justificado';});
 await p.click();await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.includes('outra aba'));
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']),'justificado');
 await p.click();await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.startsWith('Frequência salva'));
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']),'presente');
 await page.evaluate(async()=>{await renderFrequencia();});
 check(await page.locator('.freq-week-label').first().inputValue(),'26/10\na\n30/10');
 check(await page.locator('.freq-week-head').first().evaluate(e=>getComputedStyle(e).minWidth),'78px');
 await page.evaluate(()=>{__test.store['frequenciaSemanas/s2']={...__test.store['frequenciaSemanas/s1']};});
 await page.locator('#agendaData').fill('2026-10-27');await page.locator('#agendaData').fill('2026-10-26');
 await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.includes('sobrepostas'));check(await p.isDisabled(),true);
 await page.locator('#agendaData').fill('2026-11-02');await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.includes('Não há semana'));check(await p.isDisabled(),true);
 await page.evaluate(()=>{delete __test.store['frequenciaSemanas/s2'];});await page.locator('#agendaData').fill('2026-10-26');await page.waitForFunction(()=>!document.querySelector('.agenda-marca.presente').disabled);

 for(const [label,value]of [['Falta','falta'],['Justificado','justificado']]){await page.getByRole('button',{name:label+' · Bruno fictício',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.startsWith('Frequência salva'));check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-b__Segunda']),value);}
 await page.evaluate(()=>{__test.store['alunos/aluno-b'].professorUid='outra';});
 await page.getByRole('button',{name:'Sem atendimento pedagógico · 1º Horário',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#agendaFrequenciaStatus').textContent.includes('cadastro'));
 check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-a__Segunda']),'presente');check(await page.evaluate(()=>__test.store['frequenciaSemanas/s1'].status['aluno-b__Segunda']),'justificado');
 await page.evaluate(()=>{__test.store['alunos/aluno-b'].professorUid='a';});
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#agendaDia').screenshot({path:'/tmp/site-results/agenda-frequencia-'+width+'.png'});}
 check(errors,[]);console.log(total+' verificações de atalhos de frequência aprovadas.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
