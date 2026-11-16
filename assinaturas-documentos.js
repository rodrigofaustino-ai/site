/* Blocos exclusivos de assinatura: quatro linhas simples, sem bordas de tabela. */
(() => {
 'use strict';
 const linha='________________________________';
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function imagemValida(a){return !!a&&typeof a.imagem==='string'&&a.imagem.length<=80000&&/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(a.imagem)&&Number.isInteger(a.largura)&&a.largura>0&&a.largura<=640&&Number.isInteger(a.altura)&&a.altura>0&&a.altura<=200;}
 function tamanho(a){const ratio=Math.min(180/a.largura,64/a.altura,1);return {width:Math.max(1,Math.round(a.largura*ratio)),height:Math.max(1,Math.round(a.altura*ratio))};}
 function imagemHtml(a){if(!imagemValida(a))return '';const d=tamanho(a);return '<p data-srm-sign-imagem-area="true" style="height:48pt;text-align:center;margin:0"><img data-srm-sign-imagem="true" data-largura="'+a.largura+'" data-altura="'+a.altura+'" src="'+a.imagem+'" width="'+d.width+'" height="'+d.height+'" alt="Assinatura digitalizada" style="object-fit:contain;max-width:100%"></p>';}
 function paraNome(a,nome){return imagemValida(a)&&a.nome===String(nome||'').trim()?a:null;}
 function paragrafoImagem(a){if(!imagemValida(a))return null;const {Paragraph,ImageRun,AlignmentType}=window.docx;return new Paragraph({children:[new ImageRun({type:'png',data:Uint8Array.from(atob(a.imagem.split(',')[1]),c=>c.charCodeAt(0)),transformation:tamanho(a)})],alignment:AlignmentType.CENTER,keepNext:true,spacing:{before:0,after:0}});}
 function html(grupos){return '<table data-srm-assinaturas="true" style="width:100%;border-collapse:collapse;border:none"><tbody>'+grupos.map(g=>'<tr>'+g.map(a=>'<td'+(g.length===1?' colspan="2"':'')+' style="border:none;text-align:center">'+(imagemValida(a.assinatura)?imagemHtml(a.assinatura):Array.from({length:4},()=>'<p data-srm-sign-espaco="true" style="margin:0;line-height:12pt;height:12pt">&#160;</p>').join(''))+'<p data-srm-sign-linha="true" style="text-align:center;margin:0">'+linha+'</p><p data-srm-sign-nome="true" style="text-align:center;margin:0">'+esc(a.nome)+'</p><p data-srm-sign-cargo="true" style="text-align:center;margin:0">'+esc(a.cargo)+'</p></td>').join('')+'</tr>').join('')+'</tbody></table>';}
 function gruposDoHtml(table){return Array.from(table.rows).map(r=>Array.from(r.cells).map(c=>({nome:c.querySelector('[data-srm-sign-nome]')?.textContent||'',cargo:c.querySelector('[data-srm-sign-cargo]')?.textContent||'',assinatura:c.querySelector('[data-srm-sign-imagem]')?{imagem:c.querySelector('[data-srm-sign-imagem]').getAttribute('src'),largura:Number(c.querySelector('[data-srm-sign-imagem]').dataset.largura),altura:Number(c.querySelector('[data-srm-sign-imagem]').dataset.altura)}:null})));}
 function docx(grupos){
  const {Table,TableRow,TableCell,Paragraph,TextRun,ImageRun,WidthType,TableLayoutType,AlignmentType,BorderStyle,LineRuleType}=window.docx;
  const none={style:BorderStyle.NONE,size:0,color:'FFFFFF'},borders={top:none,bottom:none,left:none,right:none,insideHorizontal:none,insideVertical:none};
  const p=(text,ultimo=false,espaco=false)=>new Paragraph({children:[new TextRun({text:text||' ',size:24,font:'Arial'})],alignment:AlignmentType.CENTER,keepNext:!ultimo,keepLines:true,spacing:{before:0,after:0,line:240,lineRule:espaco?LineRuleType.EXACT:LineRuleType.AUTO}});
  const rows=grupos.map(g=>new TableRow({
    cantSplit:true,
    children:g.map(a=>new TableCell({
      columnSpan:g.length===1?2:1,
      width:{size:g.length===1?10206:5103,type:WidthType.DXA},borders,
      margins:{top:0,bottom:0,left:100,right:100},
      children:[...(imagemValida(a.assinatura)?[new Paragraph({children:[new ImageRun({type:'png',data:Uint8Array.from(atob(a.assinatura.imagem.split(',')[1]),c=>c.charCodeAt(0)),transformation:tamanho(a.assinatura)})],alignment:AlignmentType.CENTER,keepNext:true,spacing:{before:0,after:0}})]:Array.from({length:4},()=>p(' ',false,true))),p(linha),p(a.nome),p(a.cargo,true)]
    }))
  }));
  return new Table({width:{size:10206,type:WidthType.DXA},columnWidths:[5103,5103],layout:TableLayoutType.FIXED,borders,rows});
 }
 const estilosOdt='<style:style style:name="SrmSignTabela" style:family="table"><style:table-properties style:width="18cm" table:align="center"/></style:style><style:style style:name="SrmSignColuna" style:family="table-column"><style:table-column-properties style:column-width="9cm"/></style:style><style:style style:name="SrmSignCelula" style:family="table-cell"><style:table-cell-properties fo:border="none" fo:padding="0cm" fo:padding-left="0.18cm" fo:padding-right="0.18cm"/></style:style><style:style style:name="SrmSignLinha" style:family="table-row"><style:table-row-properties fo:keep-together="always"/></style:style>'+['Espaco','Texto','Cargo','Data','DataLeft'].map(k=>'<style:style style:name="SrmSign'+k+'" style:family="paragraph"><style:paragraph-properties fo:text-align="'+(k==='DataLeft'?'left':'center')+'" fo:margin-top="0cm" fo:margin-bottom="0cm" fo:line-height="'+(k==='Espaco'?'12pt':'100%')+'" fo:keep-with-next="'+(k==='Cargo'?'auto':'always')+'"/><style:text-properties fo:font-size="12pt" fo:font-family="Arial"/></style:style>').join('');
 function odt(table,imageXml=new Map()){return '<table:table table:name="Assinaturas" table:style-name="SrmSignTabela"><table:table-column table:style-name="SrmSignColuna" table:number-columns-repeated="2"/>'+gruposDoHtml(table).map((g,ri)=>'<table:table-row table:style-name="SrmSignLinha">'+g.map((a,ci)=>'<table:table-cell table:style-name="SrmSignCelula" office:value-type="string"'+(g.length===1?' table:number-columns-spanned="2"':'')+'>'+(imagemValida(a.assinatura)?'<text:p text:style-name="SrmSignTexto">'+(imageXml.get(table.rows[ri].cells[ci].querySelector('[data-srm-sign-imagem]'))||'')+'</text:p>':Array.from({length:4},()=>'<text:p text:style-name="SrmSignEspaco"><text:s/></text:p>').join(''))+'<text:p text:style-name="SrmSignTexto">'+linha+'</text:p><text:p text:style-name="SrmSignTexto">'+esc(a.nome||' ')+'</text:p><text:p text:style-name="SrmSignCargo">'+esc(a.cargo)+'</text:p></table:table-cell>'+(g.length===1?'<table:covered-table-cell/>':'')).join('')+'</table:table-row>').join('')+'</table:table>';}
 function normalizarPei(root){
  if(root.querySelector('table[data-srm-assinaturas]'))return;
  const ps=[...root.querySelectorAll('p')],norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
  const roles=[/^professor(?:a|\(a\))? regente$/,/^professor(?:a|\(a\))? de apoio$/,/^coordenador(?:a|\(a\))? pedagogic(?:[oa]|o\(a\))$/];
  const indices=roles.map(re=>ps.reduce((last,p,i)=>re.test(norm(p.textContent))?i:last,-1));
  if(indices.some(i=>i<0)||!(indices[0]<indices[1]&&indices[1]<indices[2])||ps.slice(indices[2]+1).some(p=>p.textContent.trim()))return;
  const dados=[];let inicio=-1;
  for(const i of indices){let j=i-1;while(j>=Math.max(0,i-5)&&!/^nome\s*:/i.test(ps[j].textContent.trim()))j--;if(j<Math.max(0,i-5))return;const nome=ps.slice(j,i).map(p=>p.textContent).join(' ').replace(/^\s*nome\s*:\s*/i,'').replace(/\s+/g,' ').trim();dados.push({nome,cargo:ps[i].textContent.trim()});if(inicio<0){inicio=j;while(inicio>0&&/^[\s_\u00a0]*$/.test(ps[inicio-1].textContent))inicio--;}}
  const anterior=ps[inicio-1];if(anterior&&/\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}/i.test(norm(anterior.textContent)))anterior.setAttribute('data-srm-sign-data','left');
  const range=document.createRange();range.setStartBefore(ps[inicio]);range.setEndAfter(ps[indices[2]]);range.deleteContents();range.insertNode(range.createContextualFragment(html([[dados[0],dados[1]],[dados[2]]])));
 }
 const css='[data-srm-assinaturas]{border:0!important;box-shadow:none!important;background:none!important;width:100%!important;table-layout:fixed;margin:0!important}[data-srm-assinaturas] td{border:0!important;background:none!important;min-width:0!important;width:auto!important;padding:0 6px!important;text-align:center!important}[data-srm-assinaturas] p{font:12pt/12pt Arial,sans-serif!important;margin:0!important;text-align:center!important}[data-srm-sign-espaco]{height:12pt!important;line-height:12pt!important}';
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 window.AssinaturasDocumentos=Object.freeze({html,docx,odt,estilosOdt,gruposDoHtml,normalizarPei,css,imagemValida,paragrafoImagem,paraNome});
})();
