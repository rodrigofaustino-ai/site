/* Leituras explícitas, isoladas por professor. Sem persistência dos resultados. */
(() => {
 'use strict';
 let ctx=null,geracao=0,dados=null,ocupado=false,erro='',carregado='';
 const $=id=>document.getElementById(id),n=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
 const hoje=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 const labels={presente:'Presenças',falta:'Faltas',justificado:'Justificativas',sem_atend:'Sem atendimento pedagógico',vazio:'Sem marcação (grade atual)',desconhecido:'Situação não reconhecida'};
 const metaLabels={ativa:'Ativas',em_revisao:'Em revisão',concluida:'Concluídas',arquivada:'Arquivadas',desconhecida:'Situação não reconhecida'};
 function limpar(){geracao++;ctx=null;dados=null;ocupado=false;erro='';carregado='';$('estatisticasRaiz')?.replaceChildren();}
 function ativar(config){
  if(ctx?.uid===config.uid&&ctx?.turno===config.turno&&ctx.vigente())return;
  limpar();ctx=config;const root=$('estatisticasRaiz');if(!root)return;
  root.append(n('h2','Estatísticas do meu trabalho'),n('p','Dados da sua conta, inclusive para o administrador. Esta primeira versão não reúne dados de outros professores.'));
  const form=n('form');form.id='estatisticasFiltros';form.className='estatisticas-filtros';form.noValidate=true;
  for(const [id,label,value]of [['estatDe','De',hoje().slice(0,8)+'01'],['estatAte','Até',hoje()]]){const l=n('label',label),i=n('input');i.type='date';i.id=id;i.value=value;l.append(i);form.append(l);}
  const label=n('label','Turno'),select=n('select');select.id='estatTurno';for(const [v,t]of [['','Todos os turnos'],['Matutino','Matutino'],['Vespertino','Vespertino']]){const o=n('option',t);o.value=v;select.append(o);}select.value=config.turno||'';label.append(select);form.append(label);
  const aplicar=n('button','Aplicar filtros');aplicar.type='submit';aplicar.className='central-btn';form.append(aplicar);form.addEventListener('submit',e=>{e.preventDefault();render();});root.append(form);
  const carregar=n('button','Carregar estatísticas');carregar.type='button';carregar.id='estatCarregar';carregar.className='central-btn';carregar.addEventListener('click',consultar);root.append(carregar);
  root.append(n('p','O botão consulta todos os alunos da sua conta, suas metas, registros de atendimentos e semanas de frequência. Os filtros são aplicados na memória, sem novas leituras. Recarregue após alterações. Nenhum dado é gravado.'));
  const status=n('p');status.id='estatStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');const resultado=n('div');resultado.id='estatResultado';root.append(status,resultado);render();
 }
 function filtro(){return {de:$('estatDe').value,ate:$('estatAte').value,turno:$('estatTurno').value};}
 function grafico(root,titulo,itens,descricao,modo='barras'){
  const section=n('section');section.className='estat-grafico';section.append(n('h3',titulo),n('p',descricao));
  const cores={'Presenças':'#238a68','Faltas':'#b95570','Justificativas':'#b37b1e','Sem atendimento pedagógico':'#3f7fba','Sem marcação (grade atual)':'#778697','Situação não reconhecida':'#8864ae','Ativas':'#238a68','Em revisão':'#b37b1e','Concluídas':'#536fbe','Arquivadas':'#778697'};
  const cor=label=>cores[label]||'#238a68',soma=itens.reduce((a,i)=>a+i[1],0),pizza=modo==='pizza';
  const max=Math.max(1,...itens.map(i=>i[1])),table=n('table'),caption=n('caption',titulo+' — valores');table.append(caption);
  const layout=n('div');layout.className=pizza?'estat-pizza-layout':'';
  if(pizza){
   const visual=n('div');visual.className='estat-pizza-visual';
   if(soma){
    let acumulado=0;const fatias=[];
    for(const [label,total]of itens){if(!total)continue;const inicio=acumulado/soma*360;acumulado+=total;fatias.push(cor(label)+' '+inicio+'deg '+acumulado/soma*360+'deg');}
    const disco=n('div');disco.className='estat-pizza';disco.setAttribute('aria-hidden','true');disco.style.setProperty('--fatias','conic-gradient('+fatias.join(',')+')');
    const base=n('div'),topo=n('div');base.className='estat-pizza-base';topo.className='estat-pizza-topo';disco.append(base,topo);visual.append(disco);
   }else visual.append(n('p','Sem dados para compor a pizza neste recorte.'));
   visual.append(n('strong','Total: '+soma),n('small','Percentuais sobre o total desta distribuição. Valores arredondados a uma casa decimal.'));layout.append(visual);
  }
  const head=n('tr');for(const t of pizza?['Categoria','Quantidade','Percentual']:['Categoria','Quantidade']){const th=n('th',t);th.scope='col';head.append(th);}const thead=n('thead');thead.append(head);table.append(thead);const body=n('tbody');
  for(const [label,total]of itens){
   const row=n('tr'),th=n('th'),td=n('td');th.scope='row';
   if(pizza){const ponto=n('span');ponto.className='estat-pizza-cor';ponto.style.backgroundColor=cor(label);ponto.setAttribute('aria-hidden','true');th.append(ponto);}
   th.append(document.createTextNode(label));td.append(n('strong',String(total)));row.append(th,td);
   if(pizza)row.append(n('td',soma?(total/soma*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'—'));
   else{const bar=n('span');bar.className='estat-barra';bar.style.width=(total/max*100)+'%';bar.style.setProperty('--estat-cor',cor(label));if(total===0)bar.classList.add('estat-barra-zero');bar.setAttribute('aria-hidden','true');td.append(bar);}
   body.append(row);
  }
  table.append(body);layout.append(table);section.append(layout);root.append(section);
 }
 function render(){
  if(!ctx?.vigente()||!$('estatResultado'))return;
  const output=$('estatResultado'),s=$('estatStatus'),b=$('estatCarregar');output.replaceChildren();b.disabled=ocupado;b.textContent=ocupado?'Carregando…':dados?'Atualizar estatísticas':'Carregar estatísticas';
  if(ocupado){s.textContent='Lendo os registros da sua conta. Aguarde…';return;}
  if(erro){s.textContent=erro;return;}if(!dados){s.textContent='Clique em Carregar estatísticas para iniciar a consulta.';return;}
  let r;try{r=EstatisticasModelo.consolidar(dados,filtro(),hoje());}catch(e){s.textContent=e.message;return;}
  s.textContent='Última leitura: '+carregado+'. Os resultados usam o cadastro e o turno atuais dos alunos.';
  const cards=n('div');cards.className='estat-indicadores';for(const [label,value]of [['Alunos no recorte atual',r.alunos],['Atendimentos registrados no período',r.atendimentos],['Alunos com registro no período',r.alunosComRegistro],['Alunos sem registro no período',r.semRegistro],['Metas ativas ou em revisão com revisão vencida hoje',r.revisoes]]){const card=n('div');card.append(n('strong',String(value)),n('span',label));cards.append(card);}output.append(cards);
  output.append(n('p','Ausência de registro não significa falta. A quantidade de atendimentos não mede aprendizagem. Alunos sem turno definido entram em qualquer filtro de turno ('+r.semTurno+' neste recorte). O cadastro atual não comprova matrícula histórica.'));
  if(r.registrosSemData||r.semanasSemData)output.append(n('p',r.registrosSemData+' registro(s) de atendimento e '+r.semanasSemData+' semana(s) sem data válida foram excluídos do período.'));
  grafico(output,'Atendimentos por mês',Object.entries(r.meses).map(([mes,v])=>[mes.slice(5)+'/'+mes.slice(0,4),v]),'Contagem dos registros pela data do atendimento, incluindo somente os dias do intervalo selecionado. Meses sem registro aparecem com zero.');
  grafico(output,'Frequência diária',Object.entries(labels).map(([k,t])=>[t,r.diarios[k]]),'Inclui '+r.semanas+' semana(s) pela data de início, considerando a semana inteira. Um aluno/dia conta uma vez por semana, mesmo com dois horários. Sem marcação usa a grade atual e não equivale a falta.','pizza');
  for(const [key,title]of [['antigos','Marcações semanais antigas'],['semDia','Marcações sem dia reconhecido']])if(Object.values(r[key]).some(v=>v))grafico(output,title,Object.entries(labels).map(([k,t])=>[t,r[key][k]]),'Contagens separadas da frequência diária para evitar somar registros com unidades diferentes.');
  if(!r.semanas)output.append(n('p','Não há semanas com data válida nesse intervalo e turno. Isso não significa ausência dos alunos.'));
  grafico(output,'Situação atual das metas',Object.entries(metaLabels).map(([k,t])=>[t,r.metas[k]]),'Retrato atual das metas dos alunos no turno selecionado; não é filtrado pela data de criação nem representa a situação histórica no período.');
  output.append(n('p',r.metasSemRevisao+' meta(s) ativa(s) ou em revisão sem data de revisão válida. Os gráficos indicam organização do trabalho, não percentual de evolução pedagógica.'));
 }
 async function consultar(){
  if(ocupado||!ctx?.vigente())return;
  try{const f=filtro();if(!FrequenciaInterface.dataValida(f.de)||!FrequenciaInterface.dataValida(f.ate)||f.de>f.ate)throw Error('Informe um período válido antes de carregar.');}catch(e){$('estatStatus').textContent=e.message;return;}
  const config=ctx,ticket=++geracao,vigente=()=>ticket===geracao&&ctx===config&&config.vigente();ocupado=true;erro='';dados=null;render();
  try{
   const snap=await config.db.collection('alunos').where('professorUid','==',config.uid).get({source:'server'});if(!vigente())return;
   if(snap.metadata?.fromCache)throw Error('cache');
   const alunos=snap.docs.map(d=>{const a=d.data();return {id:d.id,professorUid:a.professorUid,turno:a.turno,atendimentos:a.atendimentos,diaAtendimento:a.diaAtendimento};});if(alunos.some(a=>a.professorUid!==config.uid))throw Error('proprietário');
   const semanasSnap=await config.db.collection('frequenciaSemanas').where('professorUid','==',config.uid).get({source:'server'});if(!vigente())return;if(semanasSnap.metadata?.fromCache)throw Error('cache');
   const semanas=semanasSnap.docs.map(d=>({...d.data(),id:d.id}));if(semanas.some(s=>s.professorUid!==config.uid))throw Error('proprietário');
   const resultado={alunos,semanas,registros:Object.create(null),metas:Object.create(null)};let proximo=0;
   async function worker(){while(vigente()){
    const a=alunos[proximo++];if(!a)return;
    for(const sub of ['registros','metas']){if(!vigente())return;const ss=await config.db.collection('alunos').doc(a.id).collection(sub).get({source:'server'});if(!vigente())return;if(ss.metadata?.fromCache)throw Error('cache');resultado[sub][a.id]=ss.docs.map(d=>{const v=d.data();return sub==='registros'?{date:v.date}:{status:v.status,revisao:v.revisao};});}
   }}
   // Limite de quatro alunos por vez para não disparar todas as leituras simultaneamente.
   await Promise.all(Array.from({length:Math.min(4,alunos.length)},worker));if(!vigente())return;dados=resultado;carregado=new Date().toLocaleString('pt-BR');
  }catch(_){if(vigente()){dados=null;erro='Não foi possível confirmar todos os dados. Nenhuma estatística parcial será exibida. Tente atualizar a consulta.';geracao++;}}
  finally{if(ctx===config&&config.vigente()&&(ticket===geracao||erro)){ocupado=false;render();}}
 }
 window.Estatisticas=Object.freeze({ativar,limpar});
})();
