# Etapa 4 — metas pedagógicas e atendimentos vinculados

A versão inclui as etapas anteriores, com formulário de PEI, IA, instruções de
preenchimento e formatação do histórico corrigida.

## Uso

Ao abrir um aluno, a seção Metas e acompanhamento aparece abaixo da visão geral.
Também existe um atalho na visão geral para chegar a essa seção.

1. Abra Cadastrar meta.
2. Informe objetivo, critério de acompanhamento e data de revisão (obrigatórios).
3. Acrescente ponto de partida, estratégias, apoios e responsável quando pertinente.
4. Salve a meta.
5. Na seção Registro do Atendimento, marque as metas trabalhadas e escreva o relato.
6. Salve o atendimento e consulte os atendimentos vinculados no cartão da meta.

O vínculo é opcional e pode incluir mais de uma meta. Relatos sem vínculo e os
registros antigos continuam funcionando. Os relatos antigos não são associados
automaticamente; não houve migração ou inferência de quais metas foram trabalhadas.

## Situação e revisão

As situações são Ativa, Em revisão, Concluída e Arquivada. A situação é escolhida
pelo professor. Metas concluídas e arquivadas deixam de aparecer na seleção de
novos atendimentos, mas seus relatos anteriores continuam vinculados. Use o filtro
Todas as metas para consultá-las ou reabri-las.

Não há exclusão definitiva de metas nesta etapa. O lembrete Revisão pendente se
refere à data de revisão do planejamento; não é uma classificação do aluno. Não
há porcentagem automática de progresso nem conclusão automática por quantidade
de registros. Um vínculo indica trabalho relatado, não comprovação de aprendizagem.

O texto Objetivos e metas do PEI continua como foi preenchido pelo professor.
As metas desta seção são informações estruturadas de acompanhamento: não existe
sincronização automática com o texto do PEI nesta etapa.

## Persistência e limites

- Metas: `alunos/{alunoId}/metas/{metaId}` no mesmo Firebase do Diário.
- Relatos: `metaIds` guarda os identificadores escolhidos e `metaVinculos` preserva
  o objetivo e a revisão da meta na data do registro. O rótulo do relato não muda
  quando o objetivo é editado posteriormente.
- Edição de metas usa transação com conferência do vínculo do aluno e revisão.
- Edições concorrentes avisam e mantêm os campos preenchidos para conferência.
- Atualizar metas consulta novamente o banco, sem apagar o formulário em edição.
- Troca de aluno e logout limpam os dados; respostas atrasadas são descartadas.
- Alterações não salvas em uma meta pedem confirmação antes de sair do perfil.
- As metas não recebem atualização em tempo real entre abas: use Atualizar metas.
- Relatos vinculados acompanham o histórico já carregado pelo Diário.
- O nome do responsável é informativo; não cria conta, permissão ou notificação.
- As exportações anteriores continuam disponíveis; não foi criado relatório
  específico de metas nesta etapa.

Não houve alteração das regras publicadas do Firebase. O salvamento e a leitura
da nova subcoleção precisam ser conferidos no ambiente de teste. Se aparecer um
erro de permissão, envie a mensagem para diagnóstico; não torne dados públicos
nem amplie regras indiscriminadamente. A verificação do vínculo no navegador não
substitui a autorização aplicada no banco.

## Netlify de teste

1. Abra `melhorias/etapa-04-metas-atendimentos` no GitHub.
2. Baixe em Code → Download ZIP.
3. Extraia e publique a pasta completa no Netlify de teste.
4. Atualize com Ctrl+Shift+R e abra o Aluno teste.
5. Cadastre uma meta fictícia, vincule um relato fictício e reabra o aluno.
6. Confira a persistência e o relato dentro do cartão da meta.
7. Teste Concluída/Arquivada e o filtro Todas as metas.

Se teste e oficial compartilham Firebase, os salvamentos afetam o mesmo banco.
Use dados fictícios. Os arquivos novos `metas-aluno.js` e `metas-aluno.css` precisam
acompanhar o HTML. A main e o site oficial não foram publicados ou alterados.

## Validação

Com as dependências das etapas anteriores e Chromium:

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-metas-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-central-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-pei-formulario.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-vinculo-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-navegador.cjs
```

Os testes usam dados fictícios, bloqueiam requisições externas e simulam Firebase.
Cobrem criação, edição, vínculo de relatos, ausência de vínculo, registros antigos,
conclusão, arquivamento, conflito, permissão negada, confirmação de saída, troca de
aluno, consulta atrasada, falha de leitura e larguras de 320/390 pixels. Os testes
anteriores do PEI, da central, dos vínculos e dos downloads também foram executados.

### Resultados desta entrega

- 31 verificações de metas e relatos vinculados aprovadas.
- 33 verificações da central aprovadas.
- 77 verificações do PEI aprovadas, com IA simulada.
- 43 verificações de vínculo dos outros formulários aprovadas.
- 10 downloads DOCX/ODT existentes e 2 do formulário PEI aprovados.
- Sintaxe dos scripts alterados validada; revisão de espaços em branco sem erros.
