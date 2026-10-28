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
 check(await page.locator('#agendaData').inputValue(),await page.evaluate(()=>AgendaDia.hoje()));
 await page.locator('#agendaData').fill('2026-10-26');
 check(await page.locator('.agenda-horario').count(),2);check(await page.locator('#agendaLista li').count(),3);
 check((await page.locator('#agendaStatus').textContent()).includes('2 aluno(s) · 2 horário(s)'),true);
 check((await page.locator('#agendaDia').textContent()).includes('Aluno vespertino'),false);
 check((await page.locator('#agendaDia').textContent()).includes('NÃO MOSTRAR'),false);
 check(await page.locator('.agenda-horario').first().locator('strong').allTextContents(),['Ana fictícia','Bruno fictício']);
 const reads=await page.evaluate(()=>__agendaReads);
 await page.locator('#agendaData').fill('2026-10-27');check(await page.locator('#agendaLista li').count(),0);
 check((await page.locator('#agendaLista').textContent()).includes('Nenhum atendimento cadastrado'),true);
 await page.locator('#agendaData').fill('2026-10-31');check(await page.locator('#agendaLista li').count(),0);
 await page.locator('#agendaData').fill('');check((await page.locator('#agendaStatus').textContent()).includes('data válida'),true);
 await page.locator('#agendaDia').getByRole('button',{name:'Hoje',exact:true}).click();check(await page.locator('#agendaData').inputValue(),await page.evaluate(()=>AgendaDia.hoje()));
 check(await page.evaluate(()=>__agendaReads),reads);check(await page.evaluate(()=>__test.calls),0);
 await page.locator('#agendaData').fill('2026-10-26');
 fs.mkdirSync('/tmp/site-results',{recursive:true});await page.locator('#agendaDia').screenshot({path:'/tmp/site-results/agenda-dia-desktop.png'});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#agendaDia').screenshot({path:'/tmp/site-results/agenda-dia-'+width+'.png'});}
 await page.getByRole('button',{name:'Abrir ficha pela agenda: Ana fictícia',exact:true}).first().focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>currentStudentId==='aluno-a');check(await page.locator('#screen-profile').isVisible(),true);
 await page.evaluate(()=>goHome());check(await page.locator('#agendaData').inputValue(),'2026-10-26');
 await page.evaluate(async()=>{turnoAtual='Vespertino';await renderStudentList();});check(await page.locator('#agendaData').inputValue(),await page.evaluate(()=>AgendaDia.hoje()));
 await page.locator('#agendaData').fill('2026-10-26');check((await page.locator('#agendaLista').textContent()).includes('Aluno vespertino'),true);
 await page.evaluate(async()=>{__agendaDeny=true;await renderStudentList();});check((await page.locator('#agendaStatus').textContent()).includes('Não foi possível'),true);check(await page.locator('#agendaLista li').count(),0);
 await page.evaluate(()=>{__agendaDeny=false;__agendaPause=new Promise(resolve=>window.resumeAgenda=resolve);window.pendingAgenda=renderStudentList();});
 check((await page.locator('#agendaStatus').textContent()).includes('Carregando'),true);
 await page.evaluate(async()=>{await __test.auth.signOut();resumeAgenda({forEach:fn=>fn({id:'d',data:()=>({professorUid:'a',nome:'CONSULTA ANTIGA'})})});await pendingAgenda;});
 check(await page.locator('#agendaDia').isHidden(),true);check(await page.locator('#agendaDia').textContent(),'');check(await page.locator('#studentsList').textContent(),'');check(await page.evaluate(()=>__test.calls),0);check(errors,[]);
 console.log(total+' verificações da agenda do dia aprovadas; dados fictícios, Firebase simulado e pedidos externos bloqueados.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
