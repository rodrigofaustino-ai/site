# Etapa 52 — Lista de documentos PEI

Revisados os fluxos de PAEE, Diagnóstica e Relatório: as listas são de documentos salvos e excluir apaga o documento escolhido. A lista do PEI tinha sido montada como lista de cadastros do Diário, incluindo cartões sem PEI. Isso fazia um cadastro residual continuar aparecendo após a exclusão de seu PEI.

A lista principal agora mostra somente documentos atuais salvos, com Editar, exportação DOCX/ODT e Excluir PEI. Cadastros sem documento não recebem cartão. Ao excluir o documento atual, o cartão desaparece imediatamente e continua ausente após atualizar a lista. Cadastro no Diário, outros documentos e versões anteriores não são apagados. Não afirma que um cadastro ausente de determinado turno foi definitivamente excluído: não foi feita consulta à conta real.

Novo PEI / Consultar histórico abre uma seleção dos alunos pertencentes à conta do Diário. Selecionar e abrir não grava nada. O PEI só aparece na lista depois de salvo. Cadastros arquivados são identificados no seletor; documentos salvos permanecem consultáveis. O histórico anterior é acessível mesmo sem documento atual. A mudança não oculta cartões por preferência nem exclui cadastros automaticamente; não adiciona metadados ou novas coleções.

Cartões mais compactos, com nome, escola/turma, tipo do documento e data de atualização. Mantido o gerador existente e a confirmação de exclusão. O seletor fecha e é limpo ao trocar a conta. Atualização explícita e ao voltar à janela continua consultando o servidor.

## Verificação

Interface com Firebase simulado: somente documentos salvos, ausência de cartões vazios, seletor Novo PEI, abrir sem gravar, salvar novo documento e exibir cartão, excluir e atualizar sem reaparecer, DOCX/ODT, cadastro/histórico preservados, falha de permissão, conflito, repetição, logout e celular. Regressões do editor e exclusão de versões anteriores. Verificação da configuração e sintaxe do pacote. Não foram excluídos dados reais nem aplicado deploy.

## Publicação

Pacote completo cumulativo da etapa 52. Extraia e envie ao Netlify a pasta que contém index.html. Aguarde Published e use Ctrl + Shift + R. Não exige atualização de regras Firebase.
