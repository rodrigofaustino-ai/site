/* Leitura do planner na data da agenda; cache somente em memória e por conta/turno. */
(()=>{
 'use strict';
 let ctx=null,versao=0,data='';
 const root=()=>document.getElementById('plannerDia'),n=(t,text)=>{const e=document.createElement(t);if(text!=null)e.textContent=text;return e;};
 const valida=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(new Date(v+'T12:00:00Z').getTime())&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 const chave=(c,v)=>c.uid+'_'+v.slice(0,7)+'_'+c.turno;
 function limpar(){versao++;ctx=null;data='';const r=root();if(r){r.replaceChildren();r.hidden=true;}}
 function ativar(config){limpar();ctx={...config,cache:new Map()};}
 function estrutura(c,v){const r=root();if(!r)return null;r.hidden=false;r.replaceChildren();r.append(n('h3','Agenda do Dia'));
  const status=n('p');status.id='plannerDiaStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');r.append(status);
  if(valida(v))r.append(n('p',v.split('-').reverse().join('/')+' · '+c.turno));
  return {r,status};
 }
 async function selecionar(v){
  if(!ctx?.vigente())return;data=v;const c=ctx,token=++versao,ui=estrutura(c,v);if(!ui)return;
  if(!valida(v)){ui.status.textContent='Selecione uma data válida na agenda para consultar o planner.';return;}
  const id=chave(c,v),vigente=()=>ctx===c&&token===versao&&c.vigente();ui.status.textContent='Consultando o planner desta data…';
  try{
   if(!c.cache.has(id)){
    const leitura=c.db.collection('plannerMensal').doc(id).get({source:'server'}).then(doc=>{
     if(doc.metadata?.fromCache)throw Error('Leitura indisponível.');if(!doc.exists)return {};
     const d=doc.data();if(d.professorUid!==c.uid)throw Error('Responsável incompatível.');
     return d.dias&&typeof d.dias==='object'&&!Array.isArray(d.dias)?d.dias:{};
    }).catch(e=>{if(c.cache.get(id)===leitura)c.cache.delete(id);throw e;});
    c.cache.set(id,leitura);if(c.cache.size>12)c.cache.delete(c.cache.keys().next().value);
   }
   const dias=await c.cache.get(id);if(!vigente())return;
   const valor=dias[String(Number(v.slice(8,10)))],texto=typeof valor==='string'?valor:'';
   ui.status.textContent=texto.trim()?'Planejamento salvo para esta data.':'Nenhuma anotação salva no planner para esta data e turno.';
   if(texto.trim()){const p=n('p',texto);p.className='planner-dia-texto';ui.r.append(p);}
  }catch(_){if(!vigente())return;ui.status.textContent='Não foi possível consultar o planner. Clique em Atualizar Agenda do Dia para tentar novamente.';}
  if(!vigente())return;
  const b=n('button','Atualizar Agenda do Dia');b.type='button';b.className='central-btn';b.addEventListener('click',()=>{if(ctx===c&&c.vigente()){c.cache.delete(id);selecionar(data);}});ui.r.append(b,n('p','O quadro mostra somente o texto salvo. Para editar, use a aba Planner.'));
 }
 function salvo(id){if(!ctx)return;ctx.cache.delete(id);if(valida(data)&&chave(ctx,data)===id&&ctx.vigente())selecionar(data);}
 window.PlannerDia=Object.freeze({ativar,selecionar,limpar,salvo});
})();
