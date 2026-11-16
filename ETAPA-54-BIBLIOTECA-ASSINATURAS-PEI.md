# Etapa 54 — Biblioteca de assinaturas e PEI

Primeira etapa combinada: biblioteca privada por conta e botões Inserir assinatura nos três responsáveis do PEI (regente, apoio e coordenação). Os outros formulários ainda não recebem o seletor nesta etapa. Não foi publicado no Netlify, aplicado Firebase ou acessado dado real. O usuário pediu acumular as mudanças e conferir uma prévia.

## Uso

No PEI, Inserir assinatura abre o diálogo com as imagens, nome e cargo. Cadastrar assinatura aceita PNG, JPG e WebP de até 5 MB, converte localmente a PNG de até 640×200 e limita a representação a 80 mil caracteres. Não envia o arquivo original. O cadastro usa bibliotecaAssinaturas/{uid}/itens/{id}, sem exigir Storage. Cada conta só consulta e gerencia os próprios itens, inclusive quando o nome cadastrado corresponde a outro profissional.

Usar esta assinatura é uma escolha explícita para o campo aberto. Caso o nome já preenchido seja diferente, pede confirmação para substituí-lo. O cargo do documento permanece o cargo daquele campo. A imagem copiada fica dentro de peiFormulario.assinaturas.imagens, e no HTML correspondente. Editar o nome depois de escolher remove a imagem daquele campo, evitando apresentar imagem de uma pessoa sob outro nome. Remover imagem conserva o nome e o espaço para assinatura manual, e precisa salvar o PEI normalmente. Sair ou trocar de conta fecha o diálogo e invalida respostas pendentes.

DOCX incorpora o PNG com largura máxima de 180 pixels e altura de 64, sem distorcer. ODT incorpora a mesma imagem com dimensão proporcional e referência interna. Sem imagem, permanecem quatro linhas simples, linha de assinatura e nome/cargo centralizados. O cadastro e a seleção não salvam o PEI automaticamente. O salvamento normal preserva a versão anterior, incluindo as imagens. Excluir da biblioteca não remove documentos, histórico ou imagens já copiadas. Não há compartilhamento de biblioteca entre contas nesta etapa.

## Pendência para a futura publicação

As permissões estão preparadas em producao/assinaturas-biblioteca-acrescimo.rules e incluídas em producao/salamulti.rules. O bloco deve ser acrescentado DENTRO de match /databases/{database}/documents nas regras EXISTENTES de salamulti, preservando os demais caminhos. Não substituir as regras pelo bloco isolado. Não foi aplicado agora. As regras restringem leitura/criação/exclusão à própria conta, tamanho, campos e formato PNG; atualização é bloqueada (cadastre outra imagem para substituir). Não modifica paee-3fea6, Storage ou presença.

## Validação e prévias

Testes no navegador com dados fictícios: upload, normalização de imagem, seleção explícita, salvar e reabrir, imagens incorporadas em DOCX/ODT do editor e da lista, preservação do documento após excluir da biblioteca, invalidação por alteração do nome, histórico, logout e tela de celular. Testes de regras no emulador: dono, outra conta, anônimo, formatos/campos/tamanho e exclusão. Regressões do formulário, assinaturas sem imagens, histórico e exportações existentes.

Prévias em previas/etapa-54: biblioteca-assinaturas.png, biblioteca-celular.png e pei-assinatura-inserida.png. As imagens exibem assinaturas e nomes fictícios. Geradas a partir da implementação usando Firebase simulado, sem acesso ao site publicado.
