/* Uma imagem opcional por comunicado. Leitura autenticada, sem URL pública. */
(()=>{'use strict';
function criar({auth,status}){
 const M=ChatAnexosModelo,$=id=>document.getElementById(id),storage=()=>firebase.storage();
 let file=null,info=null,preview=null,selection=0,checking=false,locked=false,upload=null,display=0,url=null,abort=null;
 const input=$('comunicadosArquivo'),draft=$('comunicadosImagemPrevia'),remove=$('comunicadosImagemRemover'),box=$('comunicadosImagem');
 function clear(){selection++;checking=false;file=null;info=null;input.value='';if(preview)URL.revokeObjectURL(preview);preview=null;draft.replaceChildren();remove.hidden=true;}
 input.onchange=async()=>{const candidate=input.files[0];if(!candidate||locked)return;clear();const s=selection,u=auth.currentUser;if(!u)return;checking=true;status('Conferindo a imagem…');let local;
 try{const meta=await M.validar(candidate);if(!M.imagem(meta.tipo))throw Error('Use uma imagem JPG, PNG, GIF ou WEBP.');local=URL.createObjectURL(candidate);const img=new Image();img.src=local;await img.decode();if(s!==selection||auth.currentUser?.uid!==u.uid)return;
 file=candidate;info=meta;preview=local;img.alt='Prévia da imagem selecionada';draft.append(img,document.createTextNode(meta.nome+' · '+M.tamanho(meta.tamanho)));remove.hidden=false;status('Imagem selecionada. Confira a prévia antes de publicar.');
 }catch(e){if(s===selection)status(e.message||'Não foi possível abrir a imagem.');}finally{if(local&&local!==preview)URL.revokeObjectURL(local);if(s===selection){checking=false;input.value='';}}};
 remove.onclick=()=>{if(!locked){clear();status('Imagem removida.');}};
 function lock(v){locked=v;input.disabled=v;remove.disabled=v;}
 async function send(attempt,u,vigente){if(!attempt.file)return null;if(attempt.imagemPronta)return attempt.imagemPronta;
 const meta=attempt.info,ref=storage().ref('comunicadosImagens/'+u.uid+'/'+attempt.ref.id+'/imagem');let old;
 try{old=await ref.getMetadata();}catch(e){if(e.code!=='storage/object-not-found')throw e;}if(!vigente())throw Error('Sessão encerrada.');
 if(old){if(Number(old.size)!==meta.tamanho||old.contentType!==meta.tipo||old.customMetadata?.nomeOriginal!==meta.nome)throw Error('Imagem incompatível com esta tentativa.');}
 else{const task=ref.put(attempt.file,{contentType:meta.tipo,customMetadata:{nomeOriginal:meta.nome}});upload=task;status('Enviando imagem…');try{await task;}finally{if(upload===task)upload=null;}}
 if(!vigente())throw Error('Sessão encerrada.');return attempt.imagemPronta={...meta,caminho:ref.fullPath};
 }
 function clearDisplay(){display++;abort?.abort();abort=null;if(url)URL.revokeObjectURL(url);url=null;box.replaceChildren();box.hidden=true;}
 function show(m){clearDisplay();if(!m.imagem)return;box.hidden=false;const tokenDisplay=display,u=auth.currentUser,a=m.imagem;const note=document.createElement('p'),retry=document.createElement('button');retry.type='button';retry.textContent='Tentar carregar imagem novamente';box.append(note,retry);
 const valid=()=>display===tokenDisplay&&auth.currentUser?.uid===u?.uid;
 async function load(){if(!u||!valid())return;retry.hidden=true;note.textContent='Carregando imagem…';const controller=new AbortController();abort=controller;let local;
 try{if(!M.imagem(a.tipo)||!Number.isInteger(a.tamanho)||a.tamanho<1||a.tamanho>M.limite||a.caminho!=='comunicadosImagens/'+m.autorUid+'/'+m.id+'/imagem')throw Error('Imagem inválida.');const token=await u.getIdToken();if(!valid())return;
 const r=await fetch('https://firebasestorage.googleapis.com/v0/b/'+encodeURIComponent(storage().ref().bucket)+'/o/'+encodeURIComponent(a.caminho)+'?alt=media',{headers:{Authorization:'Firebase '+token},credentials:'omit',cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Sem acesso à imagem.');const blob=await r.blob();if(blob.size!==a.tamanho)throw Error('Tamanho diferente.');if(!valid())return;
 local=URL.createObjectURL(new Blob([blob],{type:a.tipo}));const img=new Image();img.src=local;img.alt='Imagem do comunicado: '+m.titulo;await img.decode();if(!valid())return;url=local;note.remove();retry.remove();box.append(img);
 }catch(e){if(valid()){note.textContent='Não foi possível carregar a imagem. Confira a conexão e tente novamente.';retry.hidden=false;}}
 finally{if(local&&local!==url)URL.revokeObjectURL(local);if(abort===controller)abort=null;}}
 retry.onclick=load;load();
 }
 function reset(){clear();clearDisplay();const task=upload;upload=null;task?.cancel?.();lock(false);}
 return {get file(){return file;},get info(){return info;},get checking(){return checking;},clear,lock,send,show,clearDisplay,reset};
}
window.ComunicadosImagens={criar};
})();
