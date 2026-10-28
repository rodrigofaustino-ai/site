/* Frequência do aluno no resumo por período. Consulta explícita, sem gravações. */
(() => {
  'use strict';
  const labels={presente:'Presente',falta:'Falta',justificado:'Justificado',sem_atend:'Sem atendimento pedagógico',vazio:'Sem marcação (grade atual)',desconhecido:'Situação não reconhecida'};
  let key=null,config=null,root=null,periodo=null,semanas=null,busy=false,falha=false,consultado='',generation=0;
  const n=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
  function limpar(){generation++;key=null;config=null;root=null;periodo=null;semanas=null;busy=false;falha=false;consultado='';}
  function render(values){
    const ctx=values.config,chave=ctx?JSON.stringify([ctx.uid,ctx.alunoId,ctx.turno]):null;
    if(chave!==key||ctx!==config){limpar();key=chave;}
    config=ctx;root=values.root;periodo=values.periodo;atualizar();
  }
  function atualizar(){
    if(!root?.isConnected)return;root.replaceChildren();root.className='resumo-frequencia';root.append(n('h3','Frequência no resumo'));
    if(!config?.turno||!config.vigente()){root.append(n('p','Abra uma ficha com um turno selecionado para consultar a frequência.'));return;}
    root.append(n('p','Turno desta sessão: '+config.turno+'. O intervalo da frequência considera a data de início de cada semana, incluindo todas as marcações dessa semana. Os atendimentos acima são filtrados pela data do relato.'));
    const button=n('button',busy?'Consultando frequência…':semanas?'Atualizar frequência do resumo':'Carregar frequência do resumo');button.type='button';button.className='central-btn';button.disabled=busy;button.addEventListener('click',carregar);root.append(button);
    const status=n('p');status.id='resumoFrequenciaStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
    if(busy){status.textContent='Consultando as semanas cadastradas…';return;}
    if(falha){status.textContent='Não foi possível confirmar a frequência. Tente carregar novamente.';return;}
    if(!semanas){status.textContent='A frequência será consultada somente ao clicar no botão.';return;}
    const valid=window.FrequenciaInterface.dataValida,selecionadas=periodo?semanas.filter(s=>valid(s.dataInicio)&&s.dataInicio>=periodo.de&&s.dataInicio<=periodo.ate):semanas;
    status.textContent=selecionadas.length+' semana(s) no intervalo aplicado. Última consulta: '+consultado+'.';
    const semData=semanas.filter(s=>!valid(s.dataInicio)).length;
    if(semData)root.append(n('p',semData+' semana(s) sem data de início válida '+(periodo?'ficaram fora do intervalo. Use Todo o histórico para incluí-las.':'estão incluídas em Todo o histórico.')));
    if(!selecionadas.length){root.append(n('p','Nenhuma semana encontrada para esse intervalo e turno. Isso não significa ausência do aluno.'));return;}
    const detalhes=n('details');detalhes.append(n('summary','Semanas consideradas ('+selecionadas.length+')'));const lista=n('ul');
    for(const s of selecionadas)lista.append(n('li',(s.label||'Semana sem rótulo')+' · '+(valid(s.dataInicio)?s.dataInicio.split('-').reverse().join('/'):'Data de início não informada')));detalhes.append(lista);root.append(detalhes);
    const resumo=FrequenciaInterface.apurar(config.aluno,selecionadas),grid=n('div');grid.className='resumo-frequencia-indicadores';
    for(const [id,label]of Object.entries(labels)){const item=n('div');item.append(n('strong',String(resumo.diarios[id])),n('span',label));grid.append(item);}root.append(grid);
    root.append(n('p','As contagens diárias consideram uma marcação por aluno/dia em cada semana; dois horários no mesmo dia não duplicam a contagem. Sem marcação usa os dias do cadastro atual como referência, não comprova falta nem matrícula naquele período.'));
    for(const [tipo,titulo]of [['antigos','Marcações semanais antigas'],['semDia','Marcações sem dia reconhecido']]){
      const counts=resumo[tipo],total=Object.values(counts).reduce((a,b)=>a+b,0);
      if(!total)continue;
      const box=n('section');box.className='resumo-frequencia-separado';box.append(n('h4',titulo));const list=n('ul');
      for(const [id,label]of Object.entries(labels))if(counts[id])list.append(n('li',label+': '+counts[id]));box.append(list);root.append(box);
    }
    root.append(n('p','Marcações antigas e sem dia reconhecido permanecem separadas dos totais diários. A frequência não é uma medida de aprendizagem.'));
  }
  async function carregar(){
    if(busy||!config?.vigente())return;
    const ctx=config,token=++generation;busy=true;falha=false;semanas=null;atualizar();
    try{
      const snap=await ctx.db.collection('frequenciaSemanas').where('professorUid','==',ctx.uid).get();
      if(token!==generation||config!==ctx||!ctx.vigente())return;
      const items=[];snap.forEach(d=>items.push({...d.data(),id:d.id}));
      semanas=items.filter(s=>!s.turno||s.turno===ctx.turno);consultado=new Date().toLocaleString('pt-BR');
    }catch(e){if(token!==generation||config!==ctx||!ctx.vigente())return;falha=true;semanas=null;}
    finally{if(token===generation&&config===ctx&&ctx.vigente()){busy=false;atualizar();}}
  }
  window.ResumoFrequencia={render,limpar};
})();
