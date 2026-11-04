(() => {
  'use strict';
  const $ = id => document.getElementById(id), admin = 'A1Zn1xCUUvVM1YkqCtnULzPblI43';
  if (window.SRMDocumentosConfig?.projectId !== 'paee-3fea6') { $('status').textContent = 'Configuração incorreta; backup indisponível.'; $('entrar').disabled = true; return; }
  const app = firebase.initializeApp(window.SRMDocumentosConfig, 'backup-documentos'), auth = firebase.auth(app), db = firebase.firestore(app);
  let versao = 0, ocupado = false;
  const pronto = auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
  pronto.catch(() => { $('status').textContent = 'Não foi possível preparar a sessão. Feche esta página e tente novamente.'; $('entrar').disabled = true; });
  auth.onAuthStateChanged(user => {
    versao++; ocupado = false;
    $('senha').value = ''; $('baixar').disabled = !user || user.uid !== admin;
    $('sessao').hidden = !user || user.uid !== admin; $('login').hidden = !!user && user.uid === admin;
    $('conta').textContent = user?.uid === admin ? 'Conta administradora: ' + user.email : '';
    if (user && user.uid !== admin) { $('status').textContent = 'Esta conta não é a administradora do projeto paee-3fea6. Nenhum documento foi consultado.'; auth.signOut().catch(() => {}); }
  });
  $('login').addEventListener('submit', async event => {
    event.preventDefault(); $('entrar').disabled = true; $('status').textContent = 'Entrando…';
    try { await pronto; await auth.signInWithEmailAndPassword($('email').value.trim(), $('senha').value); if (auth.currentUser?.uid === admin) $('status').textContent = 'Acesso confirmado. Clique no botão para iniciar a cópia.'; }
    catch (_) { $('status').textContent = 'Não foi possível entrar. Confira o acesso da conta administradora de paee-3fea6 e sua conexão.'; }
    finally { $('senha').value = ''; $('entrar').disabled = false; }
  });
  $('sair').addEventListener('click', async () => { versao++; $('status').textContent = 'Cópia cancelada ou sessão encerrada.'; await auth.signOut(); });
  $('baixar').addEventListener('click', async () => {
    if (ocupado || auth.currentUser?.uid !== admin) return;
    ocupado = true; $('baixar').disabled = true;
    const ticket = versao, vigente = () => ticket === versao && auth.currentUser?.uid === admin;
    const inicio = new Date().toISOString();
    try {
      const colecoes = await BackupDocumentos.coletar(db, vigente, (nome, total) => { if (vigente()) $('status').textContent = 'Lendo ' + nome + ': ' + total + ' documentos. Aguarde…'; });
      const conteudo = {projeto: 'paee-3fea6', banco: '(default)', inicio, fim: new Date().toISOString(), colecoes};
      const arquivo = {formato: 'srm-backup-documentos-v1', conteudo, sha256: await BackupDocumentos.digest(conteudo)};
      await BackupDocumentos.verificar(arquivo);
      if (!vigente()) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(arquivo)], {type: 'application/json'})), link = document.createElement('a');
      link.href = url; link.download = 'backup-paee-3fea6-' + inicio.replace(/[:.]/g, '-') + '.json'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      $('status').textContent = 'Leitura concluída e download solicitado. Confira o arquivo na pasta Downloads.\n' + colecoes.map(c => c.nome + ': ' + c.quantidade).join('\n') + '\nSelecione o arquivo salvo abaixo para conferir a integridade.';
    } catch (_) { if (vigente()) $('status').textContent = 'A cópia não foi concluída. Nenhum arquivo parcial foi baixado. Confira a conexão e as permissões; tente novamente sem edições simultâneas.'; }
    finally { if (ticket === versao) { ocupado = false; $('baixar').disabled = auth.currentUser?.uid !== admin; } }
  });
  let verificacao = 0;
  $('arquivo').addEventListener('change', async () => {
    const file = $('arquivo').files[0], ticket = ++verificacao; if (!file) return;
    $('conferencia').textContent = 'Conferindo arquivo…';
    try { const contagens = await BackupDocumentos.verificar(JSON.parse(await file.text())); if (ticket !== verificacao) return; $('conferencia').textContent = 'Integridade e quantidades conferidas: ' + contagens.map(c => c.nome + ': ' + c.quantidade).join('; ') + '. Isso não compara o arquivo com mudanças posteriores no banco.'; }
    catch (_) { if (ticket === verificacao) $('conferencia').textContent = 'Arquivo não reconhecido, incompleto ou alterado. Não o considere um backup conferido.'; }
  });
})();
