/* Período anual do histórico e faltas informadas pelo professor. Não lê a Frequência. */
(()=>{'use strict';
function dataValida(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
function hoje(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=t=>p.find(x=>x.type===t).value;return v('year')+'-'+v('month')+'-'+v('day');}
function faltasManuais(v){if(v==null||v==='')return null;if(typeof v!=='number'&&typeof v!=='string')throw Error('Informe as faltas como número inteiro igual ou maior que zero.');const s=String(v).trim();if(!s)return null;if(!/^\d+$/.test(s)||!Number.isSafeInteger(Number(s)))throw Error('Informe as faltas como número inteiro igual ou maior que zero.');return Number(s);}
function faltasDoAluno(aluno,data=hoje()){return Number(aluno.pdfFaltasAno)===Number(data.slice(0,4))?faltasManuais(aluno.pdfFaltas):null;}
function preparar(registros,data=hoje()){
 if(!Array.isArray(registros)||!dataValida(data))throw Error('Período do histórico inválido.');
 const inicio=data.slice(0,4)+'-01-01',itens=registros.filter(e=>dataValida(e.date)&&e.date>=inicio&&e.date<=data).slice().sort((a,b)=>b.date.localeCompare(a.date));
 const fim=itens.length?itens[0].date:null,format=s=>s.split('-').reverse().join('/');
 const descricao='Período: '+format(inicio)+(fim?' a '+format(fim):' — nenhum atendimento registrado até '+format(data))+'. Atendimentos previstos: mesma quantidade de registros deste histórico. Faltas: preenchimento manual pelo professor.';
 return {registros:itens,previstos:itens.length,inicio,fim,ano:Number(data.slice(0,4)),descricao};
}
async function carregar({db,uid,alunoId,vigente}){
 if(!uid||!alunoId||!vigente())throw Error('Sessão alterada.');
 const parent=db.collection('alunos').doc(alunoId),aluno=await parent.get({source:'server'});
 if(!vigente()||!aluno.exists||aluno.metadata?.fromCache||aluno.data().professorUid!==uid)throw Error('Aluno sem acesso confirmado.');
 const snap=await parent.collection('registros').get({source:'server'});
 if(!vigente()||snap.metadata?.fromCache)throw Error('Histórico sem confirmação do servidor.');
 return snap.docs.map(d=>({...d.data(),id:d.id}));
}
window.HistoricoAtendimentosFrequencia=Object.freeze({preparar,hoje,faltasManuais,faltasDoAluno,carregar});
})();
