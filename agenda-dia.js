/* Agenda semanal aplicada à data escolhida; usa alunos já carregados, com atalhos de frequência por aluno/dia. */
(() => {
  'use strict';
  const dias=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const horarios=['1º Horário','2º Horário','3º Horário','4º Horário','5º Horário'];
  let contexto=null,versao=0,alunos=[],opcoes=null,data='',estado='carregando';
  const hoje=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  function dataValida(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
  const n=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
  function agrupar(lista,valor,obter){
    if(!dataValida(valor))return [];
    const dia=dias[new Date(valor+'T12:00:00Z').getUTCDay()],grupos=horarios.map(h=>({horario:h,alunos:[]})),vistos=new Set();
    for(const aluno of lista){for(const item of obter(aluno)){
      if(item.dia!==dia||!horarios.includes(item.horario))continue;
      const chave=JSON.stringify([aluno.id,item.horario]);if(vistos.has(chave))continue;vistos.add(chave);
      grupos.find(g=>g.horario===item.horario).alunos.push({id:aluno.id,nome:aluno.nome||'Sem nome'});
    }}
    for(const grupo of grupos)grupo.alunos.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    return grupos.filter(g=>g.alunos.length);
  }
  function render(){
    const root=document.getElementById('agendaDia');if(!root)return;root.replaceChildren();root.hidden=!contexto;if(!contexto)return;
    root.append(n('h3','Agenda do dia'));
    root.append(n('p','Horários previstos conforme o cadastro semanal e o turno selecionado. A agenda não confirma presença nem atendimento realizado.'));
    const toolbar=n('div');toolbar.className='agenda-toolbar';const label=n('label','Data do encontro'),input=n('input');input.id='agendaData';input.type='date';input.value=data;label.htmlFor=input.id;label.append(input);toolbar.append(label);
    const button=n('button','Hoje');button.type='button';button.className='central-btn';button.addEventListener('click',()=>{data=hoje();render();document.getElementById('agendaData')?.focus();});toolbar.append(button);root.append(toolbar);
    const status=n('p');status.id='agendaStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
    input.addEventListener('change',()=>{data=input.value;atualizar();});
    const info=n('p','P = Presente · F = Falta · J = Justificado. A marcação vale para o aluno neste dia, em todos os seus horários.');info.className='agenda-legenda';root.append(info);
    const aviso=n('p');aviso.id='agendaFrequenciaStatus';aviso.setAttribute('role','status');root.append(aviso);
    const content=n('div');content.id='agendaLista';root.append(content);
    function atualizar(){
      content.replaceChildren();aviso.textContent='';
      if(estado==='carregando'){status.textContent='Carregando agenda…';return;}
      if(estado==='erro'){status.textContent='Não foi possível carregar a agenda. Reabra a lista de alunos para tentar novamente.';return;}
      if(!dataValida(data)){status.textContent='Selecione uma data válida para consultar a agenda.';return;}
      const grupos=agrupar(alunos,data,opcoes.obter),quantidade=new Set(grupos.flatMap(g=>g.alunos.map(a=>a.id))).size;
      const titulo=new Date(data+'T12:00:00Z').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
      status.textContent=`${titulo} · ${opcoes.turno} · ${quantidade} aluno(s) · ${grupos.length} horário(s) com atendimento.`;
      if(!grupos.length){content.append(n('p','Nenhum atendimento cadastrado para este dia no turno selecionado.'));return;}
      const token=versao,valorData=data,config=opcoes,controles=[];let ocupado=false,sessao=null;
      const valido=()=>content.isConnected&&token===versao&&valorData===data&&config===opcoes&&config.vigente();
      const atualizarMarcas=()=>{for(const b of controles){const st=b.dataset.status;const ids=JSON.parse(b.dataset.alunos);b.disabled=ocupado||!sessao;b.setAttribute('aria-pressed',String(!!sessao&&ids.every(id=>FrequenciaInterface.estado(sessao.semana,id,sessao.dia).value===st)));}};
      const marcar=async(ids,st,horario)=>{if(ocupado||!sessao||!valido())return;ocupado=true;atualizarMarcas();input.disabled=true;button.disabled=true;aviso.textContent='Salvando frequência…';try{await AgendaFrequencia.salvar(config.frequencia,sessao,ids,st,horario);if(!valido())return;aviso.textContent='Frequência salva para '+ids.length+' aluno(s) em '+valorData.split('-').reverse().join('/')+'.';config.frequencia.alterou?.();}catch(e){if(valido()){aviso.textContent=e.message;try{sessao=await AgendaFrequencia.carregar(config.frequencia,valorData);}catch{sessao=null;}}}finally{if(valido()){ocupado=false;input.disabled=false;button.disabled=false;atualizarMarcas();}}};
      const controle=(texto,ids,st,label,horario)=>{const b=n('button',texto);b.type='button';b.className='agenda-marca '+st;b.dataset.status=st;b.dataset.alunos=JSON.stringify(ids);b.setAttribute('aria-label',label);b.disabled=true;b.addEventListener('click',()=>marcar(ids,st,horario));controles.push(b);return b;};
      for(const grupo of grupos){const section=n('section');section.className='agenda-horario';const cab=n('div');cab.className='agenda-cabecalho';cab.append(n('h3',grupo.horario));if(config.frequencia)cab.append(controle('Sem atendimento pedagógico',grupo.alunos.map(a=>a.id),'sem_atend','Sem atendimento pedagógico · '+grupo.horario,grupo.horario));section.append(cab);const list=n('ul');
        for(const aluno of grupo.alunos){const item=n('li');item.append(n('strong',aluno.nome));const abrir=n('button','Abrir ficha');abrir.type='button';abrir.className='central-btn';abrir.setAttribute('aria-label','Abrir ficha pela agenda: '+aluno.nome);abrir.addEventListener('click',()=>{if(token===versao&&opcoes?.vigente())opcoes.abrir(aluno.id);});const acoes=n('div');acoes.className='agenda-acoes';if(config.frequencia)for(const [sigla,st]of [['P','presente'],['F','falta'],['J','justificado']])acoes.append(controle(sigla,[aluno.id],st,FrequenciaInterface.labels[st]+' · '+aluno.nome,grupo.horario));acoes.append(abrir);item.append(acoes);list.append(item);}section.append(list);content.append(section);
      }
      if(config.frequencia){aviso.textContent='Carregando marcações da data…';AgendaFrequencia.carregar(config.frequencia,valorData).then(resultado=>{if(!valido())return;sessao=resultado;aviso.textContent='Marcações de '+resultado.semana.label+'.';atualizarMarcas();}).catch(e=>{if(valido())aviso.textContent=e.message;});}
    }
    atualizar();
  }
  function carregar(config){
    const chave=JSON.stringify([config.uid,config.turno]);if(contexto!==chave)data=hoje();
    contexto=chave;versao++;opcoes=config;alunos=[];estado='carregando';render();return versao;
  }
  function concluir(token,lista,erro=false){if(token!==versao||!opcoes?.vigente())return false;alunos=lista;estado=erro?'erro':'pronto';render();return true;}
  function limpar(){versao++;contexto=null;opcoes=null;alunos=[];data='';render();}
  window.AgendaDia={carregar,concluir,limpar,agrupar,hoje};
})();
