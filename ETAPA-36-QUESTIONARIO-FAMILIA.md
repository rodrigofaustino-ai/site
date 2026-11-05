# Etapa 36 — Questionário da família recuperado e revisado

Mantém o visual aprovado no celular: cabeçalho verde com livro, cartões claros, textos legíveis, etapas e confirmação de envio. O conteúdo final usa a seleção de 54 itens de Diagnostica_SRM_MODELO.docx enviada pelo usuário; não usa o rascunho de 122 perguntas. São 27 perguntas ou grupos e 58 respostas individuais: 54 itens de origem, um desdobramento de zíper/tampas e três campos complementares de alimentação, sono e rotina diária. Os grupos longos são divididos em telas de até cinco subitens (29 telas de perguntas mais revisão).

## Para o professor

- Ficha do aluno → Questionário da família; também disponível no botão Família da lista da aba Diagnóstica.
- Define período de referência e gera link exclusivo com token aleatório de 256 bits. O convite público mostra só o primeiro nome, referência e identificadores necessários ao envio; não expõe cadastro, laudos, documentos nem respostas.
- Link válido por 30 dias, envio único, opção de desativar. Novo link revoga o anterior em transação. Cadastro arquivado não gera novo convite pela interface.
- Consulta manual em Atualizar respostas, com data, responsável, vínculo, contexto, período e correspondência de cada resposta ao item da Diagnóstica.
- Mantém consulta aos registros anteriores v1 de 27 perguntas sem alterar seus dados. Novos convites usam o modelo revisado v2. URLs históricas de páginas antigas que não estão no pacote não são reconstruídas: gerar novo link para o novo formulário.
- A própria página da Diagnóstica tem o atalho no painel de conexão ao Diário; exige acesso explícito ao salamulti com o mesmo e-mail, usando o UID daquele projeto. Não presume que os UIDs dos dois projetos são iguais.

## Para a família

Não exige conta, senha ou instalação. Permite não sei/não teve oportunidade e prefiro não informar. As respostas diferenciam autonomia, escrita por cópia, dificuldade de fala e relatos, evitando interpretações automáticas de S/N/P. Alimentação inclui preferências, horários, texturas, restrições e cuidados que a escola precise saber; sono e rotina permitem relato curto e aproximado.

Voltar e continuar preservam o preenchimento em memória. O texto ainda não é salvo antes de Enviar: a abertura informa que fechar ou recarregar exige preencher novamente, e há aviso do navegador ao sair com preenchimento em andamento. Falha de envio preserva o texto. Confirmação perdida consulta somente o marcador de envio e seu identificador aleatório para confirmar a própria gravação. Se outra sessão enviou antes, informa que o preenchimento atual não foi salvo, sem mostrar uma falsa confirmação. Não há envio automático nem leitura pública das respostas.

## Dados e regras

Projeto salamulti:

- questionariosFamilia/{alunoId}: ponteiro do convite atual.
- convitesFamilia/{token}: versões 1 e 2, somente metadados mínimos, revogação e validade.
- respostasFamilia/{token}: registros antigos v1, preservados.
- respostasFamiliaCompletas/{token}: identificação da resposta v2.
- respostasFamiliaCompletas/{token}/areas/{area}: nove áreas com itens selecionados e observações.
- enviosFamilia/{token}: marcador público mínimo de envio, sem conteúdo das respostas.

As nove áreas, a identificação e o marcador são salvos em um único lote. As regras validam todas as chaves, opções específicas por tipo, tamanhos e vínculos com o convite; impedem reenvio, alteração posterior e envio parcial. A divisão em áreas mantém a validação dentro dos limites de avaliação de regras.

O arquivo completo producao/salamulti.rules foi atualizado preservando v1, chat, colaboração e demais regras anteriores. Também corrige a consulta de ponteiro ainda inexistente. Não há mudanças nas regras de paee-3fea6, Storage ou Realtime Database.

**É necessário publicar manualmente as regras revisadas de salamulti antes do novo pacote Netlify. Nenhuma regra ou site foi publicado automaticamente.**

## Limites e validação

Relatos subsidiam o professor; não preenchem S/N/P, não fazem diagnóstico, não alteram texto da Diagnóstica, os dois semestres, frequência ou assinaturas. Campos escolares e inferências técnicas permanecem sob análise profissional. Leitura e escrita perguntam situações já observadas, sem exigir testes da família.

Testes locais: correspondência com os 54 itens e opções por tipo; Chromium com Firebase simulado, rede externa bloqueada e dados fictícios; emulador Firestore para permissões, envio completo e imutabilidade. Regressões da configuração oficial, agenda/frequência, documentos DOCX/ODT, regras anteriores, colaboração e chat. Não houve leitura de dados reais nem teste de credenciais de professores; o teste de uso final será após a publicação manual com aluno fictício.
