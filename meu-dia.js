/* Painel por professor/turno. Somente leituras explícitas das metas de alunos ativos. */
(() => {
 'use strict';
 let config=null,geracao=0,alunos=[],metas=null,estado='carregando',consultando=false,consulta='',dataReferencia='';
 const root=()=>document.getElementById('meuDiaRevisoes'),n=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
 const hoje=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 const formatar=d=>d.split('-').reverse().join('/');
 function limpar(){geracao++;config=null;alunos=[];metas=null;consultando=false;consulta='';dataReferencia='';root()?.replaceChildren();const box=document.getElementById('meuDia');if(box)box.hidden=true;}
 function preparar(ctx){limpar();config=ctx;estado='carregando';document.getElementById('meuDia').hidden=false;render();return geracao;}
 function concluir(token,lista,erro=false){if(token!==geracao||!config?.vigente())return;alunos=erro?[]:lista.filter(a=>a.arquivado!==true).map(a=>({id:a.id,nome:a.nome||'Sem nome',professorUid:a.professorUid}));estado=erro?'erro':'pronto';render();}
 function invalidar(){if(!config)return;geracao++;metas=null;consulta='';dataReferencia='';consultando=false;render();}
 function render(){
  const r=root();if(!r||!config?.vigente())return;r.replaceChildren();r.append(n('h3','Revisões de metas'));
  r.append(n('p','Alunos em atendimento no turno '+config.turno+', incluindo os sem turno definido. Alertas baseados na data de revisão cadastrada e na situação atual de cada meta.'));
  const status=n('p');status.id='meuDiaStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const b=n('button',consultando?'Consultando revisões…':metas?'Atualizar revisões':'Carregar revisões de metas');b.id='meuDiaCarregar';b.type='button';b.className='central-btn';b.disabled=consultando||estado==='carregando'||estado==='erro';b.addEventListener('click',carregar);r.append(b,status);
  if(estado==='carregando'){status.textContent='Aguardando a lista de alunos…';return;}
  if(estado==='erro'){status.textContent='Não foi possível carregar os alunos. Reabra a aba Alunos para tentar novamente.';return;}
  if(consultando){status.textContent='Lendo as metas dos alunos deste turno. Aguarde…';return;}
  if(!metas){status.textContent='As revisões serão consultadas ao clicar no botão. Cada atualização faz leituras das metas no Firebase.';return;}
  if(metas.erro){status.textContent='Não foi possível confirmar todas as metas. Nenhum total parcial será exibido. Clique em Atualizar revisões para tentar novamente.';return;}
  const resumo=MeuDiaModelo.resumir(metas.itens,dataReferencia);status.textContent='Última leitura: '+consulta+'. Referência dos alertas: '+formatar(resumo.referencia)+'. As revisões não usam a data escolhida na agenda. Atualize após mudanças.';
  const cards=n('div');cards.className='meu-dia-indicadores';
  for(const [k,label]of [['vencidas','Revisões vencidas'],['hoje','Revisões para hoje'],['proximas','Revisões nos próximos 7 dias']]){const card=n('div');card.className='meu-dia-indicador '+k;card.append(n('strong',String(resumo[k].length)),n('span',label));cards.append(card);}r.append(cards);
  if(!alunos.length)r.append(n('p','Nenhum aluno em atendimento neste turno. Cadastros arquivados não entram nos alertas.'));
  else if(!metas.itens.length)r.append(n('p','Nenhuma meta cadastrada foi encontrada para os alunos deste turno.'));
  const grupos=n('div');grupos.className='meu-dia-grupos';
  for(const [key,label]of [['vencidas','Revisões vencidas'],['hoje','Revisões para hoje'],['proximas','Próximas revisões — até '+formatar(resumo.limite)]]){
   if(!resumo[key].length)continue;
   const sec=n('section');sec.className='meu-dia-grupo '+key;sec.append(n('h4',label));const lista=n('ul');
   for(const m of resumo[key]){
    const item=n('li');item.append(n('strong',m.alunoNome),n('span',m.objetivo||'Meta sem objetivo informado'),n('small','Revisão prevista: '+formatar(m.revisao)+' · '+(m.status==='em_revisao'?'Em revisão':'Ativa')));
    const abrir=n('button','Abrir metas do aluno');abrir.type='button';abrir.className='central-btn';abrir.setAttribute('aria-label','Abrir metas de '+m.alunoNome+': '+(m.objetivo||'Meta sem objetivo'));const token=geracao;abrir.addEventListener('click',()=>{if(token===geracao&&config?.vigente())config.abrir(m.alunoId);});item.append(abrir);lista.append(item);
   }sec.append(lista);grupos.append(sec);
  }r.append(grupos);
  if(!resumo.vencidas.length&&!resumo.hoje.length&&!resumo.proximas.length&&alunos.length)r.append(n('p','Não há revisões com data válida vencidas ou previstas nos próximos 7 dias entre as metas ativas e em revisão consultadas.'));
  if(resumo.semData)r.append(n('p',resumo.semData+' meta(s) ativa(s) ou em revisão sem data válida de revisão. Confira as datas nas fichas.'));
  if(resumo.situacaoDesconhecida)r.append(n('p',resumo.situacaoDesconhecida+' meta(s) com situação não reconhecida não foram classificadas nos alertas.'));
  r.append(n('p','Metas concluídas e arquivadas ficam fora destes alertas. Revisão vencida indica uma data de planejamento a conferir; não significa ausência de atendimento ou atraso na aprendizagem.'));
 }
 async function carregar(){
  if(consultando||estado!=='pronto'||!config?.vigente())return;
  const ctx=config,token=++geracao,vigente=()=>token===geracao&&config===ctx&&ctx.vigente();consultando=true;metas=null;render();
  try{
   let proximo=0;const itens=[];
   async function worker(){while(vigente()){
    const a=alunos[proximo++];if(!a)return;
    if(a.professorUid!==ctx.uid)throw Error('Responsável incompatível.');
    const snap=await ctx.db.collection('alunos').doc(a.id).collection('metas').get({source:'server'});if(!vigente())return;
    if(snap.metadata?.fromCache)throw Error('Leitura indisponível.');
    for(const d of snap.docs){const m=d.data();itens.push({id:d.id,alunoId:a.id,alunoNome:a.nome,objetivo:typeof m.objetivo==='string'?m.objetivo:'',revisao:m.revisao,status:m.status});}
   }}
   await Promise.all(Array.from({length:Math.min(4,alunos.length)},worker));if(!vigente())return;
   metas={itens};dataReferencia=hoje();consulta=new Date().toLocaleString('pt-BR');
  }catch(_){if(vigente()){metas={erro:true};geracao++;}}
  finally{if(config===ctx&&ctx.vigente()&&(token===geracao||metas?.erro)){consultando=false;render();}}
 }
 window.MeuDia=Object.freeze({preparar,concluir,limpar,invalidar});
})();
