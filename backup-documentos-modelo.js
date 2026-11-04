/* Backup tipado do Firestore. Não contém operações de gravação ou restauração. */
(() => {
  'use strict';
  const colecoes = Object.freeze(['paee_alunos', 'diagnostica_srm', 'relatorios_srm']);
  function codificar(value) {
    const f = firebase.firestore;
    if (value === null) return ['null'];
    if (typeof value === 'string' || typeof value === 'boolean') return [typeof value, value];
    if (typeof value === 'number') return ['number', Number.isNaN(value) ? 'NaN' : value === Infinity ? 'Infinity' : value === -Infinity ? '-Infinity' : Object.is(value, -0) ? '-0' : value];
    if (value instanceof f.Timestamp) return ['timestamp', value.seconds, value.nanoseconds];
    if (value instanceof f.GeoPoint) return ['geopoint', value.latitude, value.longitude];
    if (value instanceof f.DocumentReference) return ['reference', value.firestore.app.options.projectId, value.path];
    if (value instanceof f.Blob) return ['bytes', value.toBase64()];
    if (Array.isArray(value)) return ['array', value.map(codificar)];
    if (value && Object.getPrototypeOf(value) === Object.prototype) return ['map', Object.keys(value).sort().map(key => [key, codificar(value[key])])];
    throw new Error('Tipo não reconhecido. O backup não será baixado incompleto.');
  }
  async function digest(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function coletar(db, vigente, progresso) {
    const resultado = [];
    for (const nome of colecoes) {
      let ultimo = null;
      const documentos = [], ids = new Set();
      while (true) {
        if (!vigente()) throw new Error('A conta mudou. Backup cancelado.');
        let q = db.collection(nome).orderBy(firebase.firestore.FieldPath.documentId()).limit(200);
        if (ultimo) q = q.startAfter(ultimo);
        const snap = await q.get({source: 'server'});
        if (!vigente()) throw new Error('A conta mudou. Backup cancelado.');
        if (snap.metadata?.fromCache) throw new Error('Dados recebidos do cache. Tente conectado à internet.');
        for (const doc of snap.docs) {
          if (ids.has(doc.id)) throw new Error('Documento repetido durante a leitura. Refaça o backup.');
          ids.add(doc.id);
          documentos.push({id: doc.id, campos: codificar(doc.data())});
        }
        progresso(nome, documentos.length);
        if (snap.docs.length < 200) break;
        ultimo = snap.docs[snap.docs.length - 1];
      }
      resultado.push({nome, quantidade: documentos.length, documentos});
    }
    return resultado;
  }
  async function verificar(arquivo) {
    if (arquivo?.formato !== 'srm-backup-documentos-v1' || arquivo.conteudo?.projeto !== 'paee-3fea6' || arquivo.sha256 !== await digest(arquivo.conteudo)) throw new Error('Arquivo inválido ou conteúdo alterado.');
    const c = arquivo.conteudo.colecoes;
    if (!Array.isArray(c) || c.length !== colecoes.length) throw new Error('Lista de coleções incompleta.');
    c.forEach((item, index) => {
      if (item.nome !== colecoes[index] || !Array.isArray(item.documentos) || item.quantidade !== item.documentos.length || new Set(item.documentos.map(d => d.id)).size !== item.quantidade) throw new Error('Quantidades inconsistentes.');
    });
    return c.map(item => ({nome: item.nome, quantidade: item.quantidade}));
  }
  window.BackupDocumentos = Object.freeze({colecoes, codificar, digest, coletar, verificar});
})();
