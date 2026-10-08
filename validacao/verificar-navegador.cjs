'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {startConverter}=require('./apoio-conversor.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
 const converter=await startConverter();let browser,server;
 try {
  server=http.createServer((req,res)=>{
   const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
   if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);return res.end();}
   res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(filename));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const request=route.request();const url=request.url();
   if(url===origin+'/.netlify/functions/convert-docx'){
    const result=await converter.handler({httpMethod:request.method(),headers:request.headers(),body:request.postDataBuffer().toString('base64'),isBase64Encoded:true});
    return route.fulfill({status:result.statusCode,headers:result.headers,body:result.isBase64Encoded?Buffer.from(result.body,'base64'):result.body});
   }
   if(!url.startsWith(origin+'/'))return route.abort(); // Não enviar dados aos serviços reais.
   return route.continue();
  });
  async function loginFixture(){await page.evaluate(idToken=>{window.firebase.auth=()=>({currentUser:{getIdToken:async()=>idToken}});},converter.idToken);}
  async function download(label,format,action){
   const [file]=await Promise.all([page.waitForEvent('download',{timeout:60000}),action()]);
   assert(file.suggestedFilename().endsWith('.'+format));await file.saveAs('/tmp/site-results/chromium-'+file.suggestedFilename());console.log('Chromium:',label,format,'OK');
  }
  for(const file of ['diagnostica_formulario.html','paee_formulario_02.html','relatorio_formulario.html']){
   await page.goto(origin+'/'+file,{waitUntil:'networkidle'});await loginFixture();
   await page.evaluate(()=>{state=novoEstado();state.identificacao.nome='Ana São';});
   for(const format of ['docx','pdf','odt'])await download(file,format,()=>page.evaluate(format=>document.getElementById('btn-export-'+format).click(),format));
  }
  await page.goto(origin+'/index.html',{waitUntil:'networkidle'});await loginFixture();
  await page.evaluate(()=>abrirPei('ficticio','Ana São','<h1>PEI Ana São</h1><p>Comunicação e participação</p><table><tr><td>Meta</td><td>Ação</td></tr><tr><td>Autonomia</td><td>Apoio visual</td></tr></table>',null));
  for(const format of ['docx','pdf','odt'])await download('PEI',format,()=>page.locator('#peiViewer button').filter({hasText:'Exportar '+format.toUpperCase()}).evaluate(button=>button.click()));
  await page.evaluate(()=>{
   const snapshot=items=>({forEach:fn=>items.forEach(d=>fn({id:d.id,data:()=>d}))});
   alunosRef=()=>({get:async()=>snapshot([{id:'a1',nome:'Ana São'}])});semanasRef=()=>({get:async()=>snapshot([{id:'s1',dataInicio:'2026-10-01',label:'Semana 1',status:{a1:'presente'}}])});
   filtrarAlunosPorTurno=items=>items;filtrarSemanasPorTurno=items=>items;
  });
  for(const format of ['docx','pdf','odt']){
   await page.evaluate(()=>abrirModalRelatorioFreq());
   await page.locator('#freqRelDe').fill('2026-10-01');await page.locator('#freqRelAte').fill('2026-10-08');
   await download('Frequência',format,()=>page.locator('#genModalBox button').filter({hasText:'Gerar '+format.toUpperCase()}).evaluate(button=>button.click()));
  }
  assert.deepEqual(errors,[]);await context.close();console.log('15 downloads confirmados no navegador usando o conversor real.');
 } finally {converter.stop();if(server)server.close();if(browser)await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
