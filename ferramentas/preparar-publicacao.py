"""Gera uma pasta nova e um ZIP de publicação, sem tocar em serviços remotos."""
from pathlib import Path
import argparse, datetime, hashlib, json, re, shutil, subprocess, zipfile
from zoneinfo import ZoneInfo
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Referencias(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]
    def handle_starttag(self, tag, attrs):
        for chave, valor in attrs:
            if chave in ('src','href') and valor:
                self.refs.append(valor)

def validar(pasta):
    faltantes=[]
    for arq in pasta.rglob('*'):
        if arq.suffix not in ('.html','.js','.css'): continue
        texto=arq.read_text()
        if arq.parent == pasta and 'ambienteteste-e368e' in texto:
            raise ValueError('Configuração de teste no pacote: '+arq.name)
        refs=[]
        if arq.suffix=='.html':
            parser=Referencias();parser.feed(texto);refs=parser.refs
        refs+=re.findall(r'''["']((?:vendor|modelos)/[^"']+)["']''',texto)
        for ref in refs:
            if not ref or ref.startswith(('#','data:','blob:','javascript:','mailto:','//')):continue
            if urlsplit(ref).scheme:continue
            if any(x in ref for x in ('+','{','<','\\')):continue  # fonte de HTML dinâmico, não uma URL literal
            caminho=unquote(urlsplit(ref).path)
            if not caminho:continue
            target=(pasta/caminho.lstrip('/')) if caminho.startswith('/') else arq.parent/caminho
            if not target.exists():faltantes.append((str(arq.relative_to(pasta)),ref))
    if faltantes:raise ValueError('Referências locais ausentes: '+repr(faltantes))

