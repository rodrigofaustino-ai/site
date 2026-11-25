/* Abre a biblioteca do Diário em contexto próprio, sem misturar contas/projetos. */
(()=>{'use strict';let corrente=null;
 function escolher({auth,vigente}){corrente?.();return new Promise(resolve=>{
  const user=auth?.currentUser;if(!user||!vigente())return resolve(null);const token=crypto.randomUUID(),dialog=document.createElement('dialog'),frame=document.createElement('iframe'),close=document.createElement('button');let ended=false;
  dialog.className='assinaturas-conexao';dialog.setAttribute('aria-label','Biblioteca de assinaturas do Diário');close.type='button';close.textContent='Fechar biblioteca';frame.title='Escolher assinatura cadastrada';frame.src='biblioteca-assinaturas-janela.html#'+token;
  const valid=()=>!ended&&vigente()&&auth.currentUser?.uid===user.uid;
  const finish=value=>{if(ended)return;ended=true;clearTimeout(timer);removeEventListener('message',receive);off?.();dialog.close();dialog.remove();if(corrente===cancel)corrente=null;resolve(value);};const cancel=()=>finish(null);corrente=cancel;
  const receive=e=>{const m=e.data;if(e.origin!==location.origin||e.source!==frame.contentWindow||m?.canal!=='srm-assinaturas'||m.token!==token)return;if(!valid())return finish(null);if(m.acao==='pronto')frame.contentWindow.postMessage({canal:'srm-assinaturas',token,acao:'abrir',email:user.email},location.origin);else if(m.acao==='escolhida')finish(AssinaturasDocumentos.imagemValida(m.assinatura)&&typeof m.assinatura.nome==='string'&&typeof m.assinatura.cargo==='string'?m.assinatura:null);else if(m.acao==='fechar')finish(null);};
  const timer=setTimeout(cancel,15*60*1000);let off;addEventListener('message',receive);close.addEventListener('click',cancel);dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});dialog.append(close,frame);document.body.append(dialog);dialog.showModal();off=auth.onAuthStateChanged(current=>{if(current?.uid!==user.uid)cancel();});
 });}
 window.AssinaturasConexao=Object.freeze({escolher,fechar:()=>corrente?.()});
})();
