/* Datas de revisão são compromissos de planejamento, não avaliação de aprendizagem. */
(() => {
 'use strict';
 function resumir(metas,hoje){
  if(!FrequenciaInterface.dataValida(hoje))throw Error('Data de referência inválida.');
  const data=new Date(hoje+'T12:00:00Z');data.setUTCDate(data.getUTCDate()+7);const limite=data.toISOString().slice(0,10);
  const r={vencidas:[],hoje:[],proximas:[],semData:0,posteriores:0,situacaoDesconhecida:0,referencia:hoje,limite};
  for(const m of metas){
   if(!['ativa','em_revisao'].includes(m.status)){if(!['concluida','arquivada'].includes(m.status))r.situacaoDesconhecida++;continue;}
   if(!FrequenciaInterface.dataValida(m.revisao)){r.semData++;continue;}
   if(m.revisao<hoje)r.vencidas.push(m);else if(m.revisao===hoje)r.hoje.push(m);else if(m.revisao<=limite)r.proximas.push(m);else r.posteriores++;
  }
  for(const k of ['vencidas','hoje','proximas'])r[k].sort((a,b)=>a.revisao.localeCompare(b.revisao)||String(a.alunoNome).localeCompare(String(b.alunoNome),'pt-BR')||String(a.id).localeCompare(String(b.id)));
  return r;
 }
 window.MeuDiaModelo=Object.freeze({resumir});
})();
