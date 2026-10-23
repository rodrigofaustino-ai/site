// Configuração pública do aplicativo Web exclusivo do teste.
// Esta branch não deve ser implantada no site oficial.
(() => {
  'use strict';
  window.SRMFirebaseConfig = Object.freeze({
    apiKey: 'AIzaSyBAk60MCw-cbvFm_YfnWMVLTdY2G4RwiIA',
    authDomain: 'ambienteteste-e368e.firebaseapp.com',
    projectId: 'ambienteteste-e368e',
    storageBucket: 'ambienteteste-e368e.firebasestorage.app',
    messagingSenderId: '342078635797',
    appId: '1:342078635797:web:7d204369a3f070f1ad331c'
  });
  window.SRMInicializarFirebase = function () {
    if (window.SRMFirebaseConfig.projectId !== 'ambienteteste-e368e')
      throw new Error('Configuração do ambiente de teste inválida.');
    return firebase.initializeApp(window.SRMFirebaseConfig);
  };
  function identificar() {
    document.title = '[TESTE] ' + document.title;
    const aviso = document.createElement('div');
    aviso.id = 'srm-ambiente-teste';
    aviso.textContent = 'AMBIENTE DE TESTE · use apenas dados fictícios';
    aviso.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:99999;padding:7px 12px;border:1px solid #c78613;border-radius:8px;background:#fff3cd;color:#664d03;font:600 12px/1.4 system-ui;pointer-events:none;max-width:calc(100vw - 40px)';
    document.body.appendChild(aviso);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', identificar, { once: true });
  else identificar();
})();
