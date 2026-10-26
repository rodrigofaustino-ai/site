'use strict';
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const acorn = require('acorn');
const root = path.resolve(__dirname, '..');
const paginas = ['index.html','pei_formulario.html','paee_formulario_02.html',
  'diagnostica_formulario.html','relatorio_formulario.html','colaboracao.html','admin_transferencia.html'];
let total = 0;
function check(value, expected) { assert.deepEqual(value, expected); total++; }
async function main() {
  // Nenhuma configuração executável deve manter referência aos projetos oficiais.
  for (const name of fs.readdirSync(root).filter(name => /\.(html|js)$/.test(name))) {
    const source = fs.readFileSync(path.join(root, name), 'utf8');
    check(/(?:salamulti|paee-3fea6)(?:\.firebase|['"])/.test(source), false);
    if (name.endsWith('.js')) acorn.parse(source, { ecmaVersion: 'latest' });
    else for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/\bsrc\s*=/.test(match[1]) && !/application\/ld\+json/.test(match[1]))
        acorn.parse(match[2], { ecmaVersion: 'latest' });
    }
  }
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const externos = [];
    await context.addInitScript(() => { window.__inits = []; });
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (!url.startsWith(origin + '/')) { externos.push(url); await route.abort(); return; }
      if (/\/firebase-app-compat\.js$/.test(url)) {
        const original = await route.fetch();
        await route.fulfill({ response: original, body: await original.text() + `\n;(() => {
          const init = firebase.initializeApp;
          firebase.initializeApp = function(config, ...args) {
            window.__inits.push(config ? JSON.parse(JSON.stringify(config)) : null);
            return init.call(this, config, ...args);
          };
        })();` });
      } else await route.continue();
    });
    for (const pagina of paginas) {
      const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/' + pagina, { waitUntil: 'load' });
      check(await page.locator('#srm-ambiente-teste').count(), 1);
      check((await page.title()).startsWith('[TESTE]'), true);
      const configs = await page.evaluate(() => window.__inits);
      check(configs.length, pagina === 'admin_transferencia.html' ? 0 : 1);
      for (const config of configs) {
        check(config.projectId, 'ambienteteste-e368e');
        check(config.storageBucket, 'ambienteteste-e368e.firebasestorage.app');
        check(config.authDomain, 'ambienteteste-e368e.firebaseapp.com');
        check(config.databaseURL, undefined);
      }
      check(errors, []);
      if (pagina === 'diagnostica_formulario.html')
        check(await page.evaluate(() => dbDiario === db), true);
      if (pagina === 'index.html') check(await page.evaluate(() => window.DIARIO_REALTIME_DATABASE_URL), '');
      await page.close();
    }
    check(externos.some(url => /salamulti|paee-3fea6/.test(url)), false);
    // Falha no arquivo de configuração não reativa nenhum projeto anterior.
    await context.route('**/firebase-ambiente-teste.js', route => route.abort());
    for (const pagina of ['index.html','pei_formulario.html','diagnostica_formulario.html']) {
      const page = await context.newPage();
      await page.goto(origin + '/' + pagina, { waitUntil: 'load' });
      check(await page.evaluate(() => window.__inits.length), 0);
      await page.close();
    }
    check(externos.some(url => /salamulti|paee-3fea6/.test(url)), false);
    await context.close();
    console.log(total + ' verificações de isolamento, carregamento e sintaxe passaram. Todos os pedidos externos foram bloqueados pelo teste.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
