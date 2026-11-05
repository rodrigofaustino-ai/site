/* Associação automática de legado único, pelo nome, dentro da conta autenticada. */
(() => {
  'use strict';
  const normalizar = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

  function selecionar(docs, alunoId, nome) {
    if (!alunoId) return {tipo: 'sem-id'};
    const vinculados = docs.filter(doc => doc.data().alunoId === alunoId);
    if (vinculados.length > 1) return {tipo: 'ambiguo'};
    if (vinculados.length === 1) return {tipo: 'existente', doc: vinculados[0]};
    const antigos = docs.filter(doc => normalizar(nome) && !doc.data().alunoId &&
      normalizar(doc.data().identificacao?.nome||doc.data().identificacao?.nomeAluno) === normalizar(nome));
    if(antigos.length&&docs.some(doc=>doc.data().alunoId&&doc.data().alunoId!==alunoId&&normalizar(doc.data().identificacao?.nome||doc.data().identificacao?.nomeAluno)===normalizar(nome)))return {tipo:'ambiguo'};
    if (antigos.length > 1) return {tipo: 'ambiguo'};
    if (antigos.length === 1) return {tipo: 'legado', doc: antigos[0]};
    return {tipo: 'novo'};
  }

  let geracao=0,pendente=null;
  function limpar(){geracao++;pendente=null;document.getElementById('vinculoAlunoAviso')?.remove();}
  function atualizar(){if(pendente&&!pendente.vigente())limpar();}
  function inconsistente(){const e=Error('Documento ambíguo ou alterado.');e.code='vinculo-inconsistente';return e;}
  async function vincular({db,ref,uid,alunoId,nome,docId,carregar,vigente}){
    const snapshot=await carregar();if(!vigente())throw Error('Contexto alterado.');
    const candidato=selecionar(snapshot.docs,alunoId,nome);
    if(!['legado','existente'].includes(candidato.tipo)||candidato.doc.id!==docId)throw inconsistente();
    let atualizado=null;
    await db.runTransaction(async tx=>{
      const doc=await tx.get(ref);
      if(!vigente())throw Error('Contexto alterado.');
      if(!doc.exists||doc.data().professorUid!==uid)throw inconsistente();
      const d=doc.data();if(d.alunoId===alunoId){atualizado={...d};return;}
      if(d.alunoId||(!normalizar(nome)||normalizar(d.identificacao?.nome||d.identificacao?.nomeAluno)!==normalizar(nome)))throw inconsistente();
      tx.update(ref,{alunoId});atualizado={...d,alunoId};
    });
    return {id:docId,data:()=>atualizado};
  }
  function oferecer(opcoes,doc,alunoId,nome,token){
    const estado=opcoes.estado(),vigente=()=>token===geracao&&opcoes.vigente()&&opcoes.estado()===estado&&estado.id===doc.id;
    pendente={vigente};const subtitulo=document.getElementById('form-subtitle');
    if(subtitulo)subtitulo.textContent='Documento antigo aberto. A associação automática não foi confirmada; use o botão abaixo para tentar novamente.';
    const root=document.createElement('section');root.id='vinculoAlunoAviso';root.setAttribute('aria-label','Confirmar aluno do documento');
    const n=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
    root.append(n('strong','Não foi possível concluir a associação automática'),n('p','O documento está aberto e seu texto foi mantido. Você pode tentar associar novamente sem salvar o formulário inteiro.'));
    const details=n('details');details.append(n('summary','Ver dados para conferência'));const d=doc.data();
    for(const texto of ['Aluno do Diário: '+nome,'Nome no documento: '+(d.identificacao?.nome||'não informado'),'Escola no documento: '+(d.identificacao?.escolaRegular||'não informada'),'Código do cadastro: '+alunoId,'Código do documento: '+doc.id])details.append(n('p',texto));root.append(details);
    const acoes=n('div'),button=n('button','Tentar associar novamente'),voltar=n('button','Voltar à lista');acoes.className='vinculo-aluno-acoes';button.type=voltar.type='button';button.className='btn';voltar.className='btn secondary';acoes.append(button,voltar);root.append(acoes);
    const status=n('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
    voltar.addEventListener('click',()=>{if(button.disabled)return;limpar();opcoes.voltar();});
    button.addEventListener('click',async()=>{
      if(button.disabled||!vigente())return;button.disabled=true;voltar.disabled=true;status.textContent='Confirmando a associação…';
      try{
        await vincular({db:opcoes.banco(),ref:opcoes.referencia(doc.id),uid:opcoes.uid,alunoId,nome,docId:doc.id,carregar:opcoes.carregar,vigente});
        if(!vigente())return;opcoes.confirmado(alunoId);limpar();
        if(subtitulo)subtitulo.textContent='Aluno confirmado. A associação já foi salva; use Salvar somente se alterar o conteúdo do formulário.';
      }catch(_){if(vigente()){status.textContent='Não foi possível confirmar. O texto do formulário foi mantido. Reabra o documento para conferir se houve mudança ou outro documento com o mesmo nome.';button.disabled=false;voltar.disabled=false;}}
    });
    const header=document.getElementById('view-form')?.querySelector('.form-header');if(header)header.after(root);else subtitulo?.after(root);
  }
  async function abrir(opcoes) {
    limpar();const token=geracao;
    const params = new URLSearchParams(window.location.search);
    const alunoId = (params.get('alunoId') || '').trim();
    const nome = (params.get('nome') || '').trim();
    if (!alunoId && !nome) return;
    if (!alunoId || /[\/\u0000-\u001f]/.test(alunoId) || alunoId.length > 1500) {
      opcoes.avisar('Abra o documento pela aba do aluno no Diário. Links antigos por nome não identificam o aluno com segurança.');
      return;
    }
    try {
      const snapshot = await opcoes.carregar();
      if(token!==geracao||!opcoes.vigente())return;
      const resultado = selecionar(snapshot.docs, alunoId, nome);
      if (resultado.tipo === 'ambiguo') {
        opcoes.avisar('Há mais de um documento candidato. Nenhum foi aberto ou vinculado automaticamente. Confira os documentos na lista.');
        return;
      }
      if (resultado.tipo === 'legado') {
        const estadoAnterior=opcoes.estado(),vigente=()=>token===geracao&&opcoes.vigente()&&opcoes.estado()===estadoAnterior;
        try{
          const associado=await vincular({db:opcoes.banco(),ref:opcoes.referencia(resultado.doc.id),uid:opcoes.uid,alunoId,nome,docId:resultado.doc.id,carregar:opcoes.carregar,vigente});
          if(vigente())opcoes.existente(associado,alunoId);
        }catch(error){
          if(vigente()&&['vinculo-inconsistente','permission-denied'].includes(error.code)){opcoes.avisar('O documento ou o acesso mudou durante a conferência. Nenhum documento foi associado. Reabra pela lista para conferir.');return;}
          if(vigente()){opcoes.existente(resultado.doc,null);if(token===geracao&&opcoes.vigente())oferecer(opcoes,resultado.doc,alunoId,nome,token);}
        }
        return;
      }
      if (resultado.doc) opcoes.existente(resultado.doc, alunoId);
      else if (nome) opcoes.novo(nome, alunoId);
      else opcoes.avisar('O link está incompleto. Abra novamente pelo Diário.');
    } catch (error) {
      if(token!==geracao||!opcoes.vigente())return;
      console.error('Não foi possível consultar os documentos do aluno:', error);
      opcoes.avisar('Não foi possível conferir os documentos existentes. Tente novamente pelo Diário; nenhum novo documento foi aberto.');
    }
  }

  window.VinculoAluno = {selecionar, abrir, limpar, atualizar, vincular};
})();
