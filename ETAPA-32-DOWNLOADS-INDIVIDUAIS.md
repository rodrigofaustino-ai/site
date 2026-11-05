# Etapa 32 — Documentos individuais como padrão

Acumulada sobre a etapa 31 e todas as melhorias anteriores. Ainda não publicada. Esta branch usa os projetos oficiais.

## Mudança de uso

O professor não precisa conhecer ZIP. O recebimento padrão agora é em arquivos individuais, no formato DOCX ou ODT escolhido.

Depois da geração, vários documentos aparecem em uma lista identificada pelo tipo e nome do aluno. O botão grande Baixar próximo documento solicita um arquivo por clique, avançando somente pelos que ainda não tiveram download solicitado. Cada item também tem botão Baixar/Baixar novamente. Repetir um arquivo não aumenta o total de itens solicitados e não faz leituras do Firebase.

Para um único documento, o download é solicitado automaticamente e o botão Baixar novamente continua disponível caso seja necessário um clique manual no navegador.

Os nomes dos arquivos individuais usam tipo, nome do aluno e índice exclusivo no lote. Não incluem caminhos de pasta nem exigem extração. Arquivos são os mesmos gerados pelos modelos existentes.

Documentos ausentes, não confirmados ou com erro ficam listados na própria tela, sem necessidade de baixar relatório dentro de ZIP. A contagem mostra downloads solicitados, sem afirmar que o navegador concluiu o salvamento no computador. Conferir a pasta Downloads continua necessário.

ZIP fica apenas como checkbox opcional na escolha do formato, desmarcado por padrão a cada abertura da caixa. Ao ser escolhido, inclusive para um único arquivo, gera um ZIP com relatório como antes. Formato e modalidade aparecem na conferência final.

A caixa deve permanecer aberta para acessar novamente os arquivos em memória. Fechar remove a lista e encerra a sessão separada dos formulários. Nenhuma alteração de documento, nova regra ou índice.

## Verificações

- 30 verificações em Chromium, dados fictícios/Firebase simulado, pedidos externos bloqueados: padrão sem ZIP, três DOCX reais baixados com cliques, conteúdo conferido, repetição sem releitura, omissões na tela, contagem de solicitações, largura em 390/320 px, único DOCX automático sem login adicional para PEI, fechamento e zero gravações.
- 26 verificações do fluxo existente, com ZIP agora escolhido explicitamente: três ODT reais no pacote, relatório, UID separado, legado/homônimos, celular e cancelamento.
- 78 verificações de configuração e sintaxe. Os geradores de modelos não foram alterados nesta etapa.

Prévia usa somente dados fictícios. Publicação no Netlify continua pendente.
