# Revisão de navegação e controles

Branch cumulativa: `melhorias/etapa-18-revisao-interface`.
Inclui etapas anteriores e o padrão visual aprovado; não publicada no Netlify.

- Trocar turno passa de elemento clicável para botão nativo, acionável pelo teclado.
- Alunos na grade passam a botões nativos, mantendo a abertura da mesma ficha.
- Navegação do Diário identificada e seção atual indicada com `aria-current` e
  sublinhado, além da cor de seleção.
- Rótulos dos campos estáticos associados aos controles correspondentes.
- Botões de abrir/excluir cadastro identificam a ação e o aluno para leitores
  de tela. Exclusão conserva a confirmação existente.
- Navegação do planner recebe nomes explícitos de mês anterior/próximo.
- Ajustes de tamanho e foco nos controles de notas e planos/recursos.

Estilos limitados à interface em `revisao-interface.css`. Não há mudanças em
regras Firebase, dados, cálculos ou modelos de exportação. Esta é uma melhoria
pontual da navegação; não representa auditoria completa de acessibilidade.

## Validação

66 verificações do registro/consulta no Chromium: inclui abrir a troca de turno
com Enter, selecionar o turno com Enter, abrir ficha pela lista com Enter e
pela grade com Espaço; conferir indicação da seção atual, associação do relato
ao seu rótulo e foco ao clicar no rótulo. Inclui as verificações anteriores de
salvamento, falhas, contexto, roteiro, filtros e larguras de 390/320 px.

89 verificações de isolamento do ambiente de teste, carregamento e sintaxe.
Dez downloads DOCX/ODT confirmados, com PAEE/Diagnóstica/Relatório em 390/320 px.
Testes com dados fictícios e pedidos externos bloqueados; salvamento autenticado
simulado. Nenhuma escrita em serviços reais.

## Publicação futura

O roteiro de conferência está em `CONFERENCIA-PACOTE-ACUMULADO.md`. Baixar a
branch completa quando decidir publicar, incluindo `revisao-interface.css` e
os arquivos de todas as etapas anteriores. Não alterar regras Firebase.
Usar somente o Netlify de teste conectado a `ambienteteste-e368e`.
