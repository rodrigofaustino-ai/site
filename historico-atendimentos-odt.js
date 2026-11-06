/* Conversão do layout do DOCX compartilhado para ODT, sem passar por HTML simplificado. */
(()=>{'use strict';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const child=(n,name)=>Array.from(n?.children||[]).find(x=>x.namespaceURI===W&&x.localName===name),children=(n,name)=>Array.from(n?.children||[]).filter(x=>x.namespaceURI===W&&x.localName===name);
const at=(n,k='val')=>n?.getAttributeNS(W,k)||'', cm=n=>(Number(n||0)*2.54/1440).toFixed(5)+'cm';
const attrs=o=>Object.entries(o).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>k+'="'+esc(v)+'"').join(' ');
async function converter(blob){const z=await JSZip.loadAsync(await blob.arrayBuffer()),xml=await z.file('word/document.xml').async('string'),doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('Documento inválido.');
 const body=doc.getElementsByTagNameNS(W,'body')[0],section=child(body,'sectPr'),page=child(section,'pgSz'),margins=child(section,'pgMar'),borders=child(section,'pgBorders');let serial=0;const styles=[];
 function style(family,props,tag){const name='H'+(++serial);styles.push('<style:style style:name="'+name+'" style:family="'+family+'"><style:'+tag+' '+attrs(props)+'/></style:style>');return name;}
 function border(n){const val=at(n);return !n||['none','nil'].includes(val)?'none':(Number(at(n,'sz')||4)/8)+'pt solid #'+(at(n,'color')||'000000');}
 function run(r){const rp=child(r,'rPr'),props={'style:font-name':at(child(rp,'rFonts'),'ascii')||'Arial','fo:font-size':(Number(at(child(rp,'sz'))||22)/2)+'pt'};
 const on=n=>!!n&&!['false','0','off'].includes(at(n));if(on(child(rp,'b')))props['fo:font-weight']='bold';if(on(child(rp,'i')))props['fo:font-style']='italic';if(at(child(rp,'color')))props['fo:color']='#'+at(child(rp,'color'));
 const st=style('text',props,'text-properties');let text='';for(const x of Array.from(r.children)){if(x.localName==='t')text+=esc(x.textContent).replace(/ {2,}/g,s=>'<text:s text:c="'+s.length+'"/>').replace(/\r?\n/g,'<text:line-break/>');else if(x.localName==='br')text+='<text:line-break/>';else if(x.localName==='tab')text+='<text:tab/>';}
 return '<text:span text:style-name="'+st+'">'+text+'</text:span>';}
 function paragraph(p){const pp=child(p,'pPr'),sp=child(pp,'spacing'),ind=child(pp,'ind'),shade=child(pp,'shd'),props={'fo:text-align':({both:'justify',center:'center',right:'end',left:'start'}[at(child(pp,'jc'))]||'justify'),'fo:margin-top':cm(at(sp,'before')),'fo:margin-bottom':cm(at(sp,'after'))};
 if(at(ind,'left'))props['fo:margin-left']=cm(at(ind,'left'));if(at(shade,'fill')&&at(shade,'fill')!=='auto')props['fo:background-color']='#'+at(shade,'fill');
 const st=style('paragraph',props,'paragraph-properties');return '<text:p text:style-name="'+st+'">'+Array.from(p.children).map(x=>x.localName==='r'?run(x):'').join('')+'</text:p>';}
 function table(t){const pr=child(t,'tblPr'),tw=child(pr,'tblW'),grid=children(child(t,'tblGrid'),'gridCol'),rows=children(t,'tr');const total=Number(at(tw,'w')||10206),cols=grid.length||Math.max(...rows.map(r=>children(r,'tc').reduce((sum,c)=>sum+Number(at(child(child(c,'tcPr'),'gridSpan'))||1),0)));
 const ts=style('table',{'style:width':cm(total),'table:align':'left','fo:margin-top':'0cm','fo:margin-bottom':'0cm'},'table-properties');let out='<table:table table:name="Tabela'+serial+'" table:style-name="'+ts+'">';
 const weights=grid.length?grid.map(g=>Number(at(g,'w')||0)):Array(cols).fill(1),weightSum=weights.reduce((a,b)=>a+b,0)||cols;
 for(let i=0;i<cols;i++){const cs=style('table-column',{'style:column-width':cm(total*(weights[i]||1)/weightSum)},'table-column-properties');out+='<table:table-column table:style-name="'+cs+'"/>';}
 for(const r of rows){const h=child(child(r,'trPr'),'trHeight');const rs=h?style('table-row',{[at(h,'hRule')==='exact'?'style:row-height':'style:min-row-height']:cm(at(h))},'table-row-properties'):null;out+='<table:table-row'+(rs?' table:style-name="'+rs+'"':'')+'>';
 for(const c of children(r,'tc')){const cp=child(c,'tcPr'),cb=child(cp,'tcBorders'),mar=child(cp,'tcMar'),span=Number(at(child(cp,'gridSpan'))||1),props={};for(const side of ['top','bottom','left','right']){props['fo:border-'+side]=border(child(cb,side));props['fo:padding-'+side]=cm(at(child(mar,side),'w'));}const fill=at(child(cp,'shd'),'fill');if(fill&&fill!=='auto')props['fo:background-color']='#'+fill;
 const cs=style('table-cell',props,'table-cell-properties');out+='<table:table-cell office:value-type="string" table:style-name="'+cs+'"'+(span>1?' table:number-columns-spanned="'+span+'"':'')+'>'+Array.from(c.children).map(x=>x.localName==='p'?paragraph(x):x.localName==='tbl'?table(x):'').join('')+'</table:table-cell>';for(let i=1;i<span;i++)out+='<table:covered-table-cell/>';}
 out+='</table:table-row>';}
 return out+'</table:table>';}
 const content=Array.from(body.children).map(x=>x.localName==='p'?paragraph(x):x.localName==='tbl'?table(x):'').join('');
 const ns='xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"';
 const layout={'fo:page-width':cm(at(page,'w')||11906),'fo:page-height':cm(at(page,'h')||16838),'style:print-orientation':'portrait','style:writing-mode':'lr-tb'};
 // Word mede o afastamento da borda a partir da página por padrão.
 // ODF mede margem até a borda e padding até o texto: manter a posição do texto.
 for(const side of ['top','right','bottom','left']){const b=child(borders,side),margin=Number(at(margins,side))/20,space=Number(at(b,'space')||0),width=b?Number(at(b,'sz')||4)/8:0;
 layout['fo:border-'+side]=border(b);
 if(b){const fromPage=at(borders,'offsetFrom')!=='text';layout['fo:margin-'+side]=cm((fromPage?space:Math.max(0,margin-space-width))*20);layout['fo:padding-'+side]=Number((fromPage?Math.max(0,margin-space-width):space).toFixed(5))+'pt';}
 else layout['fo:margin-'+side]=cm(at(margins,side));
 }
 const out=new JSZip();out.file('mimetype','application/vnd.oasis.opendocument.text',{compression:'STORE'});
 out.file('content.xml','<?xml version="1.0" encoding="UTF-8"?><office:document-content '+ns+' office:version="1.2"><office:font-face-decls><style:font-face style:name="Arial" svg:font-family="Arial"/></office:font-face-decls><office:automatic-styles>'+styles.join('')+'</office:automatic-styles><office:body><office:text>'+content+'</office:text></office:body></office:document-content>');
 out.file('styles.xml','<?xml version="1.0" encoding="UTF-8"?><office:document-styles '+ns+' office:version="1.2"><office:font-face-decls><style:font-face style:name="Arial" svg:font-family="Arial"/></office:font-face-decls><office:styles><style:default-style style:family="paragraph"><style:paragraph-properties fo:text-align="justify"/><style:text-properties style:font-name="Arial" fo:font-size="11pt"/></style:default-style><style:style style:name="Standard" style:family="paragraph" style:master-page-name="Standard"/></office:styles><office:automatic-styles><style:page-layout style:name="Pagina"><style:page-layout-properties '+attrs(layout)+'/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Pagina"/></office:master-styles></office:document-styles>');
 out.file('META-INF/manifest.xml','<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/></manifest:manifest>');
 return out.generateAsync({type:'blob',mimeType:'application/vnd.oasis.opendocument.text',compression:'DEFLATE'});
}
window.HistoricoAtendimentosOdt=Object.freeze({converter});
})();
