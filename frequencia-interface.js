/* Filtros e conferência local; mantém a frequência existente por aluno/dia. */
(() => {
  'use strict';
  const dias=['Segunda','Terça','Quinta','Sexta','Sem dia'];
  const labels={presente:'Presente',falta:'Falta',justificado:'Justificado',sem_atend:'Sem atendimento pedagógico'};
  let key=null,filtro={busca:'',dia:'',semana:'',ocultarVazios:true};
  const n=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
  const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function dataValida(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.getUTCFullYear()>0&&d.toISOString().slice(0,10)===value;
  }
  function apurar(aluno,semanas){
    const novo=()=>({presente:0,falta:0,justificado:0,sem_atend:0,vazio:0,desconhecido:0});
    const diarios=novo(),antigos=novo(),semDia=novo(),porSemana=[];
    for(const semana of semanas){
      const status=semana.status||{},prefix=aluno.id+'__',linhas=[];
      const grade=Array.isArray(aluno.atendimentos)&&aluno.atendimentos.length?aluno.atendimentos:aluno.diaAtendimento?[{dia:aluno.diaAtendimento}]:[];
      const ds=new Set(grade.map(a=>a.dia).filter(d=>typeof d==='string'&&d.trim()));
      for(const k of Object.keys(status))if(k.startsWith(prefix)&&k.length>prefix.length)ds.add(k.slice(prefix.length));
      const legado=status[aluno.id]!=null;
      for(const dia of ds){
        const own=Object.prototype.hasOwnProperty.call(status,prefix+dia),value=own?status[prefix+dia]:null;
        if(!own&&legado)continue; // Não inventar dias para um registro semanal antigo.
        const conhecido=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].includes(dia),destino=conhecido?diarios:semDia;
        if(own||conhecido){if(conhecido||value!=null)destino[value==null?'vazio':Object.hasOwn(labels,value)?value:'desconhecido']++;linhas.push({dia,value,origem:conhecido?'dia':'sem_dia'});}
      }
      if(legado){const value=status[aluno.id];antigos[Object.hasOwn(labels,value)?value:'desconhecido']++;linhas.push({dia:'Semanal antigo',value,origem:'legado'});}
      if(!linhas.length)linhas.push({dia:'Sem dia cadastrado',value:null,origem:'sem_grade'});
      porSemana.push({id:semana.id,linhas});
    }
    return {diarios,antigos,semDia,porSemana};
  }
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
    const counts={presente:0,falta:0,justificado:0,sem_atend:0,vazio:0,desconhecido:0},vistos=new Set(),legados=new Set(),semDia=new Set();
    for(const r of rows){if(!r.aluno)continue;for(const s of semanas){
      const id=JSON.stringify([s.id,r.aluno.id,r.dia]);if(vistos.has(id))continue;vistos.add(id);
      const st=estado(s,r.aluno.id,r.dia);
      if(st.fonte==='legado'){legados.add(JSON.stringify([s.id,r.aluno.id]));continue;}
      if(r.dia==='Sem dia'){if(st.value!=null)semDia.add(id);continue;}
      counts[st.value==null?'vazio':Object.hasOwn(labels,st.value)?st.value:'desconhecido']++;
    }}
    root.append(n('p','Conferência das marcações diárias nas linhas e semanas exibidas. Um aluno com dois horários no mesmo dia tem uma única marcação por dia.'));
    const grid=n('div');grid.className='freq-indicadores';
    for(const [id,label]of Object.entries({...labels,vazio:'Sem lançamento'})){const item=n('div');item.append(n('strong',String(counts[id])),n('span',label));grid.append(item);}root.append(grid);
    if(legados.size)root.append(n('p',legados.size+' registro(s) semanal(is) antigo(s) aparecem com a indicação “semanal antigo”. Eles ficam separados das contagens diárias para não presumir em quais dias houve atendimento.'));
    if(semDia.size)root.append(n('p',semDia.size+' marcação(ões) sem dia cadastrado ficam separadas dos totais diários.'));
    if(counts.desconhecido)root.append(n('p',counts.desconhecido+' marcação(ões) não reconhecida(s). Confira as células indicadas.'));
    root.append(n('p','Sem lançamento não é falta. A exportação existente permanece separada desta conferência.'));
  }
  window.FrequenciaInterface={iniciar,filtrar,resumo,estado,labels,apurar,dataValida,limpar(){key=null;filtro={busca:'',dia:'',semana:'',ocultarVazios:true};for(const id of ['freqFiltros','freqConferencia'])document.getElementById(id)?.replaceChildren();}};
})();
