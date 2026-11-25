// Configurações públicas. Não contém credenciais administrativas.
(() => {
  'use strict';
  const diario = Object.freeze({
  apiKey:"AIzaSyCUpAIWuF6RAI2PhvziozIUZdzHRXf9Dl8",
  authDomain:"salamulti.firebaseapp.com",
  projectId:"salamulti",
  storageBucket:"salamulti.firebasestorage.app",
  messagingSenderId:"489820296240",
  appId:"1:489820296240:web:8a29c187320c14f04e49f5"
});
  const documentos = Object.freeze({
  apiKey:"AIzaSyBWvVhqLf2UEz2-02clHwnvsSF4eDUMPjA",
  authDomain:"paee-3fea6.firebaseapp.com",
  projectId:"paee-3fea6",
  storageBucket:"paee-3fea6.firebasestorage.app",
  messagingSenderId:"466630982073",
  appId:"1:466630982073:web:0109116a083d1a395f9e68"
});
  window.SRMFirebaseConfig = diario;
  window.SRMDocumentosConfig = documentos;
  window.SRMInicializarFirebase = function (tipo = 'diario') {
    if (!['diario', 'documentos'].includes(tipo)) throw new Error('Projeto desconhecido.');
    const config = tipo === 'documentos' ? documentos : diario;
    const existing = firebase.apps?.find(a => a.name === '[DEFAULT]');
    if (existing && existing.options.projectId !== config.projectId)
      throw new Error('Projeto incompatível com esta página.');
    return existing || firebase.initializeApp(config);
  };
})();
