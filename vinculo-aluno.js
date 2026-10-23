/* A associação só é persistida pelo botão Salvar do formulário. */
(() => {
  'use strict';
  const normalizar = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

  function selecionar(docs, alunoId, nome) {
    if (!alunoId) return {tipo: 'sem-id'};
    const vinculados = docs.filter(doc => doc.data().alunoId === alunoId);
    if (vinculados.length > 1) return {tipo: 'ambiguo'};
    if (vinculados.length === 1) return {tipo: 'existente', doc: vinculados[0]};
    const antigos = docs.filter(doc => !doc.data().alunoId &&
      normalizar(doc.data().identificacao?.nome) === normalizar(nome));
    if (antigos.length > 1) return {tipo: 'ambiguo'};
    if (antigos.length === 1) return {tipo: 'legado', doc: antigos[0]};
    return {tipo: 'novo'};
  }

  async function abrir(opcoes) {
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
      const resultado = selecionar(snapshot.docs, alunoId, nome);
      if (resultado.tipo === 'ambiguo') {
        opcoes.avisar('Há mais de um documento candidato. Nenhum foi aberto ou vinculado automaticamente. Confira os documentos na lista.');
        return;
      }
      if (resultado.tipo === 'legado') {
        const dados = resultado.doc.data();
        const escola = dados.identificacao?.escolaRegular || 'não informada';
        const confirmado = window.confirm(
          'Encontramos um documento antigo sem vínculo com o cadastro.\n\n' +
          'Aluno do Diário: ' + nome + '\n' +
          'Identificador do aluno: ' + alunoId + '\n' +
          'Nome no documento: ' + (dados.identificacao?.nome || '') + '\n' +
          'Escola no documento: ' + escola + '\n' +
          'Documento: ' + resultado.doc.id + '\n\n' +
          'Nomes iguais podem pertencer a alunos diferentes. Confirme somente se este documento pertence ao aluno selecionado. ' +
          'O vínculo será gravado apenas quando você clicar em Salvar. Cancelar mantém os documentos como estão.');
        if (!confirmado) return;
      }
      if (resultado.doc) opcoes.existente(resultado.doc, alunoId);
      else if (nome) opcoes.novo(nome, alunoId);
      else opcoes.avisar('O link está incompleto. Abra novamente pelo Diário.');
    } catch (error) {
      console.error('Não foi possível consultar os documentos do aluno:', error);
      opcoes.avisar('Não foi possível conferir os documentos existentes. Tente novamente pelo Diário; nenhum novo documento foi aberto.');
    }
  }

  window.VinculoAluno = {selecionar, abrir};
})();
