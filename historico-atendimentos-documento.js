/* Mesmo gerador DOCX para a ficha e Exportar Documentos. */
(()=>{'use strict';
function calcIdade(dataNasc) {
  if (!dataNasc) return '';
  const hoje = new Date(), nasc = new Date(dataNasc);
  let anos = hoje.getFullYear() - nasc.getFullYear();const m = hoje.getMonth() - nasc.getMonth();
  if(m<0||(m===0&&hoje.getDate()<nasc.getDate()))anos--;
  if(anos<0)return '';if(anos<1){const meses=(hoje.getFullYear()-nasc.getFullYear())*12+hoje.getMonth()-nasc.getMonth();return meses+(meses===1?' mes':' meses');}
  return anos+(anos===1?' ano':' anos');
}
function fmtDate(s){if(!s)return '—';const [y,m,d]=s.split('-');return `${parseInt(d)} de ${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][parseInt(m)-1]} de ${y}`;}
function relato(e,complementos){let t=e.text||'';if(!complementos)return t;
 if(e.proximoPasso&&!t.includes('Próximo passo:\n'+e.proximoPasso))t+='\n\nPróximo passo:\n'+e.proximoPasso;
 if(Array.isArray(e.metaIds)&&e.metaIds.length)t+='\n\nMetas vinculadas no registro:\n'+e.metaIds.map(id=>(Array.isArray(e.metaVinculos)?e.metaVinculos.find(m=>m?.id===id)?.objetivo:null)||'Meta vinculada sem descrição salva no registro').join('\n');return t;
}
async function gerar(dados){if(!dados?.aluno||!Array.isArray(dados.registros))throw Error('Histórico inválido.');
const periodo=HistoricoAtendimentosFrequencia.preparar(dados.registros,dados.dataReferencia);
const faltas=HistoricoAtendimentosFrequencia.faltasManuais(Object.hasOwn(dados,'faltas')?dados.faltas:HistoricoAtendimentosFrequencia.faltasDoAluno(dados.aluno,dados.dataReferencia));
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, ShadingType, TableLayoutType,
    VerticalAlign, HeightRule
  } = docx;

  const p = dados.aluno;
  const entries = periodo.registros;
  const nomeAluno = p.nome || 'Aluno';
  const professor = dados.professor || p.pdfProfessor || '';
  const cargo = dados.cargo || p.pdfCargo || 'Professor(a) da Sala de Recursos Multifuncionais';
  const local = dados.local || p.pdfLocal || '';
  const hoje = dados.dataExportacao || new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});

  const MARGIN = 851; // 1,5 cm
  const TABLE_W = 10206; // 18 cm
  const borderThin = {style:BorderStyle.SINGLE,size:4,color:'CCCCCC'};
  const borderMed  = {style:BorderStyle.SINGLE,size:6,color:'AAAAAA'};
  const cm = n => Math.round(n * 566.93);
  const cellM = {top:60,bottom:60,left:100,right:100};

  function bp(text, opts={}){
    return new Paragraph({
      children:[new TextRun({text:text||'—',size:22,...opts})],
      spacing:{before:40,after:40},
      alignment:AlignmentType.JUSTIFIED,
    });
  }
  function sectionTitle(text){
    return new Paragraph({
      children:[new TextRun({text,bold:true,size:24,color:'FFFFFF'})],
      shading:{type:ShadingType.CLEAR,fill:'1B5E3C'},
      spacing:{before:260,after:80},
      indent:{left:80},
    });
  }
  function labeledP(label, value){
    return new Paragraph({
      children:[
        new TextRun({text:label+': ',bold:true,size:22}),
        new TextRun({text:value||'—',size:22}),
      ],
      spacing:{before:40,after:40},
    });
  }

  // Tabela de identificação em 2 colunas
  function idRow(cells){
    const colW = Math.floor(TABLE_W / cells.length);
    return new TableRow({
      children: cells.map((cell,i)=>new TableCell({
        width:{size:colW,type:WidthType.DXA},
        shading:{type:ShadingType.CLEAR,fill:i%2===0?'E7F0EA':'F5F6F0'},
        margins:cellM,
        borders:{top:borderThin,bottom:borderThin,left:borderThin,right:borderThin},
        children:[new Paragraph({
          children:[
            new TextRun({text:(cell.label||'')+': ',bold:true,size:22}),
            new TextRun({text:cell.value||'—',size:22}),
          ],
          spacing:{before:20,after:20},
        })],
      })),
    });
  }

  // Linha de registro de atendimento
  function entryRow(entry, isEven){
    const dateFmt = entry.date
      ? new Date(entry.date+'T00:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
      : '—';
    const humStr = entry.humor ? '  ·  '+entry.humor : '';
    const porStr = entry.por   ? 'Registrado por: '+entry.por : '';
    return [
      new TableRow({
        children:[new TableCell({
          columnSpan:1,
          width:{size:TABLE_W,type:WidthType.DXA},
          shading:{type:ShadingType.CLEAR,fill:'1B5E3C'},
          margins:{top:40,bottom:40,left:100,right:100},
          borders:{top:borderMed,bottom:{style:BorderStyle.SINGLE,size:2,color:'82C996'},left:borderMed,right:borderMed},
          children:[new Paragraph({
            children:[
              new TextRun({text:dateFmt,bold:true,size:22,color:'FFFFFF'}),
              new TextRun({text:humStr,size:20,color:'C8E6C9'}),
              ...(porStr ? [new TextRun({text:'   '+porStr,size:18,color:'A5D6A7',italics:true})] : []),
            ],
            spacing:{before:20,after:20},
          })],
        })],
      }),
      new TableRow({
        children:[new TableCell({
          width:{size:TABLE_W,type:WidthType.DXA},
          shading:{type:ShadingType.CLEAR,fill:isEven?'F5F6F0':'FFFFFF'},
          margins:{top:80,bottom:80,left:120,right:120},
          borders:{top:{style:BorderStyle.SINGLE,size:2,color:'82C996'},bottom:borderThin,left:borderMed,right:borderMed},
          children:[new Paragraph({
            children:[new TextRun({text:relato(entry,dados.complementos)||'(sem conteúdo registrado)',size:22,italics:!entry.text})],
            spacing:{before:20,after:20},
            alignment:AlignmentType.JUSTIFIED,
          })],
        })],
      }),
    ];
  }

  // ---- Montar children ----
  const children = [];

  // Cabeçalho
  children.push(new Paragraph({
    children:[new TextRun({text:'DIÁRIO DE BORDO — SALA DE RECURSOS MULTIFUNCIONAIS',bold:true,size:26,color:'123D28'})],
    alignment:AlignmentType.CENTER,
    spacing:{before:0,after:60},
  }));
  children.push(new Paragraph({
    children:[new TextRun({text:'Histórico de Atendimentos',size:22,color:'586257',italics:true})],
    alignment:AlignmentType.CENTER,
    spacing:{before:0,after:120},
  }));

  // Seção identificação
  children.push(sectionTitle('IDENTIFICAÇÃO DO ALUNO'));
  children.push(new Table({
    rows:[
      idRow([{label:'Nome',value:p.nome},{label:'Data de Nascimento',value:p.dataNasc ? fmtDate(p.dataNasc)+(p.dataNasc?' ('+calcIdade(p.dataNasc)+')':'') : ''}]),
      idRow([{label:'Turma',value:p.turma},{label:'Período',value:p.periodo}]),
      idRow([{label:'Escola',value:p.escola},{label:'Município',value:p.municipio}]),
      idRow([{label:'Laudo / Diagnóstico',value:p.laudo},{label:'CID',value:p.cid}]),
      idRow([{label:'Atendimentos previstos',value:String(periodo.previstos)},{label:'Faltas',value:faltas===null?'________':String(faltas)}]),
    ],
    width:{size:TABLE_W,type:WidthType.DXA},
    layout:TableLayoutType.FIXED,
  }));

  children.push(new Paragraph({children:[new TextRun({text:periodo.descricao,size:18,color:'586257',italics:true})],spacing:{before:60,after:60}}));

  if(p.obsClinicas){
    children.push(new Paragraph({spacing:{before:40,after:0}}));
    children.push(labeledP('Observações clínicas',p.obsClinicas));
  }

  // Responsáveis
  if(p.contacts && p.contacts.length){
    children.push(sectionTitle('RESPONSÁVEIS E CONTATOS'));
    p.contacts.forEach(ct=>{
      children.push(new Paragraph({
        children:[
          new TextRun({text:(ct.nome||'—'),bold:true,size:22}),
          new TextRun({text:'   '+[ct.relacao,ct.tel].filter(Boolean).join('  |  '),size:22,color:'586257'}),
        ],
        spacing:{before:40,after:20},
      }));
    });
  }

  // Registros
  children.push(sectionTitle(`HISTÓRICO DE ATENDIMENTOS (${entries.length} ${entries.length===1?'registro':'registros'})`));

  if(!entries.length){
    children.push(bp('Nenhum atendimento registrado.'));
  }else{
    const entryRows = [];
    entries.forEach((e,i)=>{
      entryRow(e, i%2===0).forEach(r=>entryRows.push(r));
    });
    children.push(new Table({
      rows:entryRows,
      width:{size:TABLE_W,type:WidthType.DXA},
      layout:TableLayoutType.FIXED,
    }));
  }

  // Assinatura
  children.push(new Paragraph({spacing:{before:200,after:0}}));
  const dataAssin = local ? `${local}, ${hoje}` : `_____________________________, ${hoje}`;
  const signW = Math.floor(TABLE_W/2);
  const noBorder = {style:BorderStyle.NONE,size:0,color:'FFFFFF'};
  const lineBorder = {style:BorderStyle.SINGLE,size:4,color:'555555',space:4};

  // Linha 1 — local e data (largura total)
  const rowData = new TableRow({
    children:[new TableCell({
      columnSpan:2,
      width:{size:TABLE_W,type:WidthType.DXA},
      borders:{top:noBorder,bottom:noBorder,left:noBorder,right:noBorder},
      margins:{top:40,bottom:20,left:0,right:0},
      children:[new Paragraph({
        children:[new TextRun({text:dataAssin,size:22,italics:true})],
        alignment:AlignmentType.CENTER,
        spacing:{before:40,after:0},
      })],
    })],
  });

  // Linhas 2, 3, 4 — espaço em branco para assinatura
  function blankSignRow(){
    return new TableRow({
      height:{value:400,rule:HeightRule.EXACT},
      children:[
        new TableCell({width:{size:signW,type:WidthType.DXA},borders:{top:noBorder,bottom:noBorder,left:noBorder,right:noBorder},margins:{top:0,bottom:0,left:0,right:0},children:[new Paragraph({children:[new TextRun({text:'',size:22})]})]}),
        new TableCell({width:{size:signW,type:WidthType.DXA},borders:{top:noBorder,bottom:noBorder,left:noBorder,right:noBorder},margins:{top:0,bottom:0,left:0,right:0},children:[new Paragraph({children:[new TextRun({text:'',size:22})]})]}),
      ],
    });
  }

  // Linha 5 — linha horizontal + nome
  const rowNome = new TableRow({
    children:[
      new TableCell({
        width:{size:TABLE_W,type:WidthType.DXA},
        columnSpan:2,
        borders:{top:lineBorder,bottom:noBorder,left:noBorder,right:noBorder},
        margins:{top:80,bottom:20,left:0,right:0},
        children:[new Paragraph({
          children:[new TextRun({text:professor||'',size:22,bold:!!professor})],
          alignment:AlignmentType.CENTER,
          spacing:{before:20,after:6},
        })],
      }),
    ],
  });

  // Linha 6 — cargo
  const rowCargo = new TableRow({
    children:[
      new TableCell({
        width:{size:TABLE_W,type:WidthType.DXA},
        columnSpan:2,
        borders:{top:noBorder,bottom:noBorder,left:noBorder,right:noBorder},
        margins:{top:0,bottom:20,left:0,right:0},
        children:[new Paragraph({
          children:[new TextRun({text:cargo,size:20,color:'586257'})],
          alignment:AlignmentType.CENTER,
          spacing:{before:0,after:0},
        })],
      }),
    ],
  });

  children.push(new Table({
    rows:[rowData, blankSignRow(), blankSignRow(), blankSignRow(), rowNome, rowCargo],
    width:{size:TABLE_W,type:WidthType.DXA},
    layout:TableLayoutType.FIXED,
  }));

  // Gerar e baixar
  const docxDoc = new Document({
    styles:{default:{document:{run:{font:'Arial',size:22},paragraph:{alignment:AlignmentType.JUSTIFIED}}}},
    sections:[{
      properties:{
        page:{
          margin:{top:MARGIN,right:MARGIN,bottom:MARGIN,left:MARGIN},
          borders:{
            pageBorderTop:{style:BorderStyle.SINGLE,size:8,color:'000000',space:24},
            pageBorderRight:{style:BorderStyle.SINGLE,size:8,color:'000000',space:24},
            pageBorderBottom:{style:BorderStyle.SINGLE,size:8,color:'000000',space:24},
            pageBorderLeft:{style:BorderStyle.SINGLE,size:8,color:'000000',space:24},
          },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(docxDoc);
}
window.HistoricoAtendimentosDocumento=Object.freeze({gerar});
})();
