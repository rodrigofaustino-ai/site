/* Moldura de geração: não inicializa Firebase, não salva e não chama IA. */
(() => {
 'use strict';
 const token=location.hash.match(/^#exportacao-lote=([a-f0-9-]{36})$/)?.[1];
 window.SRMExportacaoWorker=!!token&&parent!==window;if(!window.SRMExportacaoWorker)return;
 const politica=document.createElement('meta');politica.httpEquiv='Content-Security-Policy';politica.content="default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-src 'none'";document.head.append(politica);
 const enviar=payload=>parent.postMessage({canal:'srm-exportacao',token,...payload},location.origin);
 let ocupado=false;
 addEventListener('message',async e=>{
  const m=e.data;if(e.source!==parent||e.origin!==location.origin||m?.canal!=='srm-exportacao'||m.token!==token||m.acao!=='gerar'||ocupado)return;
  ocupado=true;let arquivo=null;
  window.SRMExportacaoCapturar=(blob,nome)=>{if(!(blob instanceof Blob))throw Error('Arquivo inválido.');arquivo={blob,nome};};
  try{
   if(!['docx','odt'].includes(m.formato))throw Error('Formato inválido.');
   if(m.tipo==='pei'){
    const d=m.dados;let html='';
    if(d.peiFormulario){const response=await fetch('modelos/pei-cabecalho.png');if(!response.ok)throw Error('Cabeçalho não encontrado.');const blob=await response.blob();const logo=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});html=PEIFormulario.conteudo(PEIFormulario.criarEstado({},d.peiFormulario),logo);}
    else{html=d.peiComprimido?LZString.decompressFromUTF16(d.peiHtml||''):d.peiHtml;if(!html?.trim())throw Error('PEI sem conteúdo legível.');html=SRMExport.prepararPei(html);}
    await SRMExport.fromHtml(html,m.formato,'PEI');
   }else if(m.tipo==='familia'){
    if(!location.pathname.endsWith('/questionario-familia-exportar.html'))throw Error('Gerador incompatível.');
    await SRMExport.fromHtml(QuestionarioFamiliaDocumento.html(m.dados),m.formato,'Questionario_da_familia');
   }else{
    const paginas={paee:'paee_formulario_02.html',diagnostica:'diagnostica_formulario.html',relatorio:'relatorio_formulario.html'};
    if(!paginas[m.tipo]||!location.pathname.endsWith('/'+paginas[m.tipo]))throw Error('Gerador incompatível.');
    await exportDOCX(deepMerge(novoEstado(),m.dados),m.formato);
   }
   if(!arquivo)throw Error('Nenhum arquivo gerado.');enviar({acao:'arquivo',...arquivo});
  }catch(_){enviar({acao:'erro',mensagem:'Não foi possível gerar este documento com o modelo atual.'});}
 });
 addEventListener('load',()=>enviar({acao:'pronto'}),{once:true});
})();
