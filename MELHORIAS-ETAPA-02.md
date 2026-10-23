# Etapa 2 — página central do aluno

Ao abrir um aluno na aba Alunos, aparece a nova **Visão geral do aluno**, acima
do cadastro já existente. A etapa 1 de identificação dos documentos está incluída.

## O que aparece

- Escola, turma/série, turno e quantidade de atendimentos carregados.
- Botões para registrar atendimento, editar cadastro e consultar o histórico.
- Atalhos de PAEE, PEI, relatório e diagnóstica do aluno selecionado.
- Até três relatos recentes, com data e prévia do texto.
- Conferência de escola, turma, horários e primeiro atendimento.

Os atalhos não afirmam que os planos estejam preenchidos, aprovados ou vigentes.
O painel não consulta o segundo projeto Firebase para estimar pendências.
A conferência é dos dados básicos, sem avaliação de conformidade legal.
O PEI continua sendo enviado e consultado na biblioteca existente, com destaque
no aluno selecionado e botão para voltar ao seu perfil.

## Instalação no site de teste

1. Na branch `melhorias/etapa-02-central-aluno` do GitHub, use Code → Download ZIP.
2. Extraia e envie ao Netlify de teste a pasta completa que contém `index.html`.
3. Atualize o site. Se necessário, use Ctrl+Shift+R para atualizar os arquivos.
4. Entre no Diário e abra um aluno fictício na aba Alunos.
5. Confira o título Visão geral do aluno e os novos cartões acima do cadastro.
6. Teste os quatro atalhos, os botões de navegação e o retorno do PEI.
7. Registre um atendimento fictício e confirme a atualização do resumo.

Inclua os novos arquivos `central-aluno.js` e `central-aluno.css`. Não publique
apenas o HTML. O site ainda usa as configurações Firebase anteriores: se teste e
oficial compartilham o banco, salvamentos reais afetam o mesmo banco. Use dados
fictícios para a conferência. A publicação no Netlify não foi feita pelo agente.

## Testes

Com as dependências descritas em MELHORIAS-ETAPA-01.md e Chromium disponíveis:

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-central-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-vinculo-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-navegador.cjs
```

Os testes bloqueiam requisições externas. O teste da central usa Firebase
simulado e verifica resumo, navegação, atalhos com ID, retorno do PEI, atualização
do cadastro e histórico, falha de leitura, dados antigos de horário, conteúdo
como texto, troca rápida de aluno, novo cadastro e larguras de 320/390 pixels.

Não houve migração de dados, alteração de regras Firebase, mudança de `main`
ou publicação do site oficial. Novos perfis de acesso, metas, versões do PEI e
painéis da rede ficam para etapas posteriores.

## Validação desta entrega

- 35 verificações da central aprovadas no Chromium, com dados fictícios.
- 43 verificações da etapa 1 aprovadas.
- 10 downloads DOCX/ODT aprovados no teste de exportação em navegador.
- Sintaxe dos scripts alterados e revisão de espaços em branco aprovadas.
