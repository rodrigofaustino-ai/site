/* Contrato compartilhado dos anexos: um arquivo por mensagem, até 10 MB. */
(()=>{'use strict';
 const limite=10*1024*1024;
 const tipos={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',odt:'application/vnd.oasis.opendocument.text',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ods:'application/vnd.oasis.opendocument.spreadsheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',odp:'application/vnd.oasis.opendocument.presentation',txt:'text/plain',csv:'text/csv',zip:'application/zip'};
 const imagem=t=>['image/jpeg','image/png','image/gif','image/webp'].includes(t);
 const caminho=(uid,id)=>'chatAnexos/'+uid+'/'+id+'/arquivo';
 function metaValida(a,m){return !!a&&typeof a.nome==='string'&&a.nome.length>0&&a.nome.length<=180&&Object.values(tipos).includes(a.tipo)&&Number.isInteger(a.tamanho)&&a.tamanho>0&&a.tamanho<=limite&&a.caminho===caminho(m.autorUid,m.id);}
 async function validar(file){
  if(!file||!file.size||file.size>limite)throw Error('Escolha um arquivo de até 10 MB.');
  const ext=file.name.split('.').pop().toLowerCase(),tipo=tipos[ext];if(!tipo)throw Error('Formato não suportado. Use JPG, PNG, GIF, WEBP, PDF, Word, planilha, apresentação, TXT, CSV ou ZIP.');
  const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(imagem(tipo)){
   const ok=tipo==='image/png'?b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71:tipo==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:tipo==='image/gif'?String.fromCharCode(...b.slice(0,6)).match(/^GIF8[79]a$/):String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
   if(!ok)throw Error('A imagem não corresponde ao formato informado. Escolha outro arquivo.');
  }
  if(tipo==='application/pdf'&&String.fromCharCode(...b.slice(0,5))!=='%PDF-')throw Error('O arquivo não parece ser um PDF válido.');
  let nome=file.name.replace(/[\x00-\x1f\x7f/\\]/g,'_');if(nome.length>180)nome=nome.slice(0,179-ext.length)+'.'+ext;return {nome:nome||'anexo',tipo,tamanho:file.size};
 }
 const tamanho=n=>n>=1048576?(n/1048576).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB':Math.max(1,Math.ceil(n/1024))+' KB';
 window.ChatAnexosModelo=Object.freeze({limite,tipos,imagem,caminho,metaValida,validar,tamanho});
})();
