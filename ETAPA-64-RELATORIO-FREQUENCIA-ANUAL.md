# Frequência anual no Relatório

O botão em Identificação consulta a Frequência de salamulti pela conta do Diário e preenche previstos (P+F+FJ+SAP) e realizados (P). Considera as datas de janeiro a dezembro do ano vigente no fuso America/Sao_Paulo. Não conta relatos, grade prevista ou campos sem marcação.

Uma marcação por aluno/data, em todos os turnos: duplicatas iguais não duplicam; marcações conflitantes bloqueiam a consulta para revisão. Registros semanais antigos, dias desconhecidos e semanas sem data válida são excluídos e informados. Semanas nas viradas do ano são tratadas pela data do dia, não pelo início da semana.

A consulta usa iframe da mesma origem, sessão padrão do Diário, confirmação de e-mail igual ao da sessão do Relatório e verificação de proprietário do aluno pelo ID. Projetos e UIDs diferentes não são misturados. Se necessário, o professor entra na conta do Diário; a senha não é transmitida à página do Relatório. Mensagens validam origem, janela e token; troca de conta, estado ou aluno invalida o resultado.

Não consulta nem salva automaticamente. Valores existentes pedem confirmação; edição durante a consulta impede substituição. O professor salva normalmente. As exportações usam os campos salvos, inclusive zero. Outras contagens/documentos não mudam. Não exige novas regras Firebase.

Testes locais: fórmulas, viradas de ano, duplicatas/conflitos, projetos com UIDs distintos e mesmo e-mail, iframe, valores, salvamento explícito, confirmação, mensagem forjada e aluno inexistente. Os testes usam Firebase simulado.
