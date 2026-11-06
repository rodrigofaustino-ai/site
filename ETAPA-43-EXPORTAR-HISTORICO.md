# Etapa 43 — Histórico de atendimentos na exportação central

Adiciona Histórico de atendimentos à primeira etapa de Exportar Documentos. Mantém o fluxo existente: documentos → DOCX/ODT → alunos → conferência → geração. Downloads individuais por padrão; ZIP continua opcional. A exportação já existente dentro da ficha não muda.

O histórico usa o projeto principal salamulti e dispensa a senha dos formulários quando selecionado sozinho ou com PEI/questionário da família. Pode ser combinado aos documentos do outro projeto, mantendo nesse caso o login separado existente. Inclui todos os registros salvos de `alunos/{id}/registros`, independentemente dos filtros locais da ficha. Não exporta rascunhos. A conferência informa a quantidade encontrada; aluno sem registros não produz documento vazio.

O documento contém identificação, informações clínicas e contatos salvos, datas, relatos, registrado por, humor/disposição e descrições das metas guardadas no próprio registro. Próximo passo é incluído sem duplicar o bloco já composto no relato. Não consulta o texto atual das metas para reescrever o passado. Registros aparecem da data mais recente para a mais antiga; registros sem data válida ficam no final. Inclui nome/cargo/local de assinatura salvos no cadastro. O conteúdo é escapado antes da conversão DOCX/ODT.

A geração relê o cadastro e os registros do servidor, verifica a conta responsável e não usa cache como confirmação. Se o responsável mudar, o histórico ficar vazio ou uma leitura falhar, informa que o item não foi gerado. Não grava, vincula ou altera dados; a geração ocorre em uma página isolada sem Firebase. Permissões seguem as regras já existentes de alunos e subcoleções.

## Publicação

Não há atualização de regras nesta etapa. As regras de avisos/imagens, chat e planos já publicadas permanecem. Extraia o ZIP completo, envie ao Netlify a pasta que contém index.html, aguarde Published e atualize com Ctrl + Shift + R. Não foi executado deploy pelo assistente.

Teste: Exportar Documentos → Histórico de atendimentos → formato → aluno(s) → conferir → gerar. Compare o resultado com o histórico salvo na ficha. O pacote inclui as melhorias anteriores.

## Verificação

`verificar-exportacao-historico.cjs`: DOCX e ODT reais, ZIP opcional, histórico completo mesmo com filtro local, leitura atualizada após conferência, ordenação, registros sem data, metas e próximo passo, ausência de registros, segurança do texto, bloqueio por troca de responsável/cache, nenhum dado de outra conta e zero gravações.

Regressões: exportação de PEI/PAEE, questionário da família, geração isolada, configuração oficial/sintaxe e integridade do pacote.
