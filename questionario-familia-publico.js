/* Página pública: somente convite mínimo e envio único; nenhuma leitura do cadastro. */
(async()=>{
 'use strict';
 const M=QuestionarioFamiliaModelo,root=document.getElementById('familiaConteudo'),status=document.getElementById('familiaStatus');
 const n=(t,text)=>{const e=document.createElement(t);if(text!=null)e.textContent=text;return e;};
 const token=new URLSearchParams(location.hash.slice(1)).get('token');
 const envioId=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
 let convite,db,etapa=0,enviando=false,enviado=false,avisoPendenciasMostrado=false;
 const dados={responsavel:'',vinculo:'',contexto:'',observacoes:'',ciencia:false,respostas:{},observacoesPerguntas:{}};
 const paginas=M.grupos.flatMap(g=>Array.from({length:Math.ceil(g.itens.length/5)},(_,i)=>({...g,parte:i+1,partes:Math.ceil(g.itens.length/5),itens:g.itens.slice(i*5,i*5+5)})));
 function mensagem(text,erro=false){status.textContent=text;status.className=erro?'familia-erro':'';}
 function botao(text,fn,primario=false){const b=n('button',text);b.type='button';if(primario)b.className='primario';b.addEventListener('click',fn);return b;}
 function campo(parent,label,key,limite,textarea=false){const l=n('label',label),e=n(textarea?'textarea':'input');e.id='familia-'+key;if(!textarea)e.type='text';e.maxLength=limite;e.value=dados[key];l.htmlFor=e.id;e.addEventListener('input',()=>dados[key]=e.value);parent.append(l,e);return e;}
 function foco(){root.querySelector('h1,h2')?.focus();window.scrollTo({top:0});}
 function cabecalho(card,titulo){const h=n(etapa===0?'h1':'h2',titulo);h.tabIndex=-1;card.append(h);}
 function resposta(q,card){
  const f=n('fieldset');f.dataset.item=q.id;f.append(n('legend',q.pergunta));
  const descritivo=q.tipo==='descricao',opts=M.opcoesDaPergunta(q);
  const ta=n('textarea');ta.id='nota-'+q.id;ta.maxLength=1000;ta.value=dados.observacoesPerguntas[q.id]||'';ta.addEventListener('input',()=>{dados.observacoesPerguntas[q.id]=ta.value;if(descritivo&&ta.value.trim()){dados.respostas[q.id]='relato';f.querySelector('input[value=relato]').checked=true;}});
  for(const [key,text]of Object.entries(opts)){const label=n('label');label.className='familia-opcao';const input=n('input');input.type='radio';input.name=q.id;input.value=key;input.checked=dados.respostas[q.id]===key;input.addEventListener('change',()=>{dados.respostas[q.id]=key;if((descritivo&&key!=='relato')||key==='nao_informar'){dados.observacoesPerguntas[q.id]='';ta.value='';}if(!descritivo)ta.disabled=key==='nao_informar';});label.append(input,n('span',text));f.append(label);}
  if(!descritivo)ta.disabled=dados.respostas[q.id]==='nao_informar';
  const label=n('label',descritivo?'Conte com suas palavras':'Exemplo ou apoio utilizado (opcional)');label.htmlFor=ta.id;if(descritivo){f.append(label,ta);}else{const extra=n('details');extra.open=!!ta.value;extra.append(n('summary','Acrescentar exemplo ou explicar o apoio (opcional)'),label,ta);f.append(extra);}card.append(f);
 }
 function confirmarPendencias(lista,acao){
  const faltantes=M.pendentes(lista,dados);if(!faltantes.length)return true;
  const texto=faltantes.length===1?'Há uma questão sem resposta.':'Há '+faltantes.length+' questões sem resposta.';
  const local=document.getElementById('familiaPendencias')||status;
  if(!avisoPendenciasMostrado){
   avisoPendenciasMostrado=true;
   local.textContent=texto+' Você pode responder agora ou clicar novamente em “'+acao+'” para prosseguir sem responder.'+'\n\n'+faltantes.slice(0,3).map(q=>'• '+q.pergunta).join('\n')+(faltantes.length>3?'\nOutras '+(faltantes.length-3)+' questões estão indicadas na revisão.':'');
   root.querySelectorAll('fieldset').forEach(f=>f.classList.toggle('familia-sem-resposta',faltantes.some(q=>q.id===f.dataset.item)));
   return false;
  }
  return window.confirm(texto+' As respostas ajudam a conhecer melhor a criança e planejar as melhores estratégias para auxiliá-la. Deixar questões em branco pode dificultar esse planejamento. Deseja '+(acao==='Enviar respostas'?'enviar':'avançar')+' mesmo sem essas respostas?');
 }
 function avisoPendencias(card){const p=n('p');p.id='familiaPendencias';p.className='familia-erro';p.setAttribute('role','status');p.setAttribute('aria-live','polite');card.append(p);}
 function render(){
  root.replaceChildren();mensagem('');avisoPendenciasMostrado=false;const card=n('div');card.className='familia-cartao';root.append(card);
  if(etapa===0){
   cabecalho(card,'Olá, família!');card.append(n('p','Sua participação ajuda a conhecer o estudante e planejar os apoios na escola. Responda sobre o que já observa; não é uma prova e não é necessário testar ou ensinar para responder.'));
   const info=n('p','Estudante: '+convite.apelido+' · '+convite.periodo);info.className='familia-nota';card.append(info,n('p','Não é necessário criar uma conta. O questionário tem 27 perguntas ou grupos, divididos em pequenas telas. Alguns grupos têm respostas separadas para cada atividade. Você pode marcar “não sei” ou “prefiro não informar”. Também pode deixar questões em branco; o formulário avisará antes de prosseguir.'));
   campo(card,'Seu nome','responsavel',120);campo(card,'Vínculo com o estudante (ex.: mãe, pai, avó, responsável)','vinculo',80);
   campo(card,'Em quais momentos convive com o estudante? Que recursos ou adaptações ele costuma utilizar? (opcional)','contexto',2000,true);
   const aviso=n('p','As respostas serão guardadas para consulta do professor responsável pelo convite e usadas para apoiar o planejamento pedagógico. Este link permite um único envio. Não compartilhe o link com outras pessoas. O texto fica apenas nesta página até o envio; se fechar ou recarregar, terá que preencher novamente.');aviso.className='familia-nota';card.append(aviso);
   const l=n('label');l.className='familia-opcao';const check=n('input');check.type='checkbox';check.checked=dados.ciencia;check.addEventListener('change',()=>dados.ciencia=check.checked);l.append(check,n('span','Li as informações sobre o uso das respostas.'));card.append(l);
   card.append(botao('Começar',()=>{if(!dados.responsavel.trim()||!dados.vinculo.trim()||!dados.ciencia){mensagem('Informe seu nome, vínculo e leia as informações sobre o uso das respostas.',true);return;}etapa=1;render();},true));
  }else if(etapa<=paginas.length){
   const p=paginas[etapa-1];cabecalho(card,p.titulo);card.append(n('p','Grupo '+p.numero+' de '+M.grupos.length+(p.partes>1?' · parte '+p.parte+' de '+p.partes:'')));
   const progress=n('progress');progress.max=paginas.length+1;progress.value=etapa;progress.setAttribute('aria-label','Progresso do questionário');card.append(progress);
   const nota=n('p','Considere os recursos que utiliza. Precisar de acessibilidade não significa não saber. Se não teve oportunidade de observar, marque essa opção.');nota.className='familia-nota';card.append(nota,n('p',p.ajuda));
   p.itens.forEach(q=>resposta(q,card));avisoPendencias(card);const actions=n('div');actions.className='familia-acoes';actions.append(botao('Voltar',()=>{etapa--;render();}),botao('Continuar',()=>{if(!confirmarPendencias(p.itens,'Continuar'))return;etapa++;render();},true));card.append(actions);
  }else{
   cabecalho(card,'Conferir e enviar');card.append(n('p','Confira suas respostas. As informações da família complementam a avaliação realizada pelos profissionais da escola.'));
   campo(card,'Pontos fortes, interesses, mudanças recentes, prioridades ou outras informações que gostaria de compartilhar (opcional)','observacoes',2000,true);
   for(const area of M.areas){const details=n('details');details.append(n('summary',area.titulo));for(const q of area.itens){details.append(n('p',q.pergunta),n('p',M.rotulo(q,dados.respostas[q.id])||'Não respondido'));if(dados.observacoesPerguntas[q.id])details.append(n('p',dados.observacoesPerguntas[q.id]));}card.append(details);}
   const faltantes=M.pendentes(M.itens,dados);if(faltantes.length){const info=n('p',faltantes.length+' questão(ões) sem resposta. Elas serão encaminhadas ao professor como “Sem resposta”.');info.className='familia-nota';card.append(info);}avisoPendencias(card);
   const actions=n('div');actions.className='familia-acoes';actions.append(botao('Voltar',()=>{etapa--;render();}),botao('Enviar respostas',enviar,true));card.append(actions);
  }
  foco();
 }
 function sucesso(){enviado=true;root.replaceChildren();const card=n('div');card.className='familia-cartao';const h=n('h1','Respostas enviadas!');h.tabIndex=-1;const check=n('div','✓');check.className='familia-sucesso';check.setAttribute('aria-hidden','true');card.append(check,h,n('p','Obrigado pela participação. O professor poderá consultar suas respostas para apoiar o planejamento pedagógico.'),n('p','Você pode fechar esta página.'));const nota=n('p','Este questionário complementa as informações da escola. A avaliação pedagógica é realizada pelos profissionais responsáveis.');nota.className='familia-nota';card.insertBefore(nota,card.lastChild);root.append(card);mensagem('Envio concluído.');Object.keys(dados).forEach(k=>delete dados[k]);foco();}
 async function enviar(){
  if(enviando||enviado)return;const erro=M.validar(dados);if(erro){mensagem(erro,true);return;}if(!confirmarPendencias(M.itens,'Enviar respostas'))return;
  enviando=true;root.querySelectorAll('button,input,textarea').forEach(e=>e.disabled=true);mensagem('Enviando respostas…');
  try{
   const b=db.batch(),ts=firebase.firestore.FieldValue.serverTimestamp();
   const observacoesPerguntas=dados.observacoesPerguntas,respostas=M.prepararRespostas(dados),identificacao={responsavel:dados.responsavel,vinculo:dados.vinculo,contexto:dados.contexto,observacoes:dados.observacoes,ciencia:dados.ciencia};
   const ref=db.collection('respostasFamiliaCompletas').doc(token);
   b.set(ref,{...identificacao,professorUid:convite.professorUid,alunoId:convite.alunoId,versao:2,envioId,enviadoEm:ts});
   for(const area of M.areas){const r={},notas={};for(const q of area.itens){r[q.id]=respostas[q.id];if(observacoesPerguntas[q.id]?.trim())notas[q.id]=observacoesPerguntas[q.id];}b.set(ref.collection('areas').doc(area.key),{respostas:r,observacoesPerguntas:notas,enviadoEm:ts});}
   b.set(db.collection('enviosFamilia').doc(token),{enviadoEm:ts,envioId});await b.commit();sucesso();
  }catch(_){
   try{const sent=await db.collection('enviosFamilia').doc(token).get({source:'server'});if(sent.exists){if(sent.data().envioId===envioId)sucesso();else{enviado=true;mensagem('Este questionário já foi enviado em outra sessão. Este preenchimento não foi salvo. Se precisar complementar informações, procure o professor.',true);}return;}}catch{}
   mensagem('Não foi possível confirmar o envio. Suas respostas continuam nesta página. Confira sua conexão e tente novamente. Se o link expirou ou foi desativado, peça orientação ao professor.',true);
  }finally{enviando=false;if(!enviado)root.querySelectorAll('button,input,textarea').forEach(e=>e.disabled=false);}
 }
 window.addEventListener('beforeunload',e=>{if(!enviado&&(dados.responsavel||Object.keys(dados.respostas).length)){e.preventDefault();e.returnValue='';}});
 try{
  if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))throw new Error('link');
  const app=SRMInicializarFirebase();db=firebase.firestore(app);
  const doc=await db.collection('convitesFamilia').doc(token).get({source:'server'});convite=doc.data();
  if(!doc.exists||!convite?.ativa||convite.versao!==2||!convite.expiraEm?.toDate||convite.expiraEm.toDate().getTime()<=Date.now())throw new Error('link');
  const sent=await db.collection('enviosFamilia').doc(token).get({source:'server'});
  if(sent.exists){enviado=true;mensagem('Este questionário já foi enviado. Se precisar complementar alguma informação, procure o professor.');return;}
  render();
 }catch(_){mensagem('Não foi possível abrir este questionário. O link pode ter expirado, sido desativado ou a conexão estar indisponível. Peça ao professor um novo link, se necessário.',true);}
})();
