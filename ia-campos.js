/* IA sob ação do professor: somente o campo solicitado; sugestão nunca aplicada automaticamente. */
(()=>{'use strict';if(window.SRMExportacaoWorker)return;
const M=IACamposModelo,n=(t,v)=>{const e=document.createElement(t);if(v!==undefined)e.textContent=v;return e;},map=new WeakMap(),items=new Set();
let session=0,ticket=0,active=null;
const dialog=n('dialog');dialog.id='iaCamposDialog';dialog.className='ia-revisao';dialog.setAttribute('aria-labelledby','iaCamposTitulo');
dialog.innerHTML='<h2 id="iaCamposTitulo">Melhorar texto com IA</h2><p id="iaCamposCampo"></p><p>Somente o texto deste campo será enviado ao serviço de IA já utilizado no site. Confira os fatos antes de aplicar. A IA pode cometer erros.</p><details id="iaCamposOriginalDetalhes"><summary>Ver texto original para comparar</summary><textarea id="iaCamposOriginal" aria-label="Texto original para comparação" readonly rows="4"></textarea></details><label>Nova redação sugerida pela IA<textarea id="iaCamposSugestao" readonly rows="6" placeholder="A nova redação aparecerá aqui quando a IA responder."></textarea></label><p id="iaCamposStatus" role="status" aria-live="polite"></p><div class="ia-revisao-acoes"><button type="button" id="iaCamposGerar">Gerar sugestão</button><button type="button" id="iaCamposAplicar" disabled>Aplicar sugestão</button><button type="button" id="iaCamposManter">Manter meu texto</button></div>';
document.body.append(dialog);const $=id=>document.getElementById(id);
function auth(){try{return firebase.auth();}catch{return null;}}
function context(){return {session,uid:auth()?.currentUser?.uid||null,aluno:typeof currentStudentId!=='undefined'?currentStudentId:null,turno:typeof turnoAtual!=='undefined'?turnoAtual:null,ano:typeof plannerAno!=='undefined'?plannerAno:null,mes:typeof plannerMes!=='undefined'?plannerMes:null,estado:typeof state!=='undefined'?state:null,id:typeof state!=='undefined'?state?.id:null,alunoForm:typeof state!=='undefined'?state?.alunoId:null};}
function same(a,b){return Object.keys(a).every(k=>a[k]===b[k]);}
function label(c){if(c.id==='planoDescricao')return 'Conteúdo/tema e breve descrição do plano de aula';if(c.closest('#plannerGrid'))return 'Planejamento do dia '+c.dataset.dia;if(c.closest('#notasGrid'))return 'Bloco de notas';
 const raw=c.labels?.[0]||c.closest('label')||c.closest('.field,.field-group,.metas-field')?.querySelector('label')||c.closest('.pei-field')?.querySelector('label');
 if(raw){const copy=raw.cloneNode(true);copy.querySelectorAll('input,textarea,button,.ia-campo-acoes').forEach(e=>e.remove());if(copy.textContent.trim())return copy.textContent.trim().slice(0,180);}
 if(c.dataset.obsGeral)return 'Observações gerais da Diagnóstica';if(c.dataset.obsKey){const copy=c.closest('.item-cell')?.cloneNode(true);copy?.querySelectorAll('input,textarea,button,.ia-campo-acoes,.obs-item-inline').forEach(e=>e.remove());return ('Observação da Diagnóstica: '+(copy?.textContent||'')).slice(0,180);}
 if(c.dataset.table){const cell=c.closest('td'),head=cell?.closest('table')?.querySelectorAll('th')[cell.cellIndex];return head?.textContent?.trim()||'Descrição pedagógica';}
 return c.getAttribute('aria-label')||c.dataset.bind||c.dataset.path||'Texto do professor';}
function existing(c){if(c.id==='entryText')return document.getElementById('btnMelhorarIA');if(c.id==='obsClinicas')return document.getElementById('btnIaObsClinicas');return c.closest('.ai-textarea-wrap,.obs-geral-wrap')?.querySelector('.ai-btn,.obs-geral-ia-btn');}
function ownPEI(c){return !!c.parentElement?.querySelector('.pei-ai');}
function scan(){for(const c of document.querySelectorAll('textarea,input[type="text"],input:not([type])')){
 if(c.closest('.ia-revisao'))continue;const reason=M.classificar(c),old=existing(c);
 if(reason!=='redacao'){const previous=map.get(c);if(previous){if(previous.bar)previous.bar.hidden=true;if(!previous.b.disabled)previous.b.disabled=true;}if(old){old.hidden=true;if(!old.disabled)old.disabled=true;}continue;}
 if(old&&old.hidden)old.hidden=false;
 if(c.id==='entryText'||ownPEI(c))continue;
 let item=map.get(c);if(!item){item={c,label:label(c),version:0,b:old};map.set(c,item);items.add(item);c.addEventListener('input',()=>{item.version++;if(active?.item===item){$('iaCamposAplicar').disabled=true;$('iaCamposStatus').textContent='O campo mudou. Solicite uma nova sugestão para o texto atual.';}});
 if(!old){const bar=n('span');bar.className='ia-campo-acoes';const b=n('button',c.id==='chatTexto'?'✨':c.closest('#plannerGrid')?'✨ IA':'✨ Melhorar com IA');b.type='button';b.className='ia-campo-botao';bar.append(b);c.insertAdjacentElement('afterend',bar);b.onclick=e=>{e.preventDefault();open(item);};item.b=b;item.bar=bar;}
 item.b.setAttribute('aria-label','Melhorar '+item.label+' com IA');item.b.title='Revisar este campo com IA — conferir antes de aplicar';}
 if(item.bar?.hidden)item.bar.hidden=false;const blocked=c.disabled||c.readOnly;if(item.b.disabled!==blocked)item.b.disabled=blocked;
 }
 for(const i of items)if(!i.c.isConnected){i.bar?.remove();items.delete(i);}if(active&&!valid(active))invalidate();
}
function valid(a){return a===active&&a.item.c.isConnected&&!a.item.c.disabled&&!a.item.c.readOnly&&M.classificar(a.item.c)==='redacao'&&same(a.ctx,context());}
function invalidate(){ticket++;active=null;if(dialog.open)dialog.close();$('iaCamposOriginal').value='';$('iaCamposSugestao').value='';$('iaCamposAplicar').disabled=true;}
function open(item){if(item.c.disabled||!auth()?.currentUser||M.classificar(item.c)!=='redacao')return;invalidate();active={item,ctx:context(),original:item.c.value,version:item.version,suggestion:''};$('iaCamposCampo').textContent=item.label;$('iaCamposOriginal').value=active.original;$('iaCamposOriginalDetalhes').open=false;$('iaCamposStatus').textContent='';$('iaCamposGerar').disabled=false;dialog.showModal();generate();}
async function generate(){const a=active;if(!a||!valid(a))return;const text=a.item.c.value;a.original=text;a.version=a.item.version;a.suggestion='';$('iaCamposOriginal').value=text;$('iaCamposSugestao').value='';$('iaCamposAplicar').disabled=true;
 if(!text.trim()){$('iaCamposStatus').textContent='Escreva algum texto no campo antes de pedir a revisão.';return;}
 if(!window.puter?.ai?.chat){$('iaCamposStatus').textContent='O serviço de IA está indisponível. Confira a conexão e tente novamente; seu texto foi mantido.';return;}
 const request=++ticket;$('iaCamposGerar').disabled=true;$('iaCamposStatus').textContent='Preparando sugestão…';
 try{const result=await M.revisar({texto:text,campo:a.item.label,maxCaracteres:a.item.c.maxLength,maxPalavras:a.item.c.id==='planoDescricao'?40:0,vigente:()=>request===ticket&&valid(a)&&a.item.c.value===text&&a.item.version===a.version,aoRepetir:()=>{$('iaCamposStatus').textContent='O serviço repetiu o texto. Solicitando outra redação…';}});
 a.suggestion=result;$('iaCamposSugestao').value=result;const error=M.limite(a.item.c,result);$('iaCamposStatus').textContent=error||'Revise a sugestão. O texto do campo ainda não foi alterado.';$('iaCamposAplicar').disabled=!!error;$('iaCamposSugestao').focus();
 }catch(e){if(request===ticket&&valid(a))$('iaCamposStatus').textContent=a.item.c.value!==text||a.item.version!==a.version?'O campo mudou durante a revisão. Seu texto foi mantido. Solicite uma nova sugestão.':e?.code==='sem-reformulacao'?e.message+' Nenhuma sugestão foi gerada; seu original foi mantido.':'Não foi possível gerar uma sugestão. Seu texto foi mantido. Tente novamente.';}
 finally{if(request===ticket&&active===a){if(!valid(a))invalidate();else $('iaCamposGerar').disabled=false;}}
}
$('iaCamposGerar').onclick=generate;$('iaCamposManter').onclick=invalidate;dialog.addEventListener('cancel',e=>{e.preventDefault();invalidate();});
$('iaCamposAplicar').onclick=()=>{const a=active;if(!a||!valid(a)||!a.suggestion||a.item.c.value!==a.original||a.item.version!==a.version){$('iaCamposAplicar').disabled=true;$('iaCamposStatus').textContent='O campo ou a sessão mudou. Solicite uma nova sugestão.';return;}
 const error=M.limite(a.item.c,a.suggestion);if(error){$('iaCamposStatus').textContent=error;return;}const c=a.item.c,value=a.suggestion;invalidate();c.value=value;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));c.focus();};
document.addEventListener('click',e=>{const b=e.target.closest('#btnIaObsClinicas,.ai-textarea-wrap .ai-btn,.obs-geral-ia-btn');if(!b)return;const c=b.id==='btnIaObsClinicas'?document.getElementById('obsClinicas'):b.closest('.ai-textarea-wrap,.obs-geral-wrap')?.querySelector('textarea');if(!c)return;e.preventDefault();e.stopImmediatePropagation();if(M.classificar(c)==='redacao'){scan();const i=map.get(c);if(i)open(i);}},true);
auth()?.onAuthStateChanged(()=>{session++;invalidate();});
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','readonly']});
scan();window.IACampos=Object.freeze({atualizar:scan,fechar:invalidate,abrirCampo:c=>{scan();const item=map.get(c);if(item&&M.classificar(c)==='redacao')open(item);}});
})();
