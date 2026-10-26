/* Orientações fora dos campos, inclusive nas seções renderizadas dinamicamente. */
(() => {
  'use strict';
  function preparar(campo) {
    const texto = (campo.getAttribute('placeholder') || '').trim();
    if (!texto) { campo.removeAttribute('placeholder'); return; }
    if (/^_+$/.test(texto) || campo.type === 'search' ||
      campo.type === 'password' || campo.type === 'email' ||
      /search|busca/i.test(campo.id)) return;
    const detalhe = document.createElement('details');
    detalhe.className = 'orientacao-preenchimento';
    const titulo = document.createElement('summary');
    titulo.textContent = 'Orientação de preenchimento do modelo';
    const conteudo = document.createElement('p');
    conteudo.textContent = texto;
    detalhe.append(titulo, conteudo);
    // Fora de labels para que abrir a orientação não ative o campo.
    const referencia = campo.closest('label') || campo;
    referencia.after(detalhe);
    campo.removeAttribute('placeholder');
  }
  function procurar(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches('input[placeholder],textarea[placeholder]')) preparar(root);
    root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(preparar);
  }
  function iniciar() {
    procurar(document.body);
    new MutationObserver(mudancas => {
      for (const mudanca of mudancas) {
        if (mudanca.type === 'attributes') procurar(mudanca.target);
        else mudanca.addedNodes.forEach(procurar);
      }
    }).observe(document.body, { childList: true, subtree: true,
      attributes: true, attributeFilter: ['placeholder'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
