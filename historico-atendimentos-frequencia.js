/* Totais de marcações salvas, sem projeção da grade e sem gravações. */
(()=>{'use strict';
const dias=new Set(['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']);
function apurar(alunoId,semanas){
 if(typeof alunoId!=='string'||!alunoId||!Array.isArray(semanas))throw Error('Frequência inválida.');
 const totals={previstos:0,faltas:0,presentes:0,justificados:0,semanais:0,semDia:0,antigasNaoSomadas:0,ignoradas:0};
 const add=(v,tipo)=>{if(!['presente','falta','justificado'].includes(v)){if(v!=null&&v!=='sem_atend')totals.ignoradas++;return;}
 totals.previstos++;if(v==='falta')totals.faltas++;else if(v==='presente')totals.presentes++;else totals.justificados++;if(tipo==='semanal')totals.semanais++;if(tipo==='sem_dia')totals.semDia++;};
 for(const semana of semanas){const status=semana.status||{},prefix=alunoId+'__';const diarios=Object.keys(status).filter(k=>k.startsWith(prefix)&&k.length>prefix.length);
  if(diarios.length){for(const k of diarios)add(status[k],dias.has(k.slice(prefix.length))?'dia':'sem_dia');if(['presente','falta','justificado'].includes(status[alunoId]))totals.antigasNaoSomadas++;}
  else if(Object.hasOwn(status,alunoId))add(status[alunoId],'semanal');
 }
 return totals;
}
async function carregar({db,uid,alunoId,vigente}){
 if(!uid||!alunoId||!vigente())throw Error('Sessão alterada.');
 const aluno=await db.collection('alunos').doc(alunoId).get({source:'server'});
 if(!vigente()||!aluno.exists||aluno.metadata?.fromCache||aluno.data().professorUid!==uid)throw Error('Aluno sem acesso confirmado.');
 return apurar(alunoId,await carregarSemanas({db,uid,vigente}));
}
async function carregarSemanas({db,uid,vigente}){
 if(!uid||!vigente())throw Error('Sessão alterada.');
 const snap=await db.collection('frequenciaSemanas').where('professorUid','==',uid).get({source:'server'});
 if(!vigente()||snap.metadata?.fromCache)throw Error('Frequência sem confirmação do servidor.');
 const semanas=snap.docs.map(d=>d.data());if(semanas.some(s=>s.professorUid!==uid))throw Error('Frequência de outra conta.');
 return semanas;
}

function descricao(t){let text='Base: todo o histórico de frequência, em todos os turnos. Previstos = presenças (P) + faltas (F) + justificadas (J). Sem atendimento pedagógico e campos vazios ficam fora dos totais.';
 if(t.semanais)text+=' Inclui '+t.semanais+(t.semanais===1?' marcação semanal antiga, contada uma vez':' marcações semanais antigas, contadas uma vez cada')+', sem estimar dias.';
 if(t.semDia)text+=' Inclui '+t.semDia+(t.semDia===1?' marcação sem dia definido, contada uma vez.':' marcações sem dia definido, contadas uma vez cada.');
 if(t.antigasNaoSomadas)text+=' Em '+t.antigasNaoSomadas+(t.antigasNaoSomadas===1?' semana':' semanas')+' com marcações diárias, a marcação semanal antiga não foi somada novamente.';
 if(t.ignoradas)text+=' '+t.ignoradas+(t.ignoradas===1?' situação não reconhecida ficou':' situações não reconhecidas ficaram')+' fora dos totais.';
 return text;
}

window.HistoricoAtendimentosFrequencia=Object.freeze({apurar,carregar,carregarSemanas,descricao});
})();
