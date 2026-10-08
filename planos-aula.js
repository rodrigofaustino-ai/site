/* Banco compartilhado: Firebase do Diário, separado dos documentos dos alunos. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const auth = firebase.auth(), db = firebase.firestore(), storage = firebase.storage();
  const collection = db.collection('planosAula');
  const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const MAX = 10 * 1024 * 1024;
  let user = null, unsubscribe = null, items = [], editing = null, active = false, busy = false, generation = 0;
  function status(message) { el('planosStatus').textContent = message; }
  function requireUser(expected = user && user.uid) {
    if (!user || !auth.currentUser || auth.currentUser.uid !== expected) throw new Error('Entre novamente no Diário para continuar.');
    return user;
  }
  function errorMessage(error) {
    if (/permission-denied|unauthorized/.test(error.code || '')) return 'Acesso não autorizado. Confira as regras do Banco de Planos no Firebase.';
    if (/bucket-not-found|project-not-found/.test(error.code || '')) return 'O armazenamento dos planos ainda precisa ser ativado no Firebase.';
    if (/object-not-found/.test(error.code || '')) return 'O arquivo não foi encontrado. Peça ao autor para substituí-lo.';
    return error.message || 'Não foi possível concluir. Verifique a conexão e tente novamente.';
  }
  function resetForm() {
    editing = null; el('planoForm').reset(); el('planoArquivo').required = true;
    el('planoArquivoLabel').firstChild.textContent = 'Arquivo DOCX (até 10 MB)';
    el('planoFormTitulo').textContent = 'Cadastrar plano de aula';
    el('planoSalvar').textContent = 'Cadastrar plano'; el('planoCancelar').hidden = true;
  }
  function setBusy(value) {
    busy = value;
    el('planoForm').querySelectorAll('input,textarea,button').forEach(node => { node.disabled = value; });
    el('planosLista').querySelectorAll('button').forEach(node => { node.disabled = value; });
  }
  const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function date(timestamp) { return timestamp && timestamp.toDate ? timestamp.toDate().toLocaleString('pt-BR') : 'Salvando data…'; }
  function textNode(tag, value, parent) { const node = document.createElement(tag); node.textContent = value; parent.appendChild(node); return node; }
  function render() {
    const list = el('planosLista'); list.replaceChildren();
    const query = normalize(el('planosBusca').value);
    const visible = items.filter(item => normalize([item.titulo, item.tema, item.descricao, item.autorNome].join(' ')).includes(query));
    if (!visible.length) { textNode('p', query ? 'Nenhum plano encontrado para esta busca.' : 'Nenhum plano cadastrado. Compartilhe o primeiro!', list); return; }
    visible.forEach(item => {
      const card = document.createElement('article'); card.className = 'plano-item'; list.appendChild(card);
      textNode('h3', item.titulo, card); textNode('p', 'Conteúdo/tema: ' + item.tema, card); textNode('p', item.descricao, card);
      textNode('small', 'Autor: ' + item.autorNome + ' • Upload: ' + date(item.uploadedAt), card);
      if (item.updatedAt && item.uploadedAt && item.updatedAt.toMillis() !== item.uploadedAt.toMillis()) textNode('small', 'Atualizado: ' + date(item.updatedAt), card);
      textNode('small', item.fileName, card);
      const actions = document.createElement('div'); actions.className = 'planos-actions'; card.appendChild(actions);
      function button(label, callback) { const node = textNode('button', label, actions); node.type = 'button'; node.className = 'back-btn'; node.disabled = busy; node.addEventListener('click', callback); }
      button('Visualizar', () => read(item, false)); button('Baixar DOCX', () => read(item, true));
      if (user && item.autorUid === user.uid) { button('Editar', () => edit(item)); button('Excluir', () => remove(item)); }
    });
  }
  function listen() {
    if (unsubscribe || !user || !active) return;
    const epoch = generation;
    status('Carregando planos…');
    unsubscribe = collection.orderBy('uploadedAt', 'desc').onSnapshot(snapshot => {
      if (epoch !== generation) return;
      items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); render();
      if (!busy) status('');
    }, error => { if (epoch === generation) { items = []; el('planosLista').replaceChildren(); status(errorMessage(error)); if (unsubscribe) unsubscribe(); unsubscribe = null; } });
  }
  async function validateDocx(file) {
    if (!file || !/\.docx$/i.test(file.name)) throw new Error('Selecione um arquivo no formato DOCX.');
    if (!file.size || file.size > MAX) throw new Error('O DOCX deve ter até 10 MB.');
    let zip;
    try { zip = await JSZip.loadAsync(await file.arrayBuffer()); } catch (_) { throw new Error('O arquivo selecionado não é um DOCX válido.'); }
    if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml') || zip.file('word/vbaProject.bin')) throw new Error('O arquivo selecionado não é um DOCX válido.');
    const expanded = Object.values(zip.files).reduce((sum, entry) => sum + (entry._data && entry._data.uncompressedSize || 0), 0);
    if (expanded > 30 * 1024 * 1024) throw new Error('O conteúdo descompactado é muito grande. Reduza as imagens do DOCX.');
  }
  function edit(item) {
    if (busy) return;
    requireUser(item.autorUid); editing = item;
    el('planoTitulo').value = item.titulo; el('planoTema').value = item.tema; el('planoDescricao').value = item.descricao;
    el('planoArquivo').value = ''; el('planoArquivo').required = false;
    el('planoArquivoLabel').firstChild.textContent = 'Substituir DOCX (opcional, até 10 MB)';
    el('planoFormTitulo').textContent = 'Editar plano de aula'; el('planoSalvar').textContent = 'Salvar alterações'; el('planoCancelar').hidden = false;
    el('planoForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); el('planoTitulo').focus();
  }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    const epoch = generation, owner = requireUser(), previous = editing;
    const metadata = { titulo: el('planoTitulo').value.trim(), tema: el('planoTema').value.trim(), descricao: el('planoDescricao').value.trim() };
    if (Object.values(metadata).some(value => !value)) { status('Preencha título, conteúdo/tema e descrição.'); return; }
    const file = el('planoArquivo').files[0];
    const ref = previous ? collection.doc(previous.id) : collection.doc();
    let newPath = null, committed = false;
    setBusy(true); status('Salvando plano…');
    try {
      if (!previous || file) {
        await validateDocx(file); requireUser(owner.uid);
        newPath = 'planosAula/' + owner.uid + '/' + ref.id + '/' + crypto.randomUUID() + '.docx';
        await storage.ref(newPath).put(file, { contentType: MIME });
        metadata.storagePath = newPath; metadata.fileName = file.name; metadata.fileSize = file.size;
      }
      requireUser(owner.uid);
      const now = firebase.firestore.FieldValue.serverTimestamp(); metadata.updatedAt = now;
      await db.runTransaction(async transaction => {
        const current = await transaction.get(ref);
        if (previous) {
          if (!current.exists || current.data().autorUid !== owner.uid) throw new Error('Este plano foi excluído ou não pertence a você.');
          if (current.data().updatedAt.toMillis() !== previous.updatedAt.toMillis()) throw new Error('O plano foi modificado em outra janela. Cancele a edição e abra-o novamente.');
          transaction.update(ref, metadata);
        } else {
          transaction.set(ref, { ...metadata, autorUid: owner.uid, autorNome: (owner.displayName || owner.email || 'Professor').slice(0, 200), uploadedAt: now });
        }
      });
      committed = true;
      if (epoch === generation) { resetForm(); status(previous ? 'Alterações salvas.' : 'Plano cadastrado para a equipe.'); }
      if (newPath && previous) {
        try { await storage.ref(previous.storagePath).delete(); } catch (_) { if (epoch === generation) status('Alterações salvas. O arquivo anterior não pôde ser removido do armazenamento.'); }
      }
    } catch (error) {
      // Uma falha de rede pode ocorrer depois do commit. Confirme antes de apagar o novo arquivo.
      if (newPath && !committed && auth.currentUser && auth.currentUser.uid === owner.uid) {
        try { const current = await ref.get(); if (!current.exists || current.data().storagePath !== newPath) await storage.ref(newPath).delete(); } catch (_) { /* Conservar o arquivo quando o resultado do salvamento é desconhecido. */ }
      }
      if (epoch === generation) status(errorMessage(error));
    } finally { if (epoch === generation) setBusy(false); }
  }
  async function remove(item) {
    if (busy || !confirm('Excluir o plano “' + item.titulo + '”? Esta ação não pode ser desfeita.')) return;
    const epoch = generation; requireUser(item.autorUid); setBusy(true); status('Excluindo plano…');
    try {
      await db.runTransaction(async transaction => {
        const ref = collection.doc(item.id), current = await transaction.get(ref);
        if (!current.exists) return;
        if (current.data().autorUid !== user.uid || current.data().storagePath !== item.storagePath) throw new Error('O plano mudou. Atualize a lista antes de excluir.');
        transaction.delete(ref);
      });
      if (epoch === generation) { if (editing && editing.id === item.id) resetForm(); closePreview(); status('Plano excluído.'); }
      try { await storage.ref(item.storagePath).delete(); } catch (error) { if (epoch === generation && error.code !== 'storage/object-not-found') status('Plano excluído da biblioteca. Não foi possível remover o arquivo do armazenamento.'); }
    } catch (error) { if (epoch === generation) status(errorMessage(error)); }
    finally { if (epoch === generation) setBusy(false); }
  }
  function closePreview() { el('planoViewer').hidden = true; el('planoPreview').srcdoc = ''; el('planoViewerTitulo').textContent = ''; }
  function sanitizedPreview(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const allowed = new Set(['P','BR','STRONG','B','EM','I','U','S','H1','H2','H3','H4','H5','H6','UL','OL','LI','TABLE','THEAD','TBODY','TFOOT','TR','TD','TH','BLOCKQUOTE','SPAN','DIV','IMG','SUP','SUB']);
    [...doc.body.querySelectorAll('*')].reverse().forEach(node => {
      if (['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','META','LINK'].includes(node.tagName)) { node.remove(); return; }
      if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
      const src = node.tagName === 'IMG' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(node.getAttribute('src') || '') ? node.getAttribute('src') : null;
      [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
      if (node.tagName === 'IMG') { if (src) node.setAttribute('src', src); else node.remove(); }
    });
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data:; style-src &#39;unsafe-inline&#39;"><style>body{font:16px Arial;padding:24px;color:#222;line-height:1.5;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #bbb;padding:6px}</style></head><body>' + doc.body.innerHTML + '</body></html>';
  }
  async function read(item, download) {
    if (busy) return;
    const epoch = generation, owner = requireUser(); setBusy(true); status(download ? 'Baixando DOCX…' : 'Preparando prévia…');
    try {
      // Não usar getDownloadURL: URLs com token permitem acesso sem login.
      const token = await owner.getIdToken();
      const bucket = storage.ref().bucket;
      const response = await fetch('https://firebasestorage.googleapis.com/v0/b/' + encodeURIComponent(bucket) + '/o/' + encodeURIComponent(item.storagePath) + '?alt=media', { headers: { Authorization: 'Firebase ' + token }, cache: 'no-store', credentials: 'omit' });
      if (!response.ok) { const error = new Error('Não foi possível acessar o DOCX.'); error.code = response.status === 403 || response.status === 401 ? 'storage/unauthorized' : response.status === 404 ? 'storage/object-not-found' : 'storage/unknown'; throw error; }
      const blob = await response.blob(); requireUser(owner.uid); if (epoch !== generation) return;
      if (download) {
        const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = item.fileName; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        await validateDocx(new File([blob], item.fileName));
        const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
        requireUser(owner.uid); if (epoch !== generation) return;
        el('planoViewerTitulo').textContent = item.titulo; el('planoPreview').srcdoc = sanitizedPreview(result.value); el('planoViewer').hidden = false;
        el('planoViewer').scrollIntoView({ behavior: 'smooth' });
      }
      status('');
    } catch (error) { if (epoch === generation) status(errorMessage(error)); }
    finally { if (epoch === generation) setBusy(false); }
  }
  el('planoForm').addEventListener('submit', save);
  el('planoCancelar').addEventListener('click', () => { resetForm(); status(''); });
  el('planosBusca').addEventListener('input', render); el('planoFechar').addEventListener('click', closePreview);
  auth.onAuthStateChanged(next => {
    generation++; if (unsubscribe) unsubscribe(); unsubscribe = null;
    user = next; items = []; setBusy(false); resetForm(); closePreview(); el('planosBusca').value = ''; el('planosLista').replaceChildren(); status('');
    listen();
  });
  window.PlanosAula = { activate() { active = true; if (!user) { status('Entre no Diário para acessar os planos.'); return; } listen(); } };
})();
