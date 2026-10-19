(() => {
  'use strict';
  const el=id=>document.getElementById(id),model=window.QuestionarioFamiliaModelo,db=firebase.firestore();
  const token=location.hash.slice(1);let convite=null,busy=false;
  window.addEventListener('hashchange',()=>location.reload());
  const status=text=>{el('familiaStatus').textContent=text;};
  function thanks(){el('familiaForm').hidden=true;el('familiaForm').reset();status('Respostas enviadas. Obrigado pela participação! O professor poderá consultá-las. Para corrigir ou acrescentar algo, entre em contato com ele.');}
  async function load(){
    if(!/^[A-Za-z0-9_-]{43}$/.test(token)){status('Link inválido. Peça ao professor um novo endereço.');return;}
    try{
      const snapshot=await db.collection('convitesFamilia').doc(token).get();
      if(!snapshot.exists)throw Error('indisponivel');convite=snapshot.data();
      if(!convite.ativa || convite.versao!==model.versao || convite.expiraEm.toMillis()<=Date.now())throw Error('indisponivel');
      const ack=await db.collection('enviosFamilia').doc(token).get();
      if(ack.exists){thanks();return;}
      el('familiaAluno').textContent='Referente a: '+convite.apelido;
      model.grupos.forEach(group=>{
        const section=document.createElement('section'),heading=document.createElement('h2');heading.textContent=group.titulo;section.appendChild(heading);
        group.perguntas.forEach(([id,text])=>{const label=document.createElement('label');label.appendChild(document.createTextNode(text));const select=document.createElement('select');select.id='f_'+id;select.required=true;const empty=document.createElement('option');empty.value='';empty.textContent='Selecione uma opção';select.appendChild(empty);Object.entries(model.opcoes).forEach(([value,name])=>{const option=document.createElement('option');option.value=value;option.textContent=name;select.appendChild(option);});label.appendChild(select);section.appendChild(label);});el('familiaPerguntas').appendChild(section);
      });
      el('familiaForm').hidden=false;status('Responda com tranquilidade. O link é individual; compartilhe somente com o responsável indicado pelo professor.');
    }catch(_){status('Não foi possível abrir este questionário. O link pode estar vencido, desativado ou sem conexão. Confira a internet ou peça ao professor um novo link.');}
  }
  el('familiaForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!convite)return;
    const nome=el('familiaResponsavel').value.trim(),vinculo=el('familiaVinculo').value.trim();
    if(!nome||!vinculo||!el('familiaCiencia').checked){status('Preencha seu nome, vínculo e a confirmação antes de enviar.');return;}
    const respostas={};for(const group of model.grupos)for(const [id] of group.perguntas){const answer=el('f_'+id).value;if(!Object.hasOwn(model.opcoes,answer)){status('Escolha uma resposta para cada pergunta. Você pode selecionar Não sei informar ou Prefiro não responder.');return;}respostas[id]=answer;}
    busy=true;el('familiaEnviar').disabled=true;status('Enviando respostas…');
    try{
      const now=firebase.firestore.FieldValue.serverTimestamp(),batch=db.batch();
      batch.set(db.collection('respostasFamilia').doc(token),{professorUid:convite.professorUid,alunoId:convite.alunoId,versao:model.versao,responsavel:nome,vinculo,respostas,observacoes:el('familiaObservacoes').value.trim(),ciencia:true,enviadoEm:now});
      batch.set(db.collection('enviosFamilia').doc(token),{enviadoEm:now});await batch.commit();thanks();
    }catch(_){
      try{const ack=await db.collection('enviosFamilia').doc(token).get();if(ack.exists){thanks();return;}}catch(_){}
      status('Não foi possível confirmar o envio. Suas escolhas foram mantidas nesta tela. Confira a conexão e tente novamente. Se o professor desativou o link, peça outro endereço.');
    }finally{busy=false;el('familiaEnviar').disabled=false;}
  });
  load();
})();
