/* Associação somente para leitura: nunca vincula nem salva documentos. */
(() => {
 'use strict';
 const tipos=Object.freeze({historico:{nome:'Histórico de atendimentos',pagina:'historico-atendimentos-exportar.html'},pei:{nome:'PEI',pagina:'pei_formulario.html'},paee:{nome:'PAEE',pagina:'paee_formulario_02.html',colecao:'paee_alunos'},diagnostica:{nome:'Diagnóstica',pagina:'diagnostica_formulario.html',colecao:'diagnostica_srm'},relatorio:{nome:'Relatório',pagina:'relatorio_formulario.html',colecao:'relatorios_srm'},familia:{nome:'Questionário da família',pagina:'questionario-familia-exportar.html'}});
 const normalizar=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
 const nomeDocumento=d=>d.identificacao?.nome||d.identificacao?.nomeAluno||'';
 function candidatos(docs,aluno){const diretos=docs.filter(d=>d.dados.alunoId===aluno.id);if(diretos.length)return {legado:false,itens:diretos};return {legado:true,itens:docs.filter(d=>!d.dados.alunoId&&normalizar(nomeDocumento(d.dados))===normalizar(aluno.nome)&&normalizar(aluno.nome))};}
 function compativel(d,aluno,legado){return legado?!d.alunoId&&normalizar(nomeDocumento(d))===normalizar(aluno.nome):d.alunoId===aluno.id;}
 const seguro=s=>String(s||'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,70)||'arquivo';
 window.ExportacaoLoteModelo=Object.freeze({tipos,normalizar,nomeDocumento,candidatos,compativel,seguro});
})();
