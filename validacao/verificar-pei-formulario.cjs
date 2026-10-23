'use strict';
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const mock=`
window.mockWrites=[];window.mockDeny=false;window.mockMetaError=false;window.mockPendingMetas=null;
window.mockOriginal={peiHtml:'<h1>PEI anterior</h1><p><strong>Rótulo anterior:</strong></p><p>Texto original preservado.</p><table><tr><th>Cabeçalho</th><th>Descrição</th></tr><tr><td>Aspecto</td><td>Observação fictícia.</td></tr></table><script>parent.executou=true</script>',peiComprimido:false,peiData:'2026-10-20T12:00:00.000Z',professorUid:'prof-teste',peiNomeArquivo:'original.docx'};
window.mockStore={
 'alunos/a':{nome:'Ana Teste',dataNasc:'2015-03-14',escola:'Escola Horizonte',turma:'3º A',periodo:'Matutino',professorUid:'prof-teste'},
 'alunos/b':{nome:'Aluno de outro professor',professorUid:'outro'},
 'alunos/c':{nome:'Aluno Novo',professorUid:'prof-teste'},
 'alunos/a/metas/meta-a':{objetivo:'Participar de atividades coletivas com apoio visual.',criterio:'Registrar a participação e os apoios oferecidos.',apoios:'Sequência visual.',revisao:'2026-11-23',responsavel:'Professora fictícia',status:'ativa',revision:1},
 'alunos/a/metas/meta-b':{objetivo:'Ampliar a comunicação de preferências.',criterio:'Observar as escolhas durante as atividades.',status:'em_revisao',revision:2},
 'alunos/a/metas/meta-c':{objetivo:'META ARQUIVADA NÃO IMPORTAR',status:'arquivada'},
 'alunos/a/metas/meta-d':{objetivo:'META CONCLUÍDA NÃO IMPORTAR',status:'concluida'},
 'alunos/b/metas/meta-outro':{objetivo:'META DE OUTRO ALUNO NÃO IMPORTAR',status:'ativa'},
 'alunos/a/pei/atual':mockOriginal
};
const clone=data=>data==null?data:JSON.parse(JSON.stringify(data));
function ref(parts){return {
 path:parts.join('/'),
 doc(id){return ref([...parts,id]);},collection(name){return ref([...parts,name]);},where(key,op,value){return {...this,filter:{key,value}};},
 async get(){
  const name=parts.join('/');
  if(parts.at(-1)==='metas'){
    if(mockMetaError)throw new Error('Falha simulada na leitura das metas');
    if(mockPendingMetas)return await mockPendingMetas;
  }
  if(parts.length%2===0)return {id:parts.at(-1),exists:!!mockStore[name],data:()=>clone(mockStore[name])};
  const docs=Object.entries(mockStore).filter(([key,data])=>key.startsWith(name+'/')&&key.split('/').length===parts.length+1&&(!this.filter||data[this.filter.key]===this.filter.value)).map(([key,data])=>({id:key.split('/').at(-1),data:()=>clone(data)}));
  return {docs};
 }
};}
window.mockDb={collection:name=>ref([name]),async runTransaction(fn){
 const pending=[];
 await fn({get:reference=>reference.get(),set:(reference,data,options)=>pending.push({path:reference.path,data:clone(data),options})});
 if(mockDeny)throw Object.assign(new Error('Negado'),{code:'permission-denied'});
 for(const write of pending){mockStore[write.path]=write.options?.merge?{...mockStore[write.path],...write.data}:write.data;mockWrites.push(write);}
}};
window.authCallbacks=[];
window.mockAuth={currentUser:{uid:'prof-teste',email:'professor@example.com'},onAuthStateChanged(fn){authCallbacks.push(fn);Promise.resolve().then(()=>{
 if(!mockOriginal.peiComprimido){mockOriginal.peiHtml=LZString.compressToUTF16(mockOriginal.peiHtml);mockOriginal.peiComprimido=true;}
 fn(this.currentUser);
});return ()=>{};},async signOut(){this.currentUser=null;for(const fn of authCallbacks)await fn(null);},async signInWithEmailAndPassword(){}};
window.firebase={initializeApp(){},auth:()=>mockAuth,firestore:()=>mockDb};
`;
let total=0;function check(a,b){assert.deepEqual(a,b);total++;}
(async()=>{
 const server=http.createServer((req,res)=>{
  const filename=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(filename));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(!url.startsWith(origin+'/'))return route.abort();
   if(/vendor\/firebase-.*\/firebase-app-compat.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:mock});
   if(/vendor\/firebase-.*\.js$/.test(url))return route.fulfill({contentType:'application/javascript',body:''});
   return route.continue();
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/pei_formulario.html?alunoId=a&nome=Ignorar',{waitUntil:'networkidle'});
  await page.locator('#pei-editor').waitFor({state:'visible'});
  const field=key=>page.locator('[data-path="'+key+'"]');
  check(await field('identificacao.nome').inputValue(),'Ana Teste');
  check(await field('identificacao.dataNascimento').inputValue(),'2015-03-14');
  check(await field('identificacao.escola').inputValue(),'Escola Horizonte');
  check(await field('identificacao.anoEscolar').inputValue(),'3º A');
  check(await field('identificacao.turno').inputValue(),'Matutino');
  check(await page.locator('[data-path]').count(),23);
  check(await page.locator('textarea[data-path]').count(),10);
  check(await page.evaluate(()=>mockWrites.length),0);
  check(await page.locator('#legacy-note').isVisible(),true);
  // Orientações originais estão disponíveis sem virar respostas fictícias.
  check(await field('contextoEscolar.socioafetivos').inputValue(),'');
  check((await field('contextoEscolar.socioafetivos').getAttribute('placeholder')).includes('capacitismo'),true);
  check(await field('contextoEscolar.socioafetivos').evaluate(n=>n.matches(':placeholder-shown')),true);
  check((await page.locator('#sec-escolar').textContent()).includes('capacitismo'),true);
  await page.locator('#btn-history').click();
  await page.frameLocator('#pei-legacy-preview').getByText('Texto original preservado.',{exact:true}).waitFor({state:'visible'});
  check(await page.locator('#pei-legacy-preview').isVisible(),true);
  check(await page.frameLocator('#pei-legacy-preview').getByText('Texto original preservado.',{exact:true}).isVisible(),true);
  // O histórico deve reproduzir a formatação do visualizador original do Diário.
  const reference=await context.newPage();
  await reference.route(/\/(chat-equipe|chat-presenca|planos-aula|recursos-didaticos)\.js$/,route=>route.fulfill({contentType:'application/javascript',body:''}));
  await reference.goto(origin+'/index.html',{waitUntil:'networkidle'});
  const originalHTML=await page.evaluate(()=>LZString.decompressFromUTF16(mockOriginal.peiHtml));
  await reference.evaluate(html=>{showScreen('home');document.querySelector('#tabPei').classList.add('active');abrirPei('a','Ana Teste',html);},originalHTML);
  const formatting=root=>['h1','strong','p','th','td'].map(selector=>{
    const css=getComputedStyle(root.querySelector(selector));
    return [selector,css.fontWeight,css.textAlign,css.fontFamily,css.fontSize,css.lineHeight,css.color];
  });
  check(await page.frameLocator('#pei-legacy-preview').locator('#peiConteudo').evaluate(formatting),await reference.locator('#peiConteudo').evaluate(formatting));
  await reference.close();
  await page.locator('#pei-history-list button').first().click();
  check((await page.locator('#pei-legacy-preview').getAttribute('srcdoc')).includes('Texto original preservado.'),true);
  check((await page.locator('#pei-legacy-preview').getAttribute('srcdoc')).includes('<script>'),false);
  check(await page.evaluate(()=>!!window.executou),false);
  // Conteúdo ausente não deve produzir uma visualização branca sem explicação.
  await page.evaluate(()=>{mockStore['alunos/a/pei/versao-vazia']={peiHtml:'',peiComprimido:true,peiData:'2099-01-01T12:00:00Z'};});
  await page.locator('#btn-history').click();
  check((await page.locator('#pei-history-status').textContent()).includes('Não foi possível visualizar'),true);
  check(await page.locator('#pei-legacy-preview').isVisible(),false);
  await page.locator('#pei-history-list button').last().click();
  await page.frameLocator('#pei-legacy-preview').getByText('Texto original preservado.',{exact:true}).waitFor({state:'visible'});
  check(await page.locator('#pei-history-list button').last().getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{delete mockStore['alunos/a/pei/versao-vazia'];});
  await field('contextoEscolar.socioafetivos').fill('Participa de atividades em pequenos grupos.');
  check(await field('contextoEscolar.socioafetivos').evaluate(n=>n.matches(':placeholder-shown')),false);
  await field('contextoEscolar.socioafetivos').fill('');
  check(await field('contextoEscolar.socioafetivos').evaluate(n=>n.matches(':placeholder-shown')),true);
  await field('contextoEscolar.socioafetivos').fill('Participa de atividades em pequenos grupos.');
  await field('contextoEscolar.linguagemOral').fill('Comunica preferências com apoio visual.');
  await field('estrategias.objetivosMetas').fill('Ampliar a participação nas atividades propostas.');
  await field('estrategias.adaptacoes').fill('Oferecer sequência visual e materiais acessíveis.');
  await field('contextoFamiliar.texto').fill('A família compartilhou informações sobre a rotina.');
  await field('assinaturas.regente').fill('Professora Fictícia');
  await field('assinaturas.data').fill('2026-10-23');
  await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await page.evaluate(()=>mockStore['alunos/a/pei/atual'].peiFormulario.contextoEscolar.linguagemOral),'Comunica preferências com apoio visual.');
  check(await page.evaluate(()=>Object.entries(mockStore).filter(([key])=>key.startsWith('alunos/a/pei/versao-')).map(([,data])=>JSON.stringify(data)===JSON.stringify(mockOriginal))),[true]);
  check(await page.evaluate(()=>mockStore['alunos/a/pei/atual'].peiComprimido),false);
  check(await page.evaluate(()=>mockWrites.length),2);
  // Reabertura do documento salvo sem novo salvamento automático.
  await page.locator('#btn-back-list').click();await page.locator('#student-grid .student-card').filter({hasText:'Ana Teste'}).getByRole('button',{name:'Abrir PEI',exact:true}).click();
  check(await field('contextoEscolar.socioafetivos').inputValue(),'Participa de atividades em pequenos grupos.');
  check(await field('assinaturas.regente').inputValue(),'Professora Fictícia');
  check(await page.evaluate(()=>mockWrites.length),2);
  check(await page.locator('#legacy-note').isVisible(),false);
  // Exportação usa os campos atuais, mesmo antes de salvar.
  await field('estrategias.objetivosMetas').fill('Objetivo fictício ainda não salvo — participação e comunicação.');
  fs.mkdirSync('/tmp/site-results',{recursive:true});
  for(const format of ['docx','odt']){
   const [download]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.locator('#btn-export-'+format).click()]);
   check(download.suggestedFilename().endsWith('.'+format),true);
   await download.saveAs('/tmp/site-results/pei-formulario.'+format);
  }
  check(await page.evaluate(()=>mockWrites.length),2);
  // Conflito: não sobrescreve a alteração de outra sessão e mantém o texto digitado.
  await page.evaluate(()=>{mockStore['alunos/a/pei/atual'].peiData='2026-10-24T12:00:00Z';});
  await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#peiError').textContent.includes('outra aba'));
  check(await page.evaluate(()=>mockWrites.length),2);
  check(await field('estrategias.objetivosMetas').inputValue(),'Objetivo fictício ainda não salvo — participação e comunicação.');
  // Descartar para recarregar e testar falha atômica de permissão.
  page.once('dialog',d=>d.accept());await page.locator('#btn-back-list').click();await page.locator('#student-grid .student-card').filter({hasText:'Ana Teste'}).getByRole('button',{name:'Abrir PEI',exact:true}).click();
  await field('estrategias.processoAvaliativo').fill('Observação contínua com registro descritivo.');
  await page.evaluate(()=>{mockDeny=true;});await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#peiError').textContent.includes('Sem permissão'));
  check(await page.evaluate(()=>mockWrites.length),2);
  check(await field('estrategias.processoAvaliativo').inputValue(),'Observação contínua com registro descritivo.');
  await page.evaluate(()=>{mockDeny=false;});await page.locator('#btn-save').click();
  await page.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await page.evaluate(()=>Object.keys(mockStore).filter(key=>key.startsWith('alunos/a/pei/versao-')).length),2);
  // Sem mudanças, salvar não acumula versões iguais.
  await page.locator('#btn-save').click();
  check(await page.evaluate(()=>mockWrites.length),4);
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'/tmp/site-results/pei-formulario-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/site-results/pei-formulario-celular.png'});
  await page.locator('#btn-logout').click();
  check(await page.locator('#app-shell').isVisible(),false);
  check(await page.locator('[data-path]').count(),0);
  // Aluno de outra conta não é exibido pelo formulário.
  const other=await context.newPage();
  await other.goto(origin+'/pei_formulario.html?alunoId=b',{waitUntil:'networkidle'});
  check((await other.locator('#peiError').textContent()).includes('não encontrado'),true);
  check(await other.locator('[data-path]').count(),0);
  const fresh=await context.newPage();
  await fresh.goto(origin+'/pei_formulario.html?alunoId=c',{waitUntil:'networkidle'});
  check(await fresh.locator('#legacy-note').isVisible(),false);
  check(await fresh.locator('[data-path="contextoEscolar.academicos"]').inputValue(),'');
  await fresh.locator('[data-path="identificacao.nome"]').fill('');
  await fresh.locator('#btn-save').click();
  check((await fresh.locator('#peiError').textContent()).includes('Informe o nome'),true);
  check(await fresh.evaluate(()=>mockWrites.length),0);
  await fresh.locator('[data-path="identificacao.nome"]').fill('Aluno Novo');
  await fresh.locator('#btn-save').click();
  await fresh.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await fresh.evaluate(()=>mockWrites.map(w=>w.path)),['alunos/c/pei/atual']);
  // A IA não envia dados automaticamente nem substitui ou salva sem escolha.
  const ai=await context.newPage();const aiErrors=[];ai.on('pageerror',e=>aiErrors.push(e.message));
  await ai.goto(origin+'/pei_formulario.html?alunoId=a',{waitUntil:'networkidle'});
  const socio=ai.locator('[data-path="contextoEscolar.socioafetivos"]');
  const area=ai.locator('.pei-field').filter({has:socio});
  const ask=area.getByRole('button',{name:'Melhorar Aspectos socioafetivos com IA',exact:true});
  check(await ai.locator('.pei-ai').count(),10);
  await ask.click();
  check((await area.locator('.pei-ai-status').textContent()).includes('Escreva seu texto'),true);
  await socio.fill('Participa das atividades com apoio visual.');await ask.click();
  check((await area.locator('.pei-ai-status').textContent()).includes('indisponível'),true);
  await ai.evaluate(()=>{
    window.aiPrompts=[];
    window.puter={ai:{chat:async prompt=>{aiPrompts.push(prompt);return {message:{content:[{text:'Participa das atividades propostas com apoio visual.'}]}};}}};
  });
  await ai.locator('[data-path="contextoEscolar.academicos"]').fill('OUTRO_CAMPO_NAO_ENVIAR');
  await ask.click();await area.locator('.pei-ai-preview').waitFor({state:'visible'});
  check(await socio.inputValue(),'Participa das atividades com apoio visual.');
  check(await ai.evaluate(()=>[aiPrompts.length,aiPrompts[0].includes('OUTRO_CAMPO_NAO_ENVIAR'),aiPrompts[0].includes('Ana Teste'),mockWrites.length]),[1,false,false,0]);
  await area.getByRole('button',{name:'Manter meu texto original',exact:true}).click();
  check(await socio.inputValue(),'Participa das atividades com apoio visual.');
  await ask.click();await area.getByRole('button',{name:'Aplicar sugestão',exact:true}).click();
  check(await socio.inputValue(),'Participa das atividades propostas com apoio visual.');
  check(await ai.evaluate(()=>mockWrites.length),0);
  await ai.locator('#btn-save').click();await ai.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await ai.evaluate(()=>mockStore['alunos/a/pei/atual'].peiFormulario.contextoEscolar.socioafetivos),'Participa das atividades propostas com apoio visual.');
  // Repetição da resposta, incluindo só maiúsculas/pontuação, exige reformulação.
  await ai.evaluate(()=>{
    window.tentativasIA=0;
    puter.ai.chat=async prompt=>{
      aiPrompts.push(prompt);tentativasIA++;
      return {message:{content:tentativasIA===1?'PARTICIPA DAS ATIVIDADES PROPOSTAS COM APOIO VISUAL!!!':'Com apoio visual, participa das atividades propostas.'}};
    };
  });
  await ask.click();await area.locator('.pei-ai-preview').waitFor({state:'visible'});
  check(await ai.evaluate(()=>tentativasIA),2);
  check(await area.locator('.pei-ai-preview textarea').inputValue(),'Com apoio visual, participa das atividades propostas.');
  check(await socio.inputValue(),'Participa das atividades propostas com apoio visual.');
  check(await ai.evaluate(()=>aiPrompts.at(-1).includes('Na tentativa anterior você repetiu')),true);
  await area.getByRole('button',{name:'Manter meu texto original',exact:true}).click();
  await ai.evaluate(()=>{
    tentativasIA=0;puter.ai.chat=async()=>{tentativasIA++;return 'Participa das atividades propostas com apoio visual.';};
  });
  await ask.click();
  await ai.waitForFunction(()=>document.querySelector('[data-path="contextoEscolar.socioafetivos"]').closest('.pei-field').querySelector('.pei-ai-status').textContent.includes('após duas tentativas'));
  check(await ai.evaluate(()=>tentativasIA),2);
  check(await area.locator('.pei-ai-preview').isVisible(),false);
  check(await ai.evaluate(()=>mockWrites.length),2);
  await ai.evaluate(()=>{puter.ai.chat=async()=>({message:{content:'Com apoio visual, participa das atividades propostas.'}});});
  // Uma edição feita depois da sugestão não pode ser substituída por engano.
  await ask.click();await area.locator('.pei-ai-preview').waitFor({state:'visible'});
  await socio.fill('Texto alterado depois da sugestão.');
  await area.getByRole('button',{name:'Aplicar sugestão',exact:true}).click();
  check(await socio.inputValue(),'Texto alterado depois da sugestão.');
  // Resposta atrasada não apaga o texto digitado durante a solicitação.
  await ai.evaluate(()=>{puter.ai.chat=()=>new Promise(resolve=>window.resolverIA=resolve);});
  await ask.click();await socio.fill('Edição durante a solicitação.');
  await ai.evaluate(()=>resolverIA('Texto antigo revisado.'));
  await ai.waitForFunction(()=>document.querySelector('[data-path="contextoEscolar.socioafetivos"]').closest('.pei-field').querySelector('.pei-ai-status').textContent.includes('durante a revisão'));
  check(await socio.inputValue(),'Edição durante a solicitação.');
  check(await area.locator('.pei-ai-preview').isVisible(),false);
  await ai.evaluate(()=>{puter.ai.chat=async()=>{throw new Error('Falha simulada');};});
  await ask.click();
  check((await area.locator('.pei-ai-status').textContent()).includes('Não foi possível obter'),true);
  check(await socio.inputValue(),'Edição durante a solicitação.');
  // Troca de sessão durante a solicitação descarta a resposta da IA.
  await ai.evaluate(()=>{puter.ai.chat=()=>new Promise(resolve=>window.resolverIA=resolve);});await ask.click();
  ai.once('dialog',d=>d.accept());await ai.locator('#btn-logout').click();
  await ai.evaluate(()=>resolverIA('Não deve aparecer após sair.'));
  check(await ai.locator('[data-path]').count(),0);
  check(await ai.locator('#app-shell').isVisible(),false);
  check(aiErrors,[]);
  // As metas são selecionadas e acrescentadas ao PEI sem sobrescrever seu texto.
  const bridge=await context.newPage();const bridgeErrors=[];bridge.on('pageerror',e=>bridgeErrors.push(e.message));
  await bridge.goto(origin+'/pei_formulario.html?alunoId=a',{waitUntil:'networkidle'});
  const objetivo=bridge.locator('[data-path="estrategias.objetivosMetas"]');
  const metasBox=bridge.locator('.pei-metas');
  check(await metasBox.locator('input[type=checkbox]').count(),0);
  await objetivo.fill('Objetivos já escritos pelo professor.');
  await bridge.getByRole('button',{name:'Consultar metas do acompanhamento',exact:true}).click();
  check(await metasBox.locator('input[type=checkbox]').count(),2);
  check((await metasBox.textContent()).includes('NÃO IMPORTAR'),false);
  check(await objetivo.inputValue(),'Objetivos já escritos pelo professor.');
  check(await bridge.evaluate(()=>mockWrites.length),0);
  await metasBox.locator('input[value="meta-a"]').check();
  check((await bridge.locator('#pei-metas-previa').inputValue()).includes('Revisar em: 23/11/2026'),true);
  check(await bridge.locator('#pei-metas-previa').evaluate(n=>n.readOnly),true);
  await bridge.getByRole('button',{name:'Acrescentar metas selecionadas',exact:true}).click();
  const primeiroTexto=await objetivo.inputValue();
  check(primeiroTexto.startsWith('Objetivos já escritos pelo professor.\n\n'),true);
  check(primeiroTexto.includes('Objetivo: Participar de atividades coletivas com apoio visual.'),true);
  check(await bridge.evaluate(()=>mockWrites.length),0);
  await bridge.getByRole('button',{name:'Acrescentar metas selecionadas',exact:true}).click();
  check(await objetivo.inputValue(),primeiroTexto);
  check((await metasBox.locator('.pei-metas-status').textContent()).includes('Nada foi acrescentado'),true);
  await metasBox.locator('input[value="meta-b"]').check();
  await objetivo.fill('Texto ajustado pelo professor.\n'+primeiroTexto);
  await bridge.getByRole('button',{name:'Acrescentar metas selecionadas',exact:true}).click();
  const textoCompleto=await objetivo.inputValue();
  check(textoCompleto.startsWith('Texto ajustado pelo professor.\n'+primeiroTexto),true);
  check(textoCompleto.split('Objetivo: Participar de atividades coletivas com apoio visual.').length-1,1);
  check(textoCompleto.split('Objetivo: Ampliar a comunicação de preferências.').length-1,1);
  await bridge.locator('#btn-save').click();await bridge.waitForFunction(()=>document.querySelector('#save-note').textContent.startsWith('PEI salvo'));
  check(await bridge.evaluate(()=>mockStore['alunos/a/pei/atual'].peiFormulario.estrategias.objetivosMetas),textoCompleto);
  check(await bridge.evaluate(()=>mockWrites.some(w=>w.path.includes('/metas/'))),false);
  await bridge.evaluate(()=>{mockStore['alunos/a/metas/meta-a'].objetivo='Meta alterada depois do PEI salvo.';});
  check(await objetivo.inputValue(),textoCompleto);
  await bridge.locator('#btn-back-list').click();await bridge.locator('#student-grid .student-card').filter({hasText:'Ana Teste'}).getByRole('button',{name:'Abrir PEI',exact:true}).click();
  check(await objetivo.inputValue(),textoCompleto);
  for(const format of ['docx','odt']){
    const [download]=await Promise.all([bridge.waitForEvent('download',{timeout:60000}),bridge.locator('#btn-export-'+format).click()]);
    await download.saveAs('/tmp/site-results/pei-com-metas.'+format);
  }
  for(const width of [390,320]){await bridge.setViewportSize({width,height:844});check(await bridge.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  // Uma resposta tardia não repovoa o formulário depois de sair da conta.
  await bridge.evaluate(()=>{mockPendingMetas=new Promise(resolve=>window.concluirConsultaMetas=resolve);});
  await bridge.getByRole('button',{name:'Consultar metas do acompanhamento',exact:true}).click();
  await bridge.locator('#btn-logout').click();
  await bridge.evaluate(()=>concluirConsultaMetas({docs:[{id:'tardia',data:()=>({objetivo:'NÃO EXIBIR',status:'ativa'})}]}));
  check(await bridge.locator('.pei-metas').count(),0);
  check(await bridge.locator('#app-shell').isVisible(),false);
  const semMetas=await context.newPage();
  await semMetas.goto(origin+'/pei_formulario.html?alunoId=c',{waitUntil:'networkidle'});
  await semMetas.getByRole('button',{name:'Consultar metas do acompanhamento',exact:true}).click();
  check((await semMetas.locator('.pei-metas-status').textContent()).includes('Não há metas ativas'),true);
  await semMetas.locator('[data-path="estrategias.objetivosMetas"]').fill('Texto que deve ser preservado.');
  await semMetas.evaluate(()=>{mockMetaError=true;});
  await semMetas.getByRole('button',{name:'Consultar metas do acompanhamento',exact:true}).click();
  check((await semMetas.locator('.pei-metas-status').textContent()).includes('Não foi possível consultar'),true);
  check(await semMetas.locator('[data-path="estrategias.objetivosMetas"]').inputValue(),'Texto que deve ser preservado.');
  check(bridgeErrors,[]);
  check(errors,[]);
  console.log(total+' verificações do formulário PEI aprovadas; DOCX/ODT baixados; Firebase simulado.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
