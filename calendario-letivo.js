(()=>{'use strict';
const tipos=[
 ['semestre','Início e término do semestre','05/02 a 10/07 · 29/07 a 18/12'],
 ['feriado','Feriados','01/01; 03 e 21/04; 01/05; 04 e 13/06; 07/09; 11 e 12/10; 02, 15 e 20/11; 25/12'],
 ['recesso','Recessos','16, 17 e 18/02; 05/06; 13 a 26/07; 13/10; 21 a 27/12'],
 ['planejamento','Planejamento / replanejamento','28/01; 27/07'],
 ['conselho','Conselho de Classe — E. F. e EJA','16/05; 12/09; 12/12'],
 ['conselhoEI','Conselho de Classe — E. I.','04/07; 12/12'],
 ['formacao','Formação continuada','29 e 30/01; 02, 03 e 04/02; 28/07'],
 ['reuniao','Reunião pedagógica','13/05; 25/08'],
 ['ferias','Férias discentes','A partir de 28/12']
];
const especiais=new Map();
function add(tipo,mes,dias){for(const d of dias){const key=mes+'-'+d,old=especiais.get(key)||[];old.push(tipo);especiais.set(key,old);}}
add('semestre',2,[5]);add('semestre',7,[10,29]);add('semestre',12,[18]);
for(const [m,ds]of [[1,[1]],[4,[3,21]],[5,[1]],[6,[4,13]],[9,[7]],[10,[11,12]],[11,[2,15,20]],[12,[25]]])add('feriado',m,ds);
add('recesso',2,[16,17,18]);add('recesso',6,[5]);add('recesso',7,Array.from({length:14},(_,i)=>i+13));add('recesso',10,[13]);add('recesso',12,[21,22,23,24,26,27]);
add('planejamento',1,[28]);add('planejamento',7,[27]);add('conselho',5,[16]);add('conselho',9,[12]);add('conselho',12,[12]);add('conselhoEI',7,[4]);add('conselhoEI',12,[12]);
add('formacao',1,[29,30]);add('formacao',2,[2,3,4]);add('formacao',7,[28]);add('reuniao',5,[13]);add('reuniao',8,[25]);add('ferias',1,Array.from({length:26},(_,i)=>i+2));add('ferias',12,[28,29,30,31]);
const nomes=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],letivos=[0,14,22,20,19,20,11,20,21,20,19,14];
const n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
for(let mes=1;mes<=12;mes++){const article=n('article'),h=n('h2',`${nomes[mes-1]} — ${letivos[mes-1]} D. L.`),table=n('table'),caption=n('caption',`${nomes[mes-1]} de 2026`);table.append(caption);const head=n('thead'),tr=n('tr');for(const d of ['D','S','T','Q','Q','S','S']){const th=n('th',d);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const body=n('tbody'),inicio=new Date(2026,mes-1,1).getDay(),total=new Date(2026,mes,0).getDate();for(let i=0;i<42;i+=7){if(i>=inicio+total)break;const row=n('tr');for(let j=0;j<7;j++){const d=i+j-inicio+1,td=n('td');if(d>0&&d<=total){const button=n('button',String(d));button.type='button';const ts=especiais.get(mes+'-'+d)||[];td.className=ts.length>1?'duplo':ts[0]||'';if(j===0||j===6)button.className='fim-semana';const desc=ts.map(t=>tipos.find(x=>x[0]===t)[1]).join(' e ')||'Sem destaque no calendário';button.title=`${d}/${String(mes).padStart(2,'0')}/2026 — ${desc}`;button.setAttribute('aria-label',button.title);button.onclick=()=>document.getElementById('dataSelecionada').textContent=button.title;td.append(button);}row.append(td);}body.append(row);}table.append(body);article.append(h,table);document.getElementById('meses').append(article);}
for(const [key,titulo,datas]of tipos){const p=n('p'),cor=n('span');cor.className='cor '+key;cor.setAttribute('aria-hidden','true');p.append(cor,n('strong',titulo+': '),document.createTextNode(datas));document.getElementById('legenda').append(p);}
document.getElementById('imprimir').onclick=()=>window.print();
})();
