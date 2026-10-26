'use strict';
// Somente dados fictícios. Toda requisição externa é bloqueada.
const {chromium} = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const acorn = require('acorn');
const root = path.resolve(__dirname, '..');
let checks = 0;
const check = (value, expected) => {assert.deepEqual(value, expected); checks++;};

(async () => {
  for (const name of fs.readdirSync(root).filter(n => /\.(html|js)$/.test(n))) {
    const text = fs.readFileSync(path.join(root, name), 'utf8');
    const scripts = name.endsWith('.js') ? [text] :
      [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
    scripts.forEach(script => acorn.parse(script, {ecmaVersion: 'latest', sourceType: 'script'}));
  }
  const server = http.createServer((req, res) => {
    const filename = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
      res.writeHead(404); return res.end();
    }
    res.setHeader('Content-Type', filename.endsWith('.js') ? 'application/javascript' : 'text/html');
    res.end(fs.readFileSync(filename));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
    const context = await browser.newContext();
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    for (const [filename, entry] of [
      ['paee_formulario_02.html', 'abrirViaParametroDeAluno'],
      ['relatorio_formulario.html', 'abrirViaParametro'],
      ['diagnostica_formulario.html', 'abrirViaParametro']
    ]) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/' + filename, {waitUntil: 'networkidle'});
      await page.evaluate(() => {
        window.alertas = []; window.confirmacoes = []; window.aceitar = true; window.gravacoes = [];
        window.alert = message => alertas.push(message);
        window.confirm = message => {confirmacoes.push(message); return aceitar;};
        professorUid = 'professor-ficticio';
        planosRef = () => ({get: async () => {
          if (window.falhar) throw new Error('Falha de consulta simulada');
          return {docs: window.documentos.map(d => ({id: d.id, data: () => d.dados}))};
        }});
        db = {collection: () => ({
          add: async data => {gravacoes.push({id: 'novo-documento', data}); return {id: 'novo-documento'};},
          doc: id => ({set: async data => gravacoes.push({id, data})})
        })};
        // A importação da diagnóstica é testada separadamente abaixo.
        if (typeof preencherDoPerfilDiario === 'function') window.preenchimentoOriginal = preencherDoPerfilDiario;
        if (typeof preencherDoPerfilDiario === 'function') preencherDoPerfilDiario = async () => {};
      });
      async function open(docs, query = '?alunoId=aluno-a&nome=Ana', aceitar = true, falhar = false) {
        await page.evaluate(async ({docs, query, aceitar, falhar, entry}) => {
          history.replaceState(null, '', location.pathname + query);
          window.documentos = docs; window.aceitar = aceitar; window.falhar = falhar;
          alertas.length = 0; confirmacoes.length = 0; gravacoes.length = 0;
          state = novoEstado(); showView('list');
          await window[entry]();
        }, {docs, query, aceitar, falhar, entry});
      }
      const doc = (id, nome, alunoId) => ({id, dados: {identificacao: {nome}, ...(alunoId ? {alunoId} : {})}});
      // Mesmo nome, pessoas diferentes: a identidade prevalece sobre nome e ordem.
      await open([doc('outro', 'Ana', 'aluno-b'), doc('certo', 'Nome anterior', 'aluno-a')]);
      check(await page.evaluate(() => [state.id, state.alunoId]), ['certo', 'aluno-a']);
      await page.evaluate(() => showScreen('app'));
      await page.locator('.orientacao-preenchimento summary').first().waitFor();
      const antesOrientacao = await page.evaluate(() => JSON.stringify(state));
      await page.locator('.orientacao-preenchimento summary').first().click();
      check(await page.locator('.orientacao-preenchimento').first().evaluate(n => n.open), true);
      check(await page.evaluate(() => JSON.stringify(state)), antesOrientacao);
      check(await page.evaluate(() => gravacoes.length), 0);
      check(await page.locator('textarea[placeholder]').count(), 0);
      check(await page.locator('#search-input').getAttribute('placeholder') !== null, true);
      await page.evaluate(() => saveStudent());
      check(await page.evaluate(() => [gravacoes[0].id, gravacoes[0].data.alunoId]), ['certo', 'aluno-a']);
      // Não reutilizar documento já vinculado a um homônimo.
      await open([doc('outro', 'Ana', 'aluno-b')]);
      check(await page.evaluate(() => [state.id, state.alunoId]), [null, 'aluno-a']);
      await page.evaluate(() => saveStudent());
      check(await page.evaluate(() => [gravacoes[0].id, gravacoes[0].data.alunoId]), ['novo-documento', 'aluno-a']);
      // Legado: cancelamento não abre, não vincula e não grava.
      await open([doc('antigo', 'Ana')], undefined, false);
      check(await page.evaluate(() => [state.id, state.alunoId || null, gravacoes.length, confirmacoes.length]), [null, null, 0, 1]);
      await open([doc('antigo', 'Ana')]);
      check(await page.evaluate(() => [state.id, state.alunoId, gravacoes.length]), ['antigo', 'aluno-a', 0]);
      await page.evaluate(() => saveStudent());
      check(await page.evaluate(() => [gravacoes[0].id, gravacoes[0].data.alunoId]), ['antigo', 'aluno-a']);
      // Duplicidade de candidatos exige revisão manual.
      for (const docs of [[doc('um', 'Ana'), doc('dois', 'Ana')], [doc('um', 'Ana', 'aluno-a'), doc('dois', 'Ana', 'aluno-a')]]) {
        await open(docs);
        check(await page.evaluate(() => [state.id, state.alunoId || null, alertas.length]), [null, null, 1]);
      }
      await open([], '?nome=Ana');
      check(await page.evaluate(() => [state.alunoId || null, alertas.length]), [null, 1]);
      await open([], '?alunoId=aluno%2Fa&nome=Ana');
      check(await page.evaluate(() => [state.alunoId || null, alertas.length]), [null, 1]);
      await open([], undefined, true, true);
      check(await page.evaluate(() => [state.alunoId || null, alertas.length, gravacoes.length]), [null, 1, 0]);
      if (filename.startsWith('diagnostica')) {
        check(await page.evaluate(async () => {
          dbDiario = {collection: () => ({where: () => ({get: async () => ({docs: [
            {id: 'aluno-b', data: () => ({nome: 'Ana', escola: 'Errada'})},
            {id: 'aluno-a', data: () => ({nome: 'Nome anterior', escola: 'Correta'})}
          ]})}), doc: () => ({collection: () => ({orderBy: () => ({limit: () => ({get: async () => ({docs: []})})})})})})};
          const perfil = await buscarPerfilDiario('Ana', 'aluno-a');
          const ambiguo = await buscarPerfilDiario('Ana', null);
          return [perfil.id, perfil.escola, ambiguo.id];
        }), ['aluno-a', 'Correta', 'aluno-b']);
        check(await page.evaluate(async () => {
          dbDiario = {collection: () => ({where: () => ({get: async () => ({docs: [
            {id: 'a', data: () => ({nome: 'Ana'})},
            {id: 'b', data: () => ({nome: 'Ana'})}
          ]})})})};
          return await buscarPerfilDiario('Ana', null);
        }), null);
        check(await page.evaluate(async () => {
          let concluir;
          buscarPerfilDiario = () => new Promise(resolve => {concluir = resolve;});
          state = novoEstado(); state.alunoId = 'aluno-a';
          const pendente = preenchimentoOriginal('Ana', false);
          state = novoEstado(); state.alunoId = 'aluno-b';
          concluir({dataNasc: '2015-01-01', registros: []});
          await pendente;
          return [state.alunoId, state.identificacao.dataNascimento];
        }), ['aluno-b', '']);
      }
      check(errors, []);
      console.log(filename + ': vínculo, gravação e proteção contra ambiguidades OK');
      await page.close();
    }
    // Os links dos três módulos e o perfil local carregam o mesmo identificador.
    const page = await context.newPage();
    await page.goto(origin + '/index.html', {waitUntil: 'networkidle'});
    check(await page.evaluate(async () => {
      window.urls = []; window.open = url => urls.push(url);
      for (const abrir of [abrirPaeeDoAluno, abrirRelatorioDoAluno, abrirDiagnosticaDoAluno]) {
        await abrir('Ana & João', 'aluno-a', [{id: 'aluno-a', nome: 'Ana & João'}]);
      }
      return [urls.map(url => new URL(url, location.href).searchParams.get('alunoId')),
        urls.map(url => new URL(url, location.href).searchParams.get('nome')),
        JSON.parse(localStorage.getItem('srm_perfil_aluno')).alunoId];
    }), [['aluno-a', 'aluno-a', 'aluno-a'], ['Ana & João', 'Ana & João', 'Ana & João'], 'aluno-a']);
    console.log(checks + ' verificações concluídas no Chromium, sem acesso aos serviços reais.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
