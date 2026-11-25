/* Links compartilhados no Firebase do Diário; sem upload de arquivos. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const auth = firebase.auth(), db = firebase.firestore(), collection = db.collection('recursosDidaticos');
  let user = null, unsubscribe = null, active = false, items = [], editing = null, busy = false, generation = 0;
  const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function status(message) { el('recursosStatus').textContent = message; }
  function message(error) {
    return /permission-denied/.test(error.code || '') ? 'Não foi possível acessar os recursos. Confira as regras de Recursos Didáticos no Firestore.' : error.message || 'Não foi possível concluir. Confira sua conexão.';
  }
  function requireUser(uid = user && user.uid) {
    if (!user || !auth.currentUser || auth.currentUser.uid !== uid) throw new Error('Entre novamente no Diário para continuar.');
    return user;
  }
  function safeLink(value) {
    let url;
    try { url = new URL(value); } catch (_) { throw new Error('Informe um link completo, começando com https:// ou http://.'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use um endereço http:// ou https://, sem senha no link.');
    if (url.href.length > 2048) throw new Error('O link deve ter até 2.048 caracteres.');
    return url.href;
  }
  function reset() {
    editing = null; el('recursoForm').reset(); el('recursoFormTitulo').textContent = 'Cadastrar recurso';
    el('recursoSalvar').textContent = 'Cadastrar recurso'; el('recursoCancelar').hidden = true;
  }
  function setBusy(value) {
    busy = value;
    el('recursoForm').querySelectorAll('input,textarea,button').forEach(node => { node.disabled = value; });
    el('recursosLista').querySelectorAll('button').forEach(node => { node.disabled = value; });
  }
  function add(parent, tag, text) { const node = document.createElement(tag); node.textContent = text; parent.appendChild(node); return node; }
  function date(value) { return value && value.toDate ? value.toDate().toLocaleString('pt-BR') : 'Registrando data…'; }
  function render() {
    const list = el('recursosLista'); list.replaceChildren();
    const query = normalize(el('recursosBusca').value);
    const visible = items.filter(item => normalize([item.descricao, item.link, item.autorNome].join(' ')).includes(query));
    if (!visible.length) { add(list, 'p', query ? 'Nenhum recurso encontrado para esta busca.' : 'Nenhum recurso cadastrado. Compartilhe o primeiro!'); return; }
    visible.forEach(item => {
      const card = document.createElement('article'); card.className = 'plano-item'; list.appendChild(card);
      add(card, 'p', item.descricao);
      try {
        const href = safeLink(item.link), link = add(card, 'a', 'Abrir');
        link.className = 'recurso-abrir';
        link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
        link.setAttribute('aria-label', 'Abrir recurso: ' + item.descricao);
      } catch (_) { add(card, 'p', 'Link inválido. Peça ao autor para corrigir.'); }
      add(card, 'small', 'Autor: ' + item.autorNome + ' • Inserido em: ' + date(item.createdAt));
      if (item.updatedAt && item.createdAt && item.updatedAt.toMillis() !== item.createdAt.toMillis()) add(card, 'small', 'Atualizado em: ' + date(item.updatedAt));
      if (user && item.autorUid === user.uid) {
        const actions = document.createElement('div'); actions.className = 'planos-actions'; card.appendChild(actions);
        [['Editar', () => edit(item)], ['Excluir', () => remove(item)]].forEach(([label, callback]) => {
          const button = add(actions, 'button', label); button.type = 'button'; button.className = 'back-btn'; button.disabled = busy; button.addEventListener('click', callback);
        });
      }
    });
  }
  function listen() {
    if (!user || !active || unsubscribe) return;
    const epoch = generation; status('Carregando recursos…');
    unsubscribe = collection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      if (epoch !== generation) return;
      items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); render(); if (!busy) status('');
    }, error => {
      if (epoch !== generation) return;
      items = []; el('recursosLista').replaceChildren(); status(message(error));
      if (unsubscribe) unsubscribe(); unsubscribe = null;
    });
  }
  function edit(item) {
    if (busy) return; requireUser(item.autorUid); editing = item;
    el('recursoDescricao').value = item.descricao; el('recursoLink').value = item.link;
    el('recursoFormTitulo').textContent = 'Editar recurso'; el('recursoSalvar').textContent = 'Salvar alterações'; el('recursoCancelar').hidden = false;
    el('recursoForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); el('recursoDescricao').focus();
  }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    const epoch = generation, previous = editing;
    let owner, link;
    try { owner = requireUser(); link = safeLink(el('recursoLink').value.trim()); } catch (error) { status(message(error)); return; }
    const descricao = el('recursoDescricao').value.trim();
    if (!descricao || descricao.length > 1000) { status('Informe uma descrição de até 1.000 caracteres.'); return; }
    setBusy(true); status('Salvando recurso…');
    try {
      const ref = previous ? collection.doc(previous.id) : collection.doc();
      await db.runTransaction(async transaction => {
        requireUser(owner.uid);
        const now = firebase.firestore.FieldValue.serverTimestamp();
        if (previous) {
          const current = await transaction.get(ref);
          if (!current.exists || current.data().autorUid !== owner.uid) throw new Error('Este recurso foi excluído ou não pertence a você.');
          if (current.data().updatedAt.toMillis() !== previous.updatedAt.toMillis()) throw new Error('O recurso foi alterado em outra janela. Cancele e abra a edição novamente.');
          transaction.update(ref, { descricao, link, updatedAt: now });
        } else {
          transaction.set(ref, { descricao, link, autorUid: owner.uid, autorNome: (owner.displayName || owner.email || 'Professor').slice(0, 200), createdAt: now, updatedAt: now });
        }
      });
      if (epoch === generation) { reset(); status(previous ? 'Alterações salvas.' : 'Recurso cadastrado para a equipe.'); }
    } catch (error) { if (epoch === generation) status(message(error)); }
    finally { if (epoch === generation) setBusy(false); }
  }
  async function remove(item) {
    if (busy || !confirm('Excluir este recurso da listagem?')) return;
    const epoch = generation; setBusy(true); status('Excluindo recurso…');
    try {
      const owner = requireUser(item.autorUid);
      await db.runTransaction(async transaction => {
        requireUser(owner.uid);
        const ref = collection.doc(item.id), current = await transaction.get(ref);
        if (!current.exists) return;
        if (current.data().autorUid !== owner.uid || current.data().updatedAt.toMillis() !== item.updatedAt.toMillis()) throw new Error('O recurso mudou. Confira a lista antes de excluir.');
        transaction.delete(ref);
      });
      if (epoch === generation) { if (editing && editing.id === item.id) reset(); status('Recurso excluído.'); }
    } catch (error) { if (epoch === generation) status(message(error)); }
    finally { if (epoch === generation) setBusy(false); }
  }
  el('recursoForm').addEventListener('submit', save);
  el('recursoCancelar').addEventListener('click', () => { reset(); status(''); });
  el('recursosBusca').addEventListener('input', render);
  auth.onAuthStateChanged(next => {
    generation++; if (unsubscribe) unsubscribe(); unsubscribe = null;
    user = next; items = []; reset(); setBusy(false); el('recursosBusca').value = ''; el('recursosLista').replaceChildren(); status(''); listen();
  });
  window.RecursosDidaticos = { activate() { active = true; if (!user) { status('Entre no Diário para acessar os recursos.'); return; } listen(); } };
})();
