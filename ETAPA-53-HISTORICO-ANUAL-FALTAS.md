# Etapa 53 — Histórico anual e faltas manuais

Atendimentos previstos passa a ter a mesma quantidade de registros da seção HISTÓRICO DE ATENDIMENTOS. O gerador compartilhado filtra ambos pelos registros com data válida do ano corrente, desde 1º de janeiro até a emissão. O fim do período exibido é a data do último atendimento incluído. Datas futuras, registros de outros anos e registros sem data válida ficam fora deste documento anual. Dois registros no mesmo dia são dois registros do histórico, mantendo a igualdade solicitada. Nada é removido do banco ou da consulta completa na ficha.

O ano/data da emissão usa America/Sao_Paulo. Sem registros no período, a exportação em lote informa que não há histórico disponível; pela ficha, o documento apresenta zero e informa a ausência no período. O gerador é único para a ficha, DOCX e conversão ODT na exportação central, preservando o layout existente.

Faltas não são mais calculadas pela Frequência. A ficha tem Faltas no histórico — ano vigente (manual), aceita número inteiro não negativo ou vazio. Zero é preservado; vazio gera uma linha para preenchimento no documento. O botão Salvar informações grava pdfFaltas e pdfFaltasAno no cadastro. O valor de outro ano não é preenchido automaticamente. Exportar pela ficha usa o campo atual; Exportar Documentos usa o valor salvo. Não limita faltas ao número de relatos, pois são informações distintas. Não adiciona escrita durante a exportação nem altera marcações da frequência.

A emissão pela ficha passou a reler os registros no servidor, confirmando dono do cadastro e contexto. A exportação central relê os registros antes de gerar. Ambos usam a mesma função para filtrar e contar, e falhas de acesso/cache não são transformadas em falsos zeros. Não há nova coleção, índice nem regras Firebase.

## Validação

Testes unitários: limites de ano/dia, datas inválidas/futuras, ano bissexto, registros no mesmo dia, ordenação sem mutação, faltas manuais/zero/vazio/valores inválidos, virada de ano, acesso e servidor. Navegador com dados simulados: DOCX/ODT reais na ficha e lote, totais idênticos, registros relidos, exclusão apenas do documento de exportação dos anos/datas fora do período, cadastro/frequência sem gravação na exportação, falhas de cache/permissão e navegação, salvar e reabrir faltas, zero/vazio/ano anterior. Comparação do layout com o modelo histórico, desconsiderando apenas a linha e nota novas; tabelas, fonte, bordas e assinatura preservadas.

## Publicação

Pacote cumulativo da etapa 53. Extraia e publique a pasta que contém index.html no Netlify, aguarde Published e atualize com Ctrl + Shift + R. Sem atualização de regras. Nenhum deploy nem alteração em dados reais foi executado pelo assistente.
