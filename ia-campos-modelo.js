/* Cobertura explícita dos campos de redação dos professores. Sem seleção por conteúdo. */
(()=>{'use strict';
function classificar(c,pagina=location.pathname.split('/').pop()||'index.html'){
 if(!c.matches('textarea,input[type="text"],input:not([type])'))return 'tipo';
 if(c.readOnly||c.closest('.ia-revisao,.pei-ai-preview'))return 'consulta';
 const id=c.id||'',bind=c.dataset.bind||'',field=c.dataset.field||'';
 if(pagina==='index.html'){
  if(['entryText','obsClinicas','entryProximoPasso','planoDescricao','recursoDescricao','chatTexto','comunicadosTitulo','comunicadosTexto','meta-objetivo','meta-situacaoInicial','meta-criterio','meta-estrategias','meta-apoios'].includes(id))return 'redacao';
  if(c.matches('textarea')&&(id.startsWith('roteiro-')||c.closest('#plannerGrid,#notasGrid')))return 'redacao';
  return 'identificacao-ou-controle';
 }
 if(pagina==='pei_formulario.html')return c.matches('textarea[data-path]')?'redacao':'identificacao-ou-controle';
 if(pagina==='diagnostica_formulario.html')return c.matches('textarea[data-obs-key],textarea[data-obs-geral]')?'redacao':'identificacao-ou-controle';
 if(pagina==='paee_formulario_02.html'){
  if(!c.matches('textarea')||['responsavel','profissionais','profissional','prazo','servico','data'].includes(field)||bind.startsWith('assinaturas.'))return 'identificacao-ou-controle';
  return 'redacao';
 }
 if(pagina==='relatorio_formulario.html')return c.matches('textarea')&&!bind.startsWith('assinaturas.')?'redacao':'identificacao-ou-controle';
 if(pagina==='colaboracao.html')return c.matches('#col-notes textarea')?'redacao':'identificacao-ou-controle';
 return 'fora-do-escopo-professor';
}
function texto(r){if(typeof r==='string')return r;if(Array.isArray(r))return r.map(texto).join('\n');if(r?.message?.content!==undefined)return texto(r.message.content);if(r?.content!==undefined)return texto(r.content);if(typeof r?.text==='string')return r.text;return '';}
const igual=(a,b)=>a.normalize('NFKC').trim().replace(/\s+/g,' ')===b.normalize('NFKC').trim().replace(/\s+/g,' ');
function limite(c,t){if(c.maxLength>0&&t.length>c.maxLength)return 'A sugestão ultrapassa o limite de '+c.maxLength+' caracteres. Solicite uma nova sugestão.';if(c.id==='planoDescricao'&&t.trim().split(/\s+/).filter(Boolean).length>40)return 'A descrição aceita até 40 palavras. Solicite uma nova sugestão.';return '';}
window.IACamposModelo=Object.freeze({classificar,texto,igual,limite});
})();
