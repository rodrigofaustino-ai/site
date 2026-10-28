'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');let total=0;const check=(a,b)=>{assert.deepEqual(a,b);total++;};
const source=fs.readFileSync(path.join(__dirname,'verificar-registro-tradicional-navegador.cjs'),'utf8');
const mock=source.slice(source.indexOf('function mock(){'),source.indexOf('\n(async()=>')).replace('async get(){',"async get(){if(this.path==='frequenciaSemanas'){window.__freqReads=(window.__freqReads||0)+1;if(window.__freqDeny)throw Error('Falha fictícia');if(window.__freqPause)return await window.__freqPause;}")+'\nmock();';
(async()=>{let browser,server;try{
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(mock);await page.route('**/*',r=>{const u=r.request().url();if(!u.startsWith(origin+'/'))return r.abort();if(/firebase-.*-compat\.js/.test(u))return r.fulfill({contentType:'application/javascript',body:''});return r.continue();});await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{professorUid='a';turnoAtual='Matutino';__test.auth.currentUser={uid:'a',email:'a@example.test'};__test.store['alunos/aluno-a'].atendimentos=[{dia:'Segunda',horario:'1º Horário'},{dia:'Segunda',horario:'2º Horário'},{dia:'Quinta',horario:'1º Horário'}];Object.assign(__test.store,{
  'alunos/aluno-a/metas/m':{objetivo:'Participar com apoio visual',status:'ativa',revision:1},
  'frequenciaSemanas/s1':{professorUid:'a',turno:'Matutino',label:'Semana antiga',dataInicio:'2026-10-19',status:{'aluno-a':'presente'}},
  'frequenciaSemanas/s2':{professorUid:'a',turno:'Matutino',label:'Semana diária',dataInicio:'2026-10-26',status:{'aluno-a__Segunda':'presente','aluno-a__Quinta':'justificado','aluno-a__Sem dia':'falta'}},
  'frequenciaSemanas/s3':{professorUid:'a',turno:'Matutino',label:'Semana posterior',dataInicio:'2026-11-02',status:{'aluno-a__Segunda':'falta'}},
  'frequenciaSemanas/s4':{professorUid:'a',turno:'Vespertino',label:'NÃO MOSTRAR OUTRO TURNO',dataInicio:'2026-10-26',status:{'aluno-a__Segunda':'falta'}},
  'frequenciaSemanas/s5':{professorUid:'a',label:'Semana sem data',dataInicio:'inválida',status:{'aluno-a__Segunda':'falta'}},
  'frequenciaSemanas/s6':{professorUid:'outra',label:'NÃO MOSTRAR OUTRA CONTA',dataInicio:'2026-10-26',status:{'aluno-a__Segunda':'falta'}}
 });await openStudent('aluno-a');});
 await page.waitForFunction(()=>document.querySelector('#metasStatus').textContent.includes('1 meta'));
 await page.evaluate(()=>{currentEntries=[{_id:'r1',date:'2026-10-20',text:'Relato com meta',metaIds:['m']},{_id:'r2',date:'2026-10-25',text:'Relato sem vínculo'}];centralRegistrosStatus='pronto';renderCentralAluno();});
 await page.locator('#acompanhamentoPeriodo > details > summary').click();
 const aplicar=async(de,ate)=>{await page.locator('#acompanhamentoDe').fill(de);await page.locator('#acompanhamentoAte').fill(ate);await page.getByRole('button',{name:'Aplicar período',exact:true}).click();};
 await aplicar('2026-10-19','2026-10-26');check(await page.evaluate(()=>window.__freqReads||0),0);
 check(await page.locator('.acompanhamento-indicador strong').allTextContents(),['2','1','1','1']);
 await page.getByRole('button',{name:'Carregar frequência do resumo',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.resumo-frequencia-indicadores strong').length===6);
 const totais=()=>page.locator('.resumo-frequencia-indicadores strong').allTextContents();
 check(await totais(),['1','0','1','0','0','0']);check(await page.evaluate(()=>__freqReads),1);
 check((await page.locator('#resumoFrequenciaStatus').textContent()).startsWith('2 semana(s)'),true);
 check((await page.locator('#resumoFrequencia').textContent()).includes('1 semana(s) sem data'),true);
 check((await page.locator('#resumoFrequencia').textContent()).includes('NÃO MOSTRAR'),false);
 check(await page.locator('.resumo-frequencia-separado').count(),2);
 check((await page.locator('.resumo-frequencia-separado').first().textContent()).includes('Presente: 1'),true);
 check((await page.locator('.resumo-frequencia-separado').last().textContent()).includes('Falta: 1'),true);
 fs.mkdirSync('/tmp/site-results',{recursive:true});await page.locator('#acompanhamentoPeriodo').screenshot({path:'/tmp/site-results/resumo-periodo.png'});
 await page.locator('#acompanhamentoDe').fill('2026-11-02');check(await totais(),['1','0','1','0','0','0']);
 await aplicar('2026-11-02','2026-11-02');check(await totais(),['0','1','0','0','1','0']);check(await page.evaluate(()=>__freqReads),1);
 await aplicar('2026-11-03','2026-11-02');check(await page.locator('.resumo-frequencia-indicadores').count(),0);
 await page.getByRole('button',{name:'Todo o histórico',exact:true}).click();check(await totais(),['1','2','1','0','2','0']);check(await page.evaluate(()=>__freqReads),1);
 await aplicar('2020-01-01','2020-01-02');check(await page.locator('.resumo-frequencia-indicadores').count(),0);check((await page.locator('#resumoFrequencia').textContent()).includes('Nenhuma semana encontrada'),true);
 await aplicar('2026-10-19','2026-10-26');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#resumoFrequencia').screenshot({path:'/tmp/site-results/resumo-frequencia-'+width+'.png'});}
 await page.evaluate(()=>{__freqDeny=true;});await page.getByRole('button',{name:'Atualizar frequência do resumo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#resumoFrequenciaStatus').textContent.includes('Não foi possível'));check(await page.locator('.resumo-frequencia-indicadores').count(),0);
 await page.evaluate(()=>{__freqDeny=false;__freqPause=new Promise(resolve=>window.resumeFreq=resolve);});await page.getByRole('button',{name:'Carregar frequência do resumo',exact:true}).click();check(await page.getByRole('button',{name:'Consultando frequência…',exact:true}).isDisabled(),true);
 await page.evaluate(()=>openStudent('aluno-b'));await page.waitForFunction(()=>currentStudentId==='aluno-b');await page.evaluate(()=>{resumeFreq({forEach:fn=>fn({id:'velha',data:()=>({professorUid:'a',dataInicio:'2026-10-26',status:{'aluno-a__Segunda':'presente'}})})});});
 check(await page.locator('.resumo-frequencia-indicadores').count(),0);check(await page.evaluate(()=>__test.calls),0);
 await page.evaluate(()=>__test.auth.signOut());check(await page.locator('#resumoFrequencia').count(),0);check(errors,[]);
 console.log(total+' verificações do resumo por período aprovadas; Firebase simulado, dados fictícios e pedidos externos bloqueados.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
