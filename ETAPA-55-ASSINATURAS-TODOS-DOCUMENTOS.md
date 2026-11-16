# Etapa 55 — Assinaturas nos demais documentos

Pacote cumulativo com etapa 54 (PEI/biblioteca), estendendo os controles ao PAEE (quatro responsáveis e instrumentos de avaliação), Diagnóstica (dois semestres), Relatório (professor e coordenação) e Histórico de Atendimentos (professor). Toda aplicação é explícita, com prévia, troca e remoção, e usa o salvamento normal. Sem imagem, mantém a assinatura manual. Alterar o nome invalida a imagem anterior.

## Acervo único e acessos separados

Os formulários usam paee-3fea6 com UID diferente do Diário salamulti. O seletor abre uma janela interna de mesma origem, inicializando salamulti no contexto próprio com o nome padrão do aplicativo, reutilizando a sessão do Diário. Só aceita a conta com o mesmo e-mail da conta dos formulários; se não estiver conectada, pede login do Diário na janela. Uma conta diferente não exibe a biblioteca. A senha fica nessa janela, é limpa após autenticar e não vai no postMessage nem no documento. A troca de conta, cancelamento e mudança de documento impedem aplicação tardia. Mensagens validam origem, janela emissora e token aleatório.

Não duplica a biblioteca nos projetos e não supõe igualdade de UIDs. A biblioteca é privada por conta de salamulti, com as regras preparadas na etapa 54. Não compartilha assinaturas entre contas. Arquivos pequenos em PNG são incorporados em cada documento: excluir da biblioteca não modifica o histórico nem documentos já salvos.

## Persistência e exportação

Formulários guardam assinaturasImagens no estado/documento; PAEE também assinaturasNomes e assinaturasInstrumentos. Diagnóstica preserva frequência/nomes/datas de cada semestre. Relatório preserva os cargos definidos no formulário. O Histórico guarda pdfAssinatura no cadastro e usa a cópia salva nas exportações centrais; a exportação pela ficha usa a imagem em edição. A mesma verificação de nome/imagem é aplicada antes de exportar.

DOCX contém PNG incorporado e tamanho proporcional até 180×64 pixels. ODT dos formulários preserva a imagem nos quadros; a conversão própria do Histórico passou a copiar os arquivos de imagem, relacionamentos, medidas e manifesto. Exportações pela lista/central usam o mesmo código. Layouts sem imagem e demais conteúdos mantidos. A tabela de instrumentos do PAEE mantém uma assinatura por instrumento selecionado.

## Validação

Navegador com Firebase simulado: todos os oito arquivos DOCX/ODT, número de imagens em cada local (incluindo instrumentos e semestres), PNG incorporado e manifesto ODT, dimensões, escolha real pela janela com UIDs diferentes, acesso adicional quando necessário, bloqueio de e-mail diferente, senha limpa, salvar/reabrir, remover/trocar nome, logout e celular. Fluxo real da ficha do Histórico: biblioteca, salvar, reabrir e DOCX. Regressões do PEI, assinaturas antigas, exportações em lote, histórico anual/manual e cobertura de IA.

## Entrega e publicação manual

O pacote da etapa 55 inclui PERMISSOES-ASSINATURAS-FIRESTORE.txt com o bloco isolado e instruções para acrescentá-lo nas regras EXISTENTES de salamulti. Não substituir todas as regras pelo bloco. Não altera paee-3fea6/Storage/Realtime Database. Nenhuma regra ou publicação foi aplicada pelo assistente. Depois da atualização única das permissões, publicar a pasta inteira no Netlify uma vez. As etapas anteriores estão incluídas.

Prévias em previas/etapa-55 usam apenas dados e imagens fictícios.
