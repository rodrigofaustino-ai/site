# Etapa 6 — preparação da colaboração por aluno

Status: regras publicadas recebidas e analisadas. Correção privada validada no emulador em 23/10/2026: 106 verificações
aprovadas. Publicação no Firebase ainda não realizada. Os arquivos `firebase/*.rules`
deste repositório não alteram o Firebase automaticamente.

Esta preparação não libera contas, compartilha alunos ou altera o comportamento
do site. Não foi publicada uma nova versão para o Netlify.

## Primeiro alcance

Começar com o PEI, as metas e observações de atendimento no projeto `salamulti`.
PAEE, Diagnóstica e Relatório utilizam outro projeto, `paee-3fea6`, com contas e
identificadores próprios. O compartilhamento desses módulos exige uma etapa
posterior de associação entre identidades e análise de suas regras.

## Matriz proposta

Todo acesso de um colaborador deve ter vínculo explícito com um aluno. Uma
função não concede, por si só, acesso à escola ou à rede inteira.

| Ação | Responsável AEE do cadastro | Regente vinculado | Apoio vinculado | Coordenação vinculada |
| --- | --- | --- | --- | --- |
| Ler resumo pedagógico autorizado | Sim | Sim | Sim | Sim |
| Consultar PEI e metas | Sim | Sim | Sim | Sim |
| Consultar relatos compartilhados | Sim | Sim | Sim | Sim |
| Acrescentar observação de sua atuação | Sim | Sim | Sim | Sim |
| Editar perfil completo do aluno | Sim | Não | Não | Não |
| Editar PEI e metas nesta primeira liberação | Sim | Não | Não | Não |
| Solicitar revisão do PEI | Sim | Não | Não | Não |
| Registrar revisão pedagógica | Não pelo papel de responsável | Não | Não | Sim |
| Convidar ou revogar colaboradores | Sim | Não | Não | Não |
| Ver laudos e contatos privados automaticamente | Sim, pelo acesso atual | Não | Não | Não |

A revisão pedagógica será um registro de análise, não uma assinatura digital,
uma homologação institucional ou uma certificação jurídica. Aprovação formal e
identificação de coordenadores dependem da política da instituição.

## Separação de dados necessária

Hoje o documento `alunos/{id}` reúne nome, escola, contatos, informações clínicas
e outros campos. O Firestore não filtra campos de um documento para quem recebeu
permissão de leitura: permitir acesso ao documento completo exporia todos eles.

Antes de compartilhar, é necessário criar uma representação pedagógica com
campos permitidos e leitura própria. Não basta esconder os campos na tela.
O cadastro completo e os anexos de laudos não devem ser autorizados automaticamente
aos novos colaboradores. O responsável deve escolher os relatos compartilhados;
vínculo com uma meta não equivale a autorização para divulgar seu conteúdo.

## Regras necessárias antes da implementação ativa

1. Ler o texto completo publicado em Firestore Database → Regras de `salamulti`.
2. Conferir sobreposição de autorizações: no Firestore uma regra que permite
   acesso não é anulada por outra mais restritiva.
3. Preservar os fluxos existentes de chat, planos, recursos, notas, planner,
   frequência, PEI, metas e registros, sem publicar alterações em bloco às cegas.
4. Definir origem confiável de cada vínculo e papel. Um usuário não pode se
   declarar coordenador ou conceder a si mesmo um acesso.
5. Definir convite e aceitação usando conta autenticada, com revogação e escopo
   por aluno; não dar leitura geral ao diretório de contas.
6. Guardar observações colaborativas separadas dos relatos privados, com autoria
   aplicada no banco. Ninguém deve editar a observação de outro profissional.
7. Uma revisão deve se referir a uma versão específica do PEI. Alterar o texto
   posteriormente não pode manter uma indicação enganosa de documento revisado.
8. Testar as regras com identidades fictícias antes de disponibilizar o recurso.

## Casos obrigatórios para validação

