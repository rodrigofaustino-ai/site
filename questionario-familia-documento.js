/* Documento de consulta: usa somente o relato salvo recebido pelo gerador. */
(()=>{
 'use strict';
 const M=QuestionarioFamiliaModelo;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const texto=v=>esc(v).replace(/\r?\n/g,'<br>');
 const antigos={comunica_escolha:'Comunicação de escolhas e vontades',comunica_chamado:'Resposta ao nome',comunica_fatos:'Relatos do cotidiano',leitura_nome:'Nome escrito',leitura_imagens:'Leitura de imagens',leitura_historia:'Histórias',escrita_registro:'Registros escritos',escrita_nome:'Escrita do nome',escrita_palavras:'Escrita de palavras',percepcao_comando:'Comandos',percepcao_textura:'Texturas',percepcao_objeto:'Objetos',avd_alimentacao:'Alimentação',avd_higiene:'Higiene',avd_vestir:'Vestuário',social_interacao:'Interação',social_emocoes:'Emoções',social_combinados:'Combinados',numeros_uso:'Uso dos números',numeros_quantidade:'Quantidade',numeros_compara:'Comparação',formas_iguais:'Igualdade e diferença',formas_reconhece:'Formas',formas_cores:'Cores',medidas_rotina:'Rotina',medidas_sequencia:'Sequência',medidas_espaco:'Espaço'};
 const rotulosAntigos={observa:'Observa no cotidiano',as_vezes:'Às vezes',apoio:'Com apoio',ainda_nao:'Ainda não',nao_sabe:'Não sabe informar',nao_observou:'Ainda não observou',nao_informar:'Prefere não informar'};
 function html(d){
  const {aluno:a,resposta:r}=d||{};if(!a?.id||!r||r.alunoId!==a.id||![1,2].includes(r.versao))throw Error('Questionário incompatível com o aluno.');
  const p=(nome,valor)=>'<p><strong>'+esc(nome)+':</strong> '+texto(valor||'Não informado')+'</p>';
  let out='<h1>QUESTIONÁRIO DA FAMÍLIA</h1><p>Atendimento Educacional Especializado · Sala de Recursos Multifuncionais</p>';
  out+=p('Estudante',a.nome)+p('Escola',a.escola)+p('Turma',a.turma)+p('Período de referência',d.periodo)+p('Respondido por',r.responsavel)+p('Vínculo com o estudante',r.vinculo)+p('Data do envio',d.dataEnvio);
  out+='<p>Informações relatadas pela família para apoiar o planejamento pedagógico. Este documento não substitui a avaliação do professor nem constitui assinatura da Diagnóstica.</p>';
  if(r.contexto)out+='<h2>Contexto informado pela família</h2><p>'+texto(r.contexto)+'</p>';
  if(r.versao===2){
   for(const area of M.areas){out+='<h2>'+esc(area.titulo)+'</h2>';for(const q of area.itens){const v=r.respostas?.[q.id];out+='<p><strong>'+esc(q.pergunta)+'</strong></p><p><em>'+esc(q.item)+'</em></p>'+p('Resposta',v==='relato'?'Descrição da família':M.rotulo(q,v));if(r.observacoesPerguntas?.[q.id])out+=p('Observação',r.observacoesPerguntas[q.id]);}}
  }else{
   out+='<h2>Questionário anterior — modelo original</h2>';
   for(const [key,value]of Object.entries(r.respostas||{})){out+='<p><strong>'+esc(antigos[key]||key)+'</strong></p>'+p('Resposta',value==null?'Sem resposta':rotulosAntigos[value]||value);if(r.observacoesPerguntas?.[key])out+=p('Observação',r.observacoesPerguntas[key]);}
  }
  if(r.observacoes)out+='<h2>Informações finais da família</h2><p>'+texto(r.observacoes)+'</p>';
  return out;
 }
 window.QuestionarioFamiliaDocumento=Object.freeze({html});
})();
