'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,updateDoc,getDoc,serverTimestamp,deleteField,setLogLevel}=require('firebase/firestore');const {ref,uploadBytes,getBytes,getMetadata,deleteObject,listAll}=require('firebase/storage');setLogLevel('silent');
(async()=>{assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8088');const env=await initializeTestEnvironment({projectId:'demo-chat-anexos',firestore:{host:'127.0.0.1',port:8088,rules:fs.readFileSync(path.join(__dirname,'../producao/salamulti.rules'),'utf8')},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync(path.join(__dirname,'../producao/salamulti-storage.rules'),'utf8')}});let checks=0;const yes=async p=>{const x=await assertSucceeds(p);checks++;return x;},no=async p=>{await assertFails(p);checks++;};
try{await env.clearFirestore();await env.clearStorage();const a=env.authenticatedContext('a',{email:'a@example.test'}),b=env.authenticatedContext('b',{email:'b@example.test'}),anon=env.unauthenticatedContext();const adb=a.firestore(),ast=a.storage(),bst=b.storage(),ust=anon.storage();const storages=new Map([[a,ast],[b,bst],[anon,ust]]),st=c=>storages.get(c);const bytes=new Uint8Array([37,80,68,70,45,49,46,52]);const mime='application/pdf',p='chatAnexos/a/arquivo-1/arquivo',meta={contentType:mime,customMetadata:{nomeOriginal:'exemplo.pdf'}};
 const obj=c=>ref(st(c),p),msg=(id='arquivo-1')=>doc(adb,'chatEquipe/'+id);const data=(id='arquivo-1')=>({texto:'',autorUid:'a',autorNome:'Profissional A',autorEmail:'a@example.test',createdAt:serverTimestamp(),anexo:{nome:'exemplo.pdf',tipo:mime,tamanho:bytes.length,caminho:'chatAnexos/a/'+id+'/arquivo'}});
 await no(uploadBytes(obj(anon),bytes,meta));await no(uploadBytes(obj(b),bytes,meta));await no(uploadBytes(obj(a),bytes,{...meta,contentType:'text/html'}));await no(uploadBytes(obj(a),bytes,{contentType:mime}));await no(uploadBytes(obj(a),new Uint8Array(10485761),meta));
 await yes(uploadBytes(obj(a),bytes,meta));await yes(getMetadata(obj(a)));await no(getBytes(obj(b)));await no(getBytes(obj(anon)));await no(listAll(ref(st(a),'chatAnexos/a')));
 const {anexo,...semAnexo}=data('vazio');await no(setDoc(msg('vazio'),semAnexo));
 await no(setDoc(msg('tipo'),{...data('tipo'),anexo:{...data('tipo').anexo,tipo:'text/html'}}));
 await no(setDoc(msg('caminho'),{...data('caminho'),anexo:{...data('caminho').anexo,caminho:p}}));
 await no(setDoc(msg('tamanho'),{...data('tamanho'),anexo:{...data('tamanho').anexo,tamanho:10485761}}));
 await no(setDoc(msg('extra'),{...data('extra'),anexo:{...data('extra').anexo,url:'https://example.test/publico'}}));
 await yes(setDoc(msg(),data()));await no(uploadBytes(obj(a),new Uint8Array([...bytes,0]),meta));await yes(getBytes(obj(b)));await no(getBytes(obj(anon)));await no(deleteObject(obj(b)));await no(updateDoc(msg(),{anexo:{...data().anexo,nome:'alterado.pdf'}}));
 await no(updateDoc(msg(),{texto:'',apagada:true,apagadaEm:serverTimestamp()}));
 await yes(updateDoc(msg(),{texto:'',apagada:true,apagadaEm:serverTimestamp(),anexo:deleteField()}));await no(getBytes(obj(a)));await no(getBytes(obj(b)));await yes(deleteObject(obj(a)));
 await yes(setDoc(msg('texto'),{texto:'Mensagem comum preservada.',autorUid:'a',autorNome:'A',autorEmail:'a@example.test',createdAt:serverTimestamp()}));
 // Metadado forjado não permite ler um objeto com tamanho diferente.
 const p2='chatAnexos/a/forjado/arquivo';await yes(uploadBytes(ref(st(a),p2),bytes,meta));await yes(setDoc(msg('forjado'),{...data('forjado'),anexo:{...data('forjado').anexo,tamanho:1}}));await no(getBytes(ref(st(b),p2)));
 // As permissões publicadas dos planos de aula são preservadas.
 const plano='planosAula/a/plano/arquivo-1.docx',docx={contentType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 await yes(uploadBytes(ref(st(a),plano),bytes,docx));await yes(getBytes(ref(st(b),plano)));await no(getBytes(ref(st(anon),plano)));await no(uploadBytes(ref(st(b),plano),bytes,docx));await no(deleteObject(ref(st(b),plano)));await yes(deleteObject(ref(st(a),plano)));
 await no(uploadBytes(ref(st(a),'outro/arquivo.pdf'),bytes,meta));
 console.log(checks+' verificações de Firestore e Storage aprovadas: anexos privados, publicação, tamanho/tipo, exclusão, imutabilidade e planos de aula preservados.');
}catch(e){console.error('Verificações concluídas antes da falha:',checks);throw e;}finally{await env.cleanup();}})().catch(e=>{console.error(e);process.exitCode=1;});
