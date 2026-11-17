# Notificações do navegador

No cabeçalho do chat, o sino abre a configuração. A permissão é pedida somente após clicar em Ativar notificações. A preferência é própria de cada conta neste navegador.

Quando o Diário fica em outra aba ou perde o foco para outro programa, mensagens novas de outras pessoas geram um aviso genérico do navegador. O texto e os nomes da conversa não são expostos. Clicar abre o chat. A visualização e a duração dependem do navegador e do sistema operacional.

O Diário precisa permanecer aberto, autenticado e conectado. Esta versão não implementa push com o site/navegador fechado. No site em primeiro plano permanece o aviso de três segundos; o mesmo evento não gera os dois tipos de aviso. Receber o aviso não confirma leitura.

O service worker não armazena páginas nem intercepta downloads. O clique usa um identificador de sessão para impedir abertura de conversas de uma conta anterior após troca de usuário. Desativar, sair ou retornar à janela limpa os avisos dessa sessão.

Sem novas permissões de Firebase. Testes locais usam contas fictícias e notificações simuladas; confirmar a apresentação real pelo sistema após publicar e permitir no navegador.
