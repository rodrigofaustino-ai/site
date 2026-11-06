/* Upload explícito e leitura autenticada. Não cria URLs públicas com token. */
(()=>{'use strict';const M=ChatAnexosModelo;
 function criar({auth,storage,status,render}){
  let arquivo=null,meta=null,preview=null,geracao=0,ocupado=false,tarefa=null,sessao=0,validando=false;
  const cache=new Map(),pendentes=new Map(),ativos=new Map(),abortadores=new Set();let bytes=0;
  const form=document.getElementById('chatForm'),texto=document.getElementById('chatTexto');texto.required=false;
  const campo=document.createElement('input');campo.type='file';campo.id='chatArquivo';campo.hidden=true;campo.accept=Object.keys(M.tipos).map(x=>'.'+x).join(',');
  const b=document.createElement('button');b.type='button';b.id='chatAnexar';b.textContent='📎';b.title='Anexar imagem ou arquivo';b.setAttribute('aria-label','Anexar imagem ou arquivo');
  const box=document.createElement('section');box.id='chatAnexoSelecionado';box.hidden=true;box.setAttribute('aria-label','Arquivo selecionado');form.append(campo,b,box);
  const n=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
  function mostrar(){box.replaceChildren();box.hidden=!arquivo;if(!arquivo)return;
   if(M.imagem(meta.tipo)){const img=n('img');img.src=preview;img.alt='Prévia do arquivo selecionado';box.append(img);}
   box.append(n('span',meta.nome+' · '+M.tamanho(meta.tamanho)));const remover=n('button','Remover anexo');remover.type='button';remover.disabled=ocupado;remover.addEventListener('click',()=>{if(!ocupado)limparSelecao();});box.append(remover);
  }
  function limparSelecao(){geracao++;validando=false;if(preview)URL.revokeObjectURL(preview);preview=null;arquivo=null;meta=null;campo.value='';mostrar();}
  b.addEventListener('click',()=>{if(!ocupado&&auth.currentUser)campo.click();});
  campo.addEventListener('change',async()=>{
   const file=campo.files[0];if(!file||ocupado)return;limparSelecao();const g=geracao,uid=auth.currentUser?.uid;if(!uid)return;validando=true;status('Conferindo o arquivo selecionado…');let proximaPreview=null;
   try{const info=await M.validar(file);if(g!==geracao||auth.currentUser?.uid!==uid)return;
    if(M.imagem(info.tipo)){proximaPreview=URL.createObjectURL(file);const img=new Image();img.src=proximaPreview;try{await img.decode();}catch{throw Error('Não foi possível abrir essa imagem. Escolha outro arquivo.');}}
    if(g!==geracao||auth.currentUser?.uid!==uid)return;arquivo=file;meta=info;preview=proximaPreview;mostrar();status('Arquivo selecionado. Confira e clique em Enviar. Um arquivo por mensagem, até 10 MB.');
   }catch(e){if(g===geracao)status(e.message);}finally{if(proximaPreview&&proximaPreview!==preview)URL.revokeObjectURL(proximaPreview);if(g===geracao){validando=false;campo.value='';}}
  });
  function bloqueado(v){ocupado=v;b.disabled=v;campo.disabled=v;box.querySelectorAll('button').forEach(x=>x.disabled=v);}
  async function enviar(attempt,owner,vigente){
   if(!attempt.arquivo)return null;if(attempt.anexoPronto)return attempt.anexoPronto;
   const info=attempt.infoAnexo,ref=storage.ref(M.caminho(owner.uid,attempt.ref.id));
   // Um upload com confirmação perdida é reconhecido antes de repetir. O código não reenvia um objeto já confirmado.
   let existente=null;try{existente=await ref.getMetadata();}catch(e){if(e.code!=='storage/object-not-found')throw e;}
   if(!vigente())throw Error('Sessão encerrada.');
   if(existente){if(Number(existente.size)!==info.tamanho||existente.contentType!==info.tipo||existente.customMetadata?.nomeOriginal!==info.nome)throw Error('Arquivo incompatível com a tentativa anterior.');}
   else{
    const upload=ref.put(attempt.arquivo,{contentType:info.tipo,customMetadata:{nomeOriginal:info.nome}});tarefa=upload;
    if(typeof upload.on==='function')upload.on('state_changed',s=>{if(vigente())status('Enviando arquivo… '+Math.round(s.bytesTransferred/Math.max(1,s.totalBytes)*100)+'%');});
    try{await upload;}finally{if(tarefa===upload)tarefa=null;}
   }
   if(!vigente())throw Error('Sessão encerrada.');attempt.anexoPronto={...info,caminho:ref.fullPath};return attempt.anexoPronto;
  }
  function retirar(id){const x=cache.get(id);if(x){URL.revokeObjectURL(x.url);bytes-=x.blob.size;cache.delete(id);}}
  function sincronizar(messages){ativos.clear();for(const m of messages)if(!m.apagada&&!m._indisponivel&&M.metaValida(m.anexo,m))ativos.set(m.id,m);
   for(const id of cache.keys())if(!ativos.has(id)||cache.get(id).caminho!==ativos.get(id).anexo.caminho)retirar(id);
   for(const [id,x]of pendentes)if(!ativos.has(id)){x.abort.abort();pendentes.delete(id);}
  }
  async function obter(m){
   const owner=auth.currentUser,g=sessao;if(!owner||!M.metaValida(m.anexo,m)||!ativos.has(m.id))throw Error('Anexo indisponível.');
   if(cache.has(m.id))return cache.get(m.id);
   if(pendentes.has(m.id))return pendentes.get(m.id).promessa;
   const abort=new AbortController();abortadores.add(abort);
   const promessa=(async()=>{const token=await owner.getIdToken();const bucket=storage.ref().bucket;
    const response=await fetch('https://firebasestorage.googleapis.com/v0/b/'+encodeURIComponent(bucket)+'/o/'+encodeURIComponent(m.anexo.caminho)+'?alt=media',{headers:{Authorization:'Firebase '+token},credentials:'omit',cache:'no-store',signal:abort.signal});
    if(!response.ok)throw Error('Não foi possível acessar o anexo.');const blob=await response.blob();
    if(blob.size!==m.anexo.tamanho||blob.size>M.limite)throw Error('O arquivo recebido não corresponde ao anexo.');
    if(g!==sessao||auth.currentUser?.uid!==owner.uid||!ativos.has(m.id)||ativos.get(m.id).anexo.caminho!==m.anexo.caminho)throw Error('Anexo indisponível.');
    while(cache.size>=8||bytes+blob.size>40*1048576)retirar(cache.keys().next().value);
    const x={blob,url:URL.createObjectURL(new Blob([blob],{type:m.anexo.tipo})),caminho:m.anexo.caminho};cache.set(m.id,x);bytes+=blob.size;return x;
   })();pendentes.set(m.id,{promessa,abort});try{return await promessa;}finally{if(pendentes.get(m.id)?.promessa===promessa)pendentes.delete(m.id);abortadores.delete(abort);}
  }
  function montar(m){
   if(!M.metaValida(m.anexo,m)||m.apagada||m._indisponivel)return null;const box=n('section');box.className='chat-anexo';box.setAttribute('aria-label','Anexo: '+m.anexo.nome);box.addEventListener('click',e=>e.stopPropagation());
   box.append(n('strong',m.anexo.nome),n('small',M.tamanho(m.anexo.tamanho)));const existe=cache.get(m.id);
   if(M.imagem(m.anexo.tipo)){
    if(existe){const img=n('img');img.src=existe.url;img.alt=m.anexo.nome;box.append(img);}
    const ver=n('button',existe?'Ocultar imagem':'Ver imagem / GIF');ver.type='button';ver.disabled=pendentes.has(m.id);ver.addEventListener('click',async e=>{e.stopPropagation();if(existe){retirar(m.id);render();return;}ver.disabled=true;try{await obter(m);render();}catch(_){status('Não foi possível abrir a imagem. Confira a conexão e tente novamente.');}finally{if(ver.isConnected)ver.disabled=false;}});box.append(ver);
   }
   const baixar=n('button','Baixar arquivo');baixar.type='button';baixar.addEventListener('click',async e=>{e.stopPropagation();baixar.disabled=true;try{const x=await obter(m);if(!auth.currentUser||!ativos.has(m.id))return;const a=n('a');a.href=x.url;a.download=m.anexo.nome;document.body.append(a);a.click();a.remove();status('Download solicitado: '+m.anexo.nome+'. Confira a pasta Downloads.');}catch(_){status('Não foi possível baixar o arquivo. Confira a conexão e tente novamente.');}finally{if(baixar.isConnected)baixar.disabled=false;}});box.append(baixar);return box;
  }
  function limpar(){sessao++;limparSelecao();const upload=tarefa;tarefa=null;upload?.cancel?.();for(const a of abortadores)a.abort();abortadores.clear();pendentes.clear();ativos.clear();for(const id of [...cache.keys()])retirar(id);bloqueado(false);}
  async function apagar(a,uid){if(!a||typeof a.caminho!=='string'||auth.currentUser?.uid!==uid||!a.caminho.startsWith('chatAnexos/'+uid+'/'))return;try{await storage.ref(a.caminho).delete();}catch{/* O acesso é bloqueado pelas regras assim que a mensagem é apagada. */}}
  return {get validando(){return validando;},get arquivo(){return arquivo;},get meta(){return meta;},limparSelecao,bloqueado,enviar,sincronizar,montar,limpar,apagar};
 }
 window.ChatAnexos=Object.freeze({criar});
})();
