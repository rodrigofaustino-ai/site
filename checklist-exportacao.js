/* Confirma a marcação na sessão do Diário, sem modificar o documento exportado. */
(()=>{'use strict';
async function registrar({tipo,alunoId,user,vigente}){
 if(window.SRMExportacaoWorker)return true;
 if(!user?.email||!alunoId||!vigente())return false;
 return new Promise(resolve=>{const frame=document.createElement('iframe'),token=crypto.randomUUID();frame.hidden=true;frame.title='Atualizar check-list de documentos';frame.src='checklist-exportacao-janela.html#'+token;let ended=false;
 const finish=ok=>{if(ended)return;ended=true;clearTimeout(timer);removeEventListener('message',receive);frame.remove();resolve(ok);};
 const receive=e=>{const m=e.data;if(e.source!==frame.contentWindow||e.origin!==location.origin||m?.canal!=='srm-checklist'||m.token!==token)return;if(!vigente())return finish(false);if(m.acao==='pronto')frame.contentWindow.postMessage({canal:m.canal,token,acao:'registrar',tipo,alunoId,email:user.email},location.origin);else if(m.acao==='salvo')finish(true);else if(m.acao==='erro')finish(false);};
 const timer=setTimeout(()=>finish(false),15000);addEventListener('message',receive);document.body.append(frame);
 });
}
window.ChecklistExportacao={registrar};
})();
