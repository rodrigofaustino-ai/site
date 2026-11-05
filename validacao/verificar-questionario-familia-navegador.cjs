'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');let total=0;const check=(a,b)=>{assert.deepEqual(a,b);total++;};
const source=fs.readFileSync(path.join(__dirname,'verificar-registro-tradicional-navegador.cjs'),'utf8');
let mock=source.slice(source.indexOf('function mock(){'),source.indexOf('\n(async()=>'));
mock=mock.replace('const clone=data=>data==null?data:JSON.parse(JSON.stringify(data));',`const clone=data=>data==null?data:JSON.parse(JSON.stringify(data),(k,v)=>v&&typeof v==='object'&&v._ms!=null?{_ms:v._ms,toDate:()=>new Date(v._ms),toMillis:()=>v._ms}:v);`);
mock=mock.replace("async get(){const value=store[this.path];", "async get(){(state.reads||=[]).push(this.path);if(state.readDeny)throw new Error('Leitura indisponível');const value=store[this.path];");
mock+='\nmock();\n'+`
(()=>{const db=firebase.firestore();firebase.apps=[];
 firebase.firestore.Timestamp={fromDate:d=>({_ms:d.getTime()})};firebase.firestore.FieldValue.serverTimestamp=()=>({_ms:Date.now()});
 db.batch=()=>{const ops=[];return {set:(r,d)=>ops.push([r.path,d]),async commit(){__test.batchCalls=(__test.batchCalls||0)+1;if(__test.deny)throw new Error('Falha antes de gravar');for(const [p,d]of ops)__test.store[p]=d;if(__test.ackLost)throw new Error('Confirmação perdida');}};};
})();`;
(async()=>{let server,browser;try{
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo'});await context.addInitScript(mock);
 await context.route('**/*',r=>{const url=r.request().url();if(!url.startsWith(origin+'/'))return r.abort();if(/firebase-.*-compat\.js/.test(url))return r.fulfill({contentType:'application/javascript',body:''});return r.continue();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const token='A'.repeat(43);
 await page.addInitScript(t=>{__test.store['convitesFamilia/'+t]={professorUid:'a',alunoId:'aluno-a',apelido:'Ana fictícia',periodo:'2º semestre de 2026',versao:2,ativa:true,expiraEm:{_ms:Date.now()+86400000}};},token);
 await page.goto(origin+'/questionario-familia.html#token='+token,{waitUntil:'networkidle'});
 check(await page.locator('h1').textContent(),'Olá, família!');check(await page.evaluate(()=>__test.auth.currentUser),null);
 check(await page.evaluate(()=>__test.reads),['convitesFamilia/'+token,'enviosFamilia/'+token]);check(await page.evaluate(()=>QuestionarioFamiliaModelo.grupos.length),27);
 check(await page.evaluate(()=>QuestionarioFamiliaModelo.itens.length),58);check(await page.evaluate(()=>new Set(QuestionarioFamiliaModelo.itens.filter(q=>q.origem).map(q=>q.origem)).size),54);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 fs.mkdirSync('/tmp/site-results',{recursive:true});await page.screenshot({path:'/tmp/site-results/familia-convite-celular.png',fullPage:true});
 await page.getByRole('button',{name:'Começar',exact:true}).click();check((await page.locator('#familiaStatus').textContent()).includes('Informe'),true);
 await page.getByLabel('Seu nome',{exact:true}).fill('Responsável fictício');await page.getByLabel('Vínculo com o estudante',{exact:false}).fill('Mãe');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Começar',exact:true}).click();
 check((await page.locator('h2').textContent()).includes('mostra o que quer'),true);
 await page.getByRole('button',{name:'Continuar',exact:true}).click();check((await page.locator('#familiaStatus').textContent()).includes('Responda'),true);
 await page.locator('input[name=oralidade_1][value=relato]').check();await page.locator('#nota-oralidade_1').fill('Aponta para o copo e usa imagens.');await page.locator('input[name=oralidade_15][value=apoio]').check();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Voltar',exact:true}).click();
 check(await page.locator('#nota-oralidade_1').inputValue(),'Aponta para o copo e usa imagens.');check(await page.locator('input[name=oralidade_15][value=apoio]').isChecked(),true);
 await page.getByRole('button',{name:'Continuar',exact:true}).click();let screens=1;
 while(await page.getByRole('button',{name:'Continuar',exact:true}).count()){
  const names=await page.locator('fieldset').evaluateAll(fields=>fields.map(f=>f.dataset.item));
  for(const name of names){if(['rotina_sono','rotina_dia','avd_alimentacao_contexto'].includes(name)){await page.locator('input[name="'+name+'"][value=relato]').check();await page.locator('#nota-'+name).fill(name==='rotina_sono'?'Dorme às 21h, acorda às 7h.':name==='rotina_dia'?'Brinca no quintal e utiliza imagens no tablet.':'Tem restrição alimentar e usa colher adaptada.');}else await page.locator('input[name="'+name+'"][value=nao_sabe]').check();}
  if(names.includes('rotina_sono'))await page.screenshot({path:'/tmp/site-results/familia-sono-celular.png',fullPage:true});
  await page.getByRole('button',{name:'Continuar',exact:true}).click();screens++;if(screens>40)throw new Error('Navegação sem fim');
 }
 check(screens,29);check(await page.locator('h2').textContent(),'Conferir e enviar');
 await page.getByLabel('Pontos fortes, interesses',{exact:false}).fill('Prioridade: autonomia na rotina.');await page.evaluate(()=>{__test.deny=true;});await page.getByRole('button',{name:'Enviar respostas',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#familiaStatus').textContent.includes('Não foi possível confirmar'));
 check(await page.evaluate(()=>Object.keys(__test.store).filter(k=>k.startsWith('respostasFamiliaCompletas/')).length),0);check(await page.getByLabel('Pontos fortes, interesses',{exact:false}).inputValue(),'Prioridade: autonomia na rotina.');
 await page.evaluate(()=>{__test.deny=false;__test.ackLost=true;});await page.getByRole('button',{name:'Enviar respostas',exact:true}).click();await page.getByRole('heading',{name:'Respostas enviadas!',exact:true}).waitFor();
 check(await page.evaluate(()=>Object.keys(__test.store).filter(k=>k.startsWith('respostasFamiliaCompletas/')).length),10);check(await page.evaluate(t=>!!__test.store['enviosFamilia/'+t],token),true);check(await page.evaluate(()=>__test.batchCalls),2);
 const store=await page.evaluate(()=>__test.store);check(store['respostasFamiliaCompletas/'+token+'/areas/rotina'].observacoesPerguntas.rotina_sono,'Dorme às 21h, acorda às 7h.');
 check(store['respostasFamiliaCompletas/'+token+'/areas/oralidade'].observacoesPerguntas.oralidade_1,'Aponta para o copo e usa imagens.');check(store['respostasFamiliaCompletas/'+token].versao,2);
 await page.screenshot({path:'/tmp/site-results/familia-confirmacao-celular.png',fullPage:true});
 // Abre a consulta do professor com UID próprio do Diário, preservando respostas anteriores.
 const teacher=await context.newPage();teacher.on('pageerror',e=>errors.push(e.message));await teacher.goto(origin+'/index.html',{waitUntil:'networkidle'});
 await teacher.evaluate(async data=>{Object.assign(__test.store,data);__test.store['respostasFamilia/antigo']={professorUid:'a',alunoId:'aluno-a',versao:1,responsavel:'Família antiga fictícia',vinculo:'Responsável',respostas:{comunica_escolha:'apoio'},observacoes:'Informação anterior preservada.',enviadoEm:{_ms:Date.now()-86400000}};__test.store['respostasFamilia/naomostrar']={professorUid:'a',alunoId:'outro-aluno',versao:1,responsavel:'NÃO MOSTRAR OUTRO ALUNO'};__test.auth.currentUser={uid:'a',email:'a@example.test'};professorUid='a';turnoAtual='Matutino';showScreen('home');abrirQuestionarioFamilia({id:'aluno-a',nome:'Ana fictícia'});},store);
 await teacher.getByText('Nenhum convite atual.',{exact:true}).waitFor();await teacher.getByText('Responsável fictício',{exact:false}).first().waitFor();
 check(await teacher.getByRole('dialog').count(),1);check((await teacher.getByRole('dialog').textContent()).includes('Informação anterior preservada.'),true);check((await teacher.getByRole('dialog').textContent()).includes('NÃO MOSTRAR OUTRO ALUNO'),false);await teacher.locator('.familia-dialog > section > details > summary').first().click();await teacher.getByText('Sono e rotina diária',{exact:true}).click();check((await teacher.getByRole('dialog').textContent()).includes('Dorme às 21h, acorda às 7h.'),true);
 check((await teacher.getByRole('dialog').textContent()).includes('Não altera marcações S/N/P'),true);
 await teacher.evaluate(()=>{__test.deny=true;});await teacher.getByRole('button',{name:'Gerar novo link',exact:true}).click();await teacher.waitForFunction(()=>document.querySelector('.familia-dialog [role=status]').textContent.includes('Não foi possível'));
 check(await teacher.getByLabel('Link do questionário',{exact:true}).count(),0);
 await teacher.evaluate(()=>{__test.deny=false;});await teacher.getByRole('button',{name:'Gerar novo link',exact:true}).click();await teacher.getByLabel('Link do questionário',{exact:true}).waitFor();const link=await teacher.getByLabel('Link do questionário',{exact:true}).inputValue();const novo=new URLSearchParams(new URL(link).hash.slice(1)).get('token');check(/^[A-Za-z0-9_-]{43}$/.test(novo),true);
 await teacher.getByRole('button',{name:'Gerar novo link',exact:true}).click();await teacher.waitForFunction(t=>document.querySelector('.familia-link')?.value&&!document.querySelector('.familia-link').value.includes(t),novo);check(await teacher.evaluate(t=>__test.store['convitesFamilia/'+t].ativa,novo),false);
 await teacher.getByRole('button',{name:'Desativar link',exact:true}).click();await teacher.waitForFunction(()=>document.querySelector('.familia-dialog [role=status]').textContent.startsWith('Link desativado'));check(await teacher.getByLabel('Link do questionário',{exact:true}).count(),0);
 await teacher.evaluate(()=>__test.auth.signOut());check(await teacher.getByRole('dialog').count(),0);
 const corrida=await context.newPage();corrida.on('pageerror',e=>errors.push(e.message));await corrida.addInitScript(t=>{__test.store['convitesFamilia/'+t]={professorUid:'a',alunoId:'aluno-a',apelido:'Ana fictícia',periodo:'2º semestre de 2026',versao:2,ativa:true,expiraEm:{_ms:Date.now()+86400000}};},token);await corrida.goto(origin+'/questionario-familia.html#token='+token,{waitUntil:'networkidle'});
 await corrida.getByLabel('Seu nome',{exact:true}).fill('Outra sessão fictícia');await corrida.getByLabel('Vínculo com o estudante',{exact:false}).fill('Responsável');await corrida.getByRole('checkbox').check();await corrida.getByRole('button',{name:'Começar',exact:true}).click();let passos=0;
 while(await corrida.getByRole('button',{name:'Continuar',exact:true}).count()){for(const id of await corrida.locator('fieldset').evaluateAll(fs=>fs.map(f=>f.dataset.item)))await corrida.locator('input[name="'+id+'"][value=nao_sabe]').check();await corrida.getByRole('button',{name:'Continuar',exact:true}).click();if(++passos>40)throw new Error('Navegação sem fim');}
 await corrida.evaluate(t=>{__test.store['enviosFamilia/'+t]={enviadoEm:{_ms:Date.now()},envioId:'outro-identificador'};__test.deny=true;},token);await corrida.getByRole('button',{name:'Enviar respostas',exact:true}).click();await corrida.waitForFunction(()=>document.querySelector('#familiaStatus').textContent.includes('outra sessão'));
 check((await corrida.locator('#familiaStatus').textContent()).includes('Este preenchimento não foi salvo'),true);check(await corrida.getByRole('heading',{name:'Respostas enviadas!',exact:true}).count(),0);check(await corrida.getByRole('button',{name:'Enviar respostas',exact:true}).isDisabled(),true);
 const invalid=await context.newPage();invalid.on('pageerror',e=>errors.push(e.message));await invalid.goto(origin+'/questionario-familia.html#token=invalido',{waitUntil:'networkidle'});check((await invalid.locator('#familiaStatus').textContent()).includes('Não foi possível abrir'),true);check(await invalid.evaluate(()=>__test.reads||[]),[]);
 for(const width of [390,320]){await invalid.setViewportSize({width,height:844});check(await invalid.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 check(errors,[]);console.log(total+' verificações do questionário familiar no Chromium aprovadas, com dados fictícios e rede externa bloqueada.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
