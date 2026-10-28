'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,getDoc,getDocs,query,limit,where,documentId,setDoc,updateDoc,deleteDoc,serverTimestamp,setLogLevel}=require('firebase/firestore');setLogLevel('silent');
let count=0;const yes=async p=>{const r=await assertSucceeds(p);count++;return r;},no=async p=>{await assertFails(p);count++;};
(async()=>{
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8087');
 const read=name=>fs.readFileSync(path.join(__dirname,'../firebase/'+name),'utf8'),rules=read('chat-emojis-exclusao-teste.rules'),previous=read('chat-respostas-teste.rules');
 const normalize=s=>s.replace(/match \/chatEquipe\/\{mensagemId\} \{[\s\S]*?(?=\/\/ Insira este bloco DENTRO)/,'<CHAT>');assert.equal(normalize(rules),normalize(previous));count++;
 const env=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules}});
 try{await env.clearFirestore();const a=env.authenticatedContext('a',{email:'a@example.test'}).firestore(),b=env.authenticatedContext('b',{email:'b@example.test'}).firestore(),anon=env.unauthenticatedContext().firestore();
 const data=(uid,texto='Mensagem de teste 🙂 👍')=>({texto,autorUid:uid,autorNome:'Profissional '+uid,autorEmail:uid+'@example.test',createdAt:serverTimestamp()});
 const root=(db,id)=>doc(db,'chatEquipe',id),patch=()=>({texto:'',apagada:true,apagadaEm:serverTimestamp()});
 await yes(setDoc(root(a,'original'),data('a')));await yes(setDoc(root(b,'resposta'),{...data('b','Resposta com emoji ❤️'),respostaId:'original'}));await yes(setDoc(root(b,'outra'),data('b')));
 await no(updateDoc(root(b,'original'),patch()));await no(updateDoc(root(anon,'original'),patch()));
 for(const change of [{texto:'Editado'},{...patch(),texto:'Conteúdo oculto'},{...patch(),apagada:false},{texto:'',apagada:true},{...patch(),apagadaEm:new Date(0)},{...patch(),autorUid:'b'},{...patch(),autorEmail:'b@example.test'},{...patch(),autorNome:'Nome alterado'},{...patch(),createdAt:serverTimestamp()},{...patch(),respostaId:'outra'},{...patch(),extra:true}])await no(updateDoc(root(a,'original'),change));
 await no(deleteDoc(root(a,'original')));await no(setDoc(root(a,'criada-apagada'),{...data('a'),...patch()}));
 await yes(updateDoc(root(a,'original'),patch()));const removed=await yes(getDoc(root(b,'original')));assert.equal(removed.data().texto,'');count++;assert.equal(removed.data().apagada,true);count++;assert.equal(removed.data().autorUid,'a');count++;assert(removed.data().apagadaEm.toMillis()>0);count++;
 await no(updateDoc(root(a,'original'),{texto:'Restaurar',apagada:false}));await no(updateDoc(root(a,'original'),patch()));await no(deleteDoc(root(a,'original')));
 await no(setDoc(root(b,'nova-resposta'),{...data('b'),respostaId:'original'}));const reply=await yes(getDoc(root(a,'resposta')));assert.equal(reply.data().respostaId,'original');count++;
 await no(updateDoc(root(a,'resposta'),patch()));await yes(updateDoc(root(b,'resposta'),patch()));const deletedReply=await yes(getDoc(root(a,'resposta')));assert.equal(deletedReply.data().respostaId,'original');count++;
 await yes(setDoc(root(a,'comum'),data('a')));await yes(setDoc(root(b,'valida'),{...data('b'),respostaId:'comum'}));
 await yes(getDocs(query(collection(b,'chatEquipe'),where(documentId(),'in',['original','resposta','comum']),limit(10))));await no(getDocs(query(collection(anon,'chatEquipe'),where(documentId(),'in',['original']),limit(10))));
 await yes(setDoc(doc(a,'chatEquipe/resposta/leituras/a'),{uid:'a',email:'a@example.test',lidoEm:serverTimestamp()}));
 await env.cleanup();const old=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules:previous}});try{const oldA=old.authenticatedContext('a',{email:'a@example.test'}).firestore();await no(updateDoc(root(oldA,'comum'),patch()));await yes(setDoc(root(oldA,'emoji-sem-regra-nova'),data('a','Emojis continuam como texto 🎉')));}finally{await old.cleanup();}
 console.log(count+' verificações de exclusão/compatibilidade do chat passaram; somente emulador.');
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});
