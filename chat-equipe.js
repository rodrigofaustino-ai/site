/* Conversa coletiva do Diário. Não envia mensagens sem ação do usuário. */
(() => {
  'use strict';
  const widget = document.createElement('aside'); widget.id = 'chatEquipe'; widget.hidden = true;
  widget.setAttribute('aria-label', 'Chat coletivo da equipe');
  widget.innerHTML = '<section id="chatPainel" hidden aria-label="Conversa da equipe"><header class="chat-cabecalho"><strong>Chat da equipe</strong><button id="chatFechar" type="button" aria-label="Fechar chat">Fechar ×</button></header><button id="chatHistorico" type="button">Carregar mensagens anteriores</button><div id="chatMensagens" role="log" aria-label="Mensagens da equipe" aria-live="polite" aria-relevant="additions"></div><div id="chatStatus" role="status"></div><form id="chatForm"><label for="chatTexto">Mensagem para a equipe</label><textarea id="chatTexto" maxlength="2000" placeholder="Escreva sua mensagem…" required></textarea><button id="chatEnviar" type="submit">Enviar</button></form></section><button id="chatAbrir" type="button" aria-controls="chatPainel" aria-expanded="false">💬 Chat da equipe <span id="chatNaoLidas" hidden></span></button>';
  document.body.appendChild(widget);
  const layout = document.createElement('div'); layout.className = 'chat-conteudo';
  const conversation = document.createElement('div'); conversation.className = 'chat-conversa';
  const header = document.getElementById('chatHistorico');
  header.before(layout); conversation.append(header,document.getElementById('chatMensagens')); layout.appendChild(conversation);
  const sidebar = document.createElement('section'); sidebar.id = 'chatOnline'; sidebar.setAttribute('aria-label','Professores online');
  sidebar.innerHTML = '<details open><summary>Online agora <span id="chatOnlineTotal">0</span></summary><p id="chatPresencaStatus">Configurando presença…</p><ul id="chatOnlineLista"></ul></details>'; layout.appendChild(sidebar);
  const receiptsPanel = document.createElement('section'); receiptsPanel.id = 'chatLeituras'; receiptsPanel.hidden = true;
  receiptsPanel.innerHTML = '<button type="button" id="chatLeiturasFechar">Fechar leituras ×</button><strong>Quem já leu</strong><p id="chatLeiturasStatus"></p><ul id="chatLeiturasLista"></ul>'; conversation.appendChild(receiptsPanel);
  const el = id => document.getElementById(id), auth = firebase.auth(), db = firebase.firestore();
  const collection = db.collection('chatEquipe');
  let user = null, unsubscribe = null, epoch = 0, opened = false, sending = false, loading = false;
  let receiptUnsubscribe = null, observer = null, readTimers = new Map(), acknowledged = new Set(), readScanTimer = null;
  let messages = new Map(), latest = [], cursor = null, more = false, historyLoaded = false, lastRead = 0, pendingSend = null;
  const millis = message => message.createdAt && message.createdAt.toMillis ? message.createdAt.toMillis() : 0;
  const key = () => 'ambienteteste-e368e_chat_lido_' + user.uid;
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
  const nickname = email => String(email || '').split('@')[0];
  function stopReadTracking() {
    clearTimeout(readScanTimer);
    if (observer) observer.disconnect(); observer = null;
    readTimers.forEach(clearTimeout); readTimers.clear();
  }
  function closeReceipts() {
    if (receiptUnsubscribe) receiptUnsubscribe(); receiptUnsubscribe = null;
    el('chatLeituras').hidden = true; el('chatLeiturasLista').replaceChildren(); el('chatLeiturasStatus').textContent = '';
  }
  async function recordRead(message, current) {
    if (!user || current !== epoch || !opened || document.visibilityState !== 'visible' || !millis(message)) return;
    lastRead = Math.max(lastRead,millis(message));
    try { localStorage.setItem(key(),String(lastRead)); } catch (_) {}
    unread();
    if (message.autorUid === user.uid || acknowledged.has(message.id)) return;
    acknowledged.add(message.id);
    const owner = user;
    try {
      const ref = collection.doc(message.id).collection('leituras').doc(owner.uid);
      await db.runTransaction(async transaction => {
        if (!auth.currentUser || auth.currentUser.uid !== owner.uid) return;
        const existing = await transaction.get(ref); if (existing.exists) return;
        transaction.set(ref,{uid:owner.uid,email:owner.email,lidoEm:firebase.firestore.FieldValue.serverTimestamp()});
      });
    } catch (_) {
      if (current === epoch) { acknowledged.delete(message.id); status('Não foi possível confirmar a leitura. Reabra o chat para tentar novamente.'); }
    }
  }
  function markRead() {
    stopReadTracking();
    if (!user || !opened || document.visibilityState !== 'visible') return;
    const current = epoch;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.dataset.messageId;
        const visible = entry.isIntersecting && entry.intersectionRect.height >= Math.min(40,entry.boundingClientRect.height);
        if (!visible) { clearTimeout(readTimers.get(id)); readTimers.delete(id); return; }
        if (readTimers.has(id)) return;
        readTimers.set(id,setTimeout(()=>{readTimers.delete(id); const message = messages.get(id); if (message) recordRead(message,current);},700));
      });
    },{root:el('chatMensagens'),threshold:[0,0.1,0.5,1]});
    el('chatMensagens').querySelectorAll('[data-message-id]').forEach(node=>observer.observe(node));
  }
  function showReceipts(message) {
    closeReceipts(); const current = epoch;
    el('chatLeituras').hidden = false; el('chatLeiturasStatus').textContent = 'Carregando confirmações…';
    receiptUnsubscribe = collection.doc(message.id).collection('leituras').orderBy('lidoEm','asc').limit(200).onSnapshot(snapshot=>{
      if (current !== epoch) return;
      el('chatLeiturasLista').replaceChildren();
      snapshot.docs.forEach(doc=>{const data=doc.data(),li=document.createElement('li'); li.textContent=nickname(data.email)+' • '+(data.lidoEm && data.lidoEm.toDate ? data.lidoEm.toDate().toLocaleString('pt-BR'):'Confirmando…'); el('chatLeiturasLista').appendChild(li);});
      el('chatLeiturasStatus').textContent=snapshot.docs.length?'Exibida na tela destes professores.':'Ainda não há confirmações de leitura.';
    },()=>{if(current===epoch) el('chatLeiturasStatus').textContent='Não foi possível consultar as leituras. Confira as regras do chat.';});
  }
  el('chatLeiturasFechar').addEventListener('click',closeReceipts);
  document.addEventListener('diario:online',event=>{
    el('chatOnlineLista').replaceChildren();
    const online = event.detail.users || [];
    online.forEach(person=>{const li=document.createElement('li');li.textContent=person.apelido;el('chatOnlineLista').appendChild(li);});
    el('chatOnlineTotal').textContent=String(online.length);el('chatPresencaStatus').textContent=event.detail.status || '';
  });
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
      const readers = document.createElement('button'); readers.type='button'; readers.className='chat-ver-leituras'; readers.textContent='Quem já leu'; readers.addEventListener('click',event=>{event.stopPropagation();showReceipts(message);});
      article.dataset.messageId=message.id;
      article.addEventListener('click',()=>showReceipts(message));
      article.append(name,text,time,readers); list.appendChild(article);
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
    if (!value) { stopReadTracking(); closeReceipts(); }
    if (value) { listen(); el('chatMensagens').scrollTop = el('chatMensagens').scrollHeight; markRead(); el('chatTexto').focus(); }
  }
  el('chatAbrir').addEventListener('click', () => toggle(!opened));
  el('chatFechar').addEventListener('click', () => { toggle(false); el('chatAbrir').focus(); });
  el('chatMensagens').addEventListener('scroll',()=>{clearTimeout(readScanTimer);readScanTimer=setTimeout(markRead,80);},{passive:true});
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
    epoch++; stopReadTracking(); closeReceipts(); acknowledged=new Set(); el('chatOnlineLista').replaceChildren(); el('chatOnlineTotal').textContent='0'; if (unsubscribe) unsubscribe(); unsubscribe = null;
    user = next; messages = new Map(); latest = []; cursor = null; more = false; historyLoaded = false; opened = false; sending = false; loading = false; pendingSend = null;
    el('chatMensagens').replaceChildren(); el('chatTexto').value = ''; el('chatTexto').disabled = false; el('chatEnviar').disabled = false; el('chatHistorico').disabled = false; el('chatNaoLidas').hidden = true; el('chatPainel').hidden = true; el('chatAbrir').setAttribute('aria-expanded','false'); status(''); widget.hidden = !next;
    if (user) { try { lastRead = Number(localStorage.getItem(key())) || 0; } catch (_) { lastRead = 0; } unread(); listen(); }
  });
})();
