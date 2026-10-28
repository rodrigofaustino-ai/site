'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,getDoc,getDocs,query,where,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp,setLogLevel}=require('firebase/firestore');
setLogLevel('silent');
let count=0;const yes=async p=>{const result=await assertSucceeds(p);count++;return result;},no=async p=>{await assertFails(p);count++;};
async function main(){
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8087');
  const env=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules:fs.readFileSync(path.join(__dirname,process.env.SRM_REGRAS_RESPOSTAS==='1'?'../firebase/chat-respostas-teste.rules':'../firebase/compartilhamento-teste.rules'),'utf8')}});
  try{
    await env.clearFirestore();
    const context=(uid,email,verified=true)=>env.authenticatedContext(uid,{email,email_verified:verified}).firestore();
    const owner=context('a','a@example.test'),regente=context('b','b@example.test'),coord=context('c','c@example.test'),outro=context('d','d@example.test'),semVerificar=context('b','b@example.test',false),anon=env.unauthenticatedContext().firestore();
    await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,'alunos/aluno-a'),{professorUid:'a',nome:'Aluno fictício',laudo:'PRIVADO'});await setDoc(doc(db,'alunos/aluno-b'),{professorUid:'d',nome:'Outro aluno'});await setDoc(doc(db,'alunos/aluno-a/pei/atual'),{peiHtml:'<p>Privado</p>'});});
    const grant=(email,role='regente')=>({professorUid:'a',alunoId:'aluno-a',destinatarioEmail:email,papel:role,ativo:true,criadoEm:serverTimestamp(),atualizadoEm:serverTimestamp()});
    const meta={id:'meta-a',objetivo:'Participar',detalhes:'Critério: Observar\nEstratégias: Apoio visual\nRevisão prevista: 2026-11-01'};
    const record={id:'r-a',date:'2026-10-26',text:'Relato fictício',por:'Professora'};
    const publication=()=>({professorUid:'a',alunoId:'aluno-a',publicacaoId:randomUUID(),publicadoEm:serverTimestamp(),resumo:{nome:'Aluno fictício',escola:'Escola teste',turma:'3 A',turno:'Matutino'},peiHtml:'<p>PEI compartilhado</p>',peiData:'2026-10-26',metas:[meta],registros:[record]});
    const contentWrite=(id,p)=>{const b=writeBatch(owner);b.set(doc(owner,`colaboracoes/${id}/versoes/${p.publicacaoId}`),{publicadoEm:serverTimestamp()});b.set(doc(owner,`colaboracoes/${id}/conteudo/atual`),p);return b.commit();};
    const publish=async(id,g=grant('b@example.test'),p=publication())=>{const b=writeBatch(owner);b.set(doc(owner,`colaboracoes/${id}`),g);b.set(doc(owner,`colaboracoes/${id}/versoes/${p.publicacaoId}`),{publicadoEm:serverTimestamp()});b.set(doc(owner,`colaboracoes/${id}/conteudo/atual`),p);await yes(b.commit());return p;};
    await yes(getDoc(doc(owner,'colaboracoes/novo')));
    await no(getDoc(doc(anon,'colaboracoes/novo')));
    const p1=await publish('regente');await publish('coord',grant('c@example.test','coordenacao'));
    const invalid=publication(),atomic=writeBatch(owner);
    atomic.set(doc(owner,'colaboracoes/atomico'),grant('b@example.test'));
    atomic.set(doc(owner,`colaboracoes/atomico/versoes/${invalid.publicacaoId}`),{publicadoEm:serverTimestamp()});
    atomic.set(doc(owner,'colaboracoes/atomico/conteudo/atual'),{...invalid,resumo:{nome:'Forjado',laudo:'Privado'}});
    await no(atomic.commit());
    assert.equal((await yes(getDoc(doc(owner,'colaboracoes/atomico')))).exists(),false);
    await yes(getDoc(doc(owner,'colaboracoes/regente')));
    await yes(getDoc(doc(regente,'colaboracoes/regente')));
    await no(getDoc(doc(semVerificar,'colaboracoes/regente')));
    await no(getDoc(doc(anon,'colaboracoes/regente')));
    await no(getDoc(doc(outro,'colaboracoes/regente')));
    await yes(getDocs(query(collection(owner,'colaboracoes'),where('professorUid','==','a'),where('alunoId','==','aluno-a'))));
    await yes(getDocs(query(collection(regente,'colaboracoes'),where('destinatarioEmail','==','b@example.test'),where('ativo','==',true))));
    await no(getDocs(collection(regente,'colaboracoes')));
    for(const db of [owner,regente])await yes(getDoc(doc(db,'colaboracoes/regente/conteudo/atual')));
    for(const db of [semVerificar,anon,outro])await no(getDoc(doc(db,'colaboracoes/regente/conteudo/atual')));
    await no(getDoc(doc(regente,'alunos/aluno-a')));
    await no(getDoc(doc(regente,'alunos/aluno-a/pei/atual')));
    await no(getDoc(doc(regente,'alunos/aluno-b')));
    await no(updateDoc(doc(regente,'colaboracoes/regente'),{papel:'coordenacao',atualizadoEm:serverTimestamp()}));
    await no(updateDoc(doc(regente,'colaboracoes/regente/conteudo/atual'),{peiHtml:'Forjado',publicacaoId:randomUUID(),publicadoEm:serverTimestamp()}));
    await no(setDoc(doc(outro,'colaboracoes/falso'),grant('b@example.test')));
    await no(setDoc(doc(owner,'colaboracoes/auto'),grant('a@example.test','coordenacao')));
    await no(setDoc(doc(owner,'colaboracoes/outro-aluno'),{...grant('b@example.test'),alunoId:'aluno-b'}));
    await no(setDoc(doc(owner,'colaboracoes/campo-privado'),{...grant('b@example.test'),contatos:'Privado'}));
    await no(setDoc(doc(owner,'colaboracoes/papel-forjado'),grant('b@example.test','admin')));
    await no(updateDoc(doc(owner,'colaboracoes/regente'),{destinatarioEmail:'d@example.test',atualizadoEm:serverTimestamp()}));
    await no(deleteDoc(doc(owner,'colaboracoes/regente')));
    for(const bad of [
      {...publication(),laudo:'Proibido'},
      {...publication(),resumo:{...publication().resumo,contatos:'Proibido'}},
      {...publication(),metas:[{...meta,laudo:'Proibido'}]},
      {...publication(),registros:[{...record,contatos:'Proibido'}]},
      {...publication(),metas:Array(6).fill(meta)},
      {...publication(),registros:Array(6).fill(record)},
      {...publication(),peiHtml:'x'.repeat(200001)},
      {...publication(),alunoId:'aluno-b'},
      {...publication(),publicadoEm:'Data forjada'},
      {...publication(),publicacaoId:p1.publicacaoId}
    ])await no(contentWrite('regente',bad));
    // Maior lista válida exercita também o orçamento de avaliação das regras.
    const full={...publication(),metas:Array(5).fill(meta),registros:Array(5).fill(record)};
    await yes(contentWrite('regente',full));
    await publish('maximo',grant('maximo@example.test'),{...full,publicacaoId:randomUUID()});
    const maxGrant=(await getDoc(doc(owner,'colaboracoes/maximo'))).data();
    await publish('maximo',{...maxGrant,atualizadoEm:serverTimestamp()},{...full,publicacaoId:randomUUID()});
    await no(contentWrite('regente',{...publication(),publicacaoId:p1.publicacaoId}));
    await no(deleteDoc(doc(owner,`colaboracoes/regente/versoes/${p1.publicacaoId}`)));
    await no(updateDoc(doc(owner,`colaboracoes/regente/versoes/${p1.publicacaoId}`),{publicadoEm:serverTimestamp()}));
    await no(setDoc(doc(owner,`colaboracoes/regente/versoes/${randomUUID()}`),{publicadoEm:serverTimestamp()}));
    const observation=(uid,email,pub,tipo='observacao')=>({autorUid:uid,autorEmail:email,texto:'Observação fictícia',tipo,publicacaoId:pub,criadoEm:serverTimestamp()});
    const obs=observation('b','b@example.test',full.publicacaoId);
    await yes(setDoc(doc(regente,'colaboracoes/regente/observacoes/nota'),obs));
    await yes(getDoc(doc(owner,'colaboracoes/regente/observacoes/nota')));
    await yes(getDocs(query(collection(regente,'colaboracoes/regente/observacoes'))));
    await no(getDoc(doc(outro,'colaboracoes/regente/observacoes/nota')));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/falsa'),{...obs,autorUid:'a'}));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/email-falso'),{...obs,autorEmail:'a@example.test'}));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/revisao'),{...obs,tipo:'revisao'}));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/obsoleta'),{...obs,publicacaoId:p1.publicacaoId}));
    await no(updateDoc(doc(regente,'colaboracoes/regente/observacoes/nota'),{texto:'Alterado'}));
    await no(deleteDoc(doc(owner,'colaboracoes/regente/observacoes/nota')));
    const cp=(await getDoc(doc(owner,'colaboracoes/coord/conteudo/atual'))).data();
    await yes(setDoc(doc(coord,'colaboracoes/coord/observacoes/revisao'),observation('c','c@example.test',cp.publicacaoId,'revisao')));
    await yes(updateDoc(doc(owner,'colaboracoes/coord'),{papel:'apoio',atualizadoEm:serverTimestamp()}));
    await no(setDoc(doc(coord,'colaboracoes/coord/observacoes/revisao2'),observation('c','c@example.test',cp.publicacaoId,'revisao')));
    await yes(setDoc(doc(coord,'colaboracoes/coord/observacoes/apoio'),observation('c','c@example.test',cp.publicacaoId)));
    const semPei=await publish('sem-pei',grant('c@example.test','coordenacao'),{...publication(),peiHtml:''});
    await no(setDoc(doc(coord,'colaboracoes/sem-pei/observacoes/revisao'),observation('c','c@example.test',semPei.publicacaoId,'revisao')));
    await yes(setDoc(doc(coord,'colaboracoes/sem-pei/observacoes/nota'),observation('c','c@example.test',semPei.publicacaoId)));
    await yes(updateDoc(doc(owner,'colaboracoes/regente'),{ativo:false,atualizadoEm:serverTimestamp()}));
    await no(getDoc(doc(regente,'colaboracoes/regente/conteudo/atual')));
    await no(getDoc(doc(regente,'colaboracoes/regente/observacoes/nota')));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/revogada'),obs));
    await yes(getDoc(doc(owner,'colaboracoes/regente/observacoes/nota')));
    await no(setDoc(doc(owner,'colaboracoes/regente/conteudo/atual'),publication()));
    assert.equal((await yes(getDocs(query(collection(regente,'colaboracoes'),where('destinatarioEmail','==','b@example.test'),where('ativo','==',true))))).size,0);
    // Reativação explícita é atômica e mantém a data de criação original.
    const old=(await getDoc(doc(owner,'colaboracoes/regente'))).data();
    const next=await publish('regente',{...old,ativo:true,atualizadoEm:serverTimestamp()},publication());
    await yes(getDoc(doc(regente,'colaboracoes/regente/conteudo/atual')));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/copia-antiga'),obs));
    await yes(setDoc(doc(regente,'colaboracoes/regente/observacoes/nova'),{...obs,publicacaoId:next.publicacaoId}));
    // Transferência do aluno retira acesso ao conteúdo, mesmo com vínculo ativo.
    await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'alunos/aluno-a'),{professorUid:'d'}));
    for(const db of [regente,owner,coord])await no(getDoc(doc(db,'colaboracoes/regente/conteudo/atual')));
    await no(setDoc(doc(regente,'colaboracoes/regente/observacoes/transferido'),{...obs,publicacaoId:next.publicacaoId}));
    console.log(count+' verificações de compartilhamento passaram no emulador.');
  }finally{await env.cleanup();}
}
main().catch(e=>{console.error('Falha após '+count+' verificações.',e);process.exitCode=1;});
