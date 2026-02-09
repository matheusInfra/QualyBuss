export const validators = {
    // Valida CPF (Algoritmo oficial)
    cpf: (value) => {
        const cpf = value?.replace(/[^\d]+/g, '');
        if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++)
            soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);

        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++)
            soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);

        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    },

    // Valida RG (Lógica simples de tamanho e formato)
    rg: (value) => {
        if (!value) return true; // RG pode ser opcional ou vazio dependendo da regra, aqui validamos apenas se preenchido
        const rg = value.replace(/[^\d]+/g, '');
        return rg.length >= 7; // RGs variam, mas geralmente tem pelo menos 7 dígitos
    },

    // Valida CBO (CBO 2002 - 6 dígitos)
    cbo: (value) => {
        if (!value) return true;
        const cbo = value.replace(/[^\d]+/g, '');
        return cbo.length === 6;
    },

    // Valida PIS/PASEP (Opcional por enquanto, mas mantendo a lógica se precisar)
    pis: (value) => {
        if (!value) return true;
        const pis = value.replace(/[^\d]+/g, '');
        if (pis.length !== 11) return false;

        // Algoritmo PIS (simples, apenas length check é comum se não precisar de rigor extremo)
        // Para validação completa:
        let soma = 0;
        let peso = 3;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(pis.charAt(i)) * peso;
            peso--;
            if (peso === 1) peso = 9;
        }
        const resto = 11 - (soma % 11);
        const digito = resto > 9 ? 0 : resto;
        return digito === parseInt(pis.charAt(10));
    }
};
