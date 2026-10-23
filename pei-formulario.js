(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const auth = firebase.auth(), db = firebase.firestore();
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
  let base = '', dirty = false, busy = false, generation = 0, alunos = [];
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
    $('form-sections').querySelectorAll('input,textarea,.pei-ai button').forEach(field=>field.disabled=value||field.dataset.loading==='true');
  }
  function textoIA(response) {
    if(typeof response==='string')return response;
    if(Array.isArray(response))return response.map(textoIA).join('\n');
    if(response?.message?.content!==undefined)return textoIA(response.message.content);
    if(typeof response?.text==='string')return response.text;
    return '';
  }
  function mesmaRedacao(a,b) {
    const normalizar=text=>text.normalize('NFKC').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]/gu,'');
    return normalizar(a)===normalizar(b);
  }
  function adicionarIA(wrap,input,path,label) {
    const formState=estado,formToken=generation;
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
    const valido=()=>generation===formToken&&estado===formState&&input.isConnected&&!!user;
    let originalRevisado='';
    request.addEventListener('click',async()=>{
      if(busy||!valido())return;
      const original=input.value;
      preview.hidden=true;suggestion.value='';
      if(!original.trim()){status.textContent='Escreva seu texto neste campo antes de solicitar a revisão.';input.focus();return;}
      if(!window.puter?.ai?.chat){status.textContent='O serviço de IA está indisponível. Tente novamente em instantes; seu texto foi mantido.';return;}
      request.dataset.loading='true';request.disabled=true;status.textContent='Preparando sugestão…';
      const prompt='Você é um revisor de textos pedagógicos de Plano Educacional Individualizado (PEI). '+
        'Sua tarefa é REESCREVER o texto do professor para o campo "'+label+'", e não apenas repeti-lo. '+
        'Transforme anotações e frases simples em uma redação pedagógica clara, coesa, natural e bem organizada. '+
        'Reformule a construção das frases, conecte as ideias, corrija a gramática e desenvolva melhor as ideias que já estão expressas. '+
        'Use linguagem profissional e respeitosa, evitando jargões desnecessários. Preserve o significado, o grau de certeza e todas as informações relatadas. '+
        'Você pode mudar a forma de escrever, mas não criar informações: não acrescente fatos, diagnósticos, medicamentos, '+
        'comportamentos, resultados, metas, condutas ou níveis de apoio que não estejam no texto. '+
        'Responda somente com a versão reescrita em português do Brasil, sem comentários, títulos ou marcações.\n\n'+
        'Texto do professor:\n"""\n'+original+'\n"""';
      try{
        let text='';
        for(let tentativa=0;tentativa<2;tentativa++){
          const pedido=tentativa===0?prompt:prompt+'\n\nNa tentativa anterior você repetiu o texto original. '+
            'Agora reformule de fato a estrutura e a redação, desenvolvendo as ideias já fornecidas sem acrescentar fatos. '+
            'Não se limite a mudar pontuação, espaços ou letras maiúsculas.';
          const response=await window.puter.ai.chat(pedido);
          if(!valido())return;
          if(input.value!==original){status.textContent='Você alterou o campo durante a revisão. Seu texto foi mantido; solicite uma nova sugestão.';return;}
          text=textoIA(response).trim();
          if(!text)throw new Error('Resposta vazia');
          if(!mesmaRedacao(original,text))break;
          if(tentativa===0)status.textContent='A IA repetiu o texto. Solicitando uma reformulação…';
        }
        if(mesmaRedacao(original,text)){
          status.textContent='A IA não apresentou uma reformulação após duas tentativas. Seu texto foi mantido; nenhuma sugestão foi aplicada.';
          return;
        }
        originalRevisado=original;suggestion.value=text;preview.hidden=false;
        status.textContent='Sugestão pronta. Ela ainda não substituiu seu texto nem foi salva.';
      }catch(error){if(valido())status.textContent='Não foi possível obter uma sugestão da IA. Seu texto foi mantido; tente novamente.';}
      finally{delete request.dataset.loading;request.disabled=busy;}
    });
    apply.addEventListener('click',()=>{
      if(busy||!valido())return;
      if(input.value!==originalRevisado){status.textContent='O campo foi alterado depois da revisão. Seu texto foi mantido; solicite uma nova sugestão.';return;}
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
          input.placeholder=PEIModelo.orientacoes[guide];
          input.rows=10;
        }
        if(path==='identificacao.nome')input.required=true;
        input.addEventListener('input',()=>{
          definir(estado,path,input.value);dirty=true;
          $('save-note').textContent='Alterações ainda não salvas.';
        });
        wrap.append(input);
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
    html+='<p>'+esc(valor(data,'assinaturas.local')||'Cambé')+', '+esc(written)+'.</p>';
    for(const [key,label] of [['regente','Professor(a) regente'],['apoio','Professor(a) de apoio'],['coordenador','Coordenador(a) pedagógico(a)']]){
      html+='<p>________________________________________</p><p>Nome: '+esc(valor(data,'assinaturas.'+key))+'</p><p>'+label+'</p>';
    }
    return html;
  }
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
  async function historico() {
    if(!user||!alunoId||busy)return;
    const token=generation;const root=$('pei-history-list');root.textContent='Carregando versões…';
    $('pei-history-status').textContent='';$('pei-legacy-preview').hidden=true;$('pei-legacy-preview').srcdoc='';
    try{
      const snapshot=await db.collection('alunos').doc(alunoId).collection('pei').get();
      if(token!==generation)return;
      root.replaceChildren();
      const docs=snapshot.docs.filter(d=>d.id.startsWith('versao-')||(d.id==='atual'&&!d.data().peiFormulario));
      docs.sort((a,b)=>String(b.data().peiData||'').localeCompare(String(a.data().peiData||'')));
      if(!docs.length)root.textContent='Não há versões anteriores neste cadastro.';
      for(const doc of docs){
        const data=doc.data();const date=new Date(data.peiData);
        const text=(data.peiFormulario?'PEI do formulário':'PEI importado')+' — '+(Number.isNaN(date.getTime())?'data não informada':date.toLocaleString('pt-BR'));
        const button=el('button','Visualizar '+text);button.type='button';button.className='btn secondary';
        const visualizar=()=>{
          root.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed','false'));
          if(mostrarVersao(data,text))button.setAttribute('aria-pressed','true');
        };
        button.addEventListener('click',visualizar);root.append(button);
        if(doc===docs[0])visualizar();
      }
    }catch(error){if(token===generation)root.textContent='Não foi possível consultar o histórico. Verifique a conexão e as permissões.';}
  }
  function lista() {
    const q=$('search-input').value.toLocaleLowerCase('pt-BR');const root=$('student-grid');root.replaceChildren();
    for(const student of alunos.filter(p=>(p.nome+' '+(p.escola||'')).toLocaleLowerCase('pt-BR').includes(q))){
      const card=el('article');card.className='student-card';card.append(el('h2',student.nome||'Aluno sem nome'),el('p',(student.escola||'Escola não informada')+' · '+(student.turma||'Turma não informada')));
      const button=el('button','Abrir PEI');button.type='button';button.className='btn';button.addEventListener('click',()=>abrir(student.id));card.append(button);root.append(card);
    }
    if(!root.children.length)root.append(el('p','Nenhum aluno encontrado. Cadastre o aluno no Diário de Bordo.'));
  }
  async function carregarLista() {
    if(!user)return;
    const token=generation;
    const snapshot=await db.collection('alunos').where('professorUid','==',user.uid).get();
    if(token!==generation)return;
    alunos=snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));lista();
  }
  $('pei-introducao').replaceChildren(...PEIModelo.introducao.map(text=>el('p',text)));
  document.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',()=>{
    const section=$(button.dataset.section);section.scrollIntoView({block:'start'});section.querySelector('input,textarea')?.focus({preventScroll:true});
  }));
  $('search-input').addEventListener('input',lista);
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
    generation++;user=current;dirty=false;alunoId=null;estado=null;atual=null;alunos=[];base='';setBusy(false);
    $('form-sections').replaceChildren();$('student-grid').replaceChildren();$('pei-history-list').replaceChildren();$('pei-history-status').textContent='';$('pei-legacy-preview').srcdoc='';$('pei-legacy-preview').hidden=true;
    $('login-screen').hidden=!!current;$('app-shell').hidden=!current;$('pei-editor').hidden=true;$('pei-list').hidden=false;erro();
    if(!current){$('loginPassword').value='';$('topbar-user').textContent='';return;}
    $('topbar-user').textContent=current.email||'';
    const id=new URLSearchParams(location.search).get('alunoId');
    if(id)await abrir(id);else try{await carregarLista();}catch(error){erro('Não foi possível carregar os alunos. Verifique a conexão.');}
  });
  window.PEIFormulario={grupos,criarEstado,conteudo};
})();
