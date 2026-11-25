/* Consulta local: nenhuma leitura extra ou gravação no Firebase. */
(() => {
  'use strict';
  const STATUS={ativa:'Ativa',em_revisao:'Em revisão',concluida:'Concluída',arquivada:'Arquivada'};
  let mounted=null,dados=null,periodo=null,erroFiltro='';
  const n=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
  const hoje=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  function dataValida(s){
    if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
    const [y,m,d]=s.split('-').map(Number),bissexto=y%400===0||(y%4===0&&y%100!==0);
    return y>0&&m>=1&&m<=12&&d>=1&&d<=[31,bissexto?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
  }
  const data=s=>dataValida(s)?s.split('-').reverse().join('/'):'Data não informada';
  const ids=r=>Array.isArray(r.metaIds)?[...new Set(r.metaIds.filter(id=>typeof id==='string'&&id.trim()))]:[];
  const atual=m=>['ativa','em_revisao'].includes(m.status);
  function montar(root){
    mounted=root;periodo={de:hoje().slice(0,8)+'01',ate:hoje()};erroFiltro='';root.replaceChildren();
    const details=n('details'),title=n('summary','Acompanhamento por período');details.append(title);root.append(details);
    details.append(n('p','Reúna atendimentos, metas e frequência em um intervalo de datas. Consulte abaixo os relatos vinculados às metas. A quantidade de atendimentos indica registros de trabalho, não um percentual de aprendizagem.'));
    const form=n('form');form.className='acompanhamento-filtro';form.noValidate=true;
    const dateField=(id,text,value)=>{const label=n('label',text),input=n('input');input.type='date';input.id=id;input.value=value;label.append(input);form.append(label);return input;};
    const de=dateField('acompanhamentoDe','De',periodo.de),ate=dateField('acompanhamentoAte','Até',periodo.ate);
    const apply=n('button','Aplicar período');apply.type='submit';apply.className='central-btn';form.append(apply);
    const all=n('button','Todo o histórico');all.type='button';all.className='central-btn';form.append(all);
    form.addEventListener('submit',e=>{e.preventDefault();
      if(!dataValida(de.value)||!dataValida(ate.value))erroFiltro='Informe as duas datas para consultar um período.';
      else if(de.value>ate.value)erroFiltro='A data inicial deve ser anterior ou igual à data final.';
      else{periodo={de:de.value,ate:ate.value};erroFiltro='';}
      atualizar();
    });
    all.addEventListener('click',()=>{periodo=null;de.value='';ate.value='';erroFiltro='';atualizar();});
    const status=n('p');status.id='acompanhamentoStatus';status.setAttribute('role','status');
    const results=n('div');results.id='acompanhamentoResultados';details.append(form,status,results);
  }
  function atualizar(){
    if(!mounted?.isConnected||!dados)return;
    const results=mounted.querySelector('#acompanhamentoResultados'),status=mounted.querySelector('#acompanhamentoStatus');results.replaceChildren();
    status.className=erroFiltro?'metas-error':'';
    if(erroFiltro){status.textContent=erroFiltro;return;}
    if(dados.statusMetas!=='pronto'||dados.statusRegistros!=='pronto'){
      const falha=[dados.statusMetas,dados.statusRegistros].includes('erro');
      status.textContent=falha?'Não foi possível confirmar todos os dados. Atualize as metas ou reabra o aluno antes de consultar o acompanhamento.':'Carregando metas e atendimentos…';return;
    }
    const metas=dados.metas,registros=dados.registros;
    const selecionados=periodo?registros.filter(r=>dataValida(r.date)&&r.date>=periodo.de&&r.date<=periodo.ate):registros;
    const comVinculo=selecionados.filter(r=>ids(r).length),metaIds=new Set(metas.map(m=>m.id));
    status.textContent=periodo?'Período aplicado: '+data(periodo.de)+' a '+data(periodo.ate)+' (incluindo as duas datas).':'Mostrando todo o histórico carregado, inclusive registros sem data válida.';
    const metrics=n('div');metrics.className='acompanhamento-indicadores';
    for(const [label,value]of [['Atendimentos no período',selecionados.length],['Com meta vinculada',comVinculo.length],['Sem meta vinculada',selecionados.length-comVinculo.length],['Metas atuais com registros',metas.filter(m=>atual(m)&&selecionados.some(r=>ids(r).includes(m.id))).length]]){
      const item=n('div');item.className='acompanhamento-indicador';item.append(n('strong',String(value)),n('span',label));metrics.append(item);
    }results.append(metrics);
    const pendentes=metas.filter(m=>atual(m)&&dataValida(m.revisao)&&m.revisao<hoje());
    results.append(n('p','Revisão do planejamento: '+pendentes.length+' meta(s) atual(is) com data de revisão anterior a hoje. Esse lembrete independe do período selecionado.'));
    const semData=registros.filter(r=>!dataValida(r.date)).length;
    if(semData&&periodo)results.append(n('p',semData+' registro(s) sem data válida ficaram fora do filtro. Use Todo o histórico para consultá-los.'));
    if(comVinculo.some(r=>ids(r).some(id=>!metaIds.has(id))))results.append(n('p','Há relatos com vínculo a metas não encontradas nesta consulta. Eles continuam incluídos no total com vínculo.'));
    if(!metas.length)results.append(n('p','Nenhuma meta cadastrada. Os atendimentos continuam disponíveis no histórico.'));
    else{
      results.append(n('p','O quadro inclui todas as metas cadastradas, inclusive concluídas e arquivadas. As situações são definidas pelo professor.'));
      const wrap=n('div');wrap.className='acompanhamento-tabela';const table=n('table'),caption=n('caption','Metas e relatos do período selecionado'),head=n('thead'),tr=n('tr'),body=n('tbody');
      for(const label of ['Meta e relatos','Situação','Relatos no período','Último relato no período','Revisar em']){const th=n('th',label);th.scope='col';tr.append(th);}head.append(tr);table.append(caption,head,body);wrap.append(table);
      for(const m of metas){
        const related=selecionados.filter(r=>ids(r).includes(m.id)).slice().sort((a,b)=>{
          const ad=dataValida(a.date)?a.date:'',bd=dataValida(b.date)?b.date:'';return bd.localeCompare(ad);
        });
        const row=n('tr'),cell=n('td');cell.append(n('strong',m.objetivo||'Meta sem objetivo informado'));
        const evidence=n('details');evidence.append(n('summary','Consultar relatos ('+related.length+')'));
        if(m.criterio)evidence.append(n('p','Como acompanhar: '+m.criterio));
        if(!related.length)evidence.append(n('p','Nenhum relato vinculado neste período. Isso não significa ausência de trabalho ou falta de aprendizagem.'));
        const list=n('ol');for(const r of related){const item=n('li');item.append(n('strong',data(r.date)),n('p',r.text||'Sem relato preenchido.'));
          const vinculo=Array.isArray(r.metaVinculos)?r.metaVinculos.find(v=>v&&v.id===m.id):null;
          if(typeof vinculo?.objetivo==='string'&&vinculo.objetivo!==m.objetivo)item.append(n('p','Objetivo registrado no atendimento: '+vinculo.objetivo));list.append(item);
        }evidence.append(list);cell.append(evidence);
        row.append(cell,n('td',STATUS[m.status]||'Não informada'),n('td',String(related.length)),n('td',related.length?data(related[0].date):'Sem relato neste período'));
        const review=n('td',data(m.revisao));if(pendentes.some(p=>p.id===m.id))review.append(n('span',' · Revisão pendente'));row.append(review);body.append(row);
      }results.append(wrap);
    }
    const frequencia=n('section');frequencia.id='resumoFrequencia';results.append(frequencia);
    window.ResumoFrequencia?.render({root:frequencia,periodo,config:dados.frequencia});
    // Histórico sem vínculo também fica consultável, sem associação automática.
    const livres=selecionados.filter(r=>!ids(r).length),details=n('details');details.append(n('summary','Atendimentos sem meta vinculada ('+livres.length+')'));
    if(!livres.length)details.append(n('p','Nenhum atendimento sem vínculo neste período.'));
    for(const r of livres){const item=n('article');item.append(n('strong',data(r.date)),n('p',r.text||'Sem relato preenchido.'));details.append(item);}results.append(details);
  }
  function render(values){
    const root=document.getElementById('acompanhamentoPeriodo');if(!root)return;
    if(root!==mounted)montar(root);dados=values;atualizar();
  }
  window.AcompanhamentoPeriodo={render,limpar(){window.ResumoFrequencia?.limpar();mounted=null;dados=null;periodo=null;erroFiltro='';}};
})();
