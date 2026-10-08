/* DOCX e ODT locais; PDF usa o próprio DOCX no conversor privado de LibreOffice. */
(function () {
  'use strict';
  const sources = {
    mammoth: 'vendor/mammoth.browser.min.js',
    JSZip: 'vendor/jszip.min.js'
  };
  const pending = {};
  async function load(name) {
    if (window[name]) return window[name];
    if (!pending[name]) pending[name] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = sources[name];
      script.onload = () => window[name] ? resolve(window[name]) : reject(new Error('Biblioteca indisponível: ' + name));
      script.onerror = () => reject(new Error('Não foi possível carregar ' + name + '. Verifique a conexão.'));
      document.head.appendChild(script);
    }).catch(error => { delete pending[name]; throw error; });
    return pending[name];
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor);
    anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function clean(html) {
    const root = document.createElement('div'); root.innerHTML = html;
    root.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(el => el.remove());
    root.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(a => { if (/^on/i.test(a.name) || (a.name === 'href' && !/^(https?:|mailto:|#)/i.test(a.value))) el.removeAttribute(a.name); });
    });
    return root;
  }
  const xml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  async function odt(root) {
    const Zip = await load('JSZip'); const zip = new Zip(); let tableId = 0;
    const imageXml = new Map(); const imageEntries = [];
    root.querySelectorAll('img').forEach((img,index) => {
      const match = /^data:(image\/(?:png|jpeg|gif));base64,(.+)$/s.exec(img.getAttribute('src') || '');
      if (!match) {imageXml.set(img, xml(img.alt || '[Imagem não incorporada]')); return;}
      const path = 'Pictures/imagem'+index+'.'+(match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1]);
      zip.file(path,match[2],{base64:true}); imageEntries.push({path,type:match[1]});
      imageXml.set(img, `<draw:frame draw:name="Imagem${index}" text:anchor-type="as-char" svg:width="12cm" svg:height="${12 * (Number(img.getAttribute('height')) || 300) / (Number(img.getAttribute('width')) || 450)}cm"><draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>`);
    });
    const inline = node => {
      if (node.nodeType === 3) return xml(node.textContent).replace(/\n/g, '<text:line-break/>').replace(/ {2,}/g, s => `<text:s text:c="${s.length}"/>`);
      if (node.nodeType !== 1) return '';
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') return '<text:line-break/>';
      if (tag === 'img') return imageXml.get(node) || '';
      const body = Array.from(node.childNodes).map(inline).join('');
      const style = {strong:'Bold',b:'Bold',em:'Italic',i:'Italic',u:'Underline'}[tag];
      return style ? `<text:span text:style-name="${style}">${body}</text:span>` : body;
    };
    const blocks = container => Array.from(container.childNodes).map(node => {
      if (node.nodeType === 3) return node.textContent.trim() ? `<text:p>${inline(node)}</text:p>` : '';
      if (node.nodeType !== 1) return '';
      const tag = node.tagName.toLowerCase();
      if (tag === 'table') {
        const occupied = [];
        const rows = Array.from(node.rows).map((row,rowIndex) => {
          let column = 0, body = ''; occupied[rowIndex] ||= [];
          const covered = () => {while (occupied[rowIndex][column]) {body += '<table:covered-table-cell/>';column++;}};
          Array.from(row.cells).forEach(cell => {
            covered();
            const attrs = (cell.colSpan > 1 ? ` table:number-columns-spanned="${cell.colSpan}"` : '') + (cell.rowSpan > 1 ? ` table:number-rows-spanned="${cell.rowSpan}"` : '');
            body += `<table:table-cell office:value-type="string"${attrs}>${blocks(cell) || '<text:p/>'}</table:table-cell>` + '<table:covered-table-cell/>'.repeat(cell.colSpan - 1);
            for (let r = 1; r < cell.rowSpan; r++) {occupied[rowIndex+r] ||= [];for (let c = 0; c < cell.colSpan; c++) occupied[rowIndex+r][column+c] = true;}
            column += cell.colSpan;
          });
          covered(); return '<table:table-row>'+body+'</table:table-row>';
        }).join('');
        return `<table:table table:name="Tabela${++tableId}">${rows}</table:table>`;
      }
      if (tag === 'ul' || tag === 'ol') return '<text:list>' + Array.from(node.children).map(li => `<text:list-item>${blocks(li)}</text:list-item>`).join('') + '</text:list>';
      if (/^(div|section|article|tbody|thead|li|td|th)$/.test(tag)) return blocks(node);
      if (/^h[1-6]$/.test(tag)) return `<text:h text:outline-level="${tag[1]}">${inline(node)}</text:h>`;
      return `<text:p>${inline(node)}</text:p>`;
    }).join('');
    const ns = 'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"';
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text', {compression:'STORE'});
    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-content ${ns} office:version="1.2"><office:automatic-styles><style:style style:name="Bold" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style><style:style style:name="Italic" style:family="text"><style:text-properties fo:font-style="italic"/></style:style><style:style style:name="Underline" style:family="text"><style:text-properties style:text-underline-style="solid"/></style:style></office:automatic-styles><office:body><office:text>${blocks(root)}</office:text></office:body></office:document-content>`);
    zip.file('META-INF/manifest.xml', '<?xml version="1.0"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' + imageEntries.map(i => `<manifest:file-entry manifest:full-path="${i.path}" manifest:media-type="${i.type}"/>`).join('') + '</manifest:manifest>');
    return zip.generateAsync({type:'blob',mimeType:'application/vnd.oasis.opendocument.text',compression:'DEFLATE'});
  }
  async function htmlDocx(root) {
    if (!window.docx) throw new Error('Biblioteca DOCX indisponível.');
    const {Document,Paragraph,TextRun,Table,TableRow,TableCell,Packer,ImageRun} = window.docx;
    function runs(node, styles = {}) {
      if (node.nodeType === 3) return [new TextRun({text:node.textContent,...styles})];
      if (node.nodeType !== 1) return [];
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') return [new TextRun({text:'',break:1})];
      if (tag === 'img') {
        const match = /^data:image\/(?:png|jpeg|gif);base64,(.+)$/s.exec(node.getAttribute('src') || '');
        if (!match) return [new TextRun(node.alt || '[Imagem não incorporada]')];
        const data = Uint8Array.from(atob(match[1]),c => c.charCodeAt(0));
        return [new ImageRun({data,transformation:{width:Number(node.getAttribute('width')) || 450,height:Number(node.getAttribute('height')) || 300}})];
      }
      return Array.from(node.childNodes).flatMap(n => runs(n, {...styles,...(/^(b|strong)$/.test(tag)?{bold:true}:{}),...(/^(i|em)$/.test(tag)?{italics:true}:{})}));
    }
    function blocks(container) {
      return Array.from(container.childNodes).flatMap(node => {
        if (node.nodeType === 3) return node.textContent.trim() ? [new Paragraph({children:runs(node)})] : [];
        if (node.nodeType !== 1) return [];
        if (node.tagName === 'TABLE') return [new Table({rows:Array.from(node.rows).map(row => new TableRow({children:Array.from(row.cells).map(cell => new TableCell({columnSpan:cell.colSpan,rowSpan:cell.rowSpan,children:blocks(cell).length?blocks(cell):[new Paragraph('')]}))}))})];
        if (/^(DIV|SECTION|ARTICLE|UL|OL|LI)$/.test(node.tagName)) return blocks(node);
        return [new Paragraph({children:runs(node),...(/^H[1-6]$/.test(node.tagName)?{heading:'Heading'+node.tagName[1]}:{})})];
      });
    }
    return Packer.toBlob(new Document({sections:[{children:blocks(root)}]}));
  }
  async function fromHtml(html, format, filename) {
    const root = clean(html);
    await Promise.all(Array.from(root.querySelectorAll('img')).map(async img => {
      if (!/^data:image\/(png|jpeg|gif);base64,/i.test(img.getAttribute('src') || '')) {img.replaceWith(document.createTextNode(img.alt || '[Imagem não incorporada]'));return;}
      try {if (img.decode) await img.decode();} catch (_) {}
      const width = img.naturalWidth || Number(img.getAttribute('width')) || 450;
      const height = img.naturalHeight || Number(img.getAttribute('height')) || 300;
      const fitted = Math.min(width,450);
      img.setAttribute('width',fitted); img.setAttribute('height',Math.round(height*fitted/width));
    }));
    if (!root.textContent.trim() && !root.querySelector('img')) throw new Error('O documento está vazio.');
    if (!['pdf','odt','docx'].includes(format)) throw new Error('Formato inválido.');
    if (format === 'docx') return download(await htmlDocx(root),filename+'.docx');
    if (format === 'odt') return download(await odt(root),filename+'.odt');
    return pdfFromDocx(await htmlDocx(root),filename);
  }
  async function pdfFromDocx(blob,filename) {
    if (blob.size > 4 * 1024 * 1024) throw new Error('O documento excede o limite de 4 MB.');
    const user = window.firebase?.auth().currentUser;
    if (!user) throw new Error('Faça login para gerar o PDF.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),65000);
    try {
      const response = await fetch('/.netlify/functions/convert-docx',{
        method:'POST',redirect:'error',
        headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Authorization':'Bearer '+await user.getIdToken()},
        body:blob,signal:controller.signal,
      });
      if (!response.ok) {
        let message = 'Não foi possível gerar o PDF. Verifique se o servidor de conversão está configurado.';
        try {const error = await response.json();if (typeof error.error === 'string') message = error.error;} catch (_) {}
        throw new Error(message);
      }
      if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/pdf')) throw new Error('O servidor não retornou um PDF válido.');
      const pdf = await response.blob();
      if (pdf.size > 4 * 1024 * 1024) throw new Error('O PDF excede o limite de 4 MB.');
      const signature = new Uint8Array(await pdf.slice(0,5).arrayBuffer());
      if (String.fromCharCode(...signature) !== '%PDF-') throw new Error('O servidor não retornou um PDF válido.');
      download(pdf,filename+'.pdf');
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('A conversão demorou demais. Tente novamente.');
      throw error;
    } finally {clearTimeout(timer);}
  }

  async function fromDocx(blob,format,filename) {
    if (!['docx','pdf','odt'].includes(format)) throw new Error('Formato inválido.');
    if (format === 'docx') return download(blob,filename+'.docx');
    if (format === 'pdf') return pdfFromDocx(blob,filename);
    const converter = await load('mammoth');
    const result = await converter.convertToHtml({arrayBuffer:await blob.arrayBuffer()});
    return fromHtml(result.value,format,filename);
  }
  window.SRMExport = {fromDocx,fromHtml};
  window.exportarPei = async function (format) {
    const root = document.getElementById('peiConteudo');
    const name = (document.getElementById('peiNomeAluno').textContent || 'PEI').replace(/[^\p{L}\p{N}_-]+/gu,'_');
    try { await fromHtml(root.innerHTML,format,name); showToast(format.toUpperCase()+' gerado com sucesso.'); }
    catch(error) {console.error(error); showToast('Erro na exportação: '+error.message);}
  };
})();
