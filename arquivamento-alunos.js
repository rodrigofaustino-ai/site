/* Arquivamento reversível. Não exclui documentos, arquivos ou subcoleções. */
(() => {
 'use strict';
 const arquivado=a=>a?.arquivado===true;
 function filtrar(lista,modo='ativos'){
  return lista.filter(a=>modo==='todos'||(modo==='arquivados'?arquivado(a):!arquivado(a)));
 }
 async function alterar({db,uid,id,alvo,vigente}){
  if(!uid||typeof id!=='string'||!id||id.includes('/')||typeof alvo!=='boolean'||!vigente())throw Error('Contexto inválido.');
  const ref=db.collection('alunos').doc(id);
  await db.runTransaction(async tx=>{
   const doc=await tx.get(ref);
   if(!vigente())throw Error('A conta ou o turno mudou.');
   if(!doc.exists||doc.data().professorUid!==uid)throw Error('Cadastro indisponível para esta conta.');
   if(arquivado(doc.data())===alvo)return; // Repetir após perda da confirmação é seguro.
   tx.update(ref,alvo?{arquivado:true,arquivadoEm:firebase.firestore.FieldValue.serverTimestamp(),arquivadoPor:uid}:{arquivado:false,reativadoEm:firebase.firestore.FieldValue.serverTimestamp(),reativadoPor:uid});
  });
 }
 window.ArquivamentoAlunos=Object.freeze({arquivado,filtrar,alterar});
})();
