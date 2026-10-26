(() => {
  'use strict';
  const STATUS={ativa:'Ativa',em_revisao:'Em revisão',concluida:'Concluída',arquivada:'Arquivada'};
  const fields=[
    ['objetivo','Objetivo pedagógico','textarea',true,'O que se pretende favorecer na aprendizagem, participação ou autonomia?'],
    ['situacaoInicial','Ponto de partida','textarea',false,'Descreva o que já foi observado, sem estimativas ou fatos não registrados.'],
    ['criterio','Como acompanhar','textarea',true,'O que será observado e em qual contexto para avaliar esta meta?'],
    ['estrategias','Estratégias e recursos','textarea',false,'Quais estratégias e recursos serão utilizados?'],
    ['apoios','Apoios previstos','text',false,'Descreva os apoios necessários no contexto desta atividade.'],
    ['responsavel','Responsável pelo acompanhamento','text',false,'Nome ou função do profissional responsável.'],
    ['revisao','Data de revisão','date',true,''],['status','Situação da meta','select',true,'']
  ];
  let config=null,generation=0,metas=[],registros=[],registrosStatus='carregando',selected=new Set();
  let editing=null,revision=0,busy=false,loading=false,dirty=false,falhaCarregamento=false,metasConfirmadas=false;
  const $=id=>document.getElementById(id);
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn)=>{const b=node('button',text);b.type='button';b.className='central-btn';b.addEventListener('click',fn);return b;};
  const hoje=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const data=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.split('-').reverse().join('/'):'Não informada';
  const vinculavel=meta=>['ativa','em_revisao'].includes(meta.status);
  const valido=(token,ctx)=>generation===token&&config===ctx&&ctx?.vigente();
  function mensagem(text,error=false){const element=$('metasStatus');if(element){element.textContent=text;element.classList.toggle('metas-error',error);}}
  function bloquear(value){busy=value;$('metaForm')?.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=value);}
  function limparFormulario(){
    editing=null;revision=0;dirty=false;
    $('metaForm')?.reset();if($('meta-status'))$('meta-status').value='ativa';
    if($('metasEditorTitulo'))$('metasEditorTitulo').textContent='Cadastrar meta';
  }
  function montar(){
    const root=$('metasAluno');root.replaceChildren();root.className='card metas-aluno';
    root.append(node('h2','Metas e acompanhamento'),node('p','Defina objetivos individualizados e acompanhe os relatos de atendimento relacionados. A data indica quando revisar a meta, sem classificar o ritmo de desenvolvimento do aluno.'));
    root.lastChild.className='metas-intro';
    const status=node('p');status.id='metasStatus';status.className='metas-status';status.setAttribute('role','status');root.append(status);
    const links=$('metasVinculoAtendimento');links.replaceChildren();links.className='metas-vinculo';
    if(!config?.alunoId){mensagem('Salve o cadastro do aluno para começar suas metas.');links.append(node('p','Salve o cadastro para vincular metas a um atendimento.'));return;}
    const painel=node('section');painel.id='acompanhamentoPeriodo';root.append(painel);
    const toolbar=node('div');toolbar.className='metas-toolbar';
    toolbar.append(button('Atualizar metas',()=>carregar()));
    const label=node('label','Exibir ');const filter=node('select');filter.id='metasFiltro';
    for(const [v,text] of [['atuais','Ativas e em revisão'],['todas','Todas as metas'],['concluida','Concluídas'],['arquivada','Arquivadas']]){const option=node('option',text);option.value=v;filter.append(option);}
    filter.addEventListener('change',renderLista);label.append(filter);toolbar.append(label);root.append(toolbar);
    const details=node('details');details.className='metas-editor';details.id='metasEditor';
    const summary=node('summary','Cadastrar meta');summary.id='metasEditorTitulo';details.append(summary);
    const form=node('form');form.id='metaForm';form.className='metas-form';
    for(const [key,title,type,required,placeholder] of fields){
      const wrap=node('div');wrap.className='metas-field'+(type==='textarea'?' metas-full':'');
      const label=node('label',title+(required?' *':''));label.htmlFor='meta-'+key;
      const input=node(type==='textarea'?'textarea':type==='select'?'select':'input');
      if(type==='select')for(const [value,title] of Object.entries(STATUS)){const option=node('option',title);option.value=value;input.append(option);}
      else if(type!=='textarea')input.type=type;
      input.id='meta-'+key;input.name=key;input.required=required;if(placeholder)input.placeholder=placeholder;
      if(type!=='select'&&type!=='date')input.maxLength=key==='objetivo'?600:4000;
      input.addEventListener('input',()=>{dirty=true;});wrap.append(label,input);form.append(wrap);
    }
    const actions=node('div');actions.className='metas-toolbar metas-full';
    const submit=node('button','Salvar meta');submit.type='submit';submit.className='central-btn central-btn-primary';
    actions.append(submit,button('Cancelar edição',()=>{limparFormulario();details.open=false;}));form.append(actions);
    form.addEventListener('submit',salvar);details.append(form);root.append(details);
    const list=node('div');list.className='metas-list';list.id='metasLista';root.append(list);
  }
  function renderVinculos(){
    const root=$('metasVinculoAtendimento');if(!root||!config?.alunoId)return;
    root.replaceChildren();
    const fieldset=node('fieldset');fieldset.disabled=loading;fieldset.append(node('legend','Metas trabalhadas neste atendimento (opcional)'));
    const ativas=metas.filter(vinculavel);
    if(!ativas.length)fieldset.append(node('p',loading?'Carregando metas…':falhaCarregamento?'Não foi possível consultar as metas. Você pode registrar o atendimento sem vínculo e tentar atualizar as metas novamente.':'Nenhuma meta ativa disponível. Você pode registrar o atendimento normalmente.'));
    for(const meta of ativas){
      const label=node('label');const input=node('input');input.type='checkbox';input.value=meta.id;input.checked=selected.has(meta.id);
      input.addEventListener('change',()=>input.checked?selected.add(meta.id):selected.delete(meta.id));label.append(input,node('span',meta.objetivo));fieldset.append(label);
    }
    root.append(fieldset);
  }
  function renderLista(){
    const statusMetas=loading?'carregando':falhaCarregamento?'erro':metasConfirmadas?'pronto':'carregando';
    window.AcompanhamentoPeriodo?.render({metas,registros,statusMetas,statusRegistros:registrosStatus});
    const root=$('metasLista');if(!root)return;root.replaceChildren();
    const filter=$('metasFiltro').value;
    const list=metas.filter(meta=>filter==='todas'||(filter==='atuais'?vinculavel(meta):meta.status===filter));
    for(const meta of list){
      const card=node('article');card.className='meta-card';card.append(node('h3',meta.objetivo));
      const badge=node('span',STATUS[meta.status]||'Situação não informada');badge.className='meta-badge';card.append(badge);
      if(vinculavel(meta)&&meta.revisao&&meta.revisao<hoje()){const b=node('span','Revisão pendente');b.className='meta-badge meta-review';card.append(b);}
      for(const [label,value] of [['Ponto de partida',meta.situacaoInicial],['Como acompanhar',meta.criterio],['Estratégias',meta.estrategias],['Apoios',meta.apoios],['Responsável',meta.responsavel],['Revisar em',data(meta.revisao)]]){
        if(value){const p=node('p');p.append(node('strong',label+': '),document.createTextNode(value));card.append(p);}
      }
      card.append(button('Editar meta',()=>editar(meta)));
      const evidence=node('details');evidence.className='meta-evidence';
      const related=registros.filter(r=>Array.isArray(r.metaIds)&&r.metaIds.includes(meta.id)).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      evidence.append(node('summary',registrosStatus==='pronto'?related.length+' atendimento(s) vinculado(s)':'Registros '+(registrosStatus==='erro'?'indisponíveis':'carregando')));
      if(registrosStatus==='pronto'){
        if(!related.length)evidence.append(node('p','Ainda não há relatos vinculados. Isso não significa ausência de trabalho com a meta.'));
        const ol=node('ol');for(const r of related){const li=node('li');li.append(node('strong',data(r.date)),node('p',r.text||''));ol.append(li);}evidence.append(ol);
      }else evidence.append(node('p','Reabra o aluno se os registros não carregarem.'));
      card.append(evidence);root.append(card);
    }
    if(!list.length)root.append(node('p',loading?'Carregando metas…':falhaCarregamento?'Não foi possível confirmar as metas deste aluno. Tente Atualizar metas.':'Nenhuma meta nesta seleção. Cadastre uma meta ou altere o filtro.'));
  }
  async function carregar(){
    if(!config?.alunoId||loading||busy)return;
    const ctx=config,token=generation;loading=true;mensagem('Carregando metas…');renderVinculos();renderLista();
    try{
      const snap=await ctx.db.collection('alunos').doc(ctx.alunoId).collection('metas').get();
      if(!valido(token,ctx))return;
      falhaCarregamento=false;metasConfirmadas=true;
      metas=snap.docs.map(doc=>({...doc.data(),id:doc.id})).sort((a,b)=>String(a.revisao||'').localeCompare(String(b.revisao||'')));
      selected=new Set([...selected].filter(id=>metas.some(meta=>meta.id===id&&vinculavel(meta))));
      mensagem(metas.length+' meta(s) carregada(s). Use Atualizar metas para consultar alterações feitas em outra aba.');
      ctx.alterou();
    }catch(error){if(valido(token,ctx)){
      falhaCarregamento=true;
      mensagem('Não foi possível carregar as metas. '+(metas.length?'Continuam visíveis os dados da última consulta. ':'O atendimento pode ser registrado sem vínculo. ')+'Confira a conexão e as permissões.',true);
    }}
    finally{if(valido(token,ctx)){loading=false;renderLista();renderVinculos();}}
  }
  function editar(meta){
    if(busy)return;if(dirty&&!confirm('Descartar as alterações não salvas desta meta?'))return;
    editing=meta.id;revision=meta.revision||0;dirty=false;
    for(const [key] of fields)$('meta-'+key).value=meta[key]||'';
    $('metasEditorTitulo').textContent='Editar meta';$('metasEditor').open=true;
    $('meta-objetivo').focus();
  }
  async function salvar(event){
    event.preventDefault();if(busy||loading||!config?.alunoId||!$('metaForm').reportValidity())return;
    const ctx=config,token=generation,metaId=editing||crypto.randomUUID(),expected=revision;
    const values=Object.fromEntries(fields.map(([key])=>[key,$('meta-'+key).value.trim()]));
    if(!values.objetivo||!values.criterio){mensagem('Preencha objetivo e critério de acompanhamento.',true);return;}
    if(!STATUS[values.status]){mensagem('Selecione uma situação válida.',true);return;}
    bloquear(true);mensagem('Salvando meta…');
    const pupil=ctx.db.collection('alunos').doc(ctx.alunoId),ref=pupil.collection('metas').doc(metaId);
    try{
      await ctx.db.runTransaction(async transaction=>{
        const [student,previous]=await Promise.all([transaction.get(pupil),transaction.get(ref)]);
        if(!valido(token,ctx))throw new Error('O aluno ou a sessão mudou. Reabra o cadastro.');
        if(!student.exists||student.data().professorUid!==ctx.uid)throw new Error('O aluno não está mais vinculado à sua conta.');
        const old=previous.exists?previous.data():null;
        if((old?.revision||0)!==expected||(!editing&&previous.exists))throw new Error('Esta meta mudou em outra aba. Seu preenchimento foi mantido; copie-o antes de atualizar as metas.');
        const now=new Date().toISOString();
        transaction.set(ref,{...values,alunoId:ctx.alunoId,schemaVersion:1,revision:expected+1,createdAt:old?.createdAt||now,updatedAt:now,criadoPor:old?.criadoPor||ctx.uid,atualizadoPor:ctx.uid});
      });
      if(!valido(token,ctx))return;
      limparFormulario();$('metasEditor').open=false;bloquear(false);await carregar();
      if(valido(token,ctx))mensagem(vinculavel(values)?'Meta salva. Para relacioná-la a um atendimento, marque-a antes de salvar o relato.':'Meta salva como '+STATUS[values.status]+'. Os relatos anteriores continuam disponíveis no filtro Todas as metas.');
    }catch(error){if(valido(token,ctx))mensagem(error.code==='permission-denied'?'Sem permissão para salvar metas. Seu preenchimento foi mantido; confira as regras do Firebase.':error.message||'Não foi possível salvar a meta.',true);}
    finally{if(valido(token,ctx))bloquear(false);}
  }
  function ativar(ctx){
    window.AcompanhamentoPeriodo?.limpar();
    generation++;config=ctx;metas=[];registros=[];registrosStatus='carregando';selected=new Set();editing=null;revision=0;busy=false;loading=false;dirty=false;falhaCarregamento=false;metasConfirmadas=false;
    montar();if(ctx?.alunoId)carregar();
  }
  function atualizarRegistros(items,status){registros=items||[];registrosStatus=status;renderLista();}
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  window.MetasAluno={ativar,atualizarRegistros,
    podeSair:()=>!dirty||window.confirm('Há uma meta com alterações não salvas. Deseja sair sem salvar a meta?'),
    selecionadas:()=>[...selected].filter(id=>metas.some(meta=>meta.id===id&&vinculavel(meta))),
    vinculosSelecionados:()=>metas.filter(meta=>selected.has(meta.id)&&vinculavel(meta)).map(meta=>({id:meta.id,objetivo:meta.objetivo,revision:meta.revision||0})),
    limparSelecao:()=>{selected.clear();renderVinculos();},
    rotulo:id=>metas.find(meta=>meta.id===id)?.objetivo||'Meta vinculada'};
})();
