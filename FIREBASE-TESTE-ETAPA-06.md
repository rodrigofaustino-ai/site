# Separar o Firebase do site de teste

Em 23/10/2026, o usuário confirmou que Netlify teste e oficial usam `salamulti`.
Uma nova implantação no Netlify não separa o banco nem as contas Firebase.
As regras preparadas nesta branch não devem ser publicadas em `salamulti` nesta etapa.

## Primeiro passo no console

1. Acessar https://console.firebase.google.com/ com a conta que administra os projetos.
2. Criar um projeto novo, com nome como `SalaMulti Teste`, conferindo que o ID
   seja diferente de `salamulti`. Se o nome não estiver disponível, aceitar um
   ID distinto sugerido pelo console.
3. Google Analytics é opcional para este teste; não é necessário ativá-lo.
4. Anotar apenas o ID do novo projeto. Não enviar senha, conta de serviço,
   chave privada ou credenciais administrativas no chat.

## Etapas seguintes, após o projeto existir

- Registrar um aplicativo Web e obter a configuração pública do SDK.
- Habilitar no Authentication o método de login efetivamente usado pelo Diário,
  verificando os domínios autorizados do Netlify teste.
- Criar o Cloud Firestore em modo de produção, com região escolhida antes de
  criar o banco; não utilizar permissões de teste abertas.
- Preparar o site de teste para usar o novo projeto nos módulos do Diário, PEI,
  metas e registros. Procurar todas as referências a `salamulti`, não só a tela
  inicial. PAEE, Diagnóstica e Relatório usam outro projeto (`paee-3fea6`) e sua
  separação exige configuração própria; não assumir que ficam isolados junto.
- Conferir os serviços realmente usados pelo teste, incluindo presença em
  Realtime Database e anexos em Storage, antes de conectá-los. Não apontar esses
  serviços para produção por conveniência.
- Só então publicar as regras validadas no novo projeto, cadastrar contas de
  teste e criar alunos fictícios. Não copiar prontuários reais para esse teste.
- Conferir no navegador o projeto ativo e testar leitura, gravação, histórico,
  metas e o bloqueio entre duas contas antes de avançar com colaboração.

## O que já está pronto nesta branch

- Texto original recebido: `firebase/regras-recebidas-etapa-06.rules`.
- Correção para revisão: `firebase/colaboracao-etapa-06.rules`.
- Testes de autorização: `validacao/verificar-regras-acesso-alunos.cjs`.
- Resultado: 106 verificações aprovadas no emulador oficial Firestore 1.19.8.

Não há nova interface de colaboração ativa, migração de dados, implantação no
Netlify ou publicação de regras Firebase nesta entrega. O código do site nesta
branch continua o da etapa 5; não é necessário reenviar o ZIP ao Netlify agora.
