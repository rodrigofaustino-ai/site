/* Filtro visual. Valores anteriores permanecem intactos até uma edição explícita. */
(()=>{'use strict';
function identificar(value){const text=String(value??'').trim();const match=/^([1-5])(?:\s*[º°ªo])?(?=\s|$)/i.exec(text);return match?match[1]+'º':'';}
function preencher(select,value){select.querySelectorAll('[data-serie-anterior]').forEach(o=>o.remove());const raw=String(value??'');if(raw&&!Array.from(select.options).some(o=>o.value===raw)){const option=document.createElement('option');option.value=raw;option.textContent=raw+' (cadastro atual)';option.dataset.serieAnterior='true';select.append(option);}select.value=raw;}
function filtrar(lista,serie){return !serie?lista:lista.filter(a=>serie==='outras'?!identificar(a.turma):identificar(a.turma)===serie);}
function montar(root,id,alterou,situacao='ativos'){
 let box=document.getElementById(id);if(box)return box;box=document.createElement('div');box.id=id;box.className='alunos-arquivo-filtros filtros-series';
 for(const [key,title,options]of [['situacao','Mostrar alunos',[['ativos','Em atendimento'],['arquivados','Arquivados'],['todos','Todos']]],['serie','Série',[['','Todas as séries'],...['1º','2º','3º','4º','5º'].map(v=>[v,v]),['outras','Outras / não informada']]]]){const label=document.createElement('label');label.textContent=title+' ';const select=document.createElement('select');select.dataset.filtro=key;select.setAttribute('aria-label',title);for(const [v,t]of options){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o);}select.value=key==='situacao'?situacao:'';select.onchange=alterou;label.append(select);box.append(label);}root.append(box);return box;
}
function valores(id){const box=document.getElementById(id);return {situacao:box?.querySelector('[data-filtro=situacao]')?.value||'todos',serie:box?.querySelector('[data-filtro=serie]')?.value||''};}
function aplicar(lista,id){const f=valores(id);return filtrar(lista.filter(a=>f.situacao==='todos'||(f.situacao==='arquivados'?a.arquivado===true:a.arquivado!==true)),f.serie);}
function limpar(){document.querySelectorAll('.filtros-series').forEach(box=>{box.querySelector('[data-filtro=situacao]').value=box.dataset.padrao||'ativos';box.querySelector('[data-filtro=serie]').value='';});}
window.AlunosSerie=Object.freeze({identificar,preencher,filtrar,montar,valores,aplicar,limpar});
})();
