/* Conversa coletiva do Diário. Não envia mensagens sem ação do usuário. */
(() => {
  'use strict';
  const widget = document.createElement('aside'); widget.id = 'chatEquipe'; widget.hidden = true;
  widget.setAttribute('aria-label', 'Chat coletivo da equipe');
  widget.innerHTML = '<section id="chatPainel" hidden aria-label="Conversa da equipe"><header class="chat-cabecalho"><strong>Chat da equipe</strong><button id="chatFechar" type="button" aria-label="Fechar chat">Fechar ×</button></header><button id="chatHistorico" type="button">Carregar mensagens anteriores</button><div id="chatMensagens" role="log" aria-label="Mensagens da equipe" aria-live="polite" aria-relevant="additions"></div><div id="chatStatus" role="status"></div><form id="chatForm"><label for="chatTexto">Mensagem para a equipe</label><textarea id="chatTexto" maxlength="2000" placeholder="Escreva sua mensagem…" required></textarea><button id="chatEnviar" type="submit">Enviar</button></form></section><button id="chatAbrir" type="button" aria-controls="chatPainel" aria-expanded="false">💬 Chat da equipe <span id="chatNaoLidas" hidden></span></button>';
  document.body.appendChild(widget);
  const el = id => document.getElementById(id), auth = firebase.auth(), db = firebase.firestore();
  const collection = db.collection('chatEquipe');
  let user = null, unsubscribe = null, epoch = 0, opened = false, sending = false, loading = false;
  let messages = new Map(), latest = [], cursor = null, more = false, historyLoaded = false, lastRead = 0, pendingSend = null;
  const millis = message => message.createdAt && message.createdAt.toMillis ? message.createdAt.toMillis() : 0;
  const key = () => 'salamulti_chat_lido_' + user.uid;
  function status(text) { el('chatStatus').textContent = text; }
  function errorText(error) {
    return /permission-denied/.test(error.code || '') ? 'O chat precisa de permissão no Firestore. Confira a configuração com o administrador.' : 'Não foi possível conectar ao chat. Confira sua conexão e tente novamente.';
  }
  function unread() {
    if (!user) return;
    const count = latest.filter(message => message.autorUid !== user.uid && millis(message) > lastRead).length;
    el('chatNaoLidas').hidden = count === 0;
    el('chatNaoLidas').textContent = count >= 100 ? '99+' : String(count);
    el('chatAbrir').setAttribute('aria-label', count ? 'Chat da equipe: ' + count + ' mensagens não lidas' : 'Abrir chat da equipe');
  }
  function markRead() {
    if (!user || !opened || document.visibilityState !== 'visible') return;
    lastRead = Math.max(lastRead, ...latest.map(millis));
    try { localStorage.setItem(key(), String(lastRead)); } catch (_) { /* Navegação privada pode restringir armazenamento. */ }
    unread();
  }
  function render() {
    const list = el('chatMensagens'), nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 70;
    const oldScroll = list.scrollTop; list.replaceChildren();
    const ordered = [...messages.values()].sort((a,b) => (millis(a) || Infinity) - (millis(b) || Infinity) || a.id.localeCompare(b.id));
    if (!ordered.length) { const p = document.createElement('p'); p.textContent = 'Ainda não há mensagens. Inicie a conversa com a equipe!'; list.appendChild(p); }
    ordered.forEach(message => {
      const article = document.createElement('article'); article.className = 'chat-mensagem' + (message.autorUid === user.uid ? ' propria' : '');
      const name = document.createElement('strong'); name.textContent = message.autorNome + (message.autorEmail && message.autorEmail !== message.autorNome ? ' (' + message.autorEmail + ')' : '');
      const text = document.createElement('p'); text.textContent = message.texto;
      const time = document.createElement('small'); time.textContent = millis(message) ? message.createdAt.toDate().toLocaleString('pt-BR') : 'Enviando…';
      article.append(name,text,time); list.appendChild(article);
    });
    if (nearBottom && !loading) list.scrollTop = list.scrollHeight; else list.scrollTop = oldScroll;
    el('chatHistorico').hidden = !more; unread(); markRead();
  }
  function listen() {
    if (!user || unsubscribe) return;
    const current = epoch; status('Conectando ao chat…');
    unsubscribe = collection.orderBy('createdAt','desc').limit(100).onSnapshot(snapshot => {
      if (current !== epoch) return;
      latest = snapshot.docs.map(doc => ({...doc.data(),id:doc.id}));
      latest.forEach(message => messages.set(message.id,message));
      if (!historyLoaded) { cursor = snapshot.docs.at(-1) || null; more = snapshot.docs.length === 100; }
      status(snapshot.metadata && snapshot.metadata.fromCache ? 'Mostrando mensagens disponíveis neste navegador. Aguardando conexão…' : 'Conversa compartilhada com todos os professores do Diário.'); render();
    }, error => {
      if (current !== epoch) return;
      status(errorText(error)); if (unsubscribe) unsubscribe(); unsubscribe = null;
    });
  }
  function toggle(value) {
    opened = value; el('chatPainel').hidden = !value; el('chatAbrir').setAttribute('aria-expanded', String(value));
    if (value) { listen(); el('chatMensagens').scrollTop = el('chatMensagens').scrollHeight; markRead(); el('chatTexto').focus(); }
  }
  el('chatAbrir').addEventListener('click', () => toggle(!opened));
  el('chatFechar').addEventListener('click', () => { toggle(false); el('chatAbrir').focus(); });
  widget.addEventListener('keydown', event => { if (event.key === 'Escape' && opened) { toggle(false); el('chatAbrir').focus(); } });
  document.addEventListener('visibilitychange', markRead);
  el('chatHistorico').addEventListener('click', async () => {
    if (!user || !cursor || loading || !more) return;
    const current = epoch, list = el('chatMensagens'), height = list.scrollHeight, scroll = list.scrollTop;
    loading = true; el('chatHistorico').disabled = true;
    try {
      const snapshot = await collection.orderBy('createdAt','desc').startAfter(cursor).limit(50).get();
      if (current !== epoch) return;
      snapshot.docs.forEach(doc => messages.set(doc.id,{...doc.data(),id:doc.id}));
      if (snapshot.docs.length) cursor = snapshot.docs.at(-1); more = snapshot.docs.length === 50; historyLoaded = true;
      render(); list.scrollTop = scroll + list.scrollHeight - height;
    } catch (error) { if (current === epoch) status(errorText(error)); }
    finally { if (current === epoch) { loading = false; el('chatHistorico').disabled = false; } }
  });
  el('chatForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!user || sending || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
    const texto = el('chatTexto').value.trim(); if (!texto || texto.length > 2000) { status('Escreva uma mensagem de até 2.000 caracteres.'); return; }
    const owner = user, current = epoch;
    // Reutiliza o ID em tentativas do mesmo envio para evitar mensagens duplicadas após falha de rede.
    if (!pendingSend || pendingSend.texto !== texto) pendingSend = {texto,ref:collection.doc()};
    const attempt = pendingSend; sending = true; el('chatEnviar').disabled = true; el('chatTexto').disabled = true; status('Enviando mensagem…');
    try {
      await db.runTransaction(async transaction => {
        if (!auth.currentUser || auth.currentUser.uid !== owner.uid) throw new Error('Sessão encerrada.');
        const existing = await transaction.get(attempt.ref); if (existing.exists) return;
        transaction.set(attempt.ref,{texto,autorUid:owner.uid,autorNome:(owner.displayName || owner.email || 'Professor').slice(0,200),autorEmail:owner.email,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
      if (current === epoch) { el('chatTexto').value = ''; pendingSend = null; status('Mensagem enviada.'); el('chatTexto').disabled = false; el('chatTexto').focus(); }
    } catch (error) { if (current === epoch) status(errorText(error) + ' Seu texto foi mantido para tentar novamente.'); }
    finally { if (current === epoch) { sending = false; el('chatEnviar').disabled = false; el('chatTexto').disabled = false; } }
  });
  auth.onAuthStateChanged(next => {
    epoch++; if (unsubscribe) unsubscribe(); unsubscribe = null;
    user = next; messages = new Map(); latest = []; cursor = null; more = false; historyLoaded = false; opened = false; sending = false; loading = false; pendingSend = null;
    el('chatMensagens').replaceChildren(); el('chatTexto').value = ''; el('chatTexto').disabled = false; el('chatEnviar').disabled = false; el('chatHistorico').disabled = false; el('chatNaoLidas').hidden = true; el('chatPainel').hidden = true; el('chatAbrir').setAttribute('aria-expanded','false'); status(''); widget.hidden = !next;
    if (user) { try { lastRead = Number(localStorage.getItem(key())) || 0; } catch (_) { lastRead = 0; } unread(); listen(); }
  });
})();
