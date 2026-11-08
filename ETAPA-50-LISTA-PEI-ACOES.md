# Etapa 50 — Ações na lista de PEI

A lista mostra inicialmente os PEIs atuais salvos, com Editar, Exportar DOCX, Exportar ODT e Excluir PEI. O filtro Todos os alunos do Diário permite preencher um PEI novo ou consultar versões anteriores quando não existe documento atual. A pesquisa continua disponível, assim como Atualizar lista.

Excluir PEI pede confirmação e apaga somente `alunos/{alunoId}/pei/atual`. Não exclui o cadastro do aluno, outros documentos, metas ou versões anteriores. A transação verifica a conta, o proprietário do cadastro e se o documento mudou desde a consulta. Cancelamento não grava nada. Falhas, permissão negada e confirmação de escrita perdida recebem mensagens específicas. Repetir a operação quando o documento já foi excluído não produz uma nova exclusão.

A exportação direta usa o mesmo gerador do editor para DOCX e ODT, inclusive documentos importados. Consulta o documento salvo no servidor e não salva alterações. Trocar de conta ou sair cancela exportações pendentes. A lista consulta apenas alunos da conta conectada e seus documentos atuais, sem exigir índices ou novas regras.

## Validação

Testes de interface com Firebase simulado abrangem ações, exportações reais DOCX/ODT, filtros, cancelamento, conflito, falha de permissão, exclusão limitada ao documento atual, preservação de cadastro e arquivos anteriores, repetição, logout e largura de celular. Testes no emulador verificam as permissões existentes para excluir documentos atuais e anteriores, bloqueando outra conta e anônimo. Regressões do formulário e histórico também foram verificadas. Nenhum dado real foi excluído.

## Publicação

Pacote cumulativo da etapa 50. Extraia e publique no Netlify a pasta que contém index.html. Aguarde Published e atualize com Ctrl + Shift + R. Não exige alteração no Firebase. Para conferir, use um PEI fictício: a exclusão do documento atual não pode ser desfeita pela interface, embora versões anteriores existentes continuem disponíveis.
