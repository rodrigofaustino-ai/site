/* Roteiro opcional e proteção do rascunho. Nenhum envio automático ou IA. */
(() => {
  'use strict';
  let ctx=null,key=null,generation=0,busy=false,lastUid=null,responsavel='',tentativa=null,disabled=new Map(),inicializado=false;
  let resetRoteiro=()=>{},invalidarRoteiro=()=>{};
  const campos=[['atividades','Atividades realizadas'],['apoios','Estratégias e apoios utilizados'],['respostas','Respostas observadas'],['encaminhamentos','Próximos encaminhamentos']];
  const $=id=>document.getElementById(id),n=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
  const hoje=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  function dataValida(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.getUTCFullYear()>0&&d.toISOString().slice(0,10)===s;}
  function mensagem(text,error=false){const root=$('registroStatus');if(root){root.textContent=text;root.classList.toggle('metas-error',error);}}
  function limparIA(){window.invalidarIARegistro?.();if($('aiSuggestionBox'))$('aiSuggestionBox').classList.remove('show');if($('aiSuggestionText'))$('aiSuggestionText').textContent='';}
  function textoMudou(){if($('charCount'))$('charCount').textContent=$('entryText').value.length+' caracteres';$('entryText')?.dispatchEvent(new Event('input',{bubbles:true}));}
  function iniciar(){
    if(inicializado||!$('registroAssistido'))return;inicializado=true;
    const root=$('registroAssistido'),details=n('details'),title=n('summary','Roteiro opcional para organizar o relato');details.append(title);root.append(details);
    details.append(n('p','Preencha somente o que foi observado. Confira a prévia antes de acrescentá-la ao relato. Você também pode continuar escrevendo diretamente no campo de relato.'));
    const form=n('div');form.className='registro-roteiro-campos';details.append(form);
    for(const [id,label]of campos){const l=n('label',label),input=n('textarea');input.id='roteiro-'+id;input.rows=3;l.append(input);form.append(l);}
    const actions=n('div');actions.className='registro-acoes';const previewButton=n('button','Conferir prévia do roteiro'),append=n('button','Acrescentar ao relato');previewButton.type=append.type='button';previewButton.className=append.className='central-btn';append.disabled=true;actions.append(previewButton,append);details.append(actions);
    const preview=n('p');preview.id='roteiroPrevia';preview.hidden=true;details.append(preview);
    let prepared='';const invalidar=()=>{prepared='';append.disabled=true;preview.hidden=true;preview.textContent='';};form.addEventListener('input',invalidar);
    invalidarRoteiro=invalidar;
    resetRoteiro=()=>{for(const [id]of campos)$('roteiro-'+id).value='';invalidar();};
    const clear=n('button','Limpar roteiro');clear.type='button';clear.className='central-btn';clear.addEventListener('click',()=>{if(!busy){resetRoteiro();mensagem('Roteiro limpo. O relato principal foi mantido.');}});actions.append(clear);
    previewButton.addEventListener('click',()=>{
      if(busy)return;prepared=campos.map(([id,label])=>{const text=$('roteiro-'+id).value.trim();return text?label+':\n'+text:'';}).filter(Boolean).join('\n\n');
      if(!prepared){mensagem('Preencha pelo menos uma parte do roteiro para conferir a prévia.');return;}
      preview.textContent=prepared;preview.hidden=false;append.disabled=false;mensagem('Prévia pronta. O texto ainda não foi acrescentado nem salvo.');
    });
    append.addEventListener('click',()=>{if(!prepared||busy)return;const input=$('entryText');
      if(input.value.includes(prepared)){mensagem('Esse roteiro já está no relato. Confira o texto antes de acrescentar novamente.');return;}
      input.value=(input.value.trimEnd()?input.value.trimEnd()+'\n\n':'')+prepared;
      for(const [id]of campos)$('roteiro-'+id).value='';invalidar();textoMudou();mensagem('Roteiro acrescentado. Confira o relato completo e clique em Salvar registro.');input.focus();
    });
    $('registradoPor').addEventListener('input',()=>{if(ctx?.uid)responsavel=$('registradoPor').value;});
    window.addEventListener('beforeunload',event=>{if(rascunho()){event.preventDefault();event.returnValue='';}});
  }
  function rascunho(){return !!($('entryText')?.value.trim()||campos.some(([id])=>$('roteiro-'+id)?.value.trim())||$('humorVal')?.value||window.MetasAluno?.selecionadas().length);}
  function bloquear(value){
    busy=value;
    if(value){disabled=new Map();for(const el of document.querySelectorAll('#entryDate,#entryText,#registradoPor,#btnHoje,#btnMelhorarIA,#btnAceitarIA,#btnDescartarIA,#btnSalvarRegistro,#registroAssistido textarea,#registroAssistido button')){disabled.set(el,el.disabled);el.disabled=true;}
      document.querySelectorAll('.humor-opt').forEach(el=>el.setAttribute('aria-disabled','true'));
    }else{for(const [el,previous]of disabled)if(el.isConnected)el.disabled=previous;disabled.clear();document.querySelectorAll('.humor-opt').forEach(el=>el.removeAttribute('aria-disabled'));if($('btnMelhorarIA'))$('btnMelhorarIA').disabled=!!window.iaRegistroEmCurso?.();}
    window.MetasAluno?.atualizarVinculos?.();
  }
  function ativar(options){
    iniciar();const previous=ctx;ctx=options;const next=options?JSON.stringify([options.uid,options.alunoId]):null;if(key===next)return;
    const promover=previous?.uid&&previous.uid===options?.uid&&!previous.alunoId&&options.alunoId;
    generation++;key=next;bloquear(false);tentativa=null;limparIA();
    if(options?.uid&&options.uid!==lastUid){responsavel='';lastUid=options.uid;}
    if(!promover){resetRoteiro();if($('entryText')){$('entryText').value='';$('charCount').textContent='0 caracteres';}$('humorVal').value='';document.querySelectorAll('.humor-opt').forEach(el=>el.classList.remove('sel'));}
    else invalidarRoteiro();
    $('registroAssistido')?.querySelectorAll('details').forEach(d=>d.open=false);
    if($('roteiroPrevia')){$('roteiroPrevia').hidden=true;$('roteiroPrevia').textContent='';}
    if($('registradoPor'))$('registradoPor').value=responsavel;
    mensagem(options?.alunoId?'Preencha o relato e salve para registrar o atendimento.':'Salve o cadastro do aluno antes de registrar o atendimento.');
  }
  function assinatura(d){return JSON.stringify({date:d.date,text:d.text,humor:d.humor||'',por:d.por||'',createdAt:d.createdAt,
    metaIds:Array.isArray(d.metaIds)?d.metaIds:[],metaVinculos:Array.isArray(d.metaVinculos)?d.metaVinculos.map(m=>({id:m.id,objetivo:m.objetivo,revision:m.revision||0})):[]});}
  function preparar(payload){
    const base={...payload,createdAt:''},fingerprint=assinatura(base);
    if(!tentativa||tentativa.fingerprint!==fingerprint)tentativa={id:crypto.randomUUID(),payload:{...payload,createdAt:new Date().toISOString()},fingerprint};
    return {id:tentativa.id,payload:JSON.parse(JSON.stringify(tentativa.payload)),generation};
  }
  async function salvarBanco({db,alunoId,uid,ticket,vigente}){
    const parent=db.collection('alunos').doc(alunoId),ref=parent.collection('registros').doc(ticket.id),date=ticket.payload.date;
    await db.runTransaction(async tx=>{
      const [student,previous]=await Promise.all([tx.get(parent),tx.get(ref)]);
      if(!vigente())throw new Error('O aluno ou a conta mudou. Reabra a ficha antes de salvar.');
      if(!student.exists||student.data().professorUid!==uid)throw new Error('O cadastro não pertence à conta atual.');
      if(previous.exists){if(assinatura(previous.data())!==assinatura(ticket.payload))throw new Error('O registro desta tentativa mudou. Confira o histórico antes de salvar novamente.');}
      else tx.set(ref,ticket.payload);
      const last=student.data().ultimoRegistro;
      if(!dataValida(last)||last<date)tx.update(parent,{ultimoRegistro:date});
    });
  }
  function valido(ticket){return ticket.generation===generation&&ctx?.vigente()&&firebase.auth().currentUser?.uid===ctx.uid;}
  function confirmado(){tentativa=null;responsavel=$('registradoPor').value;mensagem('Registro salvo. O relato está disponível no histórico abaixo.');}
  function podeSair(){if(busy){mensagem('Aguarde a confirmação do salvamento antes de sair.');return false;}return !rascunho()||confirm('Há um atendimento ainda não salvo. Deseja sair e descartar esse preenchimento?');}
  window.RegistroAssistido={iniciar,ativar,hoje,dataValida,preparar,salvarBanco,assinatura,valido,bloquear,mensagem,confirmado,limparIA,podeSair,salvando:()=>busy,roteiroPendente:()=>campos.some(([id])=>$('roteiro-'+id)?.value.trim()),
    limparSessao(){generation++;ctx=null;key=null;lastUid=null;responsavel='';tentativa=null;bloquear(false);window.MetasAluno?.limparSelecao();limparIA();resetRoteiro();if($('entryText')){$('entryText').value='';$('charCount').textContent='0 caracteres';}if($('registradoPor'))$('registradoPor').value='';if($('humorVal'))$('humorVal').value='';document.querySelectorAll('.humor-opt').forEach(el=>el.classList.remove('sel'));mensagem('');}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
