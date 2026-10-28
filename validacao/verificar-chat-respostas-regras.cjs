'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,getDoc,getDocs,query,limit,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp,setLogLevel}=require('firebase/firestore');setLogLevel('silent');
let count=0;const yes=async p=>{const r=await assertSucceeds(p);count++;return r;},no=async p=>{await assertFails(p);count++;};
(async()=>{
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8087');
 const rules=fs.readFileSync(path.join(__dirname,'../firebase/chat-respostas-teste.rules'),'utf8'),previous=fs.readFileSync(path.join(__dirname,'../firebase/compartilhamento-teste.rules'),'utf8');
 const normalize=s=>s.replace(/match \/chatEquipe\/\{mensagemId\} \{[\s\S]*?(?=\/\/ Insira este bloco DENTRO)/,'<CHAT>');assert.equal(normalize(rules),normalize(previous));count++;
 const env=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules}});
 try{await env.clearFirestore();const a=env.authenticatedContext('a',{email:'a@example.test'}).firestore(),b=env.authenticatedContext('b',{email:'b@example.test'}).firestore(),anon=env.unauthenticatedContext().firestore();
 const data=(uid,texto='Mensagem de teste')=>({texto,autorUid:uid,autorNome:'Profissional '+uid,autorEmail:uid+'@example.test',createdAt:serverTimestamp()});
 const root=(db,id)=>doc(db,'chatEquipe',id);
 await yes(setDoc(root(a,'original'),data('a')));await yes(setDoc(root(b,'comum'),data('b')));
 const reply={...data('b','Resposta vinculada'),respostaId:'original'};
 await yes(setDoc(root(b,'resposta'),reply));const stored=await yes(getDoc(root(a,'resposta')));assert.equal(stored.data().respostaId,'original');count++;
 await yes(setDoc(root(a,'outra-resposta'),{...data('a'),respostaId:'resposta'}));
 await no(setDoc(root(anon,'anon'),reply));await no(setDoc(root(a,'falso-autor'),reply));await no(setDoc(root(b,'falso-email'),{...reply,autorEmail:'a@example.test'}));
 for(const respostaId of ['nao-existe','','x'.repeat(129),'original/segmento','..',null,15,[],{}])await no(setDoc(root(b,'invalida'),{...reply,respostaId}));
 await no(setDoc(root(b,'mesmo-id'),{...reply,respostaId:'mesmo-id'}));
 await no(setDoc(root(b,'texto-forjado'),{...reply,respostaTexto:'Citação inventada'}));await no(setDoc(root(b,'autor-forjado'),{...reply,respostaAutor:'Outro profissional'}));
 await no(setDoc(root(b,'texto-vazio'),{...reply,texto:''}));await no(setDoc(root(b,'texto-longo'),{...reply,texto:'x'.repeat(2001)}));await no(setDoc(root(b,'data-falsa'),{...reply,createdAt:new Date(0)}));
 await no(updateDoc(root(b,'resposta'),{respostaId:'comum'}));await no(updateDoc(root(a,'resposta'),{texto:'Alterado'}));await no(deleteDoc(root(b,'resposta')));
 await no(getDoc(root(anon,'resposta')));await yes(getDocs(query(collection(a,'chatEquipe'),limit(100))));await no(getDocs(collection(a,'chatEquipe')));await no(getDocs(query(collection(a,'chatEquipe'),limit(101))));
 const batch=writeBatch(a);batch.set(root(a,'novo-original'),data('a'));batch.set(root(a,'resposta-no-mesmo-lote'),{...data('a'),respostaId:'novo-original'});await no(batch.commit());
 await yes(setDoc(doc(a,'chatEquipe/resposta/leituras/a'),{uid:'a',email:'a@example.test',lidoEm:serverTimestamp()}));await no(setDoc(doc(b,'chatEquipe/resposta/leituras/a'),{uid:'a',email:'a@example.test',lidoEm:serverTimestamp()}));
 // As regras anteriores continuam aceitando mensagens comuns e recusando o novo campo.
 await env.cleanup();const old=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules:previous}});
 try{const oldB=old.authenticatedContext('b',{email:'b@example.test'}).firestore();await no(setDoc(root(oldB,'resposta-regra-antiga'),reply));await yes(setDoc(root(oldB,'comum-regra-antiga'),data('b')));}finally{await old.cleanup();}
 console.log(count+' verificações das regras de respostas do chat passaram; somente emulador.');
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});
