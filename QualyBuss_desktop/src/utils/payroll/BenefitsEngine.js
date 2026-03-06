/**
 * ARTIFACT: Motor de Cálculo de Benefícios (BenefitsEngine)
 */

export const BenefitsEngine = {
    /**
     * Calcula custos de benefícios
     * @param {number} grossSalary Salário Bruto
     * @param {Array} benefits Lista de Benefícios Ativos [{type, value, cost_type, coparticiaption...}]
     */
    calculateBenefits(grossSalary, benefits) {
        let totalDeduction = 0; // Parte do funcionário
        let totalCompanyCost = 0; // Parte da empresa

        const details = benefits.map(b => {
            let fullValue = 0;

            // 1. Calcular Valor Cheio do Benefício
            if (b.cost_type === 'FIXED') {
                fullValue = Number(b.value);
            } else if (b.cost_type === 'PERCENTAGE') {
                fullValue = grossSalary * b.value; // Ex: 0.06 (6%)
            }

            // 2. Calcular Coparticipação (Desconto)
            // Se coparticipation for > 0, é a % do valor do benefício que o funcionário paga?
            // OU é a % do salário? Depende da regra.
            // Padrão Geral: VT é 6% do salário (Limitado ao custo). VR é X% do valor do VR.
            // Para simplificar MVP: 'coparticipation' é % do Valor do Benefício que o funcionário paga.

            // EXCEÇÃO VT: Se category == 'TRANSPORT', regra de negócio Brasil:
            // Desconto é 6% do Salário Base, mas limitado ao valor do vale.

            let employeePay = 0;

            if (b.category === 'TRANSPORT') {
                const legalDiscount = grossSalary * 0.06;
                employeePay = Math.min(legalDiscount, fullValue);
            } else {
                // Regra Genérica: Valor * % de Copart
                employeePay = fullValue * (b.default_coparticipation || 0);
            }

            const companyPay = fullValue - employeePay;

            totalDeduction += employeePay;
            totalCompanyCost += companyPay;

            return {
                name: b.name,
                fullValue,
                employeePay,
                companyPay
            };
        });

        return {
            totalDeduction: Number(totalDeduction.toFixed(2)),
            totalCompanyCost: Number(totalCompanyCost.toFixed(2)),
            details
        };
    }
};
