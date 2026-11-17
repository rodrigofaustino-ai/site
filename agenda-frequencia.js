/* Atalhos da agenda: mesma chave aluno/dia usada pela aba Frequência. */
(() => {
  'use strict';
  const dias=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  function corresponde(s,data){
    if(!FrequenciaInterface.dataValida(s.dataInicio))return false;
    const fim=new Date(s.dataInicio+'T12:00:00Z');fim.setUTCDate(fim.getUTCDate()+6);
    const limite=fim.toISOString().slice(0,10);
    const ate=FrequenciaInterface.dataValida(s.dataFim)?s.dataFim:limite;
    return ate>=s.dataInicio&&ate<=limite&&data>=s.dataInicio&&data<=ate;
  }
  const turnoValido=(s,c)=>!s.turno||s.turno===c.turno;
  async function carregar(c,data){
    if(!c.vigente()||!FrequenciaInterface.dataValida(data))throw new Error('Reabra a agenda para carregar a frequência.');
    const snap=await c.db.collection('frequenciaSemanas').where('professorUid','==',c.uid).get({source:'server'});
    if(!c.vigente())throw new Error('A conta ou o turno mudou. Reabra a agenda.');
    const semanas=[];snap.forEach(d=>{const s={...d.data(),id:d.id};if(s.professorUid===c.uid&&turnoValido(s,c)&&corresponde(s,data))semanas.push(s);});
    if(!semanas.length)throw new Error('Não há semana cadastrada para esta data. Adicione ou confira a data da semana na aba Frequência.');
    if(semanas.length!==1)throw new Error('Há semanas sobrepostas para esta data. Confira as datas na aba Frequência antes de marcar.');
    return {semana:semanas[0],data,dia:dias[new Date(data+'T12:00:00Z').getUTCDay()]};
  }
  async function salvar(c,sessao,ids,status,horario){
    ids=[...new Set(ids)];
    if(!Object.hasOwn(FrequenciaInterface.labels,status)||!ids.length||ids.length>100||!c.vigente())throw new Error('Reabra a agenda antes de marcar.');
    const ref=c.db.collection('frequenciaSemanas').doc(sessao.semana.id);
    await c.db.runTransaction(async tx=>{
      const registros=ids.map(id=>c.db.collection('alunos').doc(id).collection('registros').doc(RegistroAusencia.id(sessao.data)));
      const anterior=await tx.get(ref),alunos=await Promise.all(ids.map(id=>tx.get(c.db.collection('alunos').doc(id)))),historicos=await Promise.all(registros.map(r=>tx.get(r)));
      if(!c.vigente())throw new Error('A conta ou o turno mudou. Reabra a agenda.');
      if(!anterior.exists)throw new Error('A semana foi removida. Reabra a agenda.');
      const semana=anterior.data();
      if(semana.professorUid!==c.uid||!turnoValido(semana,c)||!corresponde(semana,sessao.data)||semana.dataInicio!==sessao.semana.dataInicio||semana.dataFim!==sessao.semana.dataFim)throw new Error('A semana mudou. Reabra a agenda antes de marcar.');
      const novos={...(semana.status||{})};
      for(let i=0;i<ids.length;i++){
        const a=alunos[i].data();
        if(!alunos[i].exists||a.professorUid!==c.uid||a.arquivado===true||!turnoValido(a,c)||!c.obter(a).some(at=>at.dia===sessao.dia&&at.horario===horario))throw new Error('O cadastro de um aluno mudou. Reabra a lista de alunos.');
        const atual=FrequenciaInterface.estado(semana,ids[i],sessao.dia),previsto=FrequenciaInterface.estado(sessao.semana,ids[i],sessao.dia);
        if(atual.value!==previsto.value||atual.fonte!==previsto.fonte){if(atual.value!==status)throw new Error('Uma marcação mudou em outra aba. Confira e clique novamente.');}
        const historico=historicos[i],existente=historico.exists?historico.data():null;
        if(existente&&(existente.date!==sessao.data||!RegistroAusencia.automatico(existente)))throw Error('Há um relato de ausência com conteúdo próprio nesta data. Confira a ficha do aluno antes de alterar pela agenda.');
        if(RegistroAusencia.tipo(status)){
          if(!existente||existente.tipoRegistro!==status)tx.set(registros[i],{date:sessao.data,text:RegistroAusencia.texto(status),tipoRegistro:status,origem:'registro_ausencia',por:c.authNome||'',humor:'',createdAt:existente?.createdAt||new Date().toISOString()});
          if(!FrequenciaInterface.dataValida(a.ultimoRegistro)||a.ultimoRegistro<sessao.data)tx.update(c.db.collection('alunos').doc(ids[i]),{ultimoRegistro:sessao.data});
        }else if(existente)tx.delete(registros[i]);
        novos[ids[i]+'__'+sessao.dia]=status;
      }
      tx.update(ref,{status:novos});
    });
    for(const id of ids){sessao.semana.status||={};sessao.semana.status[id+'__'+sessao.dia]=status;}
  }
  window.AgendaFrequencia={carregar,salvar,corresponde};
})();
