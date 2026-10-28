/* Agenda semanal aplicada à data escolhida; usa alunos já carregados, sem gravações. */
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
    root.append(n('h2','Agenda do dia'));
    root.append(n('p','Horários previstos conforme o cadastro semanal e o turno selecionado. A agenda não confirma presença nem atendimento realizado.'));
    const toolbar=n('div');toolbar.className='agenda-toolbar';const label=n('label','Data da consulta'),input=n('input');input.id='agendaData';input.type='date';input.value=data;label.htmlFor=input.id;label.append(input);toolbar.append(label);
    const button=n('button','Hoje');button.type='button';button.className='central-btn';button.addEventListener('click',()=>{data=hoje();render();document.getElementById('agendaData')?.focus();});toolbar.append(button);root.append(toolbar);
    const status=n('p');status.id='agendaStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
    input.addEventListener('change',()=>{data=input.value;atualizar();});
    const content=n('div');content.id='agendaLista';root.append(content);
    function atualizar(){
      content.replaceChildren();
      if(estado==='carregando'){status.textContent='Carregando agenda…';return;}
      if(estado==='erro'){status.textContent='Não foi possível carregar a agenda. Reabra a lista de alunos para tentar novamente.';return;}
      if(!dataValida(data)){status.textContent='Selecione uma data válida para consultar a agenda.';return;}
      const grupos=agrupar(alunos,data,opcoes.obter),quantidade=new Set(grupos.flatMap(g=>g.alunos.map(a=>a.id))).size;
      const titulo=new Date(data+'T12:00:00Z').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
      status.textContent=`${titulo} · ${opcoes.turno} · ${quantidade} aluno(s) · ${grupos.length} horário(s) com atendimento.`;
      if(!grupos.length){content.append(n('p','Nenhum atendimento cadastrado para este dia no turno selecionado.'));return;}
      const token=versao;
      for(const grupo of grupos){const section=n('section');section.className='agenda-horario';section.append(n('h3',grupo.horario));const list=n('ul');
        for(const aluno of grupo.alunos){const item=n('li');item.append(n('strong',aluno.nome));const abrir=n('button','Abrir ficha');abrir.type='button';abrir.className='central-btn';abrir.setAttribute('aria-label','Abrir ficha pela agenda: '+aluno.nome);abrir.addEventListener('click',()=>{if(token===versao&&opcoes?.vigente())opcoes.abrir(aluno.id);});item.append(abrir);list.append(item);}section.append(list);content.append(section);
      }
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
