/* Gestão de convites e consulta privada; não preenche nem altera a avaliação pedagógica. */
(()=>{
 'use strict';
 const M=QuestionarioFamiliaModelo,n=(t,text)=>{const e=document.createElement(t);if(text!=null)e.textContent=text;return e;};
 let atual=null;
 const rotulosAntigos={observa:'Observa no cotidiano',as_vezes:'Às vezes',apoio:'Com apoio',ainda_nao:'Ainda não',nao_sabe:'Não sabe informar',nao_observou:'Ainda não observou',nao_informar:'Prefere não informar'};
 const antigos={comunica_escolha:'Comunicação de escolhas e vontades',comunica_chamado:'Resposta ao nome',comunica_fatos:'Relatos do cotidiano',leitura_nome:'Nome escrito',leitura_imagens:'Leitura de imagens',leitura_historia:'Histórias',escrita_registro:'Registros escritos',escrita_nome:'Escrita do nome',escrita_palavras:'Escrita de palavras',percepcao_comando:'Comandos',percepcao_textura:'Texturas',percepcao_objeto:'Objetos',avd_alimentacao:'Alimentação',avd_higiene:'Higiene',avd_vestir:'Vestuário',social_interacao:'Interação',social_emocoes:'Emoções',social_combinados:'Combinados',numeros_uso:'Uso dos números',numeros_quantidade:'Quantidade',numeros_compara:'Comparação',formas_iguais:'Igualdade e diferença',formas_reconhece:'Formas',formas_cores:'Cores',medidas_rotina:'Rotina',medidas_sequencia:'Sequência',medidas_espaco:'Espaço'};
 function fechar(){if(!atual)return;const a=atual;atual=null;a.unsubscribe?.();a.dialog.close();a.dialog.remove();a.foco?.focus();}
 function botao(text,fn,primario=false){const b=n('button',text);b.type='button';if(primario)b.className='primario';b.addEventListener('click',fn);return b;}
 const data=t=>t?.toDate?t.toDate().toLocaleString('pt-BR'):'Data não informada';
 const chave=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 function abrir(c){
  fechar();if(!c.uid||!c.aluno?.id||!c.vigente())return;
  const dialog=n('dialog');dialog.className='familia-dialog';dialog.setAttribute('aria-labelledby','familiaProfessorTitulo');document.body.append(dialog);
  const ctx={...c,dialog,foco:document.activeElement,ocupado:false,unsubscribe:null};atual=ctx;
  const valido=()=>atual===ctx&&c.vigente()&&c.auth.currentUser?.uid===c.uid;
  const close=botao('Fechar',fechar);close.className='familia-fechar';const title=n('h2','Questionário da família');title.id='familiaProfessorTitulo';dialog.append(close,title,n('p',c.aluno.nome||'Estudante'));
  const info=n('p','Gere um link para a família responder sem criar conta. O link vale por 30 dias e permite um único envio. Gerar outro link desativa o anterior; as respostas já enviadas são preservadas.');dialog.append(info);
  const periodLabel=n('label','Período de referência'),periodo=n('input');periodo.type='text';periodo.maxLength=80;periodo.value=(new Date().getMonth()<6?'1º':'2º')+' semestre de '+new Date().getFullYear();periodo.id='familiaPeriodo';periodLabel.htmlFor=periodo.id;dialog.append(periodLabel,periodo);
  const aviso=n('p');aviso.setAttribute('role','status');dialog.append(aviso);const box=n('div');dialog.append(box);
  const controls=n('div');controls.className='familia-acoes';dialog.append(controls);
  const lista=n('section');lista.append(n('h3','Respostas recebidas'));dialog.append(lista);
  let ponteiro=null,convite=null;
  const operacao=async(fn)=>{if(ctx.ocupado||!valido())return;ctx.ocupado=true;controls.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){if(valido())aviso.textContent=e.message?.startsWith('O cadastro')?e.message:'Não foi possível concluir. Confira a conexão e se as regras do questionário estão atualizadas. Nenhum sucesso foi confirmado.';}finally{ctx.ocupado=false;if(valido())controls.querySelectorAll('button').forEach(b=>b.disabled=false);}};
  async function carregar(){
   aviso.textContent='Consultando convite…';const p=await c.db.collection('questionariosFamilia').doc(c.aluno.id).get({source:'server'});if(!valido())return;
   ponteiro=p.exists?p.data():null;convite=null;
   if(ponteiro?.token){const d=await c.db.collection('convitesFamilia').doc(ponteiro.token).get({source:'server'});if(!valido())return;convite=d.exists?d.data():null;}
   mostrar();aviso.textContent='';await respostas();
  }
  function mostrar(){
   box.replaceChildren();if(!convite){box.append(n('p','Nenhum convite atual.'));return;}
   const ativo=convite.ativa&&convite.expiraEm?.toDate?.().getTime()>Date.now();
   box.append(n('p',(ativo?'Convite ativo':'Convite desativado ou expirado')+' · '+(convite.periodo||'Modelo anterior')+' · validade: '+data(convite.expiraEm)));
   if(ativo&&convite.versao===2){const url=new URL('questionario-familia.html',location.href);url.hash=new URLSearchParams({token:ponteiro.token}).toString();const l=n('label','Link exclusivo para esta família'),input=n('input');input.readOnly=true;input.className='familia-link';input.value=url.href;input.setAttribute('aria-label','Link do questionário');box.append(l,input,botao('Copiar link',async()=>{try{await navigator.clipboard.writeText(input.value);if(valido())aviso.textContent='Link copiado. Envie somente à família deste estudante.';}catch{input.select();aviso.textContent='Selecione e copie o link com Ctrl+C.';}}));}
   if(convite.versao===1)box.append(n('p','O convite anterior utiliza o modelo antigo. Gere um novo para as perguntas revisadas. As respostas antigas continuam disponíveis para consulta.'));
  }
  async function gerar(){
   const per=periodo.value.trim();if(!per){aviso.textContent='Informe o período de referência.';return;}
   const token=chave(),expiraEm=firebase.firestore.Timestamp.fromDate(new Date(Date.now()+30*86400000)),criadoEm=firebase.firestore.FieldValue.serverTimestamp();
   await c.db.runTransaction(async tx=>{
    const aluno=await tx.get(c.db.collection('alunos').doc(c.aluno.id)),p=await tx.get(c.db.collection('questionariosFamilia').doc(c.aluno.id));
    const velho=p.exists?p.data():null;if(velho?.token)await tx.get(c.db.collection('convitesFamilia').doc(velho.token));
    if(!valido()||!aluno.exists||aluno.data().professorUid!==c.uid||aluno.data().arquivado===true)throw new Error('O cadastro mudou ou foi arquivado. Reabra o aluno.');
    if(velho?.token)tx.update(c.db.collection('convitesFamilia').doc(velho.token),{ativa:false});
    tx.set(c.db.collection('convitesFamilia').doc(token),{professorUid:c.uid,alunoId:c.aluno.id,apelido:(aluno.data().nome||'Estudante').split(/\s+/)[0].slice(0,80),versao:2,periodo:per,ativa:true,criadoEm,expiraEm});
    tx.set(c.db.collection('questionariosFamilia').doc(c.aluno.id),{professorUid:c.uid,alunoId:c.aluno.id,token,ativa:true,criadoEm,expiraEm});
   });if(!valido())return;await carregar();if(valido())aviso.textContent='Link criado. Copie e envie à família.';
  }
  async function desativar(){
   if(!ponteiro?.token)return;const token=ponteiro.token;
   await c.db.runTransaction(async tx=>{const ref=c.db.collection('questionariosFamilia').doc(c.aluno.id),p=await tx.get(ref);if(!valido()||!p.exists||p.data().professorUid!==c.uid||p.data().token!==token)throw new Error('Convite mudou.');tx.update(c.db.collection('convitesFamilia').doc(token),{ativa:false});tx.update(ref,{ativa:false});});
   if(!valido())return;await carregar();if(valido())aviso.textContent='Link desativado. As respostas recebidas foram preservadas.';
  }
  async function respostas(){
   lista.replaceChildren(n('h3','Respostas recebidas'));const snapshots=await Promise.all(['respostasFamilia','respostasFamiliaCompletas'].map(nome=>c.db.collection(nome).where('professorUid','==',c.uid).get({source:'server'})));if(!valido())return;
   const docs=[];for(const snap of snapshots)snap.forEach(d=>{const r=d.data();if(r.alunoId===c.aluno.id&&r.professorUid===c.uid)docs.push({token:d.id,...r});});docs.sort((a,b)=>(b.enviadoEm?.toMillis?.()||0)-(a.enviadoEm?.toMillis?.()||0));
   if(!docs.length){lista.append(n('p','Nenhuma resposta recebida para este estudante.'));return;}
   for(const r of docs){const details=n('details');details.append(n('summary',data(r.enviadoEm)+' · '+r.responsavel+' · '+(r.versao===2?'Modelo completo':'Modelo anterior')));details.append(n('p','Vínculo: '+r.vinculo));
    if(r.contexto)details.append(n('p','Contexto: '+r.contexto));
    if(r.versao===2){
     const areas=await c.db.collection('respostasFamiliaCompletas').doc(r.token).collection('areas').get({source:'server'});if(!valido())return;r.respostas={};r.observacoesPerguntas={};areas.forEach(d=>{Object.assign(r.respostas,d.data().respostas||{});Object.assign(r.observacoesPerguntas,d.data().observacoesPerguntas||{});});
     const ci=await c.db.collection('convitesFamilia').doc(r.token).get({source:'server'});if(!valido())return;if(ci.exists)details.append(n('p','Referência: '+(ci.data().periodo||'Não informada')));
     for(const area of M.areas){const grupo=n('details');grupo.append(n('summary',area.titulo));for(const q of area.itens){const item=n('div');item.className='familia-resposta-item';item.append(n('strong',q.pergunta));const tec=n('p','Diagnóstica: '+q.item);tec.className='familia-tecnico';item.append(tec,n('p',M.rotulo(q,r.respostas?.[q.id])||'Não informado'));if(r.observacoesPerguntas?.[q.id]){const texto=n('p',r.observacoesPerguntas[q.id]);texto.className='familia-relato';item.append(texto);}grupo.append(item);}details.append(grupo);}
    }else{for(const [key,value]of Object.entries(r.respostas||{})){details.append(n('p',(antigos[key]||key)+': '+(rotulosAntigos[value]||value)));if(r.observacoesPerguntas?.[key])details.append(n('p',r.observacoesPerguntas[key]));}}
    if(r.observacoes){const texto=n('p','Informações finais: '+r.observacoes);texto.className='familia-relato';details.append(texto);}const nota=n('p','Relato da família para consulta. Não altera marcações S/N/P, frequência, assinaturas ou textos já salvos da Diagnóstica.');nota.className='familia-somente-consulta';details.append(nota);lista.append(details);
   }
  }
  controls.append(botao('Gerar novo link',()=>operacao(gerar),true),botao('Desativar link',()=>operacao(desativar)),botao('Atualizar respostas',()=>operacao(carregar)));
  dialog.addEventListener('cancel',e=>{e.preventDefault();fechar();});dialog.showModal();
  ctx.unsubscribe=c.auth.onAuthStateChanged(()=>{if(!valido())fechar();});operacao(carregar);
 }
 window.QuestionarioFamilia={abrir,fechar};
})();
