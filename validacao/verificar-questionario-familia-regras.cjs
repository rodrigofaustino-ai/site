/* Exclusivamente emulador e dados fictícios. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,query,where,getDoc,getDocs,setDoc,updateDoc,writeBatch,serverTimestamp,Timestamp,runTransaction,setLogLevel}=require('firebase/firestore');setLogLevel('silent');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../questionario-familia-modelo.js'),'utf8'),ctx);const M=ctx.window.QuestionarioFamiliaModelo;
(async()=>{
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8087');
 const env=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules:fs.readFileSync(path.join(__dirname,'../producao/salamulti.rules'),'utf8')}});let checks=0;
 const yes=async p=>{await assertSucceeds(p);checks++;},no=async p=>{await assertFails(p);checks++;};
 try{
  await env.clearFirestore();const a=env.authenticatedContext('a',{email:'a@example.test'}).firestore(),b=env.authenticatedContext('b',{email:'b@example.test'}).firestore(),anon=env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'alunos/aluno-a'),{professorUid:'a',nome:'Ana fictícia'});});
  const token=i=>String.fromCharCode(65+i).repeat(43);
  async function criar(i,db=a,exp=Date.now()+86400000){const t=token(i),ts=serverTimestamp(),e=Timestamp.fromMillis(exp),batch=writeBatch(db);batch.set(doc(db,'convitesFamilia/'+t),{professorUid:'a',alunoId:'aluno-a',apelido:'Ana',versao:2,periodo:'2º semestre de 2026',ativa:true,criadoEm:ts,expiraEm:e});batch.set(doc(db,'questionariosFamilia/aluno-a'),{professorUid:'a',alunoId:'aluno-a',token:t,ativa:true,criadoEm:ts,expiraEm:e});return batch.commit();}
  function envio(i,alterar=()=>{}){const t=token(i),batch=writeBatch(anon),ts=serverTimestamp(),r={professorUid:'a',alunoId:'aluno-a',versao:2,envioId:'a'.repeat(32),responsavel:'Responsável fictício',vinculo:'Família',contexto:'Usa imagens para comunicação.',observacoes:'Prioridade: autonomia.',ciencia:true,enviadoEm:ts},areas={};for(const ar of M.areas)areas[ar.key]={respostas:Object.fromEntries(ar.itens.map(q=>[q.id,'nao_sabe'])),observacoesPerguntas:{},enviadoEm:ts};const payload={r,areas,sentinela:true};alterar(payload);batch.set(doc(anon,'respostasFamiliaCompletas/'+t),r);for(const [k,v]of Object.entries(areas))batch.set(doc(anon,'respostasFamiliaCompletas/'+t+'/areas/'+k),v);if(payload.sentinela)batch.set(doc(anon,'enviosFamilia/'+t),{enviadoEm:ts,envioId:r.envioId});return batch.commit();}
  await yes(getDoc(doc(a,'questionariosFamilia/aluno-a')));
  await no(criar(0,b));await no(criar(0,a,Date.now()+100*86400000));await yes(criar(0));
  await yes(getDoc(doc(anon,'convitesFamilia/'+token(0))));await yes(getDoc(doc(anon,'enviosFamilia/'+token(0))));
  await no(getDocs(collection(anon,'convitesFamilia')));await no(getDoc(doc(b,'questionariosFamilia/aluno-a')));await no(getDoc(doc(anon,'alunos/aluno-a')));
  await no(envio(0,p=>{delete p.areas.medidas;}));await no(envio(0,p=>{delete p.areas.oralidade.respostas.oralidade_1;}));
  await no(envio(0,p=>{p.areas.oralidade.respostas.oralidade_1='invalido';}));
  await no(envio(0,p=>{p.areas.oralidade.respostas.oralidade_1='relato';}));
  await no(envio(0,p=>{p.areas.oralidade.observacoesPerguntas.oralidade_1='x'.repeat(1001);}));
  await no(envio(0,p=>{p.areas.medidas.respostas.extra='observa';}));await no(envio(0,p=>{p.r.professorUid='b';}));await no(envio(0,p=>{p.r.alunoId='outro';}));await no(envio(0,p=>{p.r.ciencia=false;}));await no(envio(0,p=>{p.r.contexto='x'.repeat(2001);}));await no(envio(0,p=>{p.sentinela=false;}));
  await no(envio(0,p=>{p.areas.avd.respostas.avd_1='sem_modelo';}));
  await yes(envio(0,p=>{p.areas.avd.respostas.avd_1='autonomo';p.areas.escrita.respostas.escrita_2='sem_modelo';p.areas.oralidade.respostas.oralidade_5='frequente';p.areas.oralidade.respostas.oralidade_1='relato';p.areas.oralidade.observacoesPerguntas.oralidade_1='Relato com exemplo real.';}));
  await yes(getDoc(doc(a,'respostasFamiliaCompletas/'+token(0))));await yes(getDocs(query(collection(a,'respostasFamiliaCompletas'),where('professorUid','==','a'))));
  await yes(getDocs(collection(a,'respostasFamiliaCompletas/'+token(0)+'/areas')));
  await no(getDoc(doc(anon,'respostasFamiliaCompletas/'+token(0))));await no(getDoc(doc(b,'respostasFamiliaCompletas/'+token(0))));await no(getDoc(doc(anon,'respostasFamiliaCompletas/'+token(0)+'/areas/medidas')));await no(getDocs(collection(b,'respostasFamiliaCompletas/'+token(0)+'/areas')));
  await no(envio(0));await no(updateDoc(doc(a,'respostasFamiliaCompletas/'+token(0)),{observacoes:'Alterado'}));
  await yes(updateDoc(doc(a,'convitesFamilia/'+token(0)),{ativa:false}));await no(getDoc(doc(anon,'convitesFamilia/'+token(0))));await yes(getDoc(doc(a,'respostasFamiliaCompletas/'+token(0)+'/areas/medidas')));
  await yes(criar(1));await yes(updateDoc(doc(a,'convitesFamilia/'+token(1)),{ativa:false}));await no(envio(1));
  await yes(criar(2));await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'convitesFamilia/'+token(2)),{expiraEm:Timestamp.fromMillis(Date.now()-10000)}));await no(envio(2));
  await yes(criar(3));await no(setDoc(doc(anon,'enviosFamilia/'+token(3)),{enviadoEm:serverTimestamp()}));
  await no(setDoc(doc(anon,'respostasFamiliaCompletas/'+token(3)+'/areas/ilegal'),{respostas:{},observacoesPerguntas:{},enviadoEm:serverTimestamp()}));
  console.log(checks+' verificações de regras do questionário completo aprovadas.');
 }finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});
