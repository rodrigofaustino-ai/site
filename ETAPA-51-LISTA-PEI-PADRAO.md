# Etapa 51 — Lista do PEI

Abre com todos os alunos em atendimento da conta, mesmo sem PEI salvo. O filtro de PEIs salvos continua disponível e os cadastros arquivados ficam separados em Alunos arquivados no Diário. Usa a mesma definição de arquivamento do Diário (`arquivado === true`). A ação disponível no Diário arquiva e preserva os documentos; não constitui exclusão definitiva.

Cartões têm Editar em destaque e, quando há documento atual, botão compacto de exportação com DOCX/ODT e lixeira para excluir somente o PEI atual. Sem documento, Editar inicia o preenchimento. Excluir PEI não apaga aluno nem versões anteriores. A confirmação preserva essa distinção.

Trocar filtros ou voltar à janela consulta novamente os cadastros no servidor. Cadastros efetivamente removidos não aparecem, mesmo que subcoleções antigas ainda existam. Não acessa nem exclui automaticamente documentos órfãos. Não altera regras Firebase nem os outros formulários.

Validação com dados simulados: alunos ativos, arquivados, outra conta, documento órfão, atualização após exclusão de cadastro, exportações DOCX/ODT, exclusão de PEI e preservação do histórico, erros, logout e celular. Regressão completa do formulário PEI e verificação do pacote cumulativo. Nenhuma exclusão real ou publicação no Netlify foi executada.

Publicação manual: extrair o pacote da etapa 51, enviar a pasta que contém index.html, aguardar Published e atualizar com Ctrl + Shift + R.
