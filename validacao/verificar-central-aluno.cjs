'use strict';
const {chromium} = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mockFirebase = `
window.mockAlunos = {
  a: {nome:'Ana Teste', escola:'Escola Horizonte', turma:'3º A', turno:'Matutino', professorUid:'prof-teste', atendimentos:[{dia:'Segunda',horario:'08:00'}]},
  b: {nome:'Bruno Teste', professorUid:'prof-teste'}
};
window.mockRegistros = {a:[{id:'r1',date:'2026-10-20',text:'Participou de uma atividade com apoio visual.'},{id:'r2',date:'2026-10-22',text:'Realizou uma sequência de duas etapas.'}], b:[]};
window.mockWrites=[]; window.mockListeners={};window.mockReadError=false;window.mockPending={};
const snapshot = items => ({docs:items,empty:items.length===0,forEach:fn=>items.forEach(fn)});
const doc = (id,data) => ({id,exists:!!data,data:()=>data});
function query(parts) {
  return {
    where(){return this;},orderBy(){return this;},limit(){return this;},
    doc(id){return query([...parts,id]);},collection(name){return query([...parts,name]);},
    async get(){
      if(parts.length===2 && parts[0]==='alunos') {
        if(mockPending[parts[1]]) return await mockPending[parts[1]];
        if(mockReadError) throw new Error('Falha simulada');
        return doc(parts[1],mockAlunos[parts[1]]);
      }
      if(parts.length===4 && parts[2]==='pei') return doc('atual',null);
      if(parts.length===1 && parts[0]==='alunos') return snapshot(Object.entries(mockAlunos).map(([id,data])=>doc(id,data)));
      return snapshot([]);
    },
    onSnapshot(ok,error){
      const id=parts[1];mockListeners[id]={ok,error};
      ok(snapshot((mockRegistros[id]||[]).map(r=>doc(r.id,r))));
      return ()=>{};
    },
    async set(data){mockWrites.push({parts,data});mockAlunos[parts[1]]={...mockAlunos[parts[1]],...data};},
    async add(data){
      mockWrites.push({parts,data});
      if(parts.length===1 && parts[0]==='alunos')mockAlunos.novo=data;
      if(parts[2]==='registros'){
        const id=parts[1];mockRegistros[id]=[...(mockRegistros[id]||[]),{id:'novo-registro',...data}];
        mockListeners[id]?.ok(snapshot(mockRegistros[id].map(r=>doc(r.id,r))));
      }
      return {id:'novo'};
    }
  };
}
window.mockDb={collection:name=>query([name])};
window.mockAuth={currentUser:null,onAuthStateChanged(fn){fn(null);return ()=>{};},async signOut(){this.currentUser=null;}};
window.firebase={initializeApp(){},auth:()=>mockAuth,firestore:()=>mockDb,storage:()=>({}),app:()=>({options:{}})};
firebase.firestore.FieldValue={serverTimestamp:()=>new Date(),delete:()=>null};
`;
let count = 0;
function check(actual, expected){assert.deepEqual(actual,expected);count++;}
(async()=>{
  const server=http.createServer((req,res)=>{
    const filename=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
    if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':'text/html');
    res.end(fs.readFileSync(filename));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    await context.route('**/*',route=>{
      const url=route.request().url();
      if(!url.startsWith(origin+'/'))return route.abort();
      if(/vendor\/firebase-.*\/firebase-app-compat.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:mockFirebase});
      if(/vendor\/firebase-.*\.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:''});
      return route.continue();
    });
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
    await page.evaluate(async()=>{professorUid='prof-teste';turnoAtual='Matutino';mockAuth.currentUser={uid:'prof-teste',email:'teste@example.com'};await openStudent('a');});
    check(await page.locator('#centralAlunoTitulo').textContent(),'Visão geral do aluno');
    check(await page.locator('.central-value').allTextContents(),['Escola Horizonte','3º A','Matutino','2']);
    check(await page.locator('.central-records time').allTextContents(),['22/10/2026','20/10/2026']);
    check(await page.evaluate(()=>mockWrites.length),0);
    await page.getByRole('button',{name:'Registrar atendimento',exact:true}).click();
    check(await page.evaluate(()=>document.activeElement.id),'entryText');
    await page.getByRole('button',{name:'Editar cadastro',exact:true}).click();
    check(await page.evaluate(()=>document.activeElement.id),'nomeAluno');
    await page.getByRole('button',{name:'Ver histórico completo',exact:true}).click();
    check(await page.evaluate(()=>document.activeElement.id),'entriesList');
    await page.evaluate(()=>{window.links=[];window.open=url=>links.push(url);});
    for(const name of ['Abrir PAEE','Abrir relatório','Abrir diagnóstica','Abrir PEI'])await page.getByRole('button',{name,exact:true}).click();
    check(await page.evaluate(()=>links.map(url=>new URL(url,location.href).searchParams.get('alunoId'))),['a','a','a','a']);
    // Atualização do resumo após salvar o cadastro.
    await page.evaluate(()=>openStudent('a'));
    await page.locator('#escola').fill('Escola Atualizada');
    await page.locator('#btnSalvarPerfil').click();
    check(await page.locator('.central-value').first().textContent(),'Escola Atualizada');
    // Atualização em tempo real e falha de leitura sem fingir histórico vazio.
    await page.evaluate(()=>mockListeners.a.ok({forEach:fn=>fn({id:'r3',data:()=>({date:'2026-10-23',text:'Novo atendimento registrado.'})})}));
    check(await page.locator('.central-value').last().textContent(),'1');
    check(await page.locator('.central-records p').textContent(),'Novo atendimento registrado.');
    await page.evaluate(()=>mockListeners.a.error(new Error('Falha simulada')));
    check(await page.locator('.central-value').last().textContent(),'Indisponível');
    check(await page.locator('.central-error').count(),1);
    // Conteúdo do aluno sempre é texto, nunca HTML executável.
    await page.evaluate(async()=>{mockAlunos.b.escola='<img src=x onerror="window.executou=true">';await openStudent('b');});
    check(await page.locator('#centralAluno img').count(),0);
    check(await page.evaluate(()=>!!window.executou),false);
    check(await page.locator('.central-value').last().textContent(),'0');
    check((await page.locator('.central-checks').textContent()).includes('primeiro atendimento'),true);
    await page.evaluate(async()=>{
      mockAlunos.b.diaAtendimento='Segunda';mockAlunos.b.horarioAtendimento='08:00';
      await openStudent('b');
    });
    check((await page.locator('.central-checks').textContent()).includes('Definir os dias'),false);
    // Callback do aluno anterior não substitui o histórico do aluno atual.
    await page.evaluate(()=>mockListeners.a.ok({forEach:fn=>fn({id:'errado',data:()=>({date:'2026-10-23',text:'NÃO EXIBIR'})})}));
    check((await page.locator('#centralAluno').textContent()).includes('NÃO EXIBIR'),false);
    // Novo cadastro: documentos e atendimento desabilitados, sem vínculo herdado.
    await page.evaluate(()=>goNewStudent());
    check(await page.locator('.central-docs button:disabled').count(),4);
    check(await page.getByRole('button',{name:'Registrar atendimento',exact:true}).isDisabled(),true);
    check(await page.evaluate(()=>currentStudentId),null);
    await page.locator('#nomeAluno').fill('Novo Aluno Fictício');
    await page.locator('#btnSalvarPerfil').click();
    check(await page.evaluate(()=>currentStudentId),'novo');
    check(await page.locator('.central-docs button:disabled').count(),0);
    await page.locator('#entryText').fill('Primeiro atendimento do aluno novo.');
    await page.locator('#btnSalvarRegistro').click();
    check(await page.locator('.central-value').last().textContent(),'1');
    check(await page.locator('.central-records p').textContent(),'Primeiro atendimento do aluno novo.');
    // Uma consulta lenta não deve reabrir o aluno depois de iniciar novo cadastro.
    await page.evaluate(()=>{
      mockPending.a=new Promise(resolve=>window.finalizarA=resolve);
      window.aberturaA=openStudent('a');goNewStudent();
      finalizarA({exists:true,data:()=>mockAlunos.a});
    });
    await page.evaluate(()=>aberturaA);
    check(await page.evaluate(()=>currentStudentId),null);
    check(await page.evaluate(()=>document.querySelector('#loadingOverlay').classList.contains('show')),false);
    // Erro de perfil não reutiliza dados do aluno anterior.
    await page.evaluate(async()=>{delete mockPending.a;mockReadError=true;await openStudent('a');});
    check(await page.evaluate(()=>[currentStudentId,document.querySelector('#screen-home').classList.contains('active')]),[null,true]);
    // Capturas e largura no computador e no celular.
    await page.evaluate(async()=>{mockReadError=false;mockAlunos.b.escola='Escola Jardim';await openStudent('a');});
    await page.evaluate(()=>{document.querySelector('#toast').classList.remove('show');window.scrollTo(0,0);});
    fs.mkdirSync('/tmp/site-results',{recursive:true});
    await page.screenshot({path:'/tmp/site-results/central-aluno-desktop.png',fullPage:false});
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    }
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/site-results/central-aluno-celular.png',fullPage:true});
    // A importação antiga não substitui formulários e preserva o documento anterior.
    check(await page.evaluate(async()=>{
      window.importWrites=[];
      const original=mammoth.convertToHtml;
      mammoth.convertToHtml=async()=>({value:'<p>PEI importado fictício.</p>'});
      window.importPrevious={peiFormulario:{schemaVersion:1},peiHtml:'<p>Formulário existente</p>'};
      mockDb.runTransaction=async fn=>{
        const pending=[];
        await fn({get:async()=>({exists:true,data:()=>importPrevious}),set:(reference,data)=>pending.push(data)});
        importWrites.push(...pending);
      };
      const event={target:{files:[new File(['ficticio'],'pei.docx')]}};
      await uploadPei(event,'a','Ana Teste',null,document.createElement('span'));
      const bloqueado=importWrites.length;
      window.importPrevious={peiHtml:'<p>Documento anterior</p>',peiComprimido:false,peiData:'2026-10-20'};
      await uploadPei(event,'a','Ana Teste',null,document.createElement('span'));
      mammoth.convertToHtml=original;
      return [bloqueado,importWrites.length,importWrites[0].peiHtml,LZString.decompressFromUTF16(importWrites[1].peiHtml)];
    }),[0,2,'<p>Documento anterior</p>','<p>PEI importado fictício.</p>']);
    check(errors,[]);
    console.log(count+' verificações da central aprovadas no Chromium. Firebase simulado; nenhuma requisição externa permitida.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
