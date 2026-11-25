/* Continuidade explícita: não extrai encaminhamentos de relatos antigos nem usa IA. */
(() => {
 'use strict';
 function compor(texto,passo){
  const relato=String(texto||'').trim(),proximo=String(passo||'').trim();
  if(proximo.length>2000)throw Error('O próximo passo deve ter até 2.000 caracteres.');
  const bloco='Próximo passo:\n'+proximo;
  return {text:!proximo||relato===bloco||relato.endsWith('\n\n'+bloco)?relato:relato+'\n\n'+bloco,...(proximo?{proximoPasso:proximo}:{})};
 }
 function recentes(registros,hoje){
  const validos=registros.filter(r=>window.RegistroAssistido.dataValida(r.date)&&r.date<=hoje);
  if(!validos.length)return [];
  const dia=validos.reduce((s,r)=>r.date>s?r.date:s,'');
  return validos.filter(r=>r.date===dia).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a._id||'').localeCompare(String(b._id||'')));
 }
 function render({registros,status,contexto}){
  const root=document.getElementById('continuidadeAtendimento');if(!root)return;root.replaceChildren();root.hidden=!contexto;if(!contexto)return;
  const n=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
  root.append(n('h3','Continuidade para o próximo encontro'));
  if(status!=='pronto'){root.append(n('p',status==='erro'?'Não foi possível confirmar o histórico. Reabra a ficha antes de consultar a orientação anterior.':'Carregando o último atendimento registrado…'));return;}
  const selecionados=recentes(registros,RegistroAssistido.hoje());
  if(!selecionados.length){root.append(n('p','Ainda não há atendimento com data válida até hoje para consultar a continuidade.'));return;}
  const data=selecionados[0].date.split('-').reverse().join('/');
  root.append(n('p',(selecionados.length>1?'Há '+selecionados.length+' registros na data mais recente: ':'Última data de atendimento registrada: ')+data+'.'));
  for(const registro of selecionados){
   const box=n('div');box.className='continuidade-item';
   if(registro.por)box.append(n('small','Registrado por: '+registro.por));
   const texto=typeof registro.proximoPasso==='string'?registro.proximoPasso.trim():'';
   box.append(n('p',texto||'Este registro não tem o campo Próximo passo preenchido. Consulte o relato no histórico.'));root.append(box);
  }
  root.append(n('small','Orientação registrada pelo professor, sujeita à sua avaliação no novo encontro. Registros com data futura ficam fora deste quadro. O conteúdo não é copiado automaticamente para o novo relato.'));
 }
 window.ProximoPasso=Object.freeze({compor,recentes,render});
})();
