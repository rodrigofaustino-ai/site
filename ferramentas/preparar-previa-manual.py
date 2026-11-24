"""Gera uma prévia navegável em um HTML único, sem servidor, login ou dados reais."""
from pathlib import Path
import base64
ROOT=Path(__file__).resolve().parents[1]
assets={p.name:'data:'+('image/svg+xml' if p.suffix=='.svg' else 'image/png')+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in (ROOT/'manual').iterdir() if p.suffix in ('.svg','.png')}
import json
css=(ROOT/'manual-uso.css').read_text()
script=(ROOT/'manual-uso.js').read_text().replace("'manual/'+item[0]","window.ManualUsoImagens[item[0]]").replace("href:'manual-uso.html'","href:'manual-previa.html'")
html=(ROOT/'manual-uso.html').read_text().replace('<link rel="stylesheet" href="manual-uso.css">','<style>'+css+'</style>').replace('<script src="manual-conteudo.js" defer></script>','').replace('<script src="manual-uso.js" defer></script>','').replace('href="index.html"','href="https://saladerecursos.netlify.app/"')
html=html.replace('</body>','<script>'+(ROOT/'manual-conteudo.js').read_text()+'\nwindow.ManualUsoImagens='+json.dumps(assets)+';\n'+script+'</script></body>')
out=ROOT/'previas/etapa-84/manual-previa.html';out.write_text(html);print(out, out.stat().st_size)
