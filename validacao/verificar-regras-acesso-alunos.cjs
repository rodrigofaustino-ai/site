// Executar SOMENTE no emulador; nunca usa credenciais ou dados reais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, deleteDoc,
  writeBatch, runTransaction, serverTimestamp, Timestamp, setLogLevel } = require('firebase/firestore');
setLogLevel('silent'); // Negações esperadas são verificadas por assertFails.

async function main() {
  const isolado = process.env.SRM_REGRAS_TESTE === '1';
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8087', 'Use o emulador configurado na porta 8087.');
  const env = await initializeTestEnvironment({
    projectId: 'demo-colaboracao',
    firestore: { host: '127.0.0.1', port: 8087,
      rules: fs.readFileSync(path.join(__dirname, process.env.SRM_REGRAS_COMPARTILHAMENTO === '1' ? '../firebase/compartilhamento-teste.rules' : isolado ? '../firebase/ambiente-teste.rules' : '../firebase/colaboracao-etapa-06.rules'), 'utf8') }
  });
  let checks = 0;
  const yes = async promise => { await assertSucceeds(promise); checks++; };
  const no = async promise => { await assertFails(promise); checks++; };
  try {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'alunos/aluno-a'), { professorUid: 'a', nome: 'Aluno fictício A' });
      await setDoc(doc(db, 'alunos/aluno-b'), { professorUid: 'b', nome: 'Aluno fictício B' });
      for (const sub of ['pei', 'metas', 'registros']) {
        await setDoc(doc(db, `alunos/aluno-a/${sub}/exemplo`), { texto: 'Privado A' });
        await setDoc(doc(db, `alunos/aluno-b/${sub}/exemplo`), { texto: 'Privado B' });
      }
      for (const root of ['frequenciaSemanas', 'plannerMensal', 'notas']) {
        await setDoc(doc(db, `${root}/documento-a`), { professorUid: 'a', texto: 'A' });
        await setDoc(doc(db, `${root}/documento-b`), { professorUid: 'b', texto: 'B' });
      }
    });
    const a = env.authenticatedContext('a', { email: 'a@example.test' }).firestore();
    const b = env.authenticatedContext('b', { email: 'b@example.test' }).firestore();
    const admin = env.authenticatedContext('vYUoFHRjbmVaj6Do58NjKQsFuql2').firestore();
    const anon = env.unauthenticatedContext().firestore();
    // O planner carrega um documento ainda inexistente antes de salvar o mês.
    await yes(getDoc(doc(a, 'plannerMensal/a_2026-10_Geral')));
    await no(getDoc(doc(anon, 'plannerMensal/a_2026-10_Geral')));
    await yes(setDoc(doc(a, 'plannerMensal/a_2026-10_Geral'), { professorUid: 'a', dias: {} }));
    await no(getDoc(doc(b, 'plannerMensal/a_2026-10_Geral')));
    await yes(getDoc(doc(a, 'plannerMensal/a_2026-10_Geral')));
    await yes(getDoc(doc(a, 'alunos/aluno-a')));
    await no(getDoc(doc(b, 'alunos/aluno-a')));
    await no(getDoc(doc(anon, 'alunos/aluno-a')));
    await yes(getDocs(query(collection(a, 'alunos'), where('professorUid', '==', 'a'))));
    await no(getDocs(collection(a, 'alunos')));
    await no(updateDoc(doc(b, 'alunos/aluno-a'), { professorUid: 'b' }));
    await no(updateDoc(doc(a, 'alunos/aluno-a'), { professorUid: 'b' }));
    await yes(updateDoc(doc(a, 'alunos/aluno-a'), { nome: 'Nome atualizado' }));
    await no(setDoc(doc(a, 'alunos/forjado'), { professorUid: 'b' }));
    await no(setDoc(doc(a, 'alunos/sem-dono'), { nome: 'Inválido' }));
    await yes(setDoc(doc(a, 'alunos/novo'), { professorUid: 'a' }));
    await no(deleteDoc(doc(b, 'alunos/novo')));
    await yes(deleteDoc(doc(a, 'alunos/novo')));
    for (const sub of ['pei', 'metas', 'registros']) {
      const item = `alunos/aluno-a/${sub}/exemplo`;
      await yes(getDoc(doc(a, item)));
      await yes(updateDoc(doc(a, item), { texto: 'Atualização autorizada' }));
      await no(getDoc(doc(b, item)));
      await no(updateDoc(doc(b, item), { texto: 'Invasão' }));
      await no(deleteDoc(doc(b, item)));
      await no(getDoc(doc(anon, item)));
      await no(getDocs(collection(b, `alunos/aluno-a/${sub}`)));
      await (isolado ? no : yes)(getDoc(doc(admin, item)));
      await no(setDoc(doc(b, `alunos/inexistente/${sub}/novo`), { texto: 'Sem aluno' }));
    }
    for (const root of ['frequenciaSemanas', 'plannerMensal', 'notas']) {
      const item = `${root}/documento-a`;
      await yes(getDoc(doc(a, item)));
      await yes(getDocs(query(collection(a, root), where('professorUid', '==', 'a'))));
      await no(getDoc(doc(b, item)));
      await no(updateDoc(doc(b, item), { professorUid: 'b' }));
      await no(updateDoc(doc(a, item), { professorUid: 'b' }));
      await yes(updateDoc(doc(a, item), { texto: 'Alterado' }));
      await no(setDoc(doc(b, `${root}/forjado`), { professorUid: 'a' }));
      await yes(setDoc(doc(a, `${root}/novo`), { professorUid: 'a' }));
      await no(deleteDoc(doc(b, `${root}/novo`)));
      await yes(deleteDoc(doc(a, `${root}/novo`)));
      await no(getDoc(doc(anon, item)));
    }
    // Salvar PEI e arquivar a versão anterior na mesma transação continua permitido.
    await yes(runTransaction(a, async tx => {
      const parent = await tx.get(doc(a, 'alunos/aluno-a'));
      const anterior = await tx.get(doc(a, 'alunos/aluno-a/pei/exemplo'));
      assert.equal(parent.data().professorUid, 'a');
      tx.set(doc(a, 'alunos/aluno-a/pei/versao-teste'), anterior.data());
      tx.set(doc(a, 'alunos/aluno-a/pei/exemplo'), { texto: 'Nova versão' });
    }));
    await yes(getDoc(doc(a, 'alunos/aluno-a/pei/versao-teste')));
    await no(getDoc(doc(b, 'alunos/aluno-a/pei/versao-teste')));

    // Fluxos preservados: chat, recursos e planos, com autoria aplicada no banco.
    const mensagem = { texto: 'Reunião pedagógica', autorUid: 'a', autorNome: 'Professor A',
      autorEmail: 'a@example.test', createdAt: serverTimestamp() };
    await yes(setDoc(doc(a, 'chatEquipe/mensagem'), mensagem));
    await yes(getDoc(doc(b, 'chatEquipe/mensagem')));
    await no(setDoc(doc(b, 'chatEquipe/forjada'), mensagem));
    await no(updateDoc(doc(b, 'chatEquipe/mensagem'), { texto: 'Modificado' }));
    const recurso = { descricao: 'Recurso pedagógico', link: 'https://example.org/recurso',
      autorUid: 'a', autorNome: 'Professor A', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await yes(setDoc(doc(a, 'recursosDidaticos/recurso'), recurso));
    await yes(getDoc(doc(b, 'recursosDidaticos/recurso')));
    await no(updateDoc(doc(b, 'recursosDidaticos/recurso'), { descricao: 'Alterado', updatedAt: serverTimestamp() }));
    const plano = { titulo: 'Plano de aula', tema: 'Leitura', descricao: 'Atividade de leitura',
      autorUid: 'a', autorNome: 'Professor A', uploadedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      storagePath: 'planosAula/a/plano/arquivo.docx', fileName: 'arquivo.docx', fileSize: 100 };
    await yes(setDoc(doc(a, 'planosAula/plano'), plano));
    await yes(getDoc(doc(b, 'planosAula/plano')));
    await no(deleteDoc(doc(b, 'planosAula/plano')));

    // Convite familiar atômico, leitura pública por token e resposta única.
    const token = 'A'.repeat(43);
    const expires = Timestamp.fromMillis(Date.now() + 86400000);
    const convite = { professorUid: 'a', alunoId: 'aluno-a', apelido: 'Aluno A', versao: 1,
      ativa: true, criadoEm: serverTimestamp(), expiraEm: expires };
    const batch = writeBatch(a);
    batch.set(doc(a, `convitesFamilia/${token}`), convite);
    batch.set(doc(a, 'questionariosFamilia/aluno-a'), { professorUid: 'a', alunoId: 'aluno-a',
      token, ativa: true, criadoEm: serverTimestamp(), expiraEm: expires });
    await yes(batch.commit());
    await yes(getDoc(doc(anon, `convitesFamilia/${token}`)));
    await no(getDocs(collection(anon, 'convitesFamilia')));
    await no(getDoc(doc(b, 'questionariosFamilia/aluno-a')));
    await no(setDoc(doc(b, `convitesFamilia/${'B'.repeat(43)}`), convite));
    const campos = ['comunica_escolha','comunica_chamado','comunica_fatos','leitura_nome',
      'leitura_imagens','leitura_historia','escrita_registro','escrita_nome','escrita_palavras',
      'percepcao_comando','percepcao_textura','percepcao_objeto','avd_alimentacao','avd_higiene',
      'avd_vestir','social_interacao','social_emocoes','social_combinados','numeros_uso',
      'numeros_quantidade','numeros_compara','formas_iguais','formas_reconhece','formas_cores',
      'medidas_rotina','medidas_sequencia','medidas_espaco'];
    const resposta = { professorUid: 'a', alunoId: 'aluno-a', versao: 1, responsavel: 'Responsável fictício',
      vinculo: 'Família', respostas: Object.fromEntries(campos.map(campo => [campo, 'observa'])),
      observacoes: '', ciencia: true, enviadoEm: serverTimestamp() };
    const envio = writeBatch(anon);
    envio.set(doc(anon, `respostasFamilia/${token}`), resposta);
    envio.set(doc(anon, `enviosFamilia/${token}`), { enviadoEm: serverTimestamp() });
    await yes(envio.commit());
    await yes(getDoc(doc(a, `respostasFamilia/${token}`)));
    await no(getDoc(doc(b, `respostasFamilia/${token}`)));
    await no(getDoc(doc(anon, `respostasFamilia/${token}`)));
    await no(setDoc(doc(anon, `respostasFamilia/${token}`), resposta));
    await yes(updateDoc(doc(a, `convitesFamilia/${token}`), { ativa: false }));
    await no(getDoc(doc(anon, `convitesFamilia/${token}`)));
    if (isolado) {
      // As coleções antes separadas em outro projeto também ficam privadas.
      for (const root of ['paee_alunos', 'diagnostica_srm', 'relatorios_srm']) {
        await yes(setDoc(doc(a, `${root}/formulario`), { professorUid: 'a', alunoId: 'aluno-a', texto: 'Fictício' }));
        await yes(getDocs(query(collection(a, root), where('professorUid', '==', 'a'))));
        await no(getDocs(collection(b, root)));
        await no(getDoc(doc(b, `${root}/formulario`)));
        await no(getDoc(doc(anon, `${root}/formulario`)));
        await no(updateDoc(doc(b, `${root}/formulario`), { professorUid: 'b' }));
        await no(updateDoc(doc(a, `${root}/formulario`), { professorUid: 'b' }));
        await no(setDoc(doc(b, `${root}/forjado`), { professorUid: 'a' }));
        await yes(updateDoc(doc(a, `${root}/formulario`), { texto: 'Revisado' }));
        await no(deleteDoc(doc(b, `${root}/formulario`)));
        await yes(deleteDoc(doc(a, `${root}/formulario`)));
      }
      await no(updateDoc(doc(admin, 'alunos/aluno-a'), { professorUid: 'b' }));
      // Simula uma futura transferência por serviço confiável, fora do cliente.
      await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'alunos/aluno-a'), { professorUid: 'b' }));
    } else {
      // A transferência administrativa deve retirar o acesso do antigo dono.
      await yes(updateDoc(doc(admin, 'alunos/aluno-a'), { professorUid: 'b' }));
    }
    await no(getDoc(doc(a, 'alunos/aluno-a/pei/exemplo')));
    await yes(getDoc(doc(b, 'alunos/aluno-a/pei/exemplo')));
    console.log(`${checks} verificações de autorização passaram no emulador.`);
  } finally { await env.cleanup(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
