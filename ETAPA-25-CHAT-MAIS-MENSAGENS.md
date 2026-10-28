# Mais espaço para ler a conversa

Branch cumulativa: `melhorias/etapa-25-chat-mais-mensagens`.
A etapa 24 foi publicada pelo usuário e está funcionando. Esta alteração visual
está preparada, sem nova publicação automática no Netlify.

## Ajustes pedidos

- Painel normal mais largo e mais alto quando há espaço na tela.
- Campo de digitação com 44 px de altura inicial, ao lado de Emojis e Enviar.
  Continua redimensionável verticalmente, até 96 px.
- Rótulo de digitação preservado para leitores de tela, sem ocupar uma linha
  visual; o campo mantém sua identificação pelo placeholder.
- Emojis passam a botão compacto com ícone e nome acessível. O seletor abre
  acima do compositor, usando sua largura, sem ocupar uma faixa permanente.
- Mensagens com fonte de 13 px, autoria de 12 px e informações auxiliares menores.
  Redução de margens, preenchimento, cabeçalho, separadores e ações.
- No celular, campo de digitação mantém 16 px para evitar zoom automático em
  navegadores móveis; a fonte das mensagens permanece menor.
- Presença começa recolhida; detalhes continuam disponíveis ao abrir a seção.
- Busca, respostas, novas mensagens, emojis e Apagar permanecem disponíveis.

A ordem continua da mais antiga para a mais recente, por data/hora de criação.
Nenhum dado, permissão, regra, exclusão ou modelo de exportação foi alterado.

## Implementação e validação

Estilos em `chat-compacto.css`, carregado após os temas anteriores. Duas mudanças
no markup do chat: presença inicialmente recolhida e rótulo do seletor compacto.
Não altera a lógica de envio ou de ordenação.

No teste Chromium a 1280×720, a área de mensagens ganhou mais de 80 px comparada
ao mesmo painel sem esse CSS, e três ou mais mensagens curtas couberam inteiras,
mesmo com a busca aberta. A sequência foi conferida contra as datas das mensagens.

Testes existentes do chat/busca/leitura/ampliação passaram, além de 45 verificações
de respostas e 47 de emojis/exclusão. Larguras de 390/320 px conferidas. Dados
fictícios, Firebase simulado e pedidos externos bloqueados. Prévias de computador,
painel ampliado e celular revisadas visualmente, com conversa fictícia legível.

## Publicação

Somente atualizar o pacote completo no Netlify de teste e recarregar com
Ctrl+Shift+R. Incluir `chat-compacto.css`, `index.html` e `chat-equipe.js` atualizados
junto dos demais arquivos. Não é necessário alterar novamente o Firebase.
Prévias na pasta `previas`, com prefixo `chat-compacto`.
