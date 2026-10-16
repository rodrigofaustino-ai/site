/* Registro pedagógico opcional. Os dados individuais não são compartilhados no chat. */
(() => {
  'use strict';
  const field = document.createElement('section'); field.id='registroMetas';field.className='registro-metas';
  field.innerHTML='<details><summary>🎯 Metas do PAEE/PEI e registro rápido</summary><p>Copie do PAEE ou PEI os objetivos que pretende acompanhar. Recursos de acessibilidade e comunicação são apoios à participação, não sinais de menor aprendizagem.</p><div id="metasLista"></div><p id="metasStatus" role="status"></p><details><summary>Cadastrar uma meta do aluno</summary><label>Documento de origem<select id="metaFonte"><option>PAEE</option><option>PEI</option></select></label><label>Objetivo / meta<textarea id="metaDescricao" maxlength="1000" placeholder="Descreva uma ação observável do estudante"></textarea></label><label>Critério de acompanhamento<input id="metaCriterio" maxlength="500" placeholder="Em que situação e por quais evidências acompanhar?"></label><label>Referência no documento<input id="metaReferencia" maxlength="200" placeholder="Ex.: PEI 2026, comunicação, meta 2"></label><button type="button" id="metaCadastrar" class="add-btn">Cadastrar meta</button></details><hr><label>Atividade proposta<textarea id="rapidoAtividade" maxlength="2000"></textarea></label><label>Recursos de acessibilidade, estratégias e mediações utilizados<textarea id="rapidoApoios" maxlength="2000"></textarea></label><label>Participação e evidências observadas<textarea id="rapidoObservacao" maxlength="4000" placeholder="Registre o que aconteceu e em quais condições, sem comparar com outros estudantes"></textarea></label><label>Próximo passo<textarea id="rapidoProximo" maxlength="2000"></textarea></label><p>Selecione as metas trabalhadas acima. Os campos são opcionais e serão salvos junto com o relato, usando o botão Salvar registro do atendimento.</p><div id="metasPercurso"></div></details>';
  document.getElementById('entryText').closest('.field').before(field);
  const el=id=>document.getElementById(id),auth=firebase.auth(),db=firebase.firestore();
  let student=null,user=null,unsub=null,generation=0,goals=[],entries=[],saving=false;
  function status(text){el('metasStatus').textContent=text;}
  function resetQuick(){['rapidoAtividade','rapidoApoios','rapidoObservacao','rapidoProximo'].forEach(id=>el(id).value='');el('metasLista').querySelectorAll('input').forEach(input=>input.checked=false);}
  function reset(){generation++;if(unsub)unsub();unsub=null;student=null;goals=[];entries=[];saving=false;el('metaCadastrar').disabled=false;el('metasLista').replaceChildren();el('metasPercurso').replaceChildren();['metaDescricao','metaCriterio','metaReferencia'].forEach(id=>el(id).value='');resetQuick();status('');}
  function node(parent,tag,text){const item=document.createElement(tag);item.textContent=text;parent.appendChild(item);return item;}
  function renderProgress(){
    const target=el('metasPercurso');target.replaceChildren();
    const linked=entries.filter(entry=>entry.registroRapido && Array.isArray(entry.registroRapido.metas));if(!linked.length)return;
    node(target,'h4','Percurso registrado');
    const summaries=new Map();linked.forEach(entry=>entry.registroRapido.metas.forEach(goal=>{const summary=summaries.get(goal.id)||{descricao:goal.descricao,count:0,ultima:''};summary.count++;if(entry.date>summary.ultima)summary.ultima=entry.date;summaries.set(goal.id,summary);}));
    summaries.forEach(summary=>node(target,'p',summary.descricao+' — '+summary.count+' atendimento(s) registrado(s); último: '+summary.ultima.split('-').reverse().join('/')));
    node(target,'small','A frequência de trabalho não mede domínio da habilidade. Consulte as evidências descritas em cada atendimento.');
  }
  function render(){
    const selected=new Set([...el('metasLista').querySelectorAll('input:checked')].map(input=>input.value));el('metasLista').replaceChildren();
    if(!goals.length)node(el('metasLista'),'p','Ainda não há metas ativas. Cadastre uma meta do PAEE ou PEI deste aluno.');
    goals.forEach(goal=>{const row=document.createElement('div');row.className='meta-item';const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=goal.id;checkbox.checked=selected.has(goal.id);label.append(checkbox,document.createTextNode(' '+goal.fonte+' — '+goal.descricao));row.appendChild(label);if(goal.criterio)node(row,'p','Critério: '+goal.criterio);if(goal.referencia)node(row,'small',goal.referencia);const archive=node(row,'button','Arquivar meta');archive.type='button';archive.className='back-btn';archive.addEventListener('click',async()=>{if(!confirm('Arquivar esta meta? Os registros já feitos serão preservados.'))return;archive.disabled=true;try{await db.collection('metasAtendimento').doc(goal.id).update({ativa:false,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}catch(_){status('Não foi possível arquivar a meta.');archive.disabled=false;}});el('metasLista').appendChild(row);});
    renderProgress();
  }
  function open(id){
    reset();student=id;if(!id||!user){status('Salve o aluno e entre no Diário para cadastrar metas.');return;}
    const version=generation;status('Carregando metas…');
    unsub=db.collection('metasAtendimento').where('professorUid','==',user.uid).where('alunoId','==',id).onSnapshot(snapshot=>{if(version!==generation)return;goals=snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).filter(goal=>goal.ativa);goals.sort((a,b)=>a.descricao.localeCompare(b.descricao,'pt-BR'));status('');render();},()=>{if(version===generation)status('Não foi possível carregar metas. Confira as permissões no Firestore. O relato tradicional continua disponível.');});
  }
  el('metaCadastrar').addEventListener('click',async()=>{
    if(saving)return;if(!student||!user){status('Salve as informações do aluno antes de cadastrar metas.');return;}
    const descricao=el('metaDescricao').value.trim();if(!descricao){status('Preencha o objetivo/meta.');return;}
    const version=generation;const data={professorUid:user.uid,alunoId:student,fonte:el('metaFonte').value,descricao,criterio:el('metaCriterio').value.trim(),referencia:el('metaReferencia').value.trim(),ativa:true,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    saving=true;el('metaCadastrar').disabled=true;
    try{await db.collection('metasAtendimento').add(data);if(version===generation){['metaDescricao','metaCriterio','metaReferencia'].forEach(id=>el(id).value='');status('Meta cadastrada.');}}catch(_){if(version===generation)status('Não foi possível cadastrar. Confira as regras do Firestore.');}finally{if(version===generation){saving=false;el('metaCadastrar').disabled=false;}}
  });
  function collect(){
    const selected=new Set([...el('metasLista').querySelectorAll('input:checked')].map(input=>input.value));
    return {versao:1,metas:goals.filter(goal=>selected.has(goal.id)).map(({id,fonte,descricao,criterio,referencia})=>({id,fonte,descricao,criterio,referencia})),atividade:el('rapidoAtividade').value.trim(),apoios:el('rapidoApoios').value.trim(),observacao:el('rapidoObservacao').value.trim(),proximoPasso:el('rapidoProximo').value.trim()};
  }
  function text(data){
    const lines=[];data.metas.forEach(goal=>lines.push('Meta ('+goal.fonte+'): '+goal.descricao+(goal.criterio?'\nCritério de acompanhamento: '+goal.criterio:'')+(goal.referencia?'\nReferência: '+goal.referencia:'')));
    [['Atividade proposta',data.atividade],['Recursos, estratégias e mediações',data.apoios],['Participação e evidências observadas',data.observacao],['Próximo passo',data.proximoPasso]].forEach(([label,value])=>{if(value)lines.push(label+': '+value);});
    return lines.join('\n\n');
  }
  auth.onAuthStateChanged(next=>{reset();user=next;});
  window.RegistroMetas={abrir:open,limpar:resetQuick,coletar:collect,texto:text,historico(value){entries=value;renderProgress();},novo(){reset();status('Salve as informações do aluno antes de cadastrar metas.');}};
})();