- Sem login: sem acesso.
- Usuário autenticado sem vínculo: sem acesso a aluno ou documentos privados.
- Vínculo com aluno A: não concede acesso ao aluno B.
- Vínculo revogado: novas leituras e escritas negadas pelo banco.
- Regente/apoio: não concedem acessos, não editam cadastro privado ou PEI.
- Coordenação: não assume acesso à rede inteira nem edita autoria de terceiros.
- Campos ou papéis forjados na chamada: não ampliam os direitos.
- Perfil ou consulta com falha: não é tratado como autorização.
- Atualização do PEI: revisão anterior continua associada à versão anterior.
- Chat, bibliotecas e fluxos do responsável: permanecem funcionando.

## Resultado da inspeção das regras recebidas

O arquivo `firebase/regras-recebidas-etapa-06.rules` preserva integralmente o
texto enviado. Foram encontrados estes caminhos de acesso excessivo:

- A regra das subcoleções de alunos permite leitura e escrita a qualquer conta
  autenticada, independentemente do professor responsável.
- A atualização do cadastro aceita que alguém atribua a si mesmo o
  `professorUid` de um aluno de outro professor.
- Frequência, planner e notas aceitam criação com responsável diferente do autor
  e alteração do responsável pelo usuário atual.

`firebase/colaboracao-etapa-06.rules` é uma proposta de correção desses pontos.
Mantém o administrador existente e exige o responsável atual nas subcoleções.
O restante das regras, inclusive questionários familiares, planos, recursos e
chat, permanece literalmente igual ao texto recebido.

**Não publicar em salamulti: o usuário confirmou que teste e oficial compartilham esse projeto.** O primeiro acesso ao
planner vazio falhou no teste inicial e foi corrigido: uma conta autenticada pode
consultar um documento de planner inexistente; quando ele existe, somente seu
responsável ou administrador pode ler. Isso não permite listagem geral nem
leitura de dados de terceiros. A transferência administrativa também foi testada.
Cadastros reais antigos sem responsável não foram auditados: o teste utiliza
apenas dados fictícios. Não há transferência ou correção automática dos dados.

## Validação executada

`validacao/verificar-regras-acesso-alunos.cjs` executou testes reais com contas
fictícias: acesso do dono, bloqueio de terceiros, consultas filtradas, tentativas
de tomar posse do cadastro, PEI/metas/registros privados e transferência pelo
administrador. Também validou arquivamento do PEI em transação, autoria em
chat/recursos/planos e convite familiar com resposta pública única e revogação.
O teste exige explicitamente o emulador local; não utiliza o projeto de produção.

Dependências locais: `/tmp/site-validation` com firebase-tools 13.35.1,
@firebase/rules-unit-testing 3.0.4 e firebase 10.14.1; Java 21 disponível.

```sh
XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore --project demo-colaboracao --config firebase-colaboracao-emuladores.json 'node validacao/verificar-regras-acesso-alunos.cjs'
```

O bloqueio inicial de rede foi resolvido após a publicação do ambiente pelo
usuário. O emulador oficial 1.19.8 foi baixado pelo Firebase CLI e os testes
terminaram com 106 verificações aprovadas, código de saída 0. Os emuladores foram
encerrados pelo próprio comando. Não foi necessário login Firebase.

Foi salvo um novo rascunho de configuração com instalação e instruções para
repetir este fluxo em sessões futuras, pois os pacotes em `/tmp` desapareceram
ao reiniciar o ambiente. Esse rascunho não interfere nos testes já concluídos;
sua ativação exige revisar, salvar e publicar o ambiente Codex.

## Próximo passo antes de publicar regras

O usuário confirmou em 23/10/2026 que Netlify teste e oficial usam o mesmo
projeto `salamulti`. Trocar as regras desse projeto afeta os dois sites.
É necessário preparar um Firebase de teste separado antes de testar a publicação. Nenhuma regra foi implantada por este
trabalho. Guardar o texto atual antes de qualquer publicação manual futura.

Os arquivos `colaboracao-modelo.js` e `colaboracao.css` são preparação local e
não estão carregados pelo site. Não existe ainda convite ativo, compartilhamento
ou revisão de PEI implementado. A etapa seguinte é separar o Firebase de teste e
então implementar uma cópia pedagógica explicitamente escolhida pelo professor,
com acesso separado e revogável. Não houve alteração em `main`, Netlify ou Firebase.
