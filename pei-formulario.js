(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const auth = window.SRMExportacaoWorker?null:firebase.auth(), db = window.SRMExportacaoWorker?null:firebase.firestore();
  const grupos = [
    {id:'sec-id', titulo:'I. Identificação', campos:[
      ['identificacao.nome','Nome do aluno','text'],
      ['identificacao.dataNascimento','Data de nascimento','date'],
      ['identificacao.escola','Escola','text'],
      ['identificacao.anoEscolar','Ano escolar','text'],
      ['identificacao.turno','Turno','text'],
      ['identificacao.professorRegente','Professor regente','text'],
      ['identificacao.professorApoio','Professor de apoio','text'],
      ['identificacao.nee','Necessidade educacional especial','text']
    ]},
    {id:'sec-escolar', titulo:'II. Características do aluno no contexto escolar', campos:[
      ['contextoEscolar.socioafetivos','Aspectos socioafetivos','textarea','ASPECTOS SOCIOAFETIVOS:'],
      ['contextoEscolar.academicos','Aspectos acadêmicos','textarea','ASPECTOS ACADÊMICOS:'],
      ['contextoEscolar.linguagemOral','Aspectos de linguagem verbal oral','textarea','ASPECTOS DE LINGUAGEM VERBAL ORAL:'],
      ['contextoEscolar.linguagemEscrita','Aspectos de linguagem verbal escrita','textarea','ASPECTOS DE LINGUAGEM VERBAL ESCRITA:'],
      ['contextoEscolar.cognitivos','Aspectos cognitivos','textarea','ASPECTOS COGNITIVOS:'],
      ['contextoEscolar.psicomotores','Aspectos psicomotores','textarea','ASPECTOS PSICOMOTORES:']
    ]},
    {id:'sec-estrategias', titulo:'III. Estratégias de ensino', campos:[
      ['estrategias.objetivosMetas','Objetivos e metas educacionais','textarea','OBJETIVOS E METAS EDUCACIONAIS:'],
      ['estrategias.adaptacoes','Modificações e adaptações/adequações curriculares','textarea','MODIFICAÇÕES E ADAPTAÇÕES/ADEQUAÇÕES CURRICULARES:'],
      ['estrategias.processoAvaliativo','Processo avaliativo','textarea','PROCESSO AVALIATIVO:']
    ]},
    {id:'sec-familiar', titulo:'IV. Características do aluno no contexto familiar', campos:[
      ['contextoFamiliar.texto','Contexto familiar e contribuição da família','textarea','familiar']
    ]},
    {id:'sec-sign', titulo:'Assinaturas e local/data', campos:[
      ['assinaturas.local','Local','text'],['assinaturas.data','Data','date'],
      ['assinaturas.regente','Nome do professor regente','text'],
      ['assinaturas.apoio','Nome do professor de apoio','text'],
      ['assinaturas.coordenador','Nome do coordenador pedagógico','text']
    ]}
  ];
  let user = null, alunoId = null, perfil = {}, estado = null, atual = null;
  let base = '', dirty = false, busy = false, generation = 0, historyGeneration = 0, listGeneration = 0, alunos = [], abortarExportacaoLista = null;
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assinatura = value => JSON.stringify(value, function(key, data) {
    if (data && !Array.isArray(data) && typeof data === 'object') {
      return Object.fromEntries(Object.keys(data).sort().map(k => [k,data[k]]));
    }
    return data;
  });
  const el = (tag,text) => {const element=document.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
  function valor(data, path) {return path.split('.').reduce((v,key) => v?.[key],data) || '';}
  function definir(data,path,value) {const [grupo,key]=path.split('.');data[grupo] ||= {};data[grupo][key]=value;}
  function criarEstado(profile, saved) {
    const data = {schemaVersion:1};
    const defaults = {
      identificacao:{nome:profile.nome||'',dataNascimento:profile.dataNasc||'',escola:profile.escola||'',anoEscolar:profile.turma||'',turno:profile.periodo||'',nee:profile.laudo||''},
      assinaturas:{local:'Cambé'}
    };
    for(const grupo of grupos)for(const [path] of grupo.campos){
      const v=valor(saved,path);
      const [g,k]=path.split('.');
      definir(data,path,typeof saved?.[g]?.[k]==='string'?v:valor(defaults,path));
    }
    return data;
  }
  function erro(message='') {$('peiError').textContent=message;}
  function setBusy(value) {
    busy=value;
    for(const id of ['btn-save','btn-back-list','btn-export-docx','btn-export-odt','btn-history'])$(id).disabled=value;
    $('form-sections').querySelectorAll('input,textarea,.pei-ai button,.pei-metas button').forEach(field=>field.disabled=value||field.dataset.loading==='true');
    $('pei-history-list').querySelectorAll('button').forEach(button=>button.disabled=value);
    $('student-grid').querySelectorAll('button').forEach(button=>button.disabled=value);
    $('peiNovo').disabled=value;$('search-input').disabled=value;$('peiListaAtualizar').disabled=value;
  }
  function adicionarMetasAoPei(wrap,input) {
    const token=generation,formState=estado,id=alunoId;
    const valido=()=>generation===token&&estado===formState&&input.isConnected&&!!user&&alunoId===id;
    const box=el('section');box.className='pei-metas';
    box.append(el('h3','Metas cadastradas no acompanhamento'));
    const hint=el('p','Consulte as metas ativas e em revisão deste aluno e escolha quais acrescentar. O texto existente será mantido. Alterações futuras nas metas não atualizam este PEI automaticamente.');box.append(hint);
    const consultar=el('button','Consultar metas do acompanhamento');consultar.type='button';consultar.className='btn secondary';
    const status=el('p');status.className='pei-metas-status';status.setAttribute('role','status');
    const list=el('div');list.className='pei-metas-lista';
    const previewWrap=el('div');previewWrap.hidden=true;
    const label=el('label','Prévia das metas selecionadas');label.htmlFor='pei-metas-previa';
    const preview=el('textarea');preview.id='pei-metas-previa';preview.readOnly=true;preview.rows=10;
    const inserir=el('button','Acrescentar metas selecionadas');inserir.type='button';inserir.className='btn';
    previewWrap.append(label,preview,inserir);box.append(consultar,status,list,previewWrap);wrap.append(box);
    let metas=[],selected=new Set(),loading=false;
    const textoMeta=meta=>[
      ['Objetivo',meta.objetivo],['Ponto de partida',meta.situacaoInicial],['Como acompanhar',meta.criterio],
      ['Estratégias e recursos',meta.estrategias],['Apoios previstos',meta.apoios],['Responsável',meta.responsavel],
      ['Revisar em',/^\d{4}-\d{2}-\d{2}$/.test(meta.revisao||'')?meta.revisao.split('-').reverse().join('/'):'']
    ].filter(([,text])=>typeof text==='string'&&text.trim()).map(([label,text])=>label+': '+text.trim()).join('\n');
    const escolhidas=()=>metas.filter(meta=>selected.has(meta.id));
    function atualizarPrevia(){
      preview.value=escolhidas().map(textoMeta).join('\n\n');previewWrap.hidden=!selected.size;
    }
    consultar.addEventListener('click',async()=>{
      if(busy||loading||!valido())return;
      loading=true;consultar.dataset.loading='true';consultar.disabled=true;status.textContent='Carregando metas…';
      list.replaceChildren();selected.clear();metas=[];atualizarPrevia();
      try{
        const snapshot=await db.collection('alunos').doc(id).collection('metas').get();
        if(!valido())return;
        metas=snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).filter(meta=>['ativa','em_revisao'].includes(meta.status)&&typeof meta.objetivo==='string'&&meta.objetivo.trim());
        metas.sort((a,b)=>String(a.revisao||'').localeCompare(String(b.revisao||''))||a.objetivo.localeCompare(b.objetivo,'pt-BR'));
        status.textContent=metas.length?'Selecione as metas e confira a prévia antes de acrescentar. Nenhuma alteração foi salva.':'Não há metas ativas ou em revisão neste cadastro. Cadastre-as em Metas e acompanhamento no Diário.';
        for(const meta of metas){
          const row=el('label');const check=el('input');check.type='checkbox';check.value=meta.id;
          check.addEventListener('change',()=>{if(check.checked)selected.add(meta.id);else selected.delete(meta.id);atualizarPrevia();});
          row.append(check,el('span',meta.objetivo+' — '+(meta.status==='ativa'?'Ativa':'Em revisão')));list.append(row);
        }
      }catch(error){if(valido())status.textContent='Não foi possível consultar as metas. Seu texto foi mantido. Confira a conexão e as permissões e tente novamente.';}
      finally{loading=false;delete consultar.dataset.loading;consultar.disabled=busy;}
    });
    inserir.addEventListener('click',()=>{
      if(busy||loading||!valido())return;
      const normalizar=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR');
      let existente=normalizar(input.value);
      const blocos=escolhidas().map(textoMeta).filter(text=>{
        const normalizado=normalizar(text);
        if(existente.includes(normalizado))return false;
        existente+=' '+normalizado;return true;
      });
      if(!blocos.length){status.textContent='As metas selecionadas já constam no texto com estas informações. Nada foi acrescentado.';return;}
      input.value+=(input.value.trim()?'\n\n':'')+blocos.join('\n\n');
      input.dispatchEvent(new Event('input',{bubbles:true}));
      status.textContent=blocos.length+' meta(s) acrescentada(s). Revise o texto e clique em Salvar para gravar o PEI.';
      input.focus();input.setSelectionRange(input.value.length,input.value.length);input.scrollTop=input.scrollHeight;
    });
  }
  function adicionarIA(wrap,input,path,label) {
    const formState=estado,formToken=generation,ownerUid=user?.uid;
    const area=el('div');area.className='pei-ai';
    const request=el('button','✨ Melhorar texto com IA');request.type='button';request.className='btn secondary';
    request.setAttribute('aria-label','Melhorar '+label+' com IA');
    const hint=el('p','Envia apenas o texto deste campo ao serviço de IA. Revise a sugestão antes de aplicar.');hint.className='pei-ai-hint';
    const status=el('p');status.className='pei-ai-status';status.setAttribute('role','status');
    const preview=el('div');preview.className='pei-ai-preview';preview.hidden=true;
    const previewLabel=el('label','Sugestão da IA — revise antes de aplicar');
    const suggestion=el('textarea');suggestion.readOnly=true;suggestion.rows=8;suggestion.id='sugestao-'+path.replace('.','-');previewLabel.htmlFor=suggestion.id;
    const actions=el('div');actions.className='pei-ai-actions';
    const apply=el('button','Aplicar sugestão');apply.type='button';apply.className='btn';
    const discard=el('button','Manter meu texto original');discard.type='button';discard.className='btn secondary';
    actions.append(apply,discard);preview.append(previewLabel,suggestion,actions);area.append(request,hint,status,preview);wrap.append(area);
    const valido=()=>generation===formToken&&estado===formState&&input.isConnected&&user?.uid===ownerUid&&auth.currentUser?.uid===ownerUid;
    let originalRevisado='';
    request.addEventListener('click',async()=>{
      if(busy||!valido()||input.disabled||input.readOnly)return;
      const original=input.value;
      preview.hidden=true;suggestion.value='';
      if(!original.trim()){status.textContent='Escreva seu texto neste campo antes de solicitar a revisão.';input.focus();return;}
      if(!window.puter?.ai?.chat){status.textContent='O serviço de IA está indisponível. Tente novamente em instantes; seu texto foi mantido.';return;}
      request.dataset.loading='true';request.disabled=true;status.textContent='Preparando sugestão…';
      try{
        const text=await IACamposModelo.revisar({texto:original,campo:'PEI — '+label,maxCaracteres:input.maxLength,vigente:()=>valido()&&!busy&&!input.disabled&&!input.readOnly&&input.value===original,aoRepetir:()=>{status.textContent='A IA repetiu o texto. Solicitando uma reformulação…';}});
        if(!valido()||busy||input.value!==original)return;
        originalRevisado=original;suggestion.value=text;preview.hidden=false;
        status.textContent='Sugestão pronta. Ela ainda não substituiu seu texto nem foi salva.';
      }catch(error){if(valido())status.textContent=input.value!==original?'Você alterou o campo durante a revisão. Seu texto foi mantido; solicite uma nova sugestão.':error?.code==='sem-reformulacao'?'A IA não apresentou uma reformulação após duas tentativas. Seu texto foi mantido; nenhuma sugestão foi aplicada.':'Não foi possível obter uma sugestão da IA. Seu texto foi mantido; tente novamente.';}
      finally{delete request.dataset.loading;request.disabled=busy;}
    });
    apply.addEventListener('click',()=>{
      if(busy||!valido()||input.disabled||input.readOnly)return;
      if(input.value!==originalRevisado){status.textContent='O campo foi alterado depois da revisão. Seu texto foi mantido; solicite uma nova sugestão.';return;}
      const limite=IACamposModelo.limite(input,suggestion.value);if(limite){status.textContent=limite;return;}
      input.value=suggestion.value;input.dispatchEvent(new Event('input',{bubbles:true}));preview.hidden=true;
      status.textContent='Sugestão aplicada ao campo. Clique em Salvar para gravar o PEI.';
    });
    discard.addEventListener('click',()=>{
      if(busy)return;
      preview.hidden=true;suggestion.value='';status.textContent='Sugestão descartada. Seu texto original foi mantido.';
    });
  }
  function formulario() {
    const root=$('form-sections');root.replaceChildren();
    for(const grupo of grupos){
      const section=el('section');section.className='card';section.id=grupo.id;
      const head=el('div');head.className='card-head';const title=el('h2',grupo.titulo);title.className='pei-heading';head.append(title);
      const body=el('div');body.className='card-body';
      for(const [path,label,type,guide] of grupo.campos){
        const wrap=el('div');wrap.className='pei-field';
        const id='field-'+path.replace('.','-');const caption=el('label',label);caption.htmlFor=id;wrap.append(caption);
        if(guide){
          const detail=el('details');detail.className='pei-guidance';detail.append(el('summary','Orientação de preenchimento do modelo'),el('p',PEIModelo.orientacoes[guide]));wrap.append(detail);
        }
        const input=el(type==='textarea'?'textarea':'input');
        if(type!=='textarea')input.type=type;
        input.id=id;input.dataset.path=path;input.value=valor(estado,path);
        if(guide) {
          input.rows=10;
        }
        if(path==='identificacao.nome')input.required=true;
        input.addEventListener('input',()=>{
          definir(estado,path,input.value);dirty=true;
          $('save-note').textContent='Alterações ainda não salvas.';
        });
        wrap.append(input);
        if(path==='estrategias.objetivosMetas')adicionarMetasAoPei(wrap,input);
        if(guide)adicionarIA(wrap,input,path,label);
        body.append(wrap);
      }
      section.append(head,body);root.append(section);
    }
  }
  async function abrir(id) {
    if(!user)return;
    if(dirty&&!window.confirm('Há alterações não salvas. Deseja sair deste PEI?'))return;
    const token=++generation, owner=user.uid;
    setBusy(true);erro();$('save-note').textContent='Carregando PEI…';
    try{
      if(!id||/[\/\u0000-\u001f]/.test(id)||id.length>1500)throw new Error('Abra o PEI pela aba do aluno no Diário.');
      const ref=db.collection('alunos').doc(id);
      const [student,documento]=await Promise.all([ref.get(),ref.collection('pei').doc('atual').get()]);
      if(token!==generation||user?.uid!==owner)return;
      if(!student.exists||student.data().professorUid!==owner)throw new Error('Aluno não encontrado para esta conta.');
      const data=documento.exists?documento.data():null;
      if(data?.peiFormulario && data.peiFormulario.schemaVersion!==1)throw new Error('Este PEI usa uma versão de formulário diferente. Nenhuma alteração foi feita.');
      alunoId=id;perfil=student.data();atual=data;base=assinatura(data);
      estado=criarEstado(perfil,data?.peiFormulario);dirty=false;
      $('form-title').textContent='PEI — '+(perfil.nome||'Aluno');
      $('save-note').textContent=data?.peiFormulario?'PEI carregado. Edite os campos e clique em Salvar.':'Preencha o formulário. O salvamento é feito pelo botão Salvar.';
      $('legacy-note').hidden=!data?.peiHtml||!!data?.peiFormulario;
      $('pei-list').hidden=true;$('pei-editor').hidden=false;
      $('pei-history-list').replaceChildren();$('pei-history-status').textContent='';$('pei-legacy-preview').hidden=true;$('pei-legacy-preview').srcdoc='';
      formulario();window.scrollTo(0,0);
      history.replaceState(null,'',location.pathname+'?alunoId='+encodeURIComponent(id)+'&nome='+encodeURIComponent(perfil.nome||''));
    }catch(error){if(token===generation){erro(error.message||'Não foi possível abrir o PEI.');}}
    finally{if(token===generation)setBusy(false);}
  }
  function conteudo(data,logo='') {
    let html=(logo?'<img src="'+logo+'" width="560" height="92" alt="Prefeitura Municipal de Cambé — Secretaria de Educação e Cultura">':'')+'<h1>PLANO EDUCACIONAL INDIVIDUALIZADO — PEI</h1>';
    html+=PEIModelo.introducao.map(text=>'<p>'+esc(text)+'</p>').join('');
    for(const grupo of grupos.slice(0,4)){
      html+='<h2>'+esc(grupo.titulo)+'</h2>';
      for(const [path,label,type] of grupo.campos){
        let text=String(valor(data,path));
        if(type==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(text))text=text.split('-').reverse().join('/');
        html+='<p><strong>'+esc(label)+':</strong></p>';
        html+=(text?text.split(/\r?\n/):['']).map(line=>'<p>'+esc(line||' ')+'</p>').join('');
      }
    }
    const date=valor(data,'assinaturas.data');
    const written=/^\d{4}-\d{2}-\d{2}$/.test(date)?new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00')):'____ de __________________ de ______';
    html+='<p data-srm-sign-data="left">'+esc(valor(data,'assinaturas.local')||'Cambé')+', '+esc(written)+'.</p>';
    html+=AssinaturasDocumentos.html([[{nome:valor(data,'assinaturas.regente'),cargo:'Professor(a) regente'},{nome:valor(data,'assinaturas.apoio'),cargo:'Professor(a) de apoio'}],[{nome:valor(data,'assinaturas.coordenador'),cargo:'Coordenador(a) pedagógico(a)'}]]);
    return html;
  }
  if(window.SRMExportacaoWorker){window.PEIFormulario={grupos,criarEstado,conteudo};return;}
  async function salvar() {
    if(busy||!user||!alunoId||!estado)return;
    if(!estado.identificacao.nome.trim()){erro('Informe o nome do aluno.');$('field-identificacao-nome').focus();return;}
    if(!dirty&&atual?.peiFormulario){$('save-note').textContent='Nenhuma alteração para salvar.';return;}
    const token=generation,owner=user.uid,id=alunoId,data=JSON.parse(JSON.stringify(estado)),expected=base;
    const studentRef=db.collection('alunos').doc(id), ref=studentRef.collection('pei').doc('atual');
    const backupRef=studentRef.collection('pei').doc('versao-'+Date.now()+'-'+crypto.randomUUID());
    setBusy(true);erro();$('save-note').textContent='Salvando PEI e preservando a versão anterior…';
    try{
      const payload={peiFormulario:data,peiHtml:conteudo(data),peiComprimido:false,peiData:new Date().toISOString(),peiNomeArquivo:'PEI preenchido no formulário',professorUid:owner};
      await db.runTransaction(async transaction=>{
        const [student,previous]=await Promise.all([transaction.get(studentRef),transaction.get(ref)]);
        if(token!==generation||user?.uid!==owner)throw new Error('A sessão ou o aluno mudou. Reabra o PEI para continuar.');
        if(!student.exists||student.data().professorUid!==owner)throw new Error('Este aluno não está mais vinculado à sua conta.');
        const old=previous.exists?previous.data():null;
        if(assinatura(old)!==expected)throw new Error('O PEI foi alterado em outra aba ou sessão. Seu texto continua nesta tela: copie as alterações antes de reabrir o documento.');
        if(old)transaction.set(backupRef,old);
        transaction.set(ref,payload,{merge:true});
      });
      if(token!==generation||user?.uid!==owner)return;
      atual={...(atual||{}),...payload};base=assinatura(atual);dirty=false;
      $('legacy-note').hidden=true;$('save-note').textContent='PEI salvo com sucesso. A versão anterior, quando existente, foi preservada no histórico.';
    }catch(error){if(token===generation){erro(error.code==='permission-denied'?'Sem permissão para salvar o PEI e seu histórico. Nenhum salvamento parcial foi aplicado. Confira as regras com o responsável pelo Firebase.':error.message||'Não foi possível salvar.');$('save-note').textContent='Não salvo. Seu preenchimento permanece nesta tela.';}}
    finally{if(token===generation)setBusy(false);}
  }
  async function exportar(format) {
    if(busy||!estado)return;
    const data=JSON.parse(JSON.stringify(estado));setBusy(true);erro();
    try{
      const response=await fetch('modelos/pei-cabecalho.png');if(!response.ok)throw new Error('Cabeçalho do modelo não encontrado. Envie a pasta completa ao Netlify.');
      const blob=await response.blob();const logo=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
      await SRMExport.fromHtml(conteudo(data,logo),format,'PEI_'+(data.identificacao.nome||'Aluno').replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,100));
      $('save-note').textContent=format.toUpperCase()+' gerado com o conteúdo atual. '+(dirty?'As alterações ainda não foram salvas.':'');
    }catch(error){erro('Não foi possível exportar: '+(error.message||'tente novamente.'));}
    finally{setBusy(false);}
  }
  function mostrarVersao(data, label) {
    const anterior=$('pei-legacy-preview'),status=$('pei-history-status');
    status.textContent='';
    try {
      let html=typeof data.peiHtml==='string'?data.peiHtml:'';
      if(data.peiComprimido && html)html=LZString.decompressFromUTF16(html)||'';
      if(!html.trim()&&data.peiFormulario)html=conteudo(data.peiFormulario);
      if(!html.trim())throw new Error('O documento não contém texto legível ou não pôde ser descomprimido.');
      const parsed=new DOMParser().parseFromString(html,'text/html');
      parsed.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach(n=>n.remove());
      parsed.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes]){
        const imagemIncorporada=a.name==='src'&&n.tagName==='IMG'&&/^data:image\/(png|jpeg|gif|webp);base64,/i.test(a.value);
        if(/^on/i.test(a.name)||(['href','src','srcset','action'].includes(a.name)&&!imagemIncorporada))n.removeAttribute(a.name);
      }});
      if(!parsed.body.textContent.trim()&&!parsed.body.querySelector('img'))throw new Error('Não há conteúdo disponível para visualização nesta versão.');
      // Uma nova moldura evita que o carregamento da versão anterior interfira na atual.
      const frame=anterior.cloneNode(false);
      frame.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data:;"><style>'+PEIVisualizacao.css+'</style><article id="peiConteudo">'+parsed.body.innerHTML+'</article>';
      frame.hidden=false;
      anterior.replaceWith(frame);
      status.textContent='Visualizando: '+label+'. Esta consulta não altera o PEI salvo.';
      frame.tabIndex=-1;
      frame.scrollIntoView({block:'start'});frame.focus({preventScroll:true});
      return true;
    } catch(error) {
      anterior.hidden=true;anterior.srcdoc='';
      status.textContent='Não foi possível visualizar este PEI: '+error.message+' Nenhum dado foi alterado.';
      status.scrollIntoView({block:'center'});
      return false;
    }
  }
  async function excluirVersao(doc,data,text,row,contextoValido) {
    if(busy||!contextoValido()||!row.isConnected||!doc.id.startsWith('versao-'))return;
    const id=alunoId,owner=user.uid,expected=assinatura(data);
    if(!window.confirm('Excluir definitivamente esta versão de PEI de '+(perfil.nome||'este aluno')+'?\n\n'+text+'\n\nO PEI atual será mantido. Não será possível recuperar esta versão pelo site.'))return;
    if(!contextoValido()||!row.isConnected)return;
    const operation=++historyGeneration,studentRef=db.collection('alunos').doc(id),ref=studentRef.collection('pei').doc(doc.id);
    let foco=row.querySelector('.pei-history-delete');
    const mensagem=text=>{$('pei-history-status').textContent=text;if(!row.isConnected)return;let note=row.querySelector('.pei-history-item-status');if(!note){note=el('p');note.className='pei-history-item-status';note.setAttribute('role','status');row.append(note);}note.textContent=text;};
    setBusy(true);mensagem('Excluindo a versão escolhida…');
    try{
      await db.runTransaction(async transaction=>{
        const [student,saved]=await Promise.all([transaction.get(studentRef),transaction.get(ref)]);
        if(!contextoValido())throw new Error('A sessão ou o aluno mudou.');
        if(!student.exists||student.data().professorUid!==owner)throw new Error('Este aluno não está mais vinculado à sua conta.');
        if(!saved.exists)return;
        if(assinatura(saved.data())!==expected)throw new Error('Esta versão mudou em outra sessão. Atualize o histórico e confira antes de excluir.');
        transaction.delete(ref);
      });
      if(!contextoValido()||historyGeneration!==operation)return;
      const frame=$('pei-legacy-preview');
      if(frame.dataset.versao===doc.id){frame.hidden=true;frame.srcdoc='';delete frame.dataset.versao;}
      foco=row.nextElementSibling?.querySelector('[data-pei-visualizar]')||row.previousElementSibling?.querySelector('[data-pei-visualizar]')||$('btn-history');
      row.remove();
      if(!$('pei-history-list').children.length)$('pei-history-list').textContent='Não há versões anteriores neste cadastro.';
      $('pei-history-status').textContent='Versão excluída do histórico. O PEI atual e seu preenchimento foram mantidos.';
    }catch(error){if(contextoValido())mensagem(error?.code==='permission-denied'?'Sem permissão para excluir esta versão. Confira as permissões da sua conta.':error?.message?.includes('mudou')?error.message:'Não foi possível confirmar a exclusão. Atualize o histórico para conferir antes de tentar novamente.');}
    finally{if(contextoValido()){setBusy(false);if(foco?.isConnected)foco.focus();}}
  }
  async function historico() {
    if(!user||!alunoId||busy)return;
    const token=generation,id=alunoId,owner=user.uid,request=++historyGeneration;
    const contextoValido=()=>token===generation&&alunoId===id&&user?.uid===owner&&auth.currentUser?.uid===owner;
    const root=$('pei-history-list');root.textContent='Carregando versões…';$('btn-history').disabled=true;
    $('pei-history-status').textContent='';$('pei-legacy-preview').hidden=true;$('pei-legacy-preview').srcdoc='';delete $('pei-legacy-preview').dataset.versao;
    try{
      const snapshot=await db.collection('alunos').doc(id).collection('pei').get({source:'server'});
      if(!contextoValido()||request!==historyGeneration)return;
      if(snapshot.metadata?.fromCache)throw new Error('Histórico sem confirmação do servidor.');
      root.replaceChildren();
      const docs=snapshot.docs.filter(d=>d.id.startsWith('versao-')||(d.id==='atual'&&!d.data().peiFormulario));
      docs.sort((a,b)=>String(b.data().peiData||'').localeCompare(String(a.data().peiData||'')));
      if(!docs.length)root.textContent='Não há versões anteriores neste cadastro.';
      for(const doc of docs){
        const data=doc.data();const date=new Date(data.peiData);
        const text=(data.peiFormulario?'PEI do formulário':'PEI importado')+' — '+(Number.isNaN(date.getTime())?'data não informada':date.toLocaleString('pt-BR'));
        const row=el('div');row.className='pei-history-row';row.dataset.versao=doc.id;
        const button=el('button','Visualizar '+text);button.type='button';button.className='btn secondary';button.dataset.peiVisualizar=doc.id;button.disabled=busy;
        const visualizar=()=>{
          if(busy||!contextoValido()||!row.isConnected)return;
          root.querySelectorAll('[data-pei-visualizar]').forEach(item=>item.setAttribute('aria-pressed','false'));
          if(mostrarVersao(data,text)){button.setAttribute('aria-pressed','true');$('pei-legacy-preview').dataset.versao=doc.id;}
        };
        button.addEventListener('click',visualizar);row.append(button);
        if(doc.id.startsWith('versao-')){
          const excluir=el('button','Excluir');excluir.type='button';excluir.className='btn pei-history-delete';excluir.disabled=busy;
          excluir.setAttribute('aria-label','Excluir versão '+text);excluir.addEventListener('click',()=>excluirVersao(doc,data,text,row,contextoValido));row.append(excluir);
        }else row.append(el('small','Documento atual — mantido.'));
        root.append(row);if(doc===docs[0])visualizar();
      }
    }catch(error){if(contextoValido()&&request===historyGeneration)root.textContent='Não foi possível consultar o histórico. Verifique a conexão e as permissões.';}
    finally{if(contextoValido()&&request===historyGeneration)$('btn-history').disabled=busy;}
  }
  function contextoLista(owner,token){return generation===token&&user?.uid===owner&&auth.currentUser?.uid===owner&&!$('pei-list').hidden;}
  async function lerPeiSalvo(id,owner,vigente){
    const [student,saved]=await Promise.all([db.collection('alunos').doc(id).get({source:'server'}),db.collection('alunos').doc(id).collection('pei').doc('atual').get({source:'server'})]);
    if(!vigente())throw new Error('A sessão mudou.');
    if(!student.exists||student.metadata?.fromCache||student.data().professorUid!==owner)throw new Error('Este aluno não está mais vinculado à sua conta.');
    if(!saved.exists||saved.metadata?.fromCache)throw new Error('O PEI atual não foi encontrado no servidor. Atualize a lista.');
    return saved.data();
  }
  function gerarArquivoLista(data,format,vigente){
    return new Promise((resolve,reject)=>{
      const frame=el('iframe'),token=crypto.randomUUID();let finished=false;
      frame.hidden=true;frame.title='Gerador do PEI salvo';frame.src='pei_formulario.html#exportacao-lote='+token;
      const end=(error,blob)=>{if(finished)return;finished=true;removeEventListener('message',receive);clearTimeout(timer);frame.remove();if(abortarExportacaoLista===cancel)abortarExportacaoLista=null;error?reject(error):resolve(blob);};
      const cancel=()=>end(new Error('A sessão mudou.'));abortarExportacaoLista=cancel;
      const receive=e=>{const m=e.data;if(e.origin!==location.origin||e.source!==frame.contentWindow||m?.canal!=='srm-exportacao'||m.token!==token)return;
        if(!vigente()){end(new Error('A sessão mudou.'));return;}
        if(m.acao==='pronto')frame.contentWindow.postMessage({canal:'srm-exportacao',token,acao:'gerar',tipo:'pei',formato:format,dados:data},location.origin);
        else if(m.acao==='arquivo'&&m.blob instanceof Blob)end(null,m.blob);
        else if(m.acao==='erro')end(new Error('Não foi possível gerar o arquivo com esse PEI salvo.'));
      };
      const timer=setTimeout(()=>end(new Error('A geração demorou demais. Tente novamente.')),60000);addEventListener('message',receive);document.body.append(frame);
    });
  }
  async function exportarLista(student,format){
    if(busy||!user||$('pei-list').hidden)return;
    const owner=user.uid,token=generation,vigente=()=>contextoLista(owner,token);
    setBusy(true);erro();$('pei-list-status').textContent='Gerando '+format.toUpperCase()+' do PEI salvo…';
    try{
      const data=await lerPeiSalvo(student.id,owner,vigente);
      if(data.peiFormulario&&data.peiFormulario.schemaVersion!==1)throw new Error('Este PEI usa outra versão de formulário. Abra o documento para conferir.');
      const blob=await gerarArquivoLista(data,format,vigente);if(!vigente())return;
      const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='PEI_'+(student.nome||'Aluno').replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,100)+'.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      $('pei-list-status').textContent=format.toUpperCase()+' gerado com o PEI salvo de '+(student.nome||'Aluno')+'.';
    }catch(error){if(vigente()){$('pei-list-status').textContent='Não foi possível exportar. '+(error?.message||'Tente novamente.');erro($('pei-list-status').textContent);}}
    finally{if(vigente())setBusy(false);}
  }
  async function excluirPeiAtual(student){
    if(busy||!user||$('pei-list').hidden||!student.peiLista?.existe)return;
    const owner=user.uid,token=generation,expected=assinatura(student.peiLista.data),vigente=()=>contextoLista(owner,token);
    if(!window.confirm('Excluir o PEI atual de '+(student.nome||'este aluno')+'?\n\nSomente este documento será apagado. O cadastro do aluno no Diário, os outros documentos e as versões anteriores do PEI serão mantidos. Não será possível recuperar esta versão atual pelo site.'))return;
    if(!vigente())return;let concluido=false;setBusy(true);erro();$('pei-list-status').textContent='Excluindo somente o PEI atual…';
    try{
      const parent=db.collection('alunos').doc(student.id),ref=parent.collection('pei').doc('atual');
      await db.runTransaction(async tx=>{
        const [aluno,saved]=await Promise.all([tx.get(parent),tx.get(ref)]);
        if(!vigente())throw new Error('A sessão mudou.');
        if(!aluno.exists||aluno.data().professorUid!==owner)throw new Error('Este aluno não está mais vinculado à sua conta.');
        if(!saved.exists)return;
        if(assinatura(saved.data())!==expected)throw new Error('O PEI mudou em outra sessão. Atualize a lista e confira antes de excluir.');
        tx.delete(ref);
      });
      if(!vigente())return;student.peiLista={existe:false,data:null};lista();concluido=true;
      $('pei-list-status').textContent='PEI atual excluído. O aluno continua no Diário e as versões anteriores foram mantidas. O documento foi retirado da lista. Para criar outro PEI ou consultar versões anteriores, use Novo PEI / Consultar histórico.';
    }catch(error){if(vigente()){$('pei-list-status').textContent=error?.code==='permission-denied'?'Sem permissão para excluir este PEI.':error?.message?.includes('mudou')?error.message:'Não foi possível confirmar a exclusão. Atualize a lista para conferir antes de tentar novamente.';erro($('pei-list-status').textContent);}}
    finally{if(vigente()){setBusy(false);if(concluido)($('student-grid').querySelector('button')||$('peiNovo')).focus();}}
  }
  function lista() {
    const q=$('search-input').value.toLocaleLowerCase('pt-BR'),root=$('student-grid');root.replaceChildren();
    for(const student of alunos.filter(p=>(p.nome+' '+(p.escola||'')).toLocaleLowerCase('pt-BR').includes(q)&&p.peiLista?.existe)){
      const saved=student.peiLista?.existe,card=el('article');card.className='student-card';card.dataset.alunoId=student.id;card.append(el('h2',student.nome||'Aluno sem nome'),el('p',(student.escola||'Escola não informada')+' · '+(student.turma||'Turma não informada')));
      card.append(el('p',saved?(student.peiLista.data.peiFormulario?'PEI do formulário salvo':'PEI importado salvo'):'Sem PEI atual salvo'));
      const rawDate=student.peiLista?.data?.peiData;const date=rawDate?new Date(rawDate):null;if(date&&!Number.isNaN(date.getTime())){const stamp=el('p','Atualizado em '+date.toLocaleString('pt-BR'));stamp.className='pei-card-date';card.append(stamp);}
      const actions=el('div');actions.className='pei-list-actions';
      const button=el('button','Editar');button.title=saved?'Editar PEI':'Preencher um novo PEI';button.type='button';button.className='btn';button.dataset.peiEditar=student.id;button.disabled=busy;button.addEventListener('click',()=>{if(!busy)abrir(student.id);});actions.append(button);
      if(saved){
        const menu=el('details'),summary=el('summary','▤');menu.className='pei-export-menu';summary.setAttribute('aria-label','Exportar PEI de '+(student.nome||'Aluno'));summary.title='Exportar PEI';menu.append(summary);const options=el('div');options.className='pei-export-options';menu.append(options);actions.append(menu);
        for(const format of ['docx','odt']){const exp=el('button','Exportar '+format.toUpperCase());exp.type='button';exp.className='btn secondary';exp.disabled=busy;exp.dataset.peiExportar=format;exp.addEventListener('click',()=>exportarLista(student,format));options.append(exp);}
        const del=el('button','🗑');del.title='Excluir PEI';del.setAttribute('aria-label','Excluir PEI de '+(student.nome||'Aluno'));del.type='button';del.className='btn pei-list-delete';del.disabled=busy;del.dataset.peiExcluir=student.id;del.addEventListener('click',()=>excluirPeiAtual(student));actions.append(del);
      }
      if(student.arquivado===true)card.append(el('p','Cadastro arquivado no Diário'));
      card.append(actions);root.append(card);
    }
    if(!root.children.length)root.append(el('p','Nenhum PEI salvo encontrado. Para iniciar um documento ou consultar versões anteriores, use Novo PEI / Consultar histórico.'));
  }
  async function carregarLista() {
    if(!user)return;
    const token=generation,owner=user.uid,request=++listGeneration;alunos=[];$('student-grid').textContent='Consultando os PEIs salvos…';$('pei-list-status').textContent='';$('peiListaAtualizar').disabled=true;
    try{
    const snapshot=await db.collection('alunos').where('professorUid','==',owner).get({source:'server'});
    if(token!==generation||request!==listGeneration||auth.currentUser?.uid!==owner)return;
    if(snapshot.metadata?.fromCache)throw new Error('Não foi possível confirmar os alunos no servidor.');
    const items=await Promise.all(snapshot.docs.map(async doc=>{const student=doc.data();if(student.professorUid!==owner)throw new Error('Aluno de outra conta.');const saved=await db.collection('alunos').doc(doc.id).collection('pei').doc('atual').get({source:'server'});if(saved.metadata?.fromCache)throw new Error('Não foi possível confirmar os PEIs salvos.');return {...student,id:doc.id,peiLista:{existe:saved.exists,data:saved.exists?saved.data():null}};}));
    if(token!==generation||request!==listGeneration||auth.currentUser?.uid!==owner)return;
    alunos=items.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));lista();
    }catch(error){if(token===generation&&request===listGeneration){$('student-grid').textContent='Não foi possível consultar os PEIs salvos.';$('pei-list-status').textContent='Confira a conexão e use Atualizar lista.';}throw error;}
    finally{if(token===generation&&request===listGeneration)$('peiListaAtualizar').disabled=busy;}
  }
  $('pei-introducao').replaceChildren(...PEIModelo.introducao.map(text=>el('p',text)));
  document.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',()=>{
    const section=$(button.dataset.section);section.scrollIntoView({block:'start'});section.querySelector('input,textarea')?.focus({preventScroll:true});
  }));
  $('search-input').addEventListener('input',lista);
  $('peiNovo').addEventListener('click',async()=>{
    if(busy||!user)return;
    const owner=user.uid,token=generation;setBusy(true);erro();
    try{
      await carregarLista();if(!contextoLista(owner,token))return;
      const select=$('peiAlunoNovo');select.replaceChildren();
      for(const student of alunos){const option=el('option',(student.nome||'Aluno sem nome')+(student.escola?' — '+student.escola:'')+(student.arquivado===true?' (arquivado)':''));option.value=student.id;select.append(option);}
      if(!alunos.length){erro('Nenhum aluno disponível. Cadastre o aluno no Diário antes de criar o PEI.');return;}
      $('peiNovoDialog').showModal();select.focus();
    }catch(error){if(contextoLista(owner,token))erro('Não foi possível consultar os alunos. Confira a conexão.');}
    finally{if(contextoLista(owner,token))setBusy(false);}
  });
  $('peiNovoCancelar').addEventListener('click',()=>$('peiNovoDialog').close());
  $('peiNovoAbrir').addEventListener('click',()=>{
    const id=$('peiAlunoNovo').value;if(busy||!user||!alunos.some(student=>student.id===id))return;
    $('peiNovoDialog').close();abrir(id);
  });
  window.addEventListener('focus',()=>{if(user&&!busy&&!$('pei-list').hidden)carregarLista().catch(()=>erro('Não foi possível atualizar a lista.'));});
  $('peiListaAtualizar').addEventListener('click',()=>{if(!busy)carregarLista().catch(()=>erro('Não foi possível carregar os PEIs. Confira a conexão e tente novamente.'));});
  $('btn-save').addEventListener('click',salvar);
  $('btn-export-docx').addEventListener('click',()=>exportar('docx'));
  $('btn-export-odt').addEventListener('click',()=>exportar('odt'));
  $('btn-history').addEventListener('click',historico);
  $('btn-back-list').addEventListener('click',()=>{
    if(busy||(dirty&&!window.confirm('Há alterações não salvas. Deseja voltar à lista?')))return;
    generation++;dirty=false;alunoId=null;estado=null;$('form-sections').replaceChildren();$('pei-history-status').textContent='';$('pei-legacy-preview').srcdoc='';
    $('pei-editor').hidden=true;$('pei-list').hidden=false;erro();history.replaceState(null,'',location.pathname);carregarLista().catch(()=>erro('Não foi possível carregar os alunos.'));
  });
  $('btn-logout').addEventListener('click',()=>{
    if(busy||(dirty&&!window.confirm('Há alterações não salvas. Deseja sair?')))return;
    auth.signOut().catch(()=>erro('Não foi possível sair. Tente novamente.'));
  });
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  $('loginForm').addEventListener('submit',async event=>{
    event.preventDefault();$('loginBtn').disabled=true;$('loginError').textContent='';
    try{await auth.signInWithEmailAndPassword($('loginEmail').value.trim(),$('loginPassword').value);}
    catch(error){$('loginError').textContent=error.code==='auth/network-request-failed'?'Falha de conexão. Tente novamente.':'Não foi possível entrar. Confira a conta do Diário de Bordo.';}
    finally{$('loginBtn').disabled=false;}
  });
  auth.onAuthStateChanged(async current=>{
    generation++;abortarExportacaoLista?.();abortarExportacaoLista=null;user=current;dirty=false;alunoId=null;estado=null;atual=null;alunos=[];base='';setBusy(false);$('pei-list-status').textContent='';if($('peiNovoDialog').open)$('peiNovoDialog').close();$('peiAlunoNovo').replaceChildren();$('search-input').value='';
    $('form-sections').replaceChildren();$('student-grid').replaceChildren();$('pei-history-list').replaceChildren();$('pei-history-status').textContent='';$('pei-legacy-preview').srcdoc='';$('pei-legacy-preview').hidden=true;
    $('login-screen').hidden=!!current;$('app-shell').hidden=!current;$('pei-editor').hidden=true;$('pei-list').hidden=false;erro();
    if(!current){$('loginPassword').value='';$('topbar-user').textContent='';return;}
    $('topbar-user').textContent=current.email||'';
    const id=new URLSearchParams(location.search).get('alunoId');
    if(id)await abrir(id);else try{await carregarLista();}catch(error){erro('Não foi possível carregar os alunos. Verifique a conexão.');}
  });
  window.PEIFormulario={grupos,criarEstado,conteudo};
})();
