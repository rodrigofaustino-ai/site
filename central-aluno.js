/* Visão de leitura: usa o perfil e os registros já carregados pelo Diário. */
(() => {
  'use strict';
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function button(text, action, disabled = false, primary = false) {
    const element = node('button', 'central-btn' + (primary ? ' central-btn-primary' : ''), text);
    element.type = 'button'; element.disabled = disabled;
    element.addEventListener('click', action);
    return element;
  }
  function date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 'Data não informada';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  function render({alunoId, perfil = {}, registros = [], status = 'carregando', navegar, documento}) {
    const root = document.getElementById('centralAluno');
    if (!root) return;
    root.replaceChildren();
    const title = node('h2', '', 'Visão geral do aluno');
    title.id = 'centralAlunoTitulo'; root.setAttribute('aria-labelledby', title.id);
    root.append(title, node('p', 'central-subtitle', alunoId
      ? 'Dados principais, documentos e últimos atendimentos em um só lugar.'
      : 'Comece pelo cadastro abaixo. Depois de salvar, os documentos deste aluno ficam disponíveis aqui.'));
    const fatos = node('div', 'central-facts');
    const completos = registros.filter(r => r.date).slice().sort((a, b) => b.date.localeCompare(a.date));
    for (const [label, value] of [
      ['Escola', perfil.escola || 'Não informada'],
      ['Turma / série', perfil.turma || 'Não informada'],
      ['Turno na SRM', perfil.turno || 'Ambos os turnos'],
      ['Atendimentos registrados', status === 'pronto' ? String(registros.length) : status === 'erro' ? 'Indisponível' : alunoId ? 'Carregando…' : '—']
    ]) {
      const fact = node('div', 'central-fact');
      fact.append(node('span', 'central-label', label), node('span', 'central-value', value)); fatos.append(fact);
    }
    root.append(fatos);
    const actions = node('div', 'central-actions');
    actions.append(button('Registrar atendimento', () => navegar('atendimento'), !alunoId, true),
      button('Editar cadastro', () => navegar('cadastro')),
      button('Ver histórico completo', () => navegar('historico'), !alunoId));
    root.append(actions, node('h3', '', 'Documentos do aluno'));
    const docs = node('div', 'central-docs');
    for (const [tipo, titulo, descricao, acao] of [
      ['paee', 'PAEE', 'Plano de Atendimento Educacional Especializado.', 'Abrir PAEE'],
      ['pei', 'PEI', 'Consulte ou envie o plano em DOCX na biblioteca de PEI.', 'Ver / enviar PEI'],
      ['relatorio', 'Relatório', 'Registre as áreas trabalhadas e o parecer do atendimento.', 'Abrir relatório'],
      ['diagnostica', 'Diagnóstica', 'Consulte e preencha a avaliação pedagógica.', 'Abrir diagnóstica']
    ]) {
      const card = node('div', 'central-doc');
      card.append(node('strong', '', titulo), node('p', '', descricao), button(acao, () => documento(tipo), !alunoId));
      docs.append(card);
    }
    root.append(docs);
    const columns = node('div', 'central-columns');
    const recent = node('section', 'central-box'); recent.append(node('h3', '', 'Últimos atendimentos'));
    if (status !== 'pronto' || !registros.length) {
      const message = !alunoId ? 'Salve o cadastro para começar os registros.' : status === 'erro'
        ? 'Não foi possível carregar o histórico. Reabra o aluno para tentar novamente.'
        : status === 'carregando' ? 'Carregando atendimentos…' : 'Nenhum atendimento registrado ainda.';
      const text = node('p', 'central-empty' + (status === 'erro' ? ' central-error' : ''), message);
      text.setAttribute('role', 'status'); recent.append(text);
    } else {
      const list = node('ol', 'central-records');
      for (const record of completos.concat(registros.filter(r => !r.date)).slice(0, 3)) {
        const item = node('li'); const time = node('time', '', date(record.date));
        if (/^\d{4}-\d{2}-\d{2}$/.test(record.date || '')) time.dateTime = record.date;
        const text = String(record.text || 'Sem relato preenchido.');
        item.append(time, node('p', '', text.length > 220 ? text.slice(0, 220) + '…' : text)); list.append(item);
      }
      recent.append(list);
    }
    const review = node('section', 'central-box'); review.append(node('h3', '', 'Para conferir no cadastro'));
    const items = [];
    if (!perfil.escola) items.push('Informar a escola do aluno.');
    if (!perfil.turma) items.push('Informar a turma ou série.');
    if (!(perfil.atendimentos || []).some(a => a.dia && a.horario)) items.push('Definir os dias e horários de atendimento.');
    if (alunoId && status === 'pronto' && !registros.length) items.push('Registrar o primeiro atendimento.');
    if (!alunoId) items.unshift('Salvar o cadastro do novo aluno.');
    if (items.length) {
      const list = node('ul', 'central-checks'); items.forEach(text => list.append(node('li', '', text))); review.append(list);
    } else review.append(node('p', 'central-empty', 'Os dados básicos de escola, turma e horários estão preenchidos.'));
    review.append(node('p', 'central-note', 'Esta conferência considera apenas o cadastro. Abra cada documento para consultar seu conteúdo; a presença dos atalhos não indica que os planos estejam preenchidos ou aprovados.'));
    columns.append(recent, review); root.append(columns);
  }
  window.CentralAluno = {render};
})();
