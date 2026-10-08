'use strict';
const fs = require('node:fs'), path = require('node:path');
const {initializeTestEnvironment, assertSucceeds, assertFails} = require('@firebase/rules-unit-testing');
const {doc, setDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, collection, getDocs} = require('firebase/firestore');
const {ref, uploadBytes, getBytes, deleteObject} = require('firebase/storage');
(async () => {
  const root = path.resolve(__dirname, '..');
  const env = await initializeTestEnvironment({projectId: 'demo-planos-aula',
    firestore: {host: '127.0.0.1', port: 8085, rules: fs.readFileSync(path.join(root,'firebase/planos-firestore.rules'),'utf8')},
    storage: {host: '127.0.0.1', port: 9195, rules: fs.readFileSync(path.join(root,'firebase/planos-storage.rules'),'utf8')}});
  let count = 0;
  const succeeds = async promise => {await assertSucceeds(promise); count++;};
  const fails = async promise => {await assertFails(promise); count++;};
  try {
    await env.clearFirestore(); await env.clearStorage();
    const a = env.authenticatedContext('professor-a'), b = env.authenticatedContext('professor-b'), anonymous = env.unauthenticatedContext();
    const filePath = 'planosAula/professor-a/plano-1/arquivo-1.docx';
    const data = {titulo:'Plano de leitura', tema:'Leitura', descricao:'Prática em equipe', autorUid:'professor-a', autorNome:'Ana', uploadedAt:serverTimestamp(), updatedAt:serverTimestamp(), storagePath:filePath, fileName:'leitura.docx', fileSize:8};
    const target = context => doc(context.firestore(), 'planosAula/plano-1');
    await fails(setDoc(target(anonymous), data));
    await fails(setDoc(target(b), data));
    await succeeds(setDoc(target(a), data));
    await fails(getDoc(target(anonymous)));
    await succeeds(getDoc(target(b)));
    await succeeds(getDocs(collection(b.firestore(), 'planosAula')));
    await fails(updateDoc(target(b), {titulo:'Alteração indevida', updatedAt:serverTimestamp()}));
    await fails(updateDoc(target(a), {autorUid:'professor-b', updatedAt:serverTimestamp()}));
    await fails(updateDoc(target(a), {uploadedAt:serverTimestamp(), updatedAt:serverTimestamp()}));
    await fails(updateDoc(target(a), {storagePath:'planosAula/professor-b/plano-1/arquivo.docx', updatedAt:serverTimestamp()}));
    await fails(updateDoc(target(a), {titulo:'x'.repeat(151), updatedAt:serverTimestamp()}));
    await fails(updateDoc(target(a), {campoExtra:true, updatedAt:serverTimestamp()}));
    await succeeds(updateDoc(target(a), {titulo:'Leitura em grupo', updatedAt:serverTimestamp()}));
    const mime = {contentType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
    const bytes = new Uint8Array([80,75,3,4,1,2,3,4]);
    const object = context => ref(context.storage(), filePath);
    await fails(uploadBytes(object(anonymous), bytes, mime));
    await fails(uploadBytes(object(b), bytes, mime));
    await fails(uploadBytes(object(a), bytes, {contentType:'text/plain'}));
    await fails(uploadBytes(ref(a.storage(), 'planosAula/professor-a/plano-1/arquivo.pdf'), bytes, mime));
    await fails(uploadBytes(object(a), new Uint8Array(10*1024*1024+1), mime));
    await succeeds(uploadBytes(object(a), bytes, mime));
    await fails(uploadBytes(object(a), bytes, mime)); // Arquivos publicados são imutáveis.
    await fails(getBytes(object(anonymous)));
    await succeeds(getBytes(object(b)));
    await fails(deleteObject(object(b)));
    await fails(deleteDoc(target(b)));
    await succeeds(deleteDoc(target(a)));
    await succeeds(deleteObject(object(a)));
    console.log(count + ' verificações de regras passaram: leitura compartilhada, acesso anônimo negado e alteração/exclusão restritas ao autor.');
  } finally { await env.cleanup(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
