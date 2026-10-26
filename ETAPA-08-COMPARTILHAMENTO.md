# Compartilhamento por aluno — pacote acumulado de teste

Implementado somente para a cópia conectada a `ambienteteste-e368e`. A branch
`melhorias/etapa-08-compartilhamento` também contém as orientações de preenchimento
da etapa 7. Não houve publicação no Netlify nem alteração de regras Firebase.
Este documento substitui o desenho preliminar da etapa 6 quanto à implementação
atual; os projetos oficiais `salamulti` e `paee-3fea6` permanecem preservados.

## Responsável pelo aluno

Na ficha de um aluno salvo, abrir “Compartilhar conteúdo pedagógico” e clicar em
“Preparar compartilhamento”. Essa consulta não salva nem concede acessos.
Ela carrega o conteúdo já salvo no servidor, não alterações pendentes na ficha.

Informar o e-mail da conta do profissional no Firebase de teste e atribuir a
atuação nesse aluno: regente, apoio ou coordenação. A atuação é atribuída pelo
responsável; não representa credenciamento institucional verificado pelo sistema.
Não existe consulta pública ao diretório de usuários nem envio automático de convite.

A cópia sempre contém nome, escola, turma e turno. O responsável pode acrescentar:

- Até cinco metas ativas ou em revisão, escolhidas individualmente. Os detalhes
  incluem critério, estratégias, apoios, responsável e revisão prevista.
- Até cinco relatos escolhidos entre os 30 atendimentos mais recentes.
- O PEI integral salvo, mediante seleção explícita. O PEI pode conter dados
  familiares ou clínicos, portanto precisa ser conferido antes de compartilhar.

Nenhuma dessas opções vem marcada. Contatos, laudos e demais campos do cadastro
privado não são copiados automaticamente. A coleção privada de alunos não ganha
permissão de leitura para os colaboradores.

Clicar em “Conferir conteúdo selecionado”, revisar a cópia e só então em
“Autorizar acesso à cópia conferida”. Alterar o e-mail, papel ou seleção invalida
a conferência e exige outra prévia. Publicar novamente para o mesmo e-mail
substitui a cópia atual e reativa um acesso anteriormente revogado.

O limite de cinco metas e cinco relatos mantém a validação completa dentro do
orçamento de avaliação das regras Firestore. As listas máximas foram testadas
em criação e atualização, inclusive com as três gravações atômicas da publicação.

## Profissional que recebe o acesso

Abrir “Conteúdos compartilhados comigo”, também disponível na tela inicial.
Entrar com o e-mail autorizado, usando uma conta de `ambienteteste-e368e`.
O e-mail precisa estar verificado: a tela permite solicitar a verificação para
o próprio endereço e conferir novamente depois de abrir o link recebido.
Não é necessário mudar os Domínios autorizados já configurados no Netlify teste.

O destinatário consulta somente a cópia autorizada e acrescenta observações.
Não edita o cadastro completo, o PEI original, as metas ou os relatos privados.
As observações mantêm autor, e-mail, horário do servidor e identificação da cópia;
não podem ser alteradas ou apagadas por clientes, inclusive pelo responsável.
São exibidas até 100 observações recentes por acesso.

Coordenação pode registrar uma revisão pedagógica quando a cópia inclui PEI.
Regente, apoio e responsável não registram revisão com esse papel. A revisão
é uma análise da cópia compartilhada, não assinatura digital ou homologação.

## Atualização, revisão e revogação

Os documentos privados e a cópia compartilhada não sincronizam automaticamente.
Cada nova publicação recebe uma identificação diferente, reservada de forma
imutável no banco. Uma identificação antiga não pode ser reutilizada para fazer
uma revisão anterior parecer atual. As observações de cópias antigas ficam
identificadas como “cópia anterior”; o conteúdo antigo da cópia não é arquivado
integralmente nessa área. O histórico privado do PEI continua independente.

“Revogar acesso” bloqueia novas leituras e registros do destinatário e limpa o
conteúdo na tela conectada quando o vínculo sai da consulta ativa. Uma cópia já
lida, fotografada ou salva pelo destinatário não pode ser apagada à distância.
O responsável mantém consulta às observações antigas. Transferir a propriedade
do cadastro bloqueia o conteúdo dos vínculos anteriores, mesmo ainda ativos.

## Organização e regras

Cada autorização é um documento próprio em `colaboracoes/{id}`. O conteúdo fica
em `conteudo/atual`, as observações em `observacoes/{id}` e as reservas de versões
em `versoes/{publicacaoId}`. Cadastro, PEI e metas privados continuam nas coleções
anteriores. Não foi necessário migrar dados existentes.

O backend exige proprietário do aluno para conceder, atualizar ou revogar acesso;
destinatário autenticado com e-mail verificado para consultar; autoria e horário
do servidor em observações; papel de coordenação e cópia atual com PEI para revisão.
A publicação cria/atualiza vínculo, reserva de versão e cópia numa só transação.
Uma falha não deixa metade da autorização salva.

O PEI compartilhado usa iframe isolado, sem scripts, requisições externas ou
links ativos. A apresentação reaproveita os estilos do visualizador do PEI.
As respostas da equipe e os demais dados são inseridos como texto, não HTML.

## Publicação futura, junto com as outras melhorias

Não executar estes passos agora se a decisão continua sendo acumular alterações.
Quando for publicar o pacote:

1. Confirmar no Firebase o projeto `ambienteteste-e368e` e guardar as regras
   atuais. Substituir o texto completo por `firebase/compartilhamento-teste.rules`.
   Não acrescentar regras a um bloco público nem alterar os projetos oficiais.
2. Baixar esta branch no GitHub em Code → Download ZIP, extrair e enviar a pasta
   completa ao Netlify de teste. Ela deve incluir os arquivos `colaboracao*`.
3. Usar um aluno fictício e duas contas de teste diferentes. Manter o responsável
   em um navegador e o destinatário em outro navegador ou janela anônima.
4. Conferir prévia sem gravação, publicação, leitura somente do conteúdo escolhido,
   observação, revisão de coordenação e revogação ao vivo.
5. Alterar o PEI privado e conferir que a cópia não muda sozinha. Publicar outra
   cópia e conferir que as observações/revisões anteriores continuam marcadas
   como antigas. Conferir também regente/apoio sem opção de revisão.

PAEE, Diagnóstica e Relatório continuam funcionando no mesmo banco de teste,
mas não integram esta primeira seleção de conteúdo compartilhado. A presença
online e a transferência administrativa permanecem suspensas conforme a etapa 6.

## Validação local

Passaram 139 verificações das permissões anteriores e 80 verificações novas de
compartilhamento no emulador oficial, com contas fictícias. Passaram também 37
verificações da nova interface, 85 de isolamento/carregamento, 104 do PEI, 58 dos
vínculos dos formulários, 33 da central e 31 de metas/atendimentos.
Os testes de interface bloqueiam requisições externas e usam Firebase simulado.
Nenhuma conta real recebeu autorização ou mensagem durante o desenvolvimento.
A verificação de e-mail e a integração com duas contas reais ainda dependem da
publicação futura e da conferência manual do usuário.

```sh
SRM_REGRAS_TESTE=1 SRM_REGRAS_COMPARTILHAMENTO=1 XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore --project demo-colaboracao --config firebase-compartilhamento-emuladores.json 'node validacao/verificar-regras-acesso-alunos.cjs && node validacao/verificar-compartilhamento-regras.cjs'
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-compartilhamento-navegador.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-firebase-teste.cjs
```
