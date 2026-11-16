# Etapa 57 — Campos de assinatura padronizados

Padroniza a edição de cada pessoa adicionada nos cinco modelos: nome e cargo/função lado a lado, inserir/trocar assinatura, remover imagem e prévia abaixo do nome com a mesma largura da coluna. Retira os cartões e cabeçalhos numerados; conserva Remover pessoa e confirmação. No celular, campos e prévia ocupam uma coluna. Não altera a composição impressa dos cinco modelos, exceto retirar o espaço fixo de coordenação vazio no Relatório conforme solicitado.

## Coordenação do Relatório

Remove o campo de nome da coordenação na Identificação e o bloco fixo de cargo/instrução em Assinaturas. O professor SRM permanece no campo original mostrado pelo usuário. Coordenação, direção, pais e demais pessoas são incluídos pela lista.

O módulo relatorio-assinaturas.js lê documentos antigos e preserva a coordenação preenchida como uma pessoa da lista, incluindo cargo e PNG. Não cria uma pessoa a partir apenas do cargo padrão sem nome. Se o mesmo nome já existir na lista, não duplica; conserva o cargo escolhido e reaproveita a imagem antiga se a pessoa ainda não tiver uma. A comparação ignora acentos/maiúsculas/espaços apenas para identificar essa duplicidade, preservando o nome exibido.

Ao abrir o editor, a conversão é somente em memória. Salvar grava a lista e o marcador assinaturas.coordenacaoNaLista, e limpa os campos legados (a imagem antiga recebe null explícito, compatível com a gravação por merge) para não duplicar em clientes anteriores. Remover a pessoa da lista e salvar não a recria ao reabrir. Exportar um documento legado sem abrir o editor também preserva a coordenação, sem gravar nada. Documentos que tinham apenas cargo padrão vazio de nome deixam de imprimir uma linha fixa de coordenação.

O limite da lista passa a 21 pessoas adicionais para preservar os 20 adicionais da etapa anterior mais uma coordenação antiga. Continua a validação de tamanho antes da gravação. Não altera Firebase, biblioteca ou identificação do aluno. Não publica no Netlify.

## Validação

41 verificações novas: conversão preservando nome/cargo/imagem, sem gravação automática, deduplicação, repetição idempotente, remoção sem reaparecer, preservação do professor, legado no limite de capacidade, campos lado a lado, imagem abaixo com mesma largura, celular e DOCX sem duplicação. Regressões: pessoas adicionais nos cinco documentos e dez DOCX/ODT, assinaturas originais, biblioteca compartilhada entre projetos, PEI, IA, configuração e sintaxe. Somente dados fictícios.

Prévias em previas/etapa-57: campo completo, Relatório sem bloco fixo e celular. Pacote cumulativo da etapa 57, incluindo as etapas anteriores. Não precisa repetir as permissões de assinaturas já publicadas.
