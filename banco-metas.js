/* Banco de referência: cópias individuais usam o acompanhamento já existente. */
(() => {
'use strict';
let catalogo,ctx,geracao=0;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const botao=(text,fn)=>{const b=el('button',text);b.type='button';b.className='central-btn';b.onclick=fn;return b;};
const vigente=(c,g)=>ctx===c&&geracao===g&&c.auth.currentUser?.uid===c.uid;
function pagina(numero){
 const d=el('dialog');d.className='banco-pagina';const controls=el('div');let atual=numero;
 const label=el('strong');const img=el('img');img.alt='Página original do Banco de Metas';
 const render=()=>{label.textContent=`Página ${atual} de 48 · original ${atual+71}`;img.src=`modelos/banco-metas/paginas/${String(atual).padStart(2,'0')}.png`;};
 controls.append(botao('← Anterior',()=>{atual=Math.max(1,atual-1);render();}),label,botao('Próxima →',()=>{atual=Math.min(48,atual+1);render();}),botao('Fechar',()=>d.close()));d.append(controls,img);document.body.append(d);d.onclose=()=>d.remove();render();d.showModal();
}
async function usar(meta){
 const c=ctx,g=geracao;if(!vigente(c,g))return;
 const d=el('dialog');d.className='banco-editor';const form=el('form');const status=el('p');status.setAttribute('role','status');
 form.append(el('h2',`Adaptar ${meta.id} para um aluno`),el('p','Confira o modelo e personalize conforme as necessidades observadas. Salvar cria uma meta independente na ficha do aluno.'));
 const inputs={};const aluno=el('select');aluno.required=true;const vazio=el('option','Selecione o aluno');vazio.value='';aluno.append(vazio);const l=el('label','Aluno');l.append(aluno);form.append(l);
 const campos=[['objetivo','Objetivo pedagógico',meta.objetivo,true],['situacaoInicial','Ponto de partida (observações reais)','',false],['criterio','Como acompanhar',`${meta.criterio}\nComo registrar: ${meta.comoRegistrar}`,true],['estrategias','Estratégias e recursos','',false],['apoios','Apoios previstos','',false],['responsavel','Responsável pelo acompanhamento','',false],['revisao','Data de revisão','',true]];
 for(const [key,title,value,required] of campos){const label=el('label',title),input=el(key==='revisao'?'input':'textarea');if(key==='revisao')input.type='date';else input.maxLength=key==='objetivo'?600:4000;input.required=required;input.value=value;inputs[key]=input;label.append(input);form.append(label);}
 const save=el('button','Salvar meta para o aluno');save.type='submit';save.className='central-btn';let busy=false,dirty=false,pending=null;
 form.oninput=()=>{dirty=true;pending=null;};
 const fechar=()=>{if(!busy&&(!dirty||confirm('Descartar a adaptação ainda não salva?')))d.close();};
 form.append(save,botao('Cancelar',fechar),status);d.append(form);document.body.append(d);d.oncancel=e=>{e.preventDefault();fechar();};d.onclose=()=>d.remove();d.showModal();status.textContent='Carregando seus alunos…';save.disabled=true;
 try{const snap=await c.db.collection('alunos').where('professorUid','==',c.uid).get({source:'server'});if(!vigente(c,g)){d.close();return;}snap.docs.map(doc=>({id:doc.id,...doc.data()})).filter(a=>a.professorUid===c.uid).sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR')).forEach(a=>{const o=el('option',a.nome||'Sem nome');o.value=a.id;aluno.append(o);});status.textContent=snap.empty?'Cadastre um aluno no diário primeiro.':'';save.disabled=false;}catch(e){status.textContent='Não foi possível carregar os alunos. Feche e tente novamente.';}
 form.onsubmit=async e=>{e.preventDefault();if(busy||!vigente(c,g)||!form.reportValidity())return;
 const values=Object.fromEntries(Object.entries(inputs).map(([k,input])=>[k,input.value.trim()]));
 if(!values.objetivo||!values.criterio){status.textContent='Preencha objetivo e acompanhamento.';return;}
 const alunoId=aluno.value;const key=JSON.stringify({alunoId,values});if(!pending||pending.key!==key)pending={key,id:crypto.randomUUID()};
 busy=true;form.querySelectorAll('button,input,select,textarea').forEach(n=>n.disabled=true);status.textContent='Salvando…';
 try{const ref=c.db.collection('alunos').doc(alunoId),goal=ref.collection('metas').doc(pending.id);
 await c.db.runTransaction(async tx=>{const pupil=await tx.get(ref),old=await tx.get(goal);if(!vigente(c,g)||!pupil.exists||pupil.data().professorUid!==c.uid)throw Error('acesso');if(old.exists){const data=old.data();if(data.criadoPor!==c.uid||Object.keys(values).some(k=>data[k]!==values[k]))throw Error('conflito');return;}const now=new Date().toISOString();tx.set(goal,{...values,alunoId,status:'ativa',schemaVersion:1,revision:1,createdAt:now,updatedAt:now,criadoPor:c.uid,atualizadoPor:c.uid});});
 if(!vigente(c,g)){d.close();return;}dirty=false;status.textContent='Meta salva! Consulte a ficha do aluno → Metas. No PEI, use “Consultar metas do acompanhamento”.';save.hidden=true;
 }catch(e){status.textContent='Não foi possível confirmar o salvamento. Tente novamente sem alterar os campos para conferir a mesma meta.';}finally{busy=false;form.querySelectorAll('button,input,select,textarea').forEach(n=>n.disabled=false);}
 };
}
async function ativar(config){
 ctx=config;const g=++geracao,root=document.getElementById('bancoMetas');root.replaceChildren(el('h2','🎯 Banco de Metas'),el('p','Modelos para planejar e adaptar. Escolha com base nas necessidades observadas; o diagnóstico não seleciona metas automaticamente.'));
 document.querySelectorAll('.banco-editor').forEach(d=>d.close());
 const nav=el('div');nav.className='banco-filtros';const content=el('div');root.append(nav,content,el('small','Fonte: Banco de Metas — Kit PEI em Trilha, material enviado pelo professor. As páginas originais preservam as referências BNCC e todas as orientações do anexo.'));let visualizacao=0;
 const secoes=[['Metas',metas],['Apoios e acessibilidade',()=>referencias('Apoios e acessibilidade',22,['TEA','Deficiência intelectual','Deficiência visual','Surdez / deficiência auditiva','Deficiência física','Altas habilidades / superdotação','TDAH','Dislexia / discalculia','Comportamento desafiador / TOD'])],['Frases para relatórios',()=>referencias('Frases para relatórios e pareceres',31,['Categorias A e B','Categorias C e D','Categorias E e F','Categorias G e H'])],['Exemplos comentados',()=>referencias('Exemplos fictícios de referência',35,['Apresentação','Metas genéricas e mensuráveis','Davi — Educação Infantil (páginas 37–39)','Continuação de Davi','Acompanhamento de Davi','Lara — alfabetização (páginas 40–42)','Continuação de Lara','Acompanhamento de Lara','Iago — Ciências e português escrito (páginas 43–45)','Continuação de Iago','Acompanhamento de Iago','Caio — plano de apoio (páginas 46–48)','Continuação de Caio','Acompanhamento de Caio'])]];
 for(const [nome,fn] of secoes)nav.append(botao(nome,()=>{nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===nome)));fn();}));
 function referencias(titulo,inicio,titulos){visualizacao++;content.replaceChildren(el('h3',titulo),el('p','Consulte as páginas originais completas, incluindo orientações, tabelas e gráficos. Use as setas para percorrer o material.'));const list=el('div');list.className='banco-grade';titulos.forEach((t,i)=>list.append(botao(t,()=>pagina(inicio+i))));content.append(list);}
 async function metas(){const vista=++visualizacao;content.replaceChildren(el('p','Carregando catálogo…'));try{catalogo=catalogo||await fetch('modelos/banco-metas/metas.json').then(r=>{if(!r.ok)throw Error();return r.json();});if(!vigente(config,g)||vista!==visualizacao)return;
 const filters=el('div');filters.className='banco-filtros';const area=el('select'),etapa=el('select'),busca=el('input');busca.placeholder='Buscar por texto ou código';busca.setAttribute('aria-label','Buscar metas');
 for(const [select,key,label] of [[area,'area','Todas as áreas'],[etapa,'etapa','Todas as etapas']]){select.setAttribute('aria-label',label);const o=el('option',label);o.value='';select.append(o);[...new Set(catalogo.map(m=>m[key]))].forEach(v=>{const op=el('option',v);op.value=v;select.append(op);});}
 const count=el('p'),list=el('div');list.className='banco-grade';filters.append(area,etapa,busca);content.replaceChildren(filters,count,list);
 function render(){const q=busca.value.toLocaleLowerCase('pt-BR');const found=catalogo.filter(m=>(!area.value||m.area===area.value)&&(!etapa.value||m.etapa===etapa.value)&&`${m.id} ${m.objetivo} ${m.criterio}`.toLocaleLowerCase('pt-BR').includes(q));count.textContent=`${found.length} de ${catalogo.length} metas · Confira a página original antes de usar.`;list.replaceChildren();for(const m of found){const card=el('article');card.append(el('small',`${m.id} · ${m.area} · ${m.etapa}`),el('h3',m.objetivo),el('p',`Critério: ${m.criterio}`),el('p',`Como registrar: ${m.comoRegistrar}`),botao('Usar esta meta',()=>usar(m)),botao('Ver página original',()=>pagina(m.pagina)));list.append(card);}}area.onchange=etapa.onchange=busca.oninput=render;render();
 }catch(e){content.replaceChildren(el('p','Não foi possível carregar o catálogo. Abra novamente a aba para tentar.'));}}
 await metas();nav.firstChild.setAttribute('aria-pressed','true');
}
window.BancoMetas={ativar};
})();