def main():
    p=argparse.ArgumentParser();p.add_argument('destino',type=Path);p.add_argument('zip',type=Path);p.add_argument('--etapa',type=int,default=63);args=p.parse_args()
    destino=args.destino.resolve();arquivo_zip=args.zip.resolve()
    if destino==ROOT or destino.is_relative_to(ROOT):raise ValueError('Use uma pasta nova fora do repositório de fonte.')
    if destino.exists() and any(destino.iterdir()):raise ValueError('A pasta de destino precisa estar vazia ou não existir.')
    if arquivo_zip.exists():raise ValueError('O arquivo ZIP já existe. Escolha outro nome.')
    destino.mkdir(parents=True,exist_ok=True)
    for arq in ROOT.iterdir():
        if arq.is_file() and arq.suffix in ('.html','.js','.css'):
            if arq.name.startswith('backup-documentos') or arq.name=='firebase-ambiente-teste.js':continue
            shutil.copyfile(arq,destino/arq.name)
    for nome in ('vendor','modelos'):shutil.copytree(ROOT/nome,destino/nome)
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    (destino/'LEIA-ME-PUBLICACAO.txt').write_text('''PACOTE DO SITE OFICIAL — saladerecursos.netlify.app

Inclui as melhorias acumuladas até a etapa 33.
Conexões: salamulti (Diário/PEI) e paee-3fea6 (PAEE/Diagnóstica/Relatório).
Não é uma cópia isolada de teste.
ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA
Antes de publicar esta versão, guarde as regras atuais e atualize somente as regras
DO CLOUD FIRESTORE do projeto salamulti com o arquivo completo revisado:
https://github.com/rodrigofaustino-ai/site/blob/melhorias/etapa-37-questionario-opcional/producao/salamulti.rules
Não altere o projeto paee-3fea6, Storage ou Realtime Database nesta etapa.
As regras são preparadas no código; a publicação delas no Firebase é manual.

PARA PUBLICAR
1. Guarde o endereço/identificador do deploy oficial atual para eventual retorno.
2. Extraia o ZIP inteiro. Abra a pasta que contém index.html, vendor e modelos.
3. No Netlify, abra o site saladerecursos, endereço saladerecursos.netlify.app.
4. Em Deploys, arraste essa pasta inteira. Não arraste somente index.html.
5. Aguarde Published e atualize o site com Ctrl + Shift + R.
6. Confira com sua conta e outra conta de professor: alunos, documentos antigos,
   atendimentos, frequência, arquivamento/reativação, Meu dia e exportação.
7. Em uma ficha de aluno fictício, abra Questionário da família, gere e copie um
   link. Abra-o em janela anônima/celular, responda e envie. Retorne ao professor e
   clique em Atualizar respostas para conferir o relato e os itens correspondentes.
   Confira também a desativação do link. Não use dados reais nesse teste.
8. Confira o aviso no primeiro Continuar com perguntas em branco e a confirmação
   no segundo clique. Ao enviar, os campos pulados ficam como Sem resposta.
9. No botão Exportar Documentos, selecione Questionário da família e confira um
   DOCX/ODT com as respostas salvas. Se houver várias, escolha a versão desejada.
10. Na aba Alunos, mude a data do encontro e confira o quadro Agenda do Dia, no turno
    escolhido. A edição do conteúdo continua na aba Planner.
11. No chat, use 📎 com um arquivo fictício de até 10 MB e clique em Enviar.
    Confira prévia/download com outra conta e Apagar pelo autor.

DOCUMENTOS DOS PROFESSORES
Exportar Documentos oferece DOCX/ODT individuais por padrão. ZIP é opcional.
A associação de documentos antigos únicos pelo nome ocorre na primeira abertura:
ela grava apenas alunoId, sem exigir Salvar e sem alterar o texto do documento.

ASSINATURAS
No Relatório, o nome da coordenação fica na seção Identificação. Preencha e salve
para o nome aparecer também na exportação em lote. PEI e Relatório reservam
espaço para assinatura e centralizam linha, nome e cargo, sem quadro de bordas.

OBSERVAÇÕES
Os backups de dados e arquivos devem ser guardados separadamente. Este ZIP contém
somente o código do site e seus recursos estáticos; não contém registros do banco.
A transferência administrativa permanece temporariamente bloqueada.
Uma reversão de deploy retorna o código, mas não desfaz gravações feitas no banco.
Os testes foram locais, com dados fictícios; não validam credenciais reais, índices,
serviços externos de IA ou a configuração remota atual de todos os serviços.
'''.replace('etapa 33','etapa '+str(args.etapa)))
    if args.etapa in (38,39):
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 38 — AJUSTE VISUAL\nEsta etapa mantém as regras da etapa 37. Se ela já está publicada e funcionando,\nnão é necessário alterar Firebase. Publique somente este pacote no Netlify.\nA Agenda do Dia fica no topo; a conferência de frequência fica oculta.\n\n"+texto[fim:]
        guia.write_text(texto.replace('ETAPA 38 — AJUSTE VISUAL','ETAPA '+str(args.etapa)+' — AJUSTE VISUAL'))
    if args.etapa == 40:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 40 — ANEXOS NO CHAT\nAntes do Netlify, atualize as duas regras do projeto salamulti:\nFirestore: https://github.com/rodrigofaustino-ai/site/blob/melhorias/etapa-40-chat-anexos/producao/salamulti.rules\nStorage: https://github.com/rodrigofaustino-ai/site/blob/melhorias/etapa-40-chat-anexos/producao/salamulti-storage.rules\nO Storage mantém as permissões de planos de aula fornecidas pelo usuário.\nSe o Console pedir habilitar a consulta ao Firestore pelas regras do Storage,\nsiga a autorização apresentada. Não altere Realtime Database ou paee-3fea6.\n\n"+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 41:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 41 — AVISOS E MENSAGENS AOS PROFESSORES\nAntes do Netlify, atualize as regras completas do Firestore no projeto salamulti:\nhttps://github.com/rodrigofaustino-ai/site/blob/melhorias/etapa-41-avisos-mensagens/producao/salamulti.rules\nEsta atualização preserva as regras do chat com anexos da etapa 40.\nMantenha Storage e Realtime Database como já estão publicados.\nOs botões exclusivos de rodrigofaustino@gmail.com ficam depois de Exportar Documentos.\nAvisos pedem Entendi; Mensagens têm Fechar. A conclusão fica salva por conta.\n\n"+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 42:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 42 — IMAGENS EM AVISOS E MENSAGENS\nAntes do Netlify, atualize as duas regras completas do projeto salamulti:\nFirestore: https://github.com/rodrigofaustino-ai/site/blob/melhorias/etapa-42-imagens-comunicados/producao/salamulti.rules\nStorage: https://github.com/rodrigofaustino-ai/site/blob/melhorias/etapa-42-imagens-comunicados/producao/salamulti-storage.rules\nNo Storage, use o bucket salamulti.firebasestorage.app. As permissões de planos e chat são preservadas.\nSe o Console pedir habilitar acesso ao Firestore pelas regras do Storage, siga a autorização apresentada.\nNão altere Realtime Database nem paee-3fea6.\nNa conta rodrigofaustino@gmail.com, abra Avisos aos professores ou Mensagens.\nPreencha título e texto ou imagem. Uma imagem JPG, PNG, GIF ou WEBP de até 10 MB.\nConfira a prévia e publique. Avisos mantêm Entendi; Mensagens mantêm Fechar.\n\n"+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 43:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 43 — EXPORTAR HISTÓRICO DE ATENDIMENTOS\nEsta etapa acrescenta Histórico de atendimentos em Exportar Documentos.\nEscolha DOCX ou ODT e um ou mais alunos; ZIP continua opcional.\nInclui todos os atendimentos salvos, sem aplicar os filtros da ficha.\nNão requer alteração nas regras do Firebase. Mantenha as regras da etapa 42.\nPublique somente este pacote completo no Netlify.\n\n"+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 44:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 44 — FORMATAÇÃO DO HISTÓRICO\nExportar Documentos usa o mesmo gerador DOCX do perfil do aluno.\nMantém cabeçalho, tabelas verdes, fonte, margens, borda da página e assinaturas.\nODT preserva o layout a partir desse DOCX, sem conversão por HTML simplificado.\nNão requer alteração nas regras do Firebase. Mantenha as regras já publicadas.\nPublique somente este pacote completo no Netlify.\n\n"+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 45:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+"ETAPA 45 — MELHORAR CAMPOS COM IA\nAmplia a revisão de texto para os campos de redação das áreas dos professores.\nInclui planner, notas, metas, próximo passo, roteiro, observações da Diagnóstica, descrições e comunicação.\nPreserva os controles já existentes do relato e do PEI, sem duplicação.\nNão inclui nomes, datas, telefones, endereços, assinaturas, buscas ou códigos.\nO questionário das famílias permanece sem IA, conforme escolha do usuário.\nClique em Melhorar com IA, confira a prévia e escolha Aplicar sugestão ou Manter meu texto.\nSomente o campo solicitado é enviado ao serviço de IA já usado pelo site.\nNão requer alteração nas regras do Firebase. Publique somente este pacote completo no Netlify.\n\n"+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 46:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 46 — REFORMULAÇÃO COM IA EM NOTAS E PLANNER\nReforça o pedido de outra redação, mantendo os fatos do texto original.\nSe houver repetição, a segunda rodada inclui a resposta anterior e pede outra construção.\nCópias com apenas pontuação, maiúsculas, rótulos ou formatação não são oferecidas como nova sugestão.\nO original fica em Ver texto original para comparar. A nova redação aparece em área separada.\nOs testes locais usam IA simulada. Após publicar, confira uma nota e um dia do planner com o serviço real.\nNão precisa alterar Firebase. Publique somente este pacote completo no Netlify.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 47:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 47 — FREQUÊNCIA NO HISTÓRICO E REFORMULAÇÃO DA IA\nInclui Atendimentos previstos e Faltas abaixo de Laudo/Diagnóstico e CID.\nUsa todo o histórico salvo de frequência, em todos os turnos: previstos = P + F + J, faltas = F.\nSem atendimento pedagógico e campos vazios ficam fora. As observações no documento explicam registros antigos.\nA mesma linha aparece na ficha e em Exportar Documentos, preservando a formatação.\nInclui a correção da etapa 46 para a IA de notas e planner, sem aceitar cópias como nova redação.\nOs testes da IA são locais e simulados; após publicar, confira a resposta real em uma nota e no planner.\nNão precisa alterar Firebase. Publique este pacote completo no Netlify, aguarde Published e use Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 48:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 48 — PADRÃO ÚNICO PARA MELHORAR TEXTOS COM IA\nRelato do Diário, PEI e demais campos dos professores usam o mesmo mecanismo de revisão.\nA regra de reformulação, a detecção de cópias e a segunda tentativa são compartilhadas.\nNada é aplicado sem a escolha do professor. Nomes/dados pessoais e questionário das famílias continuam excluídos.\nPreserva os controles e telas existentes. Os totais de frequência do histórico da etapa 47 estão incluídos.\nOs testes usam IA simulada: confira a resposta real após publicar.\nNão precisa alterar Firebase. Publique este pacote completo no Netlify, aguarde Published e use Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 49:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 49 — EXCLUIR VERSÕES ANTERIORES DO PEI\nEm Documentos anteriores e versões salvas, cada versão anterior tem Visualizar e Excluir.\nA exclusão pede confirmação e apaga somente a versão escolhida. O PEI atual e o rascunho são mantidos.\nO documento atual, inclusive importado, não pode ser excluído por esse botão.\nNão precisa alterar as regras do Firebase. Publique este pacote completo no Netlify.\nAguarde Published e atualize com Ctrl + Shift + R. As melhorias anteriores estão incluídas.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 50:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 50 — AÇÕES DA LISTA DE PEI\nA lista de PEIs atuais salvos oferece Editar, Exportar DOCX, Exportar ODT e Excluir PEI.\nExcluir remove somente o PEI atual escolhido, após confirmação. Cadastro, outros documentos e versões anteriores permanecem.\nUse Todos os alunos do Diário para preencher um novo PEI ou consultar versões anteriores.\nNão precisa alterar regras do Firebase. As melhorias anteriores estão incluídas.\nPublique a pasta completa no Netlify, aguarde Published e atualize com Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 51:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 51 — LISTA DO PEI COMO OS DEMAIS FORMULÁRIOS\nAbre com todos os alunos em atendimento e separa os arquivados do Diário.\nCartões com Editar e, quando há PEI salvo, botão de exportação DOCX/ODT e lixeira.\nA lixeira exclui somente o PEI atual, preservando o cadastro e as versões anteriores.\nA lista é atualizada ao retornar à janela ou trocar o filtro. Cadastros excluídos não são listados.\nPacote cumulativo. Não precisa alterar Firebase. Publique a pasta completa no Netlify e atualize com Ctrl + Shift + R após Published.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 52:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 52 — LISTA DE DOCUMENTOS PEI\nA lista principal mostra somente PEIs salvos, como PAEE, Diagnóstica e Relatório.\nCadastros sem PEI não aparecem como cartões. Excluir PEI remove o documento atual e seu cartão.\nNovo PEI / Consultar histórico abre a seleção de aluno para preencher ou consultar versões anteriores.\nExcluir PEI preserva o cadastro no Diário e outros documentos.\nPacote cumulativo. Sem mudanças no Firebase. Publique a pasta completa no Netlify, aguarde Published e atualize com Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 53:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 53 — HISTÓRICO ANUAL E FALTAS MANUAIS\nAtendimentos previstos corresponde ao número de registros do histórico exportado.\nConsidera somente o ano vigente, de janeiro até o último atendimento registrado até a emissão.\nFaltas são informadas manualmente na ficha do aluno, no campo Faltas no histórico — ano vigente.\nSalve a ficha para usar o valor em Exportar Documentos. Em branco, sai uma linha para preencher.\nNão usa marcações da Frequência para esses totais. Não altera registros antigos.\nPacote cumulativo. Sem atualização de regras Firebase. Publique no Netlify, aguarde Published e atualize com Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 54:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 54 — BIBLIOTECA DE ASSINATURAS E PEI\nPrimeira etapa: cadastro privado de imagens e inserção explícita nas três assinaturas do PEI.\nA imagem fica incorporada no documento salvo e nos arquivos DOCX/ODT.\nExcluir da biblioteca não apaga as cópias já inseridas. Remover imagem no PEI mantém espaço para assinatura manual.\nANTES de usar a biblioteca no site publicado, acrescente as regras de producao/assinaturas-biblioteca-acrescimo.rules às regras existentes de salamulti.\nA alteração das regras e a publicação NÃO foram executadas. O usuário optou por acumular melhorias.\nOs demais formulários ainda não têm seletor de imagens nesta etapa.\nPacote cumulativo; publique somente quando desejar, após conferir as permissões pendentes.\n\n'+texto[fim:]
        guia.write_text(texto)
    if args.etapa == 55:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 55 — ASSINATURAS EM TODOS OS DOCUMENTOS\nPacote completo: inclui as melhorias anteriores, biblioteca e assinaturas do PEI, PAEE, Diagnóstica, Relatório e Histórico.\nA biblioteca é única e privada na conta do Diário. Nos formulários, entre na janela com a conta do Diário se solicitado.\nA imagem escolhida entra apenas no local selecionado; salve o documento normalmente.\nDOCX e ODT incorporam as imagens; sem imagem, permanece espaço para assinar à mão.\nANTES DA PUBLICAÇÃO: leia PERMISSOES-ASSINATURAS-FIRESTORE.txt e acrescente o bloco nas regras EXISTENTES de salamulti.\nNão altere paee-3fea6, Storage ou Realtime Database para esta melhoria.\nDepois, publique a pasta completa no Netlify, aguarde Published e use Ctrl + Shift + R.\nO assistente NÃO aplicou regras nem publicou no Netlify.\n\n'+texto[fim:]
        guia.write_text(texto)
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text((ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text())
    if args.etapa == 56:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 56 — PESSOAS ADICIONAIS PARA ASSINAR\nEm PEI, PAEE, Diagnóstica, Relatório e Histórico, use Outras pessoas que assinam → Adicionar pessoa para assinar.\nPreencha nome e cargo/função. A imagem é opcional; sem imagem, o documento mantém espaço para assinatura manual.\nPermite incluir pedagoga, direção, pais e outros responsáveis, preservando os campos originais.\nSalve cada documento ou a ficha do Histórico para incluir também nas exportações pela lista e por Exportar Documentos.\nAs assinaturas adicionais são próprias de cada documento. Excluir uma pessoa deste preenchimento não apaga a biblioteca.\nNÃO há novas regras de Firebase nesta etapa. Se as permissões da etapa 55 já foram publicadas, não precisa atualizá-las novamente.\nPacote cumulativo com todas as melhorias anteriores. Publique a pasta completa no Netlify, aguarde Published e use Ctrl + Shift + R.\nO assistente não publicou no Netlify nem alterou dados reais.\n\n'+texto[fim:]
        guia.write_text(texto)
        nota='ETAPA 56: se as permissões de assinaturas da etapa 55 já foram publicadas, NÃO precisa alterar o Firebase novamente. O guia abaixo é mantido apenas para quem ainda não habilitou a biblioteca.\n\n'
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text(nota+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text().replace('etapa 55.','etapa 56.'))
    if args.etapa == 57:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 57 — CAMPOS DE ASSINATURA PADRONIZADOS\nToda pessoa adicionada em PEI, PAEE, Diagnóstica, Relatório e Histórico usa nome e cargo lado a lado, botões de imagem e prévia abaixo do nome.\nO Relatório não tem mais o bloco fixo de coordenação nem o campo separado de coordenação na Identificação.\nA coordenação preenchida nos relatórios antigos é preservada na lista de pessoas com nome, cargo e imagem, sem duplicar assinaturas.\nSalve normalmente para confirmar a atualização do documento. Nenhuma conversão foi gravada automaticamente no banco.\nSem nova alteração de Firebase. As permissões de assinaturas já publicadas continuam suficientes.\nPacote cumulativo: inclui todas as melhorias anteriores. Publique a pasta completa no Netlify, aguarde Published e use Ctrl + Shift + R.\nO assistente não publicou no Netlify nem alterou dados reais.\n\n'+texto[fim:]
        guia.write_text(texto)
        nota='ETAPA 57: não há nova alteração de Firebase para quem já publicou as permissões das assinaturas. O guia abaixo é apenas para quem ainda não habilitou a biblioteca.\n\n'
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text(nota+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text().replace('etapa 55.','etapa 57.'))
    if args.etapa == 58:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 58 — AVISO DE NOVA MENSAGEM NO CHAT\nAviso pequeno no canto inferior esquerdo, com autor e trecho da nova mensagem. Fecha após 3 segundos; clicar abre o chat.\nAvisa mensagens de outras pessoas enquanto você usa o site, com o chat fechado ou lendo mensagens anteriores.\nNão avisa histórico inicial, mensagens próprias, edições, exclusões ou repetição da conexão. Se já estiver vendo o fim da conversa, não repete o aviso.\nMensagens em sequência são agrupadas, reiniciando os 3 segundos a partir da última chegada.\nO aviso não marca a mensagem como lida. Anexos são indicados pelo nome do arquivo.\nSem novas regras de Firebase. Inclui as assinaturas padronizadas e todas as melhorias anteriores.\nPublique a pasta completa no Netlify, aguarde Published e use Ctrl + Shift + R. O assistente não publicou no Netlify.\n\n'+texto[fim:]
        guia.write_text(texto)
        nota='ETAPA 58: não há nova alteração de Firebase. Quem já publicou as permissões das assinaturas não precisa repeti-las. O guia abaixo é apenas para quem ainda não habilitou a biblioteca.\n\n'
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text(nota+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text().replace('etapa 55.','etapa 58.'))
    if args.etapa == 59:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 59 — NOTIFICAÇÕES DO NAVEGADOR\nNo chat, clique em 🔔 → Ativar notificações → Permitir. Cada professor ativa para sua conta e navegador.\nAvisa novas mensagens em outra aba ou programa enquanto o Diário permanecer aberto, conectado e com sessão ativa.\nNão envia notificações com o site ou navegador fechado. A duração do aviso é controlada pelo navegador e sistema.\nO aviso externo não mostra nomes nem texto da conversa; clicar abre o chat. No site, permanece o aviso de 3 segundos.\nNão requer novas regras de Firebase. Pacote cumulativo com todas as melhorias anteriores.\nPublique a pasta completa no Netlify, aguarde Published e use Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text('ETAPA 59: nenhuma nova regra de Firebase. Guia apenas para quem ainda não habilitou a biblioteca.\n\n'+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text())
    if args.etapa == 60:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 60 — TOTAIS DO ALUNO E ATALHOS DE FALTA\nNa identificação, ao lado do turno, consulte Atendimentos previstos/ofertados, Faltas (F) e Justificadas (J).\nO total ofertado corresponde aos relatos salvos, inclusive faltas e justificadas. F/J são contados por data na Frequência, em todos os turnos.\nUse Selecionar período para aplicar duas datas ou voltar a Todo o histórico. Atualizar faltas refaz a consulta.\nAo lado do título do relato, Falta e Falta justificada preenchem o texto, sem salvar automaticamente. Atendimento desmarca o tipo sem apagar o texto.\nAo salvar F/J, o relato e a Frequência são gravados juntos. Semana ausente, sobreposta ou alterada exige conferência antes de salvar.\nTexto existente e marcação diferente pedem confirmação para substituir. Não altera relatos antigos nem a regra das exportações.\nInclui notificações do navegador: Chat → sino → Ativar notificações → Permitir. O Diário precisa permanecer aberto e conectado.\nNão requer novas regras de Firebase. Pacote cumulativo com todas as melhorias anteriores.\nPublique a pasta completa no Netlify, aguarde Published e use Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text('ETAPA 60: nenhuma nova regra de Firebase. Guia apenas para quem ainda não habilitou a biblioteca.\n\n'+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text())
    if args.etapa == 61:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 61 — FJ E HISTÓRICO AUTOMÁTICO NA AGENDA\nAlunos do Dia e Frequência usam P = Presente, F = Falta e FJ = Falta justificada. Sem atendimento pedagógico permanece.\nFJ substitui visualmente o antigo J; os dados existentes são preservados.\nNa agenda, F/FJ gravam a Frequência e um relato de ausência na data selecionada, em uma única transação.\nCliques repetidos e dois horários no mesmo dia não duplicam o registro automático. A ficha usa o mesmo registro de ausência.\nCorrigir F para FJ atualiza esse registro; P/SAP podem removê-lo após confirmação. Relatos com texto próprio são protegidos.\nMantém os totais previstos/ofertados com faltas incluídas, o filtro por período, assinaturas e notificações do navegador.\nNão requer novas regras de Firebase. Pacote cumulativo com todas as melhorias anteriores.\nExtraia o ZIP, publique a pasta que contém index.html no Netlify, aguarde Published e use Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text('ETAPA 61: nenhuma nova regra de Firebase. Guia apenas para quem ainda não habilitou a biblioteca.\n\n'+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text())
    if args.etapa == 62:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 62 — FICHA COMPACTA E UNIFICADA\nIdentificação, escola e horários vêm antes da Visão geral, no mesmo bloco.\nEspaços entre títulos, campos e informações foram reduzidos; o celular preserva campos maiores para toque.\nA mensagem de cadastro arquivado foi removida desta tela. O arquivamento e os dados permanecem preservados.\nInclui P/F/FJ, histórico automático das ausências pela agenda, totais por período e todas as melhorias anteriores.\nInclui popup do chat de 3 segundos e notificações do navegador: Chat → sino → Ativar notificações → Permitir.\nNotificações externas exigem Diário aberto, autenticado e conectado.\nNão requer novas regras de Firebase.\nExtraia o ZIP e publique a pasta que contém index.html no Netlify. Aguarde Published e use Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text('ETAPA 62: nenhuma nova regra de Firebase. Guia apenas para quem ainda não habilitou a biblioteca.\n\n'+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text())
    if args.etapa == 63:
        guia=destino/'LEIA-ME-PUBLICACAO.txt'
        texto=guia.read_text()
        inicio=texto.index('ATENÇÃO — QUESTIONÁRIO DA FAMÍLIA')
        fim=texto.index('PARA PUBLICAR',inicio)
        texto=texto[:inicio]+'ETAPA 63 — MENU LATERAL DA FICHA\nO menu Nesta ficha oferece atalhos locais para identificação, escola, horários, visão geral, metas, laudo, responsáveis, registro, assinaturas e histórico.\nNo computador acompanha a rolagem; no celular abre e recolhe sem cobrir os campos.\nNavegar pelo menu não salva, troca de aluno nem apaga o rascunho.\nPacote cumulativo: ficha compacta, P/F/FJ, histórico automático das faltas, totais por período e avisos do chat estão incluídos.\nNotificações do navegador continuam exigindo ativação no sino do chat e Diário aberto e conectado.\nSem novas regras de Firebase. Publique a pasta completa com index.html no Netlify, aguarde Published e atualize com Ctrl + Shift + R.\n\n'+texto[fim:]
        guia.write_text(texto)
        (destino/'PERMISSOES-ASSINATURAS-FIRESTORE.txt').write_text('ETAPA 63: nenhuma nova regra de Firebase. Guia apenas para quem ainda não habilitou a biblioteca.\n\n'+(ROOT/'producao'/'GUIA-ASSINATURAS-FIRESTORE.txt').read_text())
    guia=destino/'LEIA-ME-PUBLICACAO.txt'
    guia.write_text(guia.read_text().replace('até a etapa 33.',f'até a etapa {args.etapa}.'))
    if args.etapa >= 57:
        texto=guia.read_text()
        inicio=texto.index('ASSINATURAS\n',texto.index('DOCUMENTOS DOS PROFESSORES'))
        fim=texto.index('OBSERVAÇÕES',inicio)
        texto=texto[:inicio]+'ASSINATURAS\nUse Adicionar pessoa para assinar nos cinco documentos. No Relatório, coordenação e demais responsáveis ficam na lista de pessoas, sem campo fixo separado na Identificação. Nomes e imagens antigos são preservados ao abrir; salve para confirmar.\n\n'+texto[fim:]
        guia.write_text(texto)
    validar(destino)
    files={str(f.relative_to(destino)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(destino.rglob('*')) if f.is_file()}
    manifest={'versao':'etapa-'+str(args.etapa),'site':'https://saladerecursos.netlify.app/','commit_fonte':commit,'preparado_em':datetime.datetime.now(ZoneInfo('America/Sao_Paulo')).date().isoformat(),'arquivos_sha256':files}
    (destino/'PUBLICACAO.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    with zipfile.ZipFile(arquivo_zip,'w',zipfile.ZIP_DEFLATED) as z:
        for arq in sorted(destino.rglob('*')):
            if arq.is_file():z.write(arq,Path('publicar-netlify')/arq.relative_to(destino))
    with zipfile.ZipFile(arquivo_zip) as z:
        if z.testzip():raise ValueError('Falha de integridade do ZIP.')
        for ref,digest in files.items():
            if hashlib.sha256(z.read('publicar-netlify/'+ref)).hexdigest()!=digest:raise ValueError('Arquivo divergente no ZIP: '+ref)
    print(json.dumps({'pasta':str(destino),'zip':str(arquivo_zip),'arquivos':len(files)+1,'bytes':arquivo_zip.stat().st_size,'sha256_zip':hashlib.sha256(arquivo_zip.read_bytes()).hexdigest()},indent=2))

if __name__=='__main__':main()
