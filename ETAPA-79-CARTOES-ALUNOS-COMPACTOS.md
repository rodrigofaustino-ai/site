# Etapa 79 — nomes e espaços nos cartões dos alunos

Os cartões da aba Alunos passam a mostrar primeiro e último nome por extenso e iniciais nos nomes intermediários, usando a mesma função do menu. Nome completo permanece no título ao passar o mouse, no atributo de origem usado pela busca e no botão de abrir ficha. O cadastro, formulários e exportações continuam com o nome original. A navegação lê o nome completo do atributo para não perder a busca pelos nomes intermediários.

Layout dos cartões em quatro colunas: número, foto, informações e ações com largura constante. Botões Abrir/Arquivar na primeira linha da coluna de ações; Encaminhar fica abaixo, sem comprimir o nome. Espaçamento e fonte compactos, alinhamento à esquerda e altura mínima uniforme de 88 px, permitindo crescer quando necessário para não esconder nomes. Diagnóstico mantém o texto original no título quando o espaço exige elipse. No celular, a mesma estrutura adapta as colunas; os seletores consideram os estilos anteriores de acessibilidade para não sobrepor botões ou deslocar as ações.

CSS restrito aos cartões em studentsList. Menu também recebe alinhamento explícito à esquerda para evitar palavras distribuídas com espaços excessivos. Destaque amarelo temporário e nomes vermelhos dos alertas permanecem.

Validação existente da navegação ampliada com nome abreviado no cartão, nome completo no título e na ficha, exemplos de etiquetas e alerta pendente. Busca, filtros, foco/rolagem, volta ao topo, ida/volta da ficha, celular, logout e ausência de gravação preservados. Prévias fictícias em previas/etapa-79. Pacote cumulativo 79, publicação manual e sem regras novas.
