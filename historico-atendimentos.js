/* Consulta local: não grava dados nem modifica a lista usada pelas exportações. */
(function(){
  'use strict';
  let contexto=null;
  const ids=['historicoBusca','historicoInicio','historicoFim','historicoMetas'];
  const normalizar=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function dataValida(v){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;
    const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;
  }
  function selecionar(registros,f){
    if((f.inicio&&!dataValida(f.inicio))||(f.fim&&!dataValida(f.fim))||(f.inicio&&f.fim&&f.inicio>f.fim))return {itens:[],erro:'Confira o período: a data inicial deve ser anterior ou igual à final.'};
    const termos=normalizar(f.busca).trim().split(/\s+/).filter(Boolean);
    let semData=0;
    const itens=registros.filter(e=>{
      if(f.inicio||f.fim){if(!dataValida(e.date)){semData++;return false;}if(f.inicio&&e.date<f.inicio||f.fim&&e.date>f.fim)return false;}
      const temMeta=Array.isArray(e.metaIds)&&e.metaIds.some(id=>typeof id==='string'&&id.length>0);
      if(f.metas==='com'&&!temMeta||f.metas==='sem'&&temMeta)return false;
      const texto=normalizar([e.text,e.por,...(Array.isArray(e.metaVinculos)?e.metaVinculos.map(m=>m&&m.objetivo):[])].join(' '));
      return termos.every(t=>texto.includes(t));
    });
    return {itens,semData};
  }
  function filtrar(registros,chave,status){
    const area=document.getElementById('historicoFiltros');
    if(!area)return registros;
    if(contexto!==chave){contexto=chave;ids.forEach(id=>document.getElementById(id).value='');}
    area.hidden=!chave;
    const f=Object.fromEntries(ids.map((id,i)=>[['busca','inicio','fim','metas'][i],document.getElementById(id).value]));
    const resultado=selecionar(registros,f);
    const aviso=document.getElementById('historicoResultado');
    aviso.textContent=status==='carregando'?'Carregando atendimentos…':status==='erro'?'Não foi possível atualizar o histórico. Reabra a ficha para tentar novamente.':resultado.erro||`${resultado.itens.length} de ${registros.length} atendimento(s).${resultado.semData?' Registros sem data válida não aparecem no período selecionado.':''}`;
    return status==='pronto'&&!resultado.erro?resultado.itens:[];
  }
  document.addEventListener('DOMContentLoaded',()=>{
    ids.forEach(id=>document.getElementById(id).addEventListener(id==='historicoBusca'?'input':'change',()=>window.renderEntriesList()));
    document.getElementById('historicoLimpar').addEventListener('click',()=>{ids.forEach(id=>document.getElementById(id).value='');window.renderEntriesList();});
  });
  window.HistoricoAtendimentos={filtrar,selecionar,dataValida};
})();
