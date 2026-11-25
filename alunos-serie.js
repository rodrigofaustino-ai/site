/* Filtro visual. Valores anteriores permanecem intactos até uma edição explícita. */
(()=>{'use strict';
function identificar(value){const text=String(value??'').trim();const match=/^([1-5])(?:\s*[º°ªo])?(?=\s|$)/i.exec(text);return match?match[1]+'º':'';}
function preencher(select,value){select.querySelectorAll('[data-serie-anterior]').forEach(o=>o.remove());const raw=String(value??'');if(raw&&!Array.from(select.options).some(o=>o.value===raw)){const option=document.createElement('option');option.value=raw;option.textContent=raw+' (cadastro atual)';option.dataset.serieAnterior='true';select.append(option);}select.value=raw;}
function filtrar(lista,serie){return !serie?lista:lista.filter(a=>serie==='outras'?!identificar(a.turma):identificar(a.turma)===serie);}
window.AlunosSerie=Object.freeze({identificar,preencher,filtrar});
})();
