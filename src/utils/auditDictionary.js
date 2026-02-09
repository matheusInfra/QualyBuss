export const AUDIT_Dictionary = {
    tables: {
        'leave_requests': 'Solicitação de Férias/Folga',
        'absence_transactions': 'Banco de Horas',
        'collaborators': 'Cadastro de Colaborador'
    },
    columns: {
        'status': 'Status',
        'start_date': 'Data de Início',
        'end_date': 'Data de Término',
        'reason': 'Motivo',
        'type': 'Tipo',
        'days_count': 'Quantidade de Dias',
        'full_name': 'Nome Completo',
        'job_title': 'Cargo',
        'admission_date': 'Data de Admissão',
        'balance_minutes': 'Saldo (Minutos)',
        'amount': 'Quantidade'
    },
    values: {
        'PENDING': 'Pendente',
        'APPROVED': 'Aprovado',
        'REJECTED': 'Reprovado',
        'CANCELLED': 'Cancelado',
        'FERIAS': 'Férias',
        'FOLGA': 'Folga',
        'LICENCA': 'Licença',
        'CREDIT': 'Crédito',
        'DEBIT': 'Débito'
    }
};

export const formatChange = (key, oldValue, newValue) => {
    const label = AUDIT_Dictionary.columns[key] || key;
    const oldVal = AUDIT_Dictionary.values[oldValue] || oldValue || '(Vazio)';
    const newVal = AUDIT_Dictionary.values[newValue] || newValue || '(Vazio)';

    return {
        label,
        text: `${oldVal} ➝ ${newVal}`
    };
};
