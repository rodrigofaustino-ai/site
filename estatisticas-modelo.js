/* Consolidação local. Contagens não representam avaliação de aprendizagem. */
(() => {
 'use strict';
 const valido = s => window.FrequenciaInterface.dataValida(s);
 const status = ['ativa','em_revisao','concluida','arquivada'];
 const zero = () => ({presente:0,falta:0,justificado:0,sem_atend:0,vazio:0,desconhecido:0});
 function consolidar(dados, filtro, hoje) {
  if (!valido(filtro.de)||!valido(filtro.ate)||filtro.de>filtro.ate) throw new Error('Informe um período válido, com início anterior ou igual ao fim.');
  const distancia=(Number(filtro.ate.slice(0,4))-Number(filtro.de.slice(0,4)))*12+Number(filtro.ate.slice(5,7))-Number(filtro.de.slice(5,7));
  if(distancia>=120)throw new Error('Selecione um intervalo de até 120 meses para exibir os gráficos.');
  const alunos=dados.alunos.filter(a=>(!filtro.turno||!a.turno||a.turno===filtro.turno)&&(!filtro.situacao||filtro.situacao==='todos'||(filtro.situacao==='arquivados'?a.arquivado===true:a.arquivado!==true)));
  const r={alunos:alunos.length,semTurno:alunos.filter(a=>!a.turno).length,atendimentos:0,alunosComRegistro:0,semRegistro:0,registrosSemData:0,semanasSemData:0,meses:{},metas:Object.fromEntries([...status,'desconhecida'].map(k=>[k,0])),revisoes:0,metasSemRevisao:0,diarios:zero(),antigos:zero(),semDia:zero(),semanas:0};
  let mes=filtro.de.slice(0,7);const fim=filtro.ate.slice(0,7);
  while(mes<=fim){r.meses[mes]=0;let [y,m]=mes.split('-').map(Number);m++;if(m===13){m=1;y++;}mes=String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0');}
  for(const a of alunos){let presentes=0;
   for(const reg of dados.registros[a.id]||[]){if(!valido(reg.date)){r.registrosSemData++;continue;}if(reg.date>=filtro.de&&reg.date<=filtro.ate){r.atendimentos++;presentes++;r.meses[reg.date.slice(0,7)]++;}}
   if(presentes)r.alunosComRegistro++;
   for(const meta of dados.metas[a.id]||[]){r.metas[status.includes(meta.status)?meta.status:'desconhecida']++;if(['ativa','em_revisao'].includes(meta.status)){if(!valido(meta.revisao))r.metasSemRevisao++;else if(meta.revisao<hoje)r.revisoes++;}}
  }
  r.semRegistro=r.alunos-r.alunosComRegistro;
  const semanas=dados.semanas.filter(s=>!filtro.turno||!s.turno||s.turno===filtro.turno);
  r.semanasSemData=semanas.filter(s=>!valido(s.dataInicio)).length;
  const selecionadas=semanas.filter(s=>valido(s.dataInicio)&&s.dataInicio>=filtro.de&&s.dataInicio<=filtro.ate);r.semanas=selecionadas.length;
  for(const aluno of alunos){
   // Mesmo em Todos os turnos, não associar semana explicitamente de outro turno.
   const compativeis=selecionadas.filter(s=>!aluno.turno||!s.turno||s.turno===aluno.turno);
   const soma=FrequenciaInterface.apurar(aluno,compativeis);
   for(const tipo of ['diarios','antigos','semDia'])for(const key of Object.keys(r[tipo]))r[tipo][key]+=soma[tipo][key];
  }
  return r;
 }
 window.EstatisticasModelo=Object.freeze({consolidar});
})();
