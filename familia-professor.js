(() => {
 'use strict';
 const el=id=>document.getElementById(id),auth=firebase.auth(),db=firebase.firestore(),model=window.QuestionarioFamiliaModelo;
 let user=null,active=false,epoch=0,stops=[],students=[],invites=new Map(),responses=[],channels=new Set(),modals=new Set();
 const status=text=>el('familiaProfessorStatus').textContent=text;
 const norm=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const date=value=>value&&value.toDate?value.toDate().toLocaleString('pt-BR'):'Registrando…';
 const token=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
 function link(value){const url=new URL('familia.html',location.href);url.hash=value;return url.href;}
 function add(parent,tag,text){const node=document.createElement(tag);node.textContent=text;parent.appendChild(node);return node;}
 function button(parent,text,action){const node=add(parent,'button',text);node.type='button';node.className='back-btn';node.addEventListener('click',()=>Promise.resolve().then(action).catch(()=>status('Não foi possível concluir. Confira a conexão e as regras do Firestore.')));return node;}
 function modal(title){const overlay=document.createElement('div');overlay.className='familia-modal';const box=document.createElement('section');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',title);overlay.appendChild(box);add(box,'h2',title);document.body.appendChild(overlay);modals.add(overlay);const close=()=>{overlay.remove();modals.delete(overlay);};button(box,'Fechar',close);return {box,close};}
 function requireUser(uid=user&&user.uid){if(!user||!auth.currentUser||auth.currentUser.uid!==uid)throw Error('Sessão encerrada.');return user;}
 function render(){
  const list=el('familiaAlunos');list.replaceChildren();const search=norm(el('familiaBusca').value);
  const visible=students.filter(student=>norm([student.nome,student.turma].join(' ')).includes(search));
  if(!visible.length){add(list,'p','Nenhum aluno encontrado. Cadastre os alunos no Diário para gerar os links.');return;}
  visible.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR')).forEach(student=>{
   const card=document.createElement('article');card.className='plano-item';list.appendChild(card);add(card,'h3',student.nome||'Aluno');add(card,'p',student.turma||'');
   const invitation=invites.get(student.id),answers=responses.filter(response=>response.alunoId===student.id).sort((a,b)=>(b.enviadoEm?.toMillis()||0)-(a.enviadoEm?.toMillis()||0));
   const current=invitation&&answers.find(answer=>answer.id===invitation.token),valid=invitation&&invitation.ativa&&invitation.expiraEm?.toMillis()>Date.now();
   const label=current?'Respondido':!invitation?'Não enviado':!invitation.ativa?'Link desativado':!valid?'Link vencido':'Aguardando resposta';
   add(card,'p',label).className='familia-situacao';if(current)add(card,'small','Recebido em: '+date(current.enviadoEm));if(invitation)add(card,'small','Validade do link: '+date(invitation.expiraEm));if(current&&invitation&&!invitation.ativa)add(card,'small','Link desativado; resposta preservada.');
   const actions=document.createElement('div');actions.className='planos-actions';card.appendChild(actions);
   button(actions,invitation?'Gerar novo link':'Gerar link',()=>generate(student));
   if(valid){button(actions,'Copiar link',()=>copy(invitation.token));const open=add(actions,'a','Abrir questionário');open.className='back-btn';open.href=link(invitation.token);open.target='_blank';open.rel='noopener noreferrer';open.referrerPolicy='no-referrer';button(actions,'Desativar link',()=>disable(student));}
   if(answers.length)button(actions,'Ver respostas'+(answers.length>1?' ('+answers.length+')':''),()=>showAnswers(student,answers));
  });
 }
 async function copy(value){try{await navigator.clipboard.writeText(link(value));status('Link copiado. Envie apenas ao responsável deste aluno.');}catch(_){const view=modal('Copiar link individual');const input=add(view.box,'input','');input.className='familia-link';input.readOnly=true;input.value=link(value);input.select();add(view.box,'p','Selecione o endereço e copie para enviar ao responsável.');}}
 function generate(student){
  requireUser();const current=epoch,owner=user;const view=modal('Gerar link para '+student.nome);
  add(view.box,'p','O link dará acesso somente ao questionário. Qualquer pessoa que receber o endereço poderá respondê-lo; envie individualmente à família. Um novo link desativa o anterior, preservando as respostas já recebidas.');
  const label=add(view.box,'label','Nome exibido para a família (prefira somente o primeiro nome)');const name=add(label,'input','');name.maxLength=80;name.value=(student.nome||'Aluno').trim().split(/\s+/)[0];name.className='familia-link';
  const expiryLabel=add(view.box,'label','Validade');const days=add(expiryLabel,'select','');[[7,'7 dias'],[14,'14 dias'],[30,'30 dias']].forEach(([value,text])=>{const option=add(days,'option',text);option.value=value;});days.value='30';
  const result=add(view.box,'p','');const create=button(view.box,'Criar link',async()=>{
   if(!name.value.trim()){result.textContent='Informe o nome exibido.';return;}create.disabled=true;
   try{
    requireUser(owner.uid);const secret=token(),expires=firebase.firestore.Timestamp.fromMillis(Date.now()+Number(days.value)*86400000);
    await db.runTransaction(async transaction=>{
     requireUser(owner.uid);const ref=db.collection('questionariosFamilia').doc(student.id),existing=await transaction.get(ref);let old=null;
     if(existing.exists){if(existing.data().professorUid!==owner.uid)throw Error('Sem acesso.');old=await transaction.get(db.collection('convitesFamilia').doc(existing.data().token));}
     if(old&&old.exists)transaction.update(old.ref||db.collection('convitesFamilia').doc(existing.data().token),{ativa:false});
     const now=firebase.firestore.FieldValue.serverTimestamp();
     transaction.set(db.collection('convitesFamilia').doc(secret),{professorUid:owner.uid,alunoId:student.id,apelido:name.value.trim(),versao:model.versao,ativa:true,criadoEm:now,expiraEm:expires});
     transaction.set(ref,{professorUid:owner.uid,alunoId:student.id,token:secret,ativa:true,criadoEm:now,expiraEm:expires});
    });
    if(current!==epoch)return;view.close();await copy(secret);status('Link criado. Aguardando resposta da família.');
   }catch(error){console.warn('Falha ao criar questionário familiar:',error.code||error.name);if(current===epoch)result.textContent='Não foi possível criar o link. Confira as permissões e a conexão.';}
   finally{create.disabled=false;}
  });
 }
 async function disable(student){
  const owner=requireUser();if(!confirm('Desativar o link deste aluno? As respostas já recebidas serão preservadas.'))return;
  await db.runTransaction(async transaction=>{requireUser(owner.uid);const ref=db.collection('questionariosFamilia').doc(student.id),snapshot=await transaction.get(ref);if(!snapshot.exists||snapshot.data().professorUid!==owner.uid)throw Error('Sem acesso.');transaction.update(ref,{ativa:false});transaction.update(db.collection('convitesFamilia').doc(snapshot.data().token),{ativa:false});});status('Link desativado.');
 }
 function showAnswers(student,answers){
  const owner=requireUser(),current=epoch,view=modal('Respostas da família — '+student.nome);
  const choose=add(view.box,'select','');answers.forEach((answer,index)=>{const option=add(choose,'option',date(answer.enviadoEm)+' — '+answer.responsavel);option.value=index;});
  const content=add(view.box,'div',''),selected=new Map();let response=answers[0];
  function draw(){content.replaceChildren();selected.clear();response=answers[Number(choose.value)||0];add(content,'p','Responsável: '+response.responsavel+' • Vínculo: '+response.vinculo+' • Recebido: '+date(response.enviadoEm));add(content,'p','Selecione somente as informações que deseja levar à conferência na Diagnóstica. As marcações pedagógicas não serão alteradas.');
   model.grupos.forEach(group=>{add(content,'h3',group.titulo);group.perguntas.forEach(([id,text])=>{const note=response.observacoesPerguntas?.[id]||'';const label=add(content,'label','');label.className='familia-resposta';const check=add(label,'input','');check.type='checkbox';check.addEventListener('change',()=>{if(check.checked)selected.set(id,{cat:group.key,text:text+' — '+(model.opcoes[response.respostas[id]]||model.opcoesAnteriores[response.respostas[id]]||'Não informado')+(note?'\nInformações adicionais da família: '+note:'')});else selected.delete(id);});label.appendChild(document.createTextNode(' '+text));add(label,'span',model.opcoes[response.respostas[id]]||model.opcoesAnteriores[response.respostas[id]]||'Não informado');if(note)add(label,'span','Informações adicionais da família: '+note);});});
   if(response.observacoes)add(content,'p','Observações adicionais da família (para consulta):\n'+response.observacoes);
  }
  choose.addEventListener('change',draw);draw();
  button(view.box,'Abrir Diagnóstica para conferência',()=>{
   requireUser(owner.uid);if(!selected.size){alert('Selecione pelo menos uma informação.');return;}
   if(!window.BroadcastChannel){alert('Este navegador não permite a transferência entre abas. Consulte as respostas e copie manualmente as informações desejadas.');return;}
   const nonce=token(),channel=new BroadcastChannel('srm_familia_'+nonce),observacoes={};
   selected.forEach(item=>{observacoes[item.cat]=(observacoes[item.cat]?observacoes[item.cat]+'\n':'')+item.text;});
   const source='Relato da família — '+date(response.enviadoEm)+' — '+response.responsavel+' ('+response.vinculo+').';
   const payload={nome:student.nome,dataNascimento:student.dataNasc||'',respostaId:response.id,observacoes:Object.fromEntries(Object.entries(observacoes).map(([key,value])=>[key,source+'\n'+value]))};
   channels.add(channel);channel.onmessage=event=>{if(event.data==='solicitar'&&current===epoch&&user?.uid===owner.uid)channel.postMessage(payload);};
   setTimeout(()=>{channel.close();channels.delete(channel);},600000);
   const url=new URL('diagnostica_formulario.html',location.href);url.hash='familia='+nonce;window.open(url.href,'_blank','noopener');add(view.box,'p','Na outra aba, abra ou crie a Diagnóstica deste aluno e use o painel Conferir relato familiar. Mantenha esta aba aberta até receber os dados.');
  });
 }
 function listen(){
  if(!user||!active||stops.length)return;const current=epoch;status('Carregando questionários…');
  let ready=0;
  function subscribe(query,callback){let first=true;stops.push(query.onSnapshot(snapshot=>{if(current!==epoch)return;callback(snapshot.docs.map(doc=>({...doc.data(),id:doc.id})));if(first){ready++;first=false;}render();if(ready===3&&el('familiaProfessorStatus').textContent==='Carregando questionários…')status('');},()=>{if(current===epoch)status('Não foi possível consultar os questionários. Confira as regras do Firestore.');}));}
  subscribe(db.collection('alunos').where('professorUid','==',user.uid),items=>students=items);
  subscribe(db.collection('questionariosFamilia').where('professorUid','==',user.uid),items=>invites=new Map(items.map(item=>[item.alunoId,item])));
  subscribe(db.collection('respostasFamilia').where('professorUid','==',user.uid),items=>responses=items);
 }
 el('familiaBusca').addEventListener('input',render);
 auth.onAuthStateChanged(next=>{epoch++;stops.forEach(stop=>stop());stops=[];channels.forEach(channel=>channel.close());channels.clear();modals.forEach(node=>node.remove());modals.clear();user=next;students=[];invites=new Map();responses=[];el('familiaAlunos').replaceChildren();el('familiaBusca').value='';status('');listen();});
 window.QuestionariosFamilia={activate(){active=true;if(!user){status('Entre no Diário para acessar os questionários.');return;}render();listen();}};
})();
