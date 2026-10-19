/* Transferência temporária entre abas do mesmo site. Não grava no Firebase. */
(() => {
 'use strict';
 const match=location.hash.match(/^#familia=([A-Za-z0-9_-]{43})$/);if(!match)return;
 const panel=document.createElement('section');panel.className='familia-importar';panel.setAttribute('aria-label','Conferir relato familiar');
 const heading=document.createElement('h3');heading.textContent='Conferir relato familiar';panel.appendChild(heading);
 const status=document.createElement('p');status.textContent='Aguardando as informações da aba Questionários da Família. Mantenha a outra aba aberta.';panel.appendChild(status);
 const content=document.createElement('div');panel.appendChild(content);document.getElementById('form-sections').before(panel);
 const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
 let payload=null,channel=null,timer=null;
 if(!window.BroadcastChannel){status.textContent='Este navegador não permite a transferência. Consulte as respostas na outra aba e copie as informações manualmente.';return;}
 channel=new BroadcastChannel('srm_familia_'+match[1]);let attempts=0;
 channel.onmessage=event=>{
  const data=event.data;
  if(!data||typeof data.nome!=='string'||!data.observacoes||typeof data.observacoes!=='object'||JSON.stringify(data).length>50000)return;
  payload=data;clearInterval(timer);channel.close();
  status.textContent='Relato referente a '+data.nome+'. Abra ou crie a Diagnóstica correspondente. Nada foi preenchido ou salvo automaticamente.';
  Object.entries(data.observacoes).forEach(([key,text])=>{
   const category=CATEGORIAS.find(item=>item.key===key);if(!category||typeof text!=='string'||text.length>12000)return;
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.familiaCat=key;label.append(check,document.createTextNode(' Acrescentar em Observações gerais — '+category.label));const preview=document.createElement('p');preview.textContent=text;preview.style.whiteSpace='pre-wrap';label.appendChild(preview);content.appendChild(label);
  });
  const apply=document.createElement('button');apply.type='button';apply.className='btn secondary';apply.textContent='Acrescentar informações selecionadas';content.appendChild(apply);
  apply.addEventListener('click',()=>{
   if(!professorUid||!document.getElementById('view-form').classList.contains('active')){status.textContent='Entre no formulário e abra a Diagnóstica deste aluno antes de incorporar.';return;}
   if(normalize(state.identificacao.nome)!==normalize(payload.nome)){status.textContent='O nome do aluno neste formulário é diferente. Abra a Diagnóstica de '+payload.nome+'. Nenhum campo foi alterado.';return;}
   if(payload.dataNascimento&&state.identificacao.dataNascimento&&payload.dataNascimento!==state.identificacao.dataNascimento){status.textContent='As datas de nascimento não correspondem. Confira se abriu o aluno correto. Nenhum campo foi alterado.';return;}
   const selected=[...content.querySelectorAll('input:checked')].map(input=>input.dataset.familiaCat);if(!selected.length){status.textContent='Selecione as áreas que deseja acrescentar.';return;}
   if(!confirm('Acrescentar o relato da família às observações gerais de '+payload.nome+'? Os textos existentes e as marcações Sim/Não/Parcial serão preservados. Confira antes de salvar.'))return;
   state.obsGerais=state.obsGerais||{};let changed=0;
   selected.forEach(key=>{const text=payload.observacoes[key],existing=state.obsGerais[key]||'';if(!existing.includes(text)){state.obsGerais[key]=existing+(existing?'\n\n':'')+text;changed++;}});
   renderForm();status.textContent=changed?'Informações acrescentadas como relato familiar. Confira e clique em Salvar quando desejar gravar a Diagnóstica.':'As informações selecionadas já constam nas observações; nada foi duplicado.';
  });
 };
 channel.postMessage('solicitar');timer=setInterval(()=>{if(++attempts>=30){clearInterval(timer);channel.close();status.textContent='Não foi possível receber as informações. Volte à aba Questionários da Família e abra a conferência novamente.';}else channel.postMessage('solicitar');},1500);
 window.addEventListener('pagehide',()=>{clearInterval(timer);if(channel)channel.close();});
})();
