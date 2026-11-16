# Etapa 56 — Pessoas adicionais para assinar

Corrige a diferença entre trocar a imagem de um campo existente e acrescentar novos signatários. Adiciona Outras pessoas que assinam / Adicionar pessoa para assinar em PEI, PAEE, Diagnóstica, Relatório e Histórico de Atendimentos. Preserva os responsáveis e assinaturas originais de cada modelo. Não altera permissões Firebase nem dados reais.

## Uso e persistência

Cada pessoa adicional tem nome, cargo/função, imagem opcional da biblioteca e Remover pessoa. Ao escolher uma imagem, preenche o nome (com confirmação se for diferente) e o cargo apenas se estiver vazio. Permite cadastrar pedagoga, direção, pai, mãe ou outros responsáveis em linhas separadas. Sem imagem, imprime linha e espaço para assinatura manual. Alterar o nome remove a imagem daquele campo; alterar o cargo mantém a identidade da assinatura. A biblioteca é a mesma da etapa 55.

A lista é por documento. PEI guarda em peiFormulario.assinaturas.adicionais e preserva nas versões anteriores. Os demais formulários guardam em assinaturasAdicionais. O Histórico guarda pdfAssinaturasAdicionais na ficha do aluno. Tudo depende do salvamento normal; não grava automaticamente nem propaga para outros documentos ou alunos. Remover pessoa pede confirmação quando preenchida, afeta somente o preenchimento e não exclui imagens da biblioteca. A resposta atrasada de uma seleção não restaura uma pessoa removida.

## Exportação

DOCX e ODT incluem os responsáveis originais e os adicionais, com nome, cargo e linha centralizados. Os adicionais são organizados em pares; o último, quando ímpar, fica centralizado na largura disponível. Imagens PNG são incorporadas no arquivo, não links externos. A mesma composição é usada na exportação pelo editor, pela lista, pela ficha e por Exportar Documentos. Documentos antigos sem lista adicional mantêm o layout anterior. Linhas totalmente vazias não viram blocos vazios no documento; linha parcialmente preenchida precisa de nome e cargo, ou deve ser removida.

A interface admite até 20 pessoas adicionais, limita nome/cargo a 120/100 caracteres e valida o tamanho do documento antes de gravar. Se o conjunto de imagens/texto ficar grande demais para o Firestore, informa como reduzir as imagens e preserva o preenchimento na tela, sem salvamento parcial.

## Validação

185 verificações novas com dados fictícios: três signatários adicionais nos cinco documentos e nos dez arquivos DOCX/ODT, preservação do assinante original, imagens incorporadas, pessoa sem imagem, XML ODT válido, linhas pares/ímpares, campos incompletos, limite/tamanho/IDs, salvar e reabrir, cancelamento/remoção, nome alterado, celular e seleção atrasada após remoção. Regressões: PEI, assinaturas existentes, acervo único entre projetos, Histórico anual/faltas manuais, layout DOCX/ODT e cobertura/exclusões de IA. Sem acesso a documentos reais.

## Publicação

Pacote cumulativo da etapa 56. As permissões de assinaturas já publicadas na etapa 55 continuam suficientes. Não precisa atualizar Firebase novamente. O guia anterior permanece no pacote para quem ainda não habilitou a biblioteca. Extraia, publique no Netlify a pasta com index.html, aguarde Published e use Ctrl + Shift + R. Nenhum deploy foi realizado pelo assistente.

Prévias em previas/etapa-56: pessoas adicionais nos cinco documentos e tela de celular do Relatório. Somente nomes e imagens fictícios.
