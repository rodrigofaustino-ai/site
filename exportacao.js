/* Exportações DOCX e ODT geradas no navegador. */
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
    const {Document,Paragraph,TextRun,Table,TableRow,TableCell,Packer,ImageRun,AlignmentType,WidthType,TableLayoutType,BorderStyle,ShadingType,VerticalAlign} = window.docx;
    // Padrão compartilhado com PAEE/Relatório: Arial 12, A4 e margens de 1,5 cm.
    const MARGIN = 850, TABLE_WIDTH = 10205;
    const border = {style:BorderStyle.SINGLE,size:4,color:'CCCCCC'};
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
    function table(node) {
      const htmlRows=Array.from(node.rows), occupied=[];
      let columns=1;
      const positions=htmlRows.map((row,r)=>{
        occupied[r] ||= [];let column=0;
        return Array.from(row.cells).map(cell=>{
          while(occupied[r][column])column++;
          const start=column;
          for(let y=0;y<cell.rowSpan;y++){
            occupied[r+y] ||= [];
            for(let x=0;x<cell.colSpan;x++)occupied[r+y][start+x]=true;
          }
          column+=cell.colSpan;columns=Math.max(columns,column);
          return {cell,start};
        });
      });
      const widths=Array(columns).fill(Math.floor(TABLE_WIDTH/columns));
      widths[columns-1]+=TABLE_WIDTH-widths.reduce((a,b)=>a+b,0);
      return new Table({width:{size:TABLE_WIDTH,type:WidthType.DXA},columnWidths:widths,layout:TableLayoutType.FIXED,
        rows:positions.map(cells=>new TableRow({
          tableHeader:cells.length>0 && cells.every(({cell})=>cell.tagName==='TH'),
          children:cells.map(({cell,start})=>{
            const children=blocks(cell);
            return new TableCell({columnSpan:cell.colSpan,rowSpan:cell.rowSpan,
              width:{size:widths.slice(start,start+cell.colSpan).reduce((a,b)=>a+b,0),type:WidthType.DXA},
              margins:{top:60,bottom:60,left:80,right:80},verticalAlign:VerticalAlign.CENTER,
              borders:{top:border,bottom:border,left:border,right:border},
              ...(cell.tagName==='TH'?{shading:{type:ShadingType.CLEAR,fill:'EFF3EC'}}:{}),
              children:children.length?children:[new Paragraph('')],
            });
          }),
        })),
      });
    }
    function blocks(container) {
      return Array.from(container.childNodes).flatMap(node => {
        if (node.nodeType === 3) return node.textContent.trim() ? [new Paragraph({children:runs(node,container.tagName==='TH'?{bold:true}:{}),spacing:{before:40,after:40},alignment:AlignmentType.JUSTIFIED})] : [];
        if (node.nodeType !== 1) return [];
        if (node.tagName === 'TABLE') return [table(node)];
        if (/^(DIV|SECTION|ARTICLE|UL|OL|LI)$/.test(node.tagName)) return blocks(node);
        return [new Paragraph({children:runs(node,container.tagName==='TH'?{bold:true}:{}),spacing:{before:40,after:40},alignment:AlignmentType.JUSTIFIED,...(/^H[1-6]$/.test(node.tagName)?{style:'PEIHeading'+node.tagName[1],spacing:{before:200,after:60}}:{})})];
      });
    }
    const pageBorder={style:BorderStyle.SINGLE,size:8,color:'000000',space:24};
    return Packer.toBlob(new Document({
      styles:{default:{document:{run:{font:'Arial',size:24},paragraph:{alignment:AlignmentType.JUSTIFIED}}},
        paragraphStyles:Array.from({length:6},(_,i)=>({id:'PEIHeading'+(i+1),name:'Título PEI '+(i+1),basedOn:'Normal',next:'Normal',
          run:{font:'Arial',size:24,bold:true,color:'1B5E3C'},paragraph:{spacing:{before:200,after:60},outlineLevel:i}})),
      },
      sections:[{properties:{page:{size:{width:11906,height:16838},
        margin:{top:MARGIN,right:MARGIN,bottom:MARGIN,left:MARGIN},
        borders:{pageBorderTop:pageBorder,pageBorderRight:pageBorder,pageBorderBottom:pageBorder,pageBorderLeft:pageBorder},
      }},children:blocks(root)}],
    }));
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
    if (!['odt','docx'].includes(format)) throw new Error('Formato inválido.');
    if (format === 'docx') return download(await htmlDocx(root),filename+'.docx');
    if (format === 'odt') return download(await odt(root),filename+'.odt');
  }
  async function fromDocx(blob,format,filename) {
    if (!['docx','odt'].includes(format)) throw new Error('Formato inválido.');
    if (format === 'docx') return download(blob,filename+'.docx');
    const converter = await load('mammoth');
    const result = await converter.convertToHtml({arrayBuffer:await blob.arrayBuffer()});
    return fromHtml(result.value,format,filename);
  }
  window.SRMExport = {fromDocx,fromHtml};
  function preparePei(html) {
    const root=clean(html);
    // Ler cada célula na ordem das linhas, preservando os parágrafos e imagens.
    Array.from(root.querySelectorAll('table')).reverse().forEach(table=>{
      const text=document.createElement('div');
      Array.from(table.rows).forEach(row=>{
        Array.from(row.cells).forEach(cell=>{
          const paragraph=document.createElement('div');
          while(cell.firstChild)paragraph.appendChild(cell.firstChild);
          text.appendChild(paragraph);
        });
      });
      table.replaceWith(text);
    });
    root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading=>{
      const paragraph=document.createElement('p');
      while(heading.firstChild)paragraph.appendChild(heading.firstChild);
      heading.replaceWith(paragraph);
    });
    root.querySelectorAll('b,strong').forEach(el=>el.replaceWith(...el.childNodes));
    root.querySelectorAll('*').forEach(el=>el.removeAttribute('style'));
    root.normalize();
    const labels=[
      'IDENTIFICAÇÃO',
      'II. CARACTERÍSTICAS DO ALUNO NO CONTEXTO ESCOLAR',
      'ASPECTOS SOCIOAFETIVOS:', 'ASPECTOS ACADÊMICOS:',
      'ASPECTOS DE LINGUAGEM VERBAL ORAL:', 'ASPECTOS DE LINGUAGEM VERBAL ESCRITA:',
      'ASPECTOS COGNITIVOS:', 'ASPECTOS PSICOMOTORES:',
      'III. ESTRATÉGIAS DE ENSINO, OBJETIVOS E METAS EDUCACIONAIS:',
      '1) Lembrar (Reconhecer/Identificar): Desenvolver a capacidade de reconhecer informações básicas do cotidiano escolar.',
      '2) Compreender (Entender/Interpretar): Favorecer a compreensão de comandos simples e significados.',
      '3) Aplicar (Usar/Executar): Utilizar o conhecimento em situações práticas do dia a dia.',
      '4) Analisar (Diferenciar/Comparar): Desenvolver habilidades iniciais de comparação e organização.',
      '5) Avaliar (Escolher/Opinar): Estimular a expressão de preferências e escolhas.',
      '6) Criar (Produzir/Expressar): Incentivar formas de expressão e participação criativa.',
      'Metas:', 'MODIFICAÇÕES E ADAPTAÇÕES/ADEQUAÇÕES CURRICULARES:',
      'Procedimentos didáticos e Estratégias Pedagógicas:', 'Recursos Pedagógicos:',
      'Ajustes Temporais:', 'Avaliações Adaptadas:',
      'Adequações Físicas e Funcionais do Ambiente Escolar:',
      'PROCESSO AVALIATIVO:', 'Instrumentos Complementares:', 'Parecer descritivo:',
      'Portfólio:', 'IV. CARACTERÍSTICAS DO ALUNO NO CONTEXTO FAMILIAR',
      'Nome:', 'Professora Regente', 'Professora de Apoio', 'Coordenadora Pedagógica',
    ];
    // A marcação pode dividir um título em vários spans. Marcar pelo texto completo
    // permite reconhecer o título sem tornar o restante do parágrafo negrito.
    const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const patterns=labels.map(label=>escape(label).replace(/ +/g,'\\s+').replace(/\\\.\\s\+/g,'\\.\\s*'));
    const expression=new RegExp(patterns.sort((a,b)=>b.length-a.length).join('|'),'giu');
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];let node;let text='';let previousBlock=null;
    while((node=walker.nextNode())){
      const block=node.parentElement.closest('p,div,li');
      if(previousBlock && previousBlock!==block)text+='\n';
      const start=text.length;text+=node.textContent;nodes.push({node,start,end:text.length});previousBlock=block;
    }
    const ranges=Array.from(text.matchAll(expression),match=>({start:match.index,end:match.index+match[0].length}));
    nodes.forEach(({node,start,end})=>{
      const overlaps=ranges.filter(range=>range.start<end && range.end>start);
      if(!overlaps.length)return;
      const fragment=document.createDocumentFragment();let cursor=0;
      overlaps.forEach(range=>{
        const from=Math.max(range.start,start)-start,to=Math.min(range.end,end)-start;
        if(from>cursor)fragment.appendChild(document.createTextNode(node.textContent.slice(cursor,from)));
        const bold=document.createElement('strong');bold.textContent=node.textContent.slice(from,to);fragment.appendChild(bold);cursor=to;
      });
      if(cursor<node.textContent.length)fragment.appendChild(document.createTextNode(node.textContent.slice(cursor)));
      node.replaceWith(fragment);
    });
    return root.innerHTML;
  }
  window.exportarPei = async function (format) {
    const root = document.getElementById('peiConteudo');
    const name = (document.getElementById('peiNomeAluno').textContent || 'PEI').replace(/[^\p{L}\p{N}_-]+/gu,'_');
    try { await fromHtml(preparePei(root.innerHTML),format,name); showToast(format.toUpperCase()+' gerado com sucesso.'); }
    catch(error) {console.error(error); showToast('Erro na exportação: '+error.message);}
  };
})();
