/* Coordenador de exportação: leitura dos documentos salvos; nunca salva ou vincula. */
(() => {
 'use strict';
 const M=()=>window.ExportacaoLoteModelo,n=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
 let ctx=null,dialog=null,corpo=null,status=null;
 const vigente=c=>ctx===c&&!c.cancelado&&c.config.vigente();
 function mensagem(text){if(status)status.textContent=text;}
 function fechar(){
  const devolverFoco=!!dialog?.open;const anterior=ctx;ctx=null;if(anterior){anterior.cancelado=true;anterior.abortar?.();if(anterior.app)Promise.resolve(anterior.login).catch(()=>{}).then(()=>anterior.auth.signOut()).catch(()=>{}).then(()=>anterior.app.delete()).catch(()=>{});}
  if(dialog?.open)dialog.close();corpo?.replaceChildren();mensagem('');if(devolverFoco)document.getElementById('btnExportarDocumentos')?.focus();
 }
 function botao(label,fn){const b=n('button',label);b.type='button';b.className='central-btn';b.addEventListener('click',fn);return b;}
 function acoes(...b){const box=n('div');box.className='exportar-acoes';box.append(...b);corpo.append(box);}
 function campo(text,input){const l=n('label',text);l.className='exportar-campo';l.append(input);return l;}
 function criar(){if(dialog)return;dialog=n('dialog');dialog.id='exportarDocumentosDialog';dialog.setAttribute('aria-labelledby','exportarDocumentosTitulo');const header=n('div');header.className='exportar-cabecalho';const h=n('h2','Exportar Documentos');h.id='exportarDocumentosTitulo';header.append(h,botao('Fechar',fechar));corpo=n('div');corpo.className='exportar-corpo';status=n('p');status.id='exportarDocumentosStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');dialog.append(header,corpo,status);document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();fechar();});}
 async function abrir(config){
  fechar();criar();const c={config,nonce:crypto.randomUUID(),etapa:1,tipos:new Set(),formato:'docx',empacotar:false,selecionados:new Set(),alunos:[],cancelado:false,busy:false};ctx=c;dialog.showModal();tela1(c);
 }
 function tela1(c){if(!vigente(c)||c.busy)return;corpo.replaceChildren();mensagem('');corpo.append(n('h3','1. Escolha os documentos'),n('p','Serão exportados os conteúdos já salvos. Rascunhos abertos em outros formulários não são incluídos. Esta operação não altera os documentos.'));
  const opcoes=n('div');opcoes.className='exportar-opcoes';for(const [key,tipo]of Object.entries(M().tipos)){const label=n('label');label.className='exportar-opcao';const input=n('input');input.type='checkbox';input.value=key;input.checked=c.tipos.has(key);input.addEventListener('change',()=>{if(input.checked)c.tipos.add(key);else c.tipos.delete(key);});label.append(input,n('span',tipo.nome));opcoes.append(label);}corpo.append(opcoes);
  acoes(botao('Próximo: formato',()=>{if(!c.tipos.size){mensagem('Selecione pelo menos um documento.');return;}tela2(c);}));
 }
 function tela2(c){if(!vigente(c)||c.busy)return;corpo.replaceChildren();mensagem('');corpo.append(n('h3','2. Escolha o formato'));for(const [value,text]of [['docx','Word — DOCX'],['odt','LibreOffice — ODT']]){const label=n('label');label.className='exportar-opcao';const i=n('input');i.type='radio';i.name='exportar-formato';i.value=value;i.checked=c.formato===value;i.addEventListener('change',()=>c.formato=value);label.append(i,n('span',text));corpo.append(label);}
  corpo.append(n('p','Por padrão, os documentos ficam disponíveis individualmente, prontos para abrir no Word ou LibreOffice. Você pode baixar um de cada vez com o botão Baixar próximo documento.'));
  const opcao=n('label');opcao.className='exportar-opcao';const zip=n('input');zip.type='checkbox';zip.checked=c.empacotar;zip.addEventListener('change',()=>c.empacotar=zip.checked);opcao.append(zip,n('span','Reunir em um arquivo ZIP (opcional)'));corpo.append(opcao);
  acoes(botao('Voltar',()=>tela1(c)),botao('Próximo: alunos',()=>carregarAlunos(c)));
 }
 async function carregarAlunos(c){
  if(c.busy||!vigente(c))return;c.busy=true;corpo.replaceChildren();corpo.append(n('p','Carregando os alunos…'),botao('Cancelar',fechar));mensagem('Carregando os alunos da sua conta…');
  try{const snap=await c.config.db.collection('alunos').where('professorUid','==',c.config.uid).get({source:'server'});if(!vigente(c))return;if(snap.metadata?.fromCache)throw Error('cache');c.alunos=snap.docs.map(d=>{const a=d.data();if(a.professorUid!==c.config.uid)throw Error('responsável');return {id:d.id,nome:a.nome||'Sem nome',escola:a.escola||'',turno:a.turno||'',arquivado:a.arquivado===true};}).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));c.busy=false;tela3(c);}catch(_){if(vigente(c)){mensagem('Não foi possível carregar os alunos. Confira a conexão e tente novamente.');acoes(botao('Voltar ao formato',()=>tela2(c)));}}finally{c.busy=false;}
 }
 function tela3(c){
  if(!vigente(c)||c.busy)return;corpo.replaceChildren();mensagem('');corpo.append(n('h3','3. Escolha um ou mais alunos'));
  const busca=n('input');busca.type='search';busca.placeholder='Buscar pelo nome';busca.setAttribute('aria-label','Buscar aluno para exportar');const turno=n('select');for(const [v,t]of [['','Todos os turnos'],['Matutino','Matutino'],['Vespertino','Vespertino']]){const o=n('option',t);o.value=v;turno.append(o);}turno.value=c.config.turno||'';
  const arquivo=n('input');arquivo.type='checkbox';arquivo.id='exportarIncluirArquivados';const label=n('label');label.className='exportar-opcao';label.append(arquivo,n('span','Incluir alunos arquivados na lista'));corpo.append(campo('Buscar aluno',busca),campo('Turno',turno),label);const lista=n('div');lista.className='exportar-alunos';const contagem=n('p');corpo.append(contagem,lista);
  function mostrar(){lista.replaceChildren();const termos=M().normalizar(busca.value).split(' ').filter(Boolean),visiveis=c.alunos.filter(a=>(arquivo.checked||!a.arquivado)&&(!turno.value||!a.turno||a.turno===turno.value)&&termos.every(t=>M().normalizar(a.nome).includes(t)));
   contagem.textContent=c.selecionados.size+' aluno(s) selecionado(s). Filtrar a lista não desmarca seleções anteriores.';
   if(!visiveis.length)lista.append(n('p','Nenhum aluno nesse filtro.'));for(const a of visiveis){const l=n('label');l.className='exportar-opcao';const i=n('input');i.type='checkbox';i.value=a.id;i.checked=c.selecionados.has(a.id);i.addEventListener('change',()=>{if(i.checked)c.selecionados.add(a.id);else c.selecionados.delete(a.id);contagem.textContent=c.selecionados.size+' aluno(s) selecionado(s). Filtrar a lista não desmarca seleções anteriores.';});l.append(i,n('span',a.nome+(a.escola?' · '+a.escola:'')+(a.arquivado?' · Arquivado':'')));lista.append(l);}
   c.visiveis=visiveis;
  }
  busca.addEventListener('input',mostrar);turno.addEventListener('change',mostrar);arquivo.addEventListener('change',mostrar);mostrar();
  acoes(botao('Selecionar os exibidos',()=>{c.visiveis.forEach(a=>c.selecionados.add(a.id));mostrar();}),botao('Limpar seleção',()=>{c.selecionados.clear();mostrar();}));
  corpo.append(n('p','Até 100 arquivos por exportação. Documentos não encontrados serão informados, sem gerar formulários vazios.'));
  acoes(botao('Voltar',()=>tela2(c)),botao('Conferir documentos',()=>{if(!c.selecionados.size){mensagem('Selecione ao menos um aluno.');return;}if(c.selecionados.size*c.tipos.size>100){mensagem('Selecione até 100 combinações de alunos e documentos por pacote.');return;}if([...c.tipos].some(t=>!!M().tipos[t].colecao)&&!c.auth?.currentUser)loginFormularios(c);else conferir(c);}));
 }
 function loginFormularios(c){
  if(!vigente(c))return;corpo.replaceChildren();mensagem('');corpo.append(n('h3','Acesso aos formulários'),n('p','PAEE, Diagnóstica e Relatório usam o projeto paee-3fea6. Entre com a conta dos formulários que tem o mesmo e-mail da sua conta do Diário. Esta sessão é separada e fica só na memória.'));
  const form=n('form'),email=n('input'),senha=n('input'),entrar=n('button','Entrar e conferir documentos');email.type='email';email.value=c.config.email;email.readOnly=true;senha.type='password';senha.autocomplete='current-password';senha.required=true;entrar.type='submit';entrar.className='central-btn';form.append(campo('E-mail dos formulários',email),campo('Senha dos formulários',senha),entrar);corpo.append(form);
  form.addEventListener('submit',async e=>{e.preventDefault();if(c.busy||!vigente(c))return;c.busy=true;entrar.disabled=true;mensagem('Conectando aos formulários…');
   try{if(!c.app){c.app=firebase.initializeApp(window.SRMDocumentosConfig,'exportacao-'+c.nonce);c.auth=firebase.auth(c.app);c.dbDocumentos=firebase.firestore(c.app);await c.auth.setPersistence(firebase.auth.Auth.Persistence.NONE);}if(!vigente(c))return;c.login=c.auth.signInWithEmailAndPassword(email.value,senha.value);await c.login;senha.value='';if(!vigente(c))return;if(c.auth.currentUser?.email?.toLowerCase()!==c.config.email.toLowerCase())throw Error('Conta incompatível');c.uidDocumentos=c.auth.currentUser.uid;c.busy=false;await conferir(c);}catch(_){if(vigente(c))mensagem('Não foi possível entrar nos formulários. Confira o acesso dessa conta. Nenhuma senha foi salva.');}finally{senha.value='';c.busy=false;entrar.disabled=false;}
  });acoes(botao('Voltar aos alunos',()=>tela3(c)));
 }
 async function conferir(c){
  if(c.busy||!vigente(c))return;c.busy=true;corpo.replaceChildren();corpo.append(n('p','Conferindo os documentos salvos…'),botao('Cancelar',fechar));mensagem('Conferindo os documentos salvos…');
  try{
   const fontes={};for(const t of c.tipos){if(!M().tipos[t].colecao)continue;const snap=await c.dbDocumentos.collection(M().tipos[t].colecao).where('professorUid','==',c.uidDocumentos).get({source:'server'});if(!vigente(c))return;if(snap.metadata?.fromCache)throw Error('cache');fontes[t]=snap.docs.map(d=>({id:d.id,dados:d.data()}));if(fontes[t].some(d=>d.dados.professorUid!==c.uidDocumentos))throw Error('responsável');}
   if(c.tipos.has('familia')){fontes.familia=[];for(const [prefixo,colecao]of [['v1','respostasFamilia'],['v2','respostasFamiliaCompletas']]){const snap=await c.config.db.collection(colecao).where('professorUid','==',c.config.uid).get({source:'server'});if(!vigente(c))return;if(snap.metadata?.fromCache)throw Error('cache');for(const d of snap.docs){const r=d.data();if(r.professorUid!==c.config.uid)throw Error('responsável');fontes.familia.push({id:prefixo+':'+d.id,dados:r});}}}
   const itens=[];for(const aluno of c.alunos.filter(a=>c.selecionados.has(a.id))){for(const tipo of c.tipos){
    if(!vigente(c))return;
    if(tipo==='historico'){const registros=await carregarRegistros(c,aluno.id);if(!vigente(c))return;itens.push({aluno,tipo,escolha:registros.length?'historico':'',candidatos:registros.length?[{id:'historico',dados:{quantidade:registros.length}}]:[],legado:false});}
    else if(tipo==='pei'){const doc=await c.config.db.collection('alunos').doc(aluno.id).collection('pei').doc('atual').get({source:'server'});if(!vigente(c))return;itens.push({aluno,tipo,escolha:doc.exists?'atual':'',candidatos:doc.exists?[{id:'atual',dados:doc.data()}]:[],legado:false});}
    else if(tipo==='familia'){const respostas=fontes.familia.filter(d=>d.dados.alunoId===aluno.id);itens.push({aluno,tipo,candidatos:respostas,legado:false,escolha:respostas.length===1?respostas[0].id:''});}
    else{const found=M().candidatos(fontes[tipo],aluno);itens.push({aluno,tipo,candidatos:found.itens,legado:found.legado,escolha:!found.legado&&found.itens.length===1?found.itens[0].id:''});}
   }}
   if(!vigente(c))return;c.itens=itens;c.busy=false;telaConferencia(c);
  }catch(_){if(vigente(c)){mensagem('Não foi possível conferir todos os documentos. Nenhum arquivo foi gerado. Volte e tente novamente.');acoes(botao('Voltar aos alunos',()=>tela3(c)));}}finally{c.busy=false;}
 }
 function dataDocumento(d){try{const v=d.updatedAt||d.createdAt||d.peiData||d.enviadoEm;const date=typeof v?.toDate==='function'?v.toDate():typeof v==='string'?new Date(v):null;return date&&!Number.isNaN(date.getTime())?' · '+date.toLocaleString('pt-BR'):'';}catch(_){return '';}}
 function telaConferencia(c){
  if(!vigente(c))return;corpo.replaceChildren();mensagem('');corpo.append(n('h3','4. Confira antes de exportar'),n('p','Formato: '+c.formato.toUpperCase()+' · Recebimento: '+(c.empacotar?'arquivo ZIP':'documentos individuais, sem ZIP')+'. Documentos antigos sem vínculo exigem confirmação nesta lista. Ela vale apenas para esta exportação e não altera o cadastro. Confira nomes e escola, especialmente em casos de homônimos.'));
  for(const item of c.itens){const box=n('div');box.className='exportar-revisao';box.append(n('strong',item.aluno.nome+(item.aluno.arquivado?' (arquivado)':'')+' — '+M().tipos[item.tipo].nome));
   box.append(n('small','Cadastro do Diário: '+(item.aluno.escola||'escola não informada')+' · aluno '+item.aluno.id));
   if(!item.candidatos.length){box.append(n('small',item.tipo==='historico'?'Ainda não há atendimentos salvos para este aluno. Não será gerado um histórico vazio.':item.tipo==='familia'?'Ainda não há respostas da família salvas para este aluno. Não será gerado um formulário vazio.':'Não encontrado para este aluno. Este item não será exportado.'));corpo.append(box);continue;}
   if(item.legado)box.append(n('small','Documento antigo sem alunoId: escolha e confirme somente se pertence a este aluno.'));
   else if(item.candidatos.length>1)box.append(n('small',item.tipo==='familia'?'Há mais de um questionário respondido. Escolha a resposta que deseja exportar.':'Há mais de um documento vinculado. Escolha a versão desejada.'));
   const s=n('select');s.setAttribute('aria-label','Documento de '+item.aluno.nome+' — '+M().tipos[item.tipo].nome);const vazio=n('option',item.legado?'Selecione para confirmar ou não exportar':'Não exportar este item');vazio.value='';s.append(vazio);
   if(item.tipo==='historico')box.append(n('small','Histórico completo: '+item.candidatos[0].dados.quantidade+' atendimento(s) salvo(s). Os filtros da ficha não limitam esta exportação.'));
   for(const d of item.candidatos){const id=d.dados.identificacao||{},o=n('option',(item.tipo==='familia'?d.dados.responsavel||'Responsável não informado':id.nome||id.nomeAluno||item.aluno.nome)+(id.escolaRegular?' · '+id.escolaRegular:'')+dataDocumento(d.dados)+' · documento '+d.id);o.value=d.id;s.append(o);}s.value=item.escolha;s.addEventListener('change',()=>item.escolha=s.value);box.append(s);corpo.append(box);
  }
  corpo.append(n('p','A geração lê novamente os conteúdos salvos e não inclui rascunhos. Arquivos de alunos contêm informações pessoais; guarde o download em local protegido.'));
  acoes(botao('Voltar aos alunos',()=>tela3(c)),botao('Gerar e baixar',()=>gerar(c)));
 }
 async function carregarRegistros(c,id){
  const snap=await c.config.db.collection('alunos').doc(id).collection('registros').get({source:'server'});
  if(!vigente(c)||snap.metadata?.fromCache)throw Error('acesso');
  const data=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return '';const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:'';};
  return snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>data(b.date).localeCompare(data(a.date))||a.id.localeCompare(b.id));
 }
 async function carregarFamilia(c,item,aluno){
  const match=/^(v[12]):([A-Za-z0-9_-]{43})$/.exec(item.escolha);if(!match)throw Error('questionário inválido');
  const versao=match[1]==='v2'?2:1,token=match[2],ref=c.config.db.collection(versao===2?'respostasFamiliaCompletas':'respostasFamilia').doc(token);
  const doc=await ref.get({source:'server'});if(!vigente(c)||!doc.exists||doc.metadata?.fromCache)throw Error('não encontrado');const r=doc.data();
  if(r.professorUid!==c.config.uid||r.alunoId!==item.aluno.id||r.versao!==versao)throw Error('vínculo mudou');
  if(versao===2){const areas=await ref.collection('areas').get({source:'server'});if(!vigente(c)||areas.metadata?.fromCache)throw Error('acesso');
   const esperadas=window.QuestionarioFamiliaModelo.areas,nomes=new Set(areas.docs.map(d=>d.id));if(nomes.size!==esperadas.length||esperadas.some(a=>!nomes.has(a.key)))throw Error('questionário incompleto');
   r.respostas={};r.observacoesPerguntas={};for(const a of areas.docs){const ar=a.data(),modelo=esperadas.find(x=>x.key===a.id);if(modelo.itens.some(q=>!Object.hasOwn(ar.respostas||{},q.id)))throw Error('questionário incompleto');Object.assign(r.respostas,ar.respostas||{});Object.assign(r.observacoesPerguntas,ar.observacoesPerguntas||{});}if(window.QuestionarioFamiliaModelo.validar(r))throw Error('questionário inválido');
  }
  const convite=await c.config.db.collection('convitesFamilia').doc(token).get({source:'server'});if(!vigente(c)||!convite.exists||convite.metadata?.fromCache||convite.data().professorUid!==c.config.uid||convite.data().alunoId!==item.aluno.id)throw Error('acesso');
  const {enviadoEm,...resposta}=r;
  return {aluno:{id:item.aluno.id,nome:aluno.nome||item.aluno.nome,escola:aluno.escola||'',turma:aluno.turma||''},resposta,periodo:convite.data().periodo||'Modelo anterior',dataEnvio:typeof enviadoEm?.toDate==='function'?enviadoEm.toDate().toLocaleString('pt-BR'):'Data não informada'};
 }
 async function renderizar(c,tipo,dados){
  return new Promise((resolve,reject)=>{
   const frame=n('iframe');frame.className='exportar-worker';frame.title='Gerador de documento';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.src=M().tipos[tipo].pagina+'#exportacao-lote='+c.nonce;
   let terminado=false;const limpar=()=>{removeEventListener('message',receber);clearTimeout(timer);frame.remove();c.abortar=null;};
   const fim=(erro,valor)=>{if(terminado)return;terminado=true;limpar();erro?reject(erro):resolve(valor);};
   const receber=e=>{const m=e.data;if(e.origin!==location.origin||e.source!==frame.contentWindow||m?.canal!=='srm-exportacao'||m.token!==c.nonce)return;if(!vigente(c)){fim(Error('cancelado'));return;}if(m.acao==='pronto')frame.contentWindow.postMessage({canal:'srm-exportacao',token:c.nonce,acao:'gerar',tipo,formato:c.formato,dados},location.origin);else if(m.acao==='arquivo'&&m.blob instanceof Blob)fim(null,m.blob);else if(m.acao==='erro')fim(Error('geração'));};
   const timer=setTimeout(()=>fim(Error('tempo excedido')),60000);c.abortar=()=>fim(Error('cancelado'));addEventListener('message',receber);document.body.append(frame);
  });
 }
 function download(blob,nome){const url=URL.createObjectURL(blob),a=n('a');a.href=url;a.download=nome;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 function individuais(c,arquivos,avisos){
  if(!vigente(c))return;corpo.replaceChildren();const baixados=new Set(),botoes=[];
  corpo.append(n('h3',arquivos.length===1?'Documento pronto':'Documentos prontos para baixar'),n('p',arquivos.length===1?'O arquivo já está no formato escolhido, sem ZIP. O download será solicitado automaticamente; se necessário, clique em Baixar novamente. Confira a pasta Downloads do computador.':'Os arquivos já estão no formato escolhido. Não é necessário abrir ou extrair ZIP. Clique em Baixar próximo documento e repita até terminar. Confira os arquivos na pasta Downloads do computador.'));
  const area=n('section');area.id='exportarArquivosProntos';area.setAttribute('aria-label','Documentos individuais');const principal=botao('Baixar próximo documento',()=>{const i=arquivos.findIndex((_,i)=>!baixados.has(i));if(i>=0)baixar(i);});principal.classList.add('exportar-baixar-proximo');corpo.append(principal,area);
  function atualizar(){const proximo=arquivos.findIndex((_,i)=>!baixados.has(i));principal.disabled=proximo<0;principal.textContent=proximo<0?'Downloads solicitados para todos os documentos':'Baixar próximo documento ('+(baixados.size+1)+' de '+arquivos.length+')';botoes.forEach((b,i)=>{b.textContent=baixados.has(i)?'Baixar novamente':'Baixar';b.setAttribute('aria-label',(baixados.has(i)?'Baixar novamente ':'Baixar ')+arquivos[i].rotulo);});mensagem(baixados.size+' de '+arquivos.length+' download(s) solicitado(s). O navegador não informa se você concluiu o salvamento. Confira a pasta Downloads.'+(avisos.length?' Há itens não incluídos; veja a lista abaixo.':''));}
  function baixar(i){if(!vigente(c))return;download(arquivos[i].blob,arquivos[i].nomeIndividual);baixados.add(i);atualizar();}
  arquivos.forEach((arquivo,i)=>{const item=n('div');item.className='exportar-arquivo-pronto';const info=n('div');info.append(n('strong',arquivo.rotulo),n('small',c.formato.toUpperCase()));const b=botao('Baixar',()=>baixar(i));botoes.push(b);item.append(info,b);area.append(item);});
  if(avisos.length){const box=n('details');box.className='exportar-avisos';box.open=true;box.append(n('summary','Itens não incluídos ('+avisos.length+')'));const lista=n('ul');avisos.forEach(text=>lista.append(n('li',text)));box.append(lista);corpo.append(box);}
  acoes(botao('Nova seleção',()=>tela1(c)));atualizar();
  if(arquivos.length===1)baixar(0);
 }
 async function carregarZip(){if(window.JSZip)return window.JSZip;await new Promise((resolve,reject)=>{const s=n('script');s.src='vendor/jszip.min.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});if(!window.JSZip)throw Error('ZIP indisponível');return window.JSZip;}
 async function gerar(c){
  if(c.busy||!vigente(c))return;const jobs=c.itens.filter(i=>i.escolha),usados=new Set();if(!jobs.length){mensagem('Nenhum documento escolhido. Confira a lista.');return;}
  for(const item of jobs){const k=item.tipo+'/'+item.escolha;if(item.tipo!=='pei'&&usados.has(k)){mensagem('O mesmo documento foi escolhido para mais de um aluno. Confira os homônimos antes de continuar.');return;}usados.add(k);}
  c.busy=true;corpo.replaceChildren();corpo.append(n('h3','Gerando documentos'),n('p','Aguarde o download. Fechar esta caixa cancela a geração pendente; nenhum documento será alterado.'),botao('Cancelar geração',fechar));const arquivos=[],relatorio=[];let bytes=0;
  try{
   for(const item of jobs){if(!vigente(c))return;mensagem('Gerando '+(arquivos.length+relatorio.length+1)+' de '+jobs.length+': '+item.aluno.nome+' — '+M().tipos[item.tipo].nome);
    try{
     const aluno=await c.config.db.collection('alunos').doc(item.aluno.id).get({source:'server'});if(!vigente(c))return;if(!aluno.exists||aluno.metadata?.fromCache||aluno.data().professorUid!==c.config.uid)throw Error('acesso');
     let dados;
     if(item.tipo==='historico'){const registros=await carregarRegistros(c,item.aluno.id);if(!registros.length)throw Error('sem registros');dados={aluno:{...aluno.data(),id:item.aluno.id},registros,dataExportacao:new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})};}
     else if(item.tipo==='familia')dados=await carregarFamilia(c,item,aluno.data());
     else{
      const ref=item.tipo==='pei'?c.config.db.collection('alunos').doc(item.aluno.id).collection('pei').doc('atual'):c.dbDocumentos.collection(M().tipos[item.tipo].colecao).doc(item.escolha);
      const doc=await ref.get({source:'server'});if(!vigente(c))return;if(!doc.exists||doc.metadata?.fromCache)throw Error('não encontrado');dados=doc.data();
      if(item.tipo!=='pei'&&(c.auth.currentUser?.uid!==c.uidDocumentos||dados.professorUid!==c.uidDocumentos||!M().compativel(dados,{...item.aluno,nome:aluno.data().nome||''},item.legado)))throw Error('vínculo mudou');
     }
     const blob=await renderizar(c,item.tipo,dados);if(!vigente(c))return;if(bytes+blob.size>150*1024*1024)throw Error('limite do pacote');bytes+=blob.size;arquivos.push({nome:String(c.alunos.findIndex(a=>a.id===item.aluno.id)+1).padStart(3,'0')+'_'+M().seguro(item.aluno.nome)+'_'+M().seguro(item.aluno.id)+'/'+M().seguro(M().tipos[item.tipo].nome)+'.'+c.formato,nomeIndividual:M().seguro(M().tipos[item.tipo].nome)+'_'+M().seguro(item.aluno.nome)+'_'+String(c.alunos.findIndex(a=>a.id===item.aluno.id)+1).padStart(3,'0')+'.'+c.formato,rotulo:M().tipos[item.tipo].nome+' — '+item.aluno.nome,blob});
    }catch(_){if(!vigente(c))return;relatorio.push(item.aluno.nome+' — '+M().tipos[item.tipo].nome+': não gerado; confira acesso, vínculo e conteúdo no formulário.');}
   }
   if(!vigente(c))return;if(!arquivos.length){mensagem('Nenhum arquivo pôde ser gerado.\n'+relatorio.join('\n'));c.busy=false;acoes(botao('Voltar à conferência',()=>telaConferencia(c)));return;}
   const omitidos=c.itens.filter(i=>!i.escolha).map(i=>i.aluno.nome+' — '+M().tipos[i.tipo].nome+': '+(i.candidatos.length?'não selecionado/confirmado':'não encontrado'));
   if(!c.empacotar){c.busy=false;individuais(c,arquivos,[...relatorio,...omitidos]);return;}
   mensagem('Preparando o ZIP…');const Zip=await carregarZip(),zip=new Zip();for(const a of arquivos)zip.file(a.nome,a.blob);zip.file('RELATORIO_DA_EXPORTACAO.txt','Exportação de documentos salvos — '+new Date().toLocaleString('pt-BR')+'\nArquivos gerados: '+arquivos.length+'\n\n'+[...relatorio,...omitidos].join('\n'));const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}),nome='Documentos_SRM_'+new Date().toLocaleDateString('sv-SE')+'.zip';
   if(!vigente(c))return;const solicitarDownload=()=>{if(!vigente(c))return;const url=URL.createObjectURL(blob),a=n('a');a.href=url;a.download=nome;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};solicitarDownload();mensagem('Download solicitado: '+arquivos.length+' arquivo(s). Confira a pasta Downloads.\n'+(relatorio.length||omitidos.length?'Há itens não incluídos; consulte o relatório dentro do ZIP.':'Todos os documentos escolhidos foram gerados.'));c.busy=false;acoes(botao('Baixar novamente',solicitarDownload),botao('Nova seleção',()=>tela1(c)));
  }catch(_){if(vigente(c)){c.busy=false;mensagem('Não foi possível preparar o pacote. Nenhum dado foi alterado.');acoes(botao('Voltar à conferência',()=>telaConferencia(c)));}}
 }
 window.ExportarDocumentos=Object.freeze({abrir,fechar});
})();
