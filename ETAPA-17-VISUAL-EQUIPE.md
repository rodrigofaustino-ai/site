# Consistência visual da área da equipe

Branch cumulativa: `melhorias/etapa-17-visual-equipe`.
Inclui todas as etapas anteriores; não publicada automaticamente no Netlify.

A página Conteúdos compartilhados comigo passa a usar fundo neutro, cartões
brancos, campos com borda visível, títulos hierárquicos, ações principais verdes,
foco de teclado e botões com altura mínima de 44 px. Conta e lista de acessos
ficam visualmente separadas do conteúdo e das observações.

O chat recebe as mesmas cores e campos, com controles principais maiores.
Não há mudanças no envio, leitura, autenticação, permissões, presença ou regras.
A presença online continua dependendo da configuração já existente e não foi
ativada no Firebase de teste por esta etapa.

Estilos isolados em `equipe-visual.css`, aplicados somente na tela. O documento
PEI compartilhado continua em iframe com sandbox e CSS próprio, sem herdar esse
tema. Os arquivos responsáveis pelos modelos, geração e visualização dos
documentos permanecem sem alterações nas etapas visuais 14 a 17. Não há mudanças
nos layouts de DOCX/ODT. Os dez downloads foram verificados na etapa 16.

## Validação

41 verificações do compartilhamento no Chromium, incluindo seleção do conteúdo,
isolamento de dados privados, falha de publicação, autoria da observação,
revogação, mudança de papel, verificação do e-mail e larguras de 390/320 px.
Os botões de observação mantêm área de toque de pelo menos 44 px.

Testes existentes do chat aprovados: duas sessões, texto seguro, não lidas,
confirmação de leitura, falha/reenvio sem duplicação, histórico, logout, troca de
conta e larguras de 390/320 px. Painel cabe na tela e botão Enviar tem pelo menos
44 px. Testes autenticados com Firebase simulado, dados fictícios e pedidos
externos bloqueados. Capturas do compartilhamento e chat revisadas visualmente.

## Conferência futura

Baixar a branch completa e incluir `equipe-visual.css` quando for publicar no
Netlify de teste. Não há alteração Firebase. Usar somente dados fictícios.
Na publicação, conferir as melhorias acumuladas de registros, filtros e visual;
os testes automatizados não substituem a avaliação do usuário no site.
Prévias disponíveis na pasta `previas`.
