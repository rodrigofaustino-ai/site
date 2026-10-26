/* Filtros e conferência local; mantém a frequência existente por aluno/dia. */
(() => {
  'use strict';
  const dias=['Segunda','Terça','Quinta','Sexta','Sem dia'];
  const labels={presente:'Presente',falta:'Falta',justificado:'Justificado',sem_atend:'Sem atendimento pedagógico'};
  let key=null,filtro={busca:'',dia:'',semana:'',ocultarVazios:true};
  const n=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
  const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function estado(semana,alunoId,dia){
    const status=semana.status||{},chave=alunoId+'__'+dia;
    if(Object.prototype.hasOwnProperty.call(status,chave))return {value:status[chave],fonte:status[chave]==null?'vazio':'dia'};
    if(status[alunoId]!=null)return {value:status[alunoId],fonte:'legado'};
    return {value:null,fonte:'vazio'};
  }
  function iniciar({contexto,semanas,alterou}){
    const root=document.getElementById('freqFiltros');if(!root)return;
    if(key!==contexto){key=contexto;filtro={busca:'',dia:'',semana:'',ocultarVazios:true};}
    if(filtro.semana&&!semanas.some(s=>s.id===filtro.semana))filtro.semana='';
    root.replaceChildren();
    const field=(text,input)=>{const label=n('label',text);label.append(input);root.append(label);return input;};
    const busca=field('Buscar aluno',n('input'));busca.type='search';busca.id='freqBusca';busca.value=filtro.busca;
    busca.addEventListener('input',()=>{filtro.busca=busca.value;alterou();});
    const dia=field('Dia',n('select'));dia.id='freqDia';for(const value of ['',...dias]){const op=n('option',value||'Todos os dias');op.value=value;dia.append(op);}dia.value=filtro.dia;
    dia.addEventListener('change',()=>{filtro.dia=dia.value;alterou();});
    const semana=field('Semana',n('select'));semana.id='freqSemana';
    const all=n('option','Todas as semanas');all.value='';semana.append(all);
    for(const s of semanas){const op=n('option',(s.label||'Semana sem rótulo')+(s.dataInicio?' · '+s.dataInicio.split('-').reverse().join('/'):' · sem data'));op.value=s.id;semana.append(op);}semana.value=filtro.semana;
    semana.addEventListener('change',()=>{filtro.semana=semana.value;alterou();});
    const label=n('label'),empty=n('input');label.className='freq-filtro-vazios';empty.type='checkbox';empty.id='freqOcultarVazios';empty.checked=filtro.ocultarVazios;label.append(empty,n('span','Ocultar horários sem alunos'));root.append(label);
    empty.addEventListener('change',()=>{filtro.ocultarVazios=empty.checked;alterou();});
    const clear=n('button','Limpar filtros');clear.type='button';clear.className='central-btn';root.append(clear);
    clear.addEventListener('click',()=>{filtro={busca:'',dia:'',semana:'',ocultarVazios:true};busca.value='';dia.value='';semana.value='';empty.checked=true;alterou();});
  }
  function filtrar(rows,semanas){return {
    rows:rows.filter(r=>(!filtro.dia||r.dia===filtro.dia)&&(!filtro.ocultarVazios||r.aluno)&&(!filtro.busca.trim()||r.aluno&&normal(r.aluno.nome).includes(normal(filtro.busca.trim())))),
    semanas:semanas.filter(s=>!filtro.semana||s.id===filtro.semana)
  };}
  function resumo(rows,semanas){
    const root=document.getElementById('freqConferencia');if(!root)return;root.replaceChildren();
    const counts={presente:0,falta:0,justificado:0,sem_atend:0,vazio:0,desconhecido:0},vistos=new Set(),legados=new Set();
    for(const r of rows){if(!r.aluno)continue;for(const s of semanas){
      const id=JSON.stringify([s.id,r.aluno.id,r.dia]);if(vistos.has(id))continue;vistos.add(id);
      const st=estado(s,r.aluno.id,r.dia);
      if(st.fonte==='legado'){legados.add(JSON.stringify([s.id,r.aluno.id]));continue;}
      counts[st.value==null?'vazio':Object.hasOwn(labels,st.value)?st.value:'desconhecido']++;
    }}
    root.append(n('p','Conferência das marcações diárias nas linhas e semanas exibidas. Um aluno com dois horários no mesmo dia tem uma única marcação por dia.'));
    const grid=n('div');grid.className='freq-indicadores';
    for(const [id,label]of Object.entries({...labels,vazio:'Sem lançamento'})){const item=n('div');item.append(n('strong',String(counts[id])),n('span',label));grid.append(item);}root.append(grid);
    if(legados.size)root.append(n('p',legados.size+' registro(s) semanal(is) antigo(s) aparecem com a indicação “semanal antigo”. Eles ficam separados das contagens diárias para não presumir em quais dias houve atendimento.'));
    if(counts.desconhecido)root.append(n('p',counts.desconhecido+' marcação(ões) não reconhecida(s). Confira as células indicadas.'));
    root.append(n('p','Sem lançamento não é falta. A exportação existente permanece separada desta conferência.'));
  }
  window.FrequenciaInterface={iniciar,filtrar,resumo,estado,labels,limpar(){key=null;filtro={busca:'',dia:'',semana:'',ocultarVazios:true};for(const id of ['freqFiltros','freqConferencia'])document.getElementById(id)?.replaceChildren();}};
})();
