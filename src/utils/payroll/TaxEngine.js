/**
 * ARTIFACT: Motor de Cálculo Tributário (TaxEngine)
 * Objetivo: Calcular INSS e IRRF baseados em tabelas dinâmicas (JSON).
 */

export const TaxEngine = {
    /**
     * Calcula o INSS Progressivo
     * @param {number} grossSalary Salário Bruto
     * @param {Array} brackets Tabela INSS [{limit, rate}]
     * @returns {Object} { value, effectiveRate }
     */
    calculateINSS(grossSalary, brackets) {
        if (!brackets || brackets.length === 0) {
            return { value: 0, effectiveRate: 0 };
        }

        let remainingSalary = grossSalary;
        let totalTax = 0;
        let previousLimit = 0;

        // Sort brackets by limit just in case
        const sortedBrackets = [...brackets].sort((a, b) => a.limit - b.limit);

        for (const bracket of sortedBrackets) {
            if (remainingSalary <= 0) break;

            const range = bracket.limit - previousLimit;
            const taxableAmount = Math.min(remainingSalary, Math.max(0, grossSalary - previousLimit));

            // Logic correction for progressive:
            // We calculate tax on the portion within this bracket
            // But usually the logic is: Math.min(salary, limit) - prevLimit

            const salaryInBracket = Math.min(grossSalary, bracket.limit);
            const portion = Math.max(0, salaryInBracket - previousLimit);

            totalTax += portion * bracket.rate;

            previousLimit = bracket.limit;

            if (grossSalary <= bracket.limit) break;
        }

        // Teto do INSS (Caso o salário supere a última faixa)
        // A lógica acima já cobre se a última faixa tiver limit alto ou se loopar tudo,
        // mas normalmente a última faixa é "Até X". Acima disso é Teto.
        // Se o salário for maior que o ultimo limite, a aliquota incide sobre o teto?
        // No Brasil, paga-se o Teto. O loop acima para no ultimo limit.
        // Precisa garantir que se sobrar salario alem do ultimo bracket, não cobra nada (Teto).

        return {
            value: Number(totalTax.toFixed(2)),
            effectiveRate: (totalTax / grossSalary) || 0
        };
    },

    /**
     * Calcula IRRF
     * @param {number} baseCalc Base de Cálculo (Bruto - INSS - Dependentes)
     * @param {Array} brackets Tabela IRRF [{limit, rate, deduction}]
     */
    calculateIRRF(baseCalc, brackets) {
        if (!brackets || brackets.length === 0) {
            return { value: 0, rate: 0, deduction: 0 };
        }
        if (baseCalc <= 0) return { value: 0, rate: 0, deduction: 0 };

        // Find the bracket that fits
        // IRRF não é progressivo "por pedaço" igual INSS novo, é "Aliquota cheia - Dedução"
        const sortedBrackets = [...brackets].sort((a, b) => a.limit - b.limit);

        let selectedBracket = null;

        // Find the matching bracket
        for (const bracket of sortedBrackets) {
            if (baseCalc <= bracket.limit) {
                selectedBracket = bracket;
                break;
            }
        }

        // Se estourou todas as faixas (acima da ultima), pega a ultima (que geralmente tem limit null ou muito alto)
        // Mas na nossa estrutura JSON, o ultimo deve ter limit: 9999999
        if (!selectedBracket) selectedBracket = sortedBrackets[sortedBrackets.length - 1];

        const tax = (baseCalc * selectedBracket.rate) - selectedBracket.deduction;

        return {
            value: Math.max(0, Number(tax.toFixed(2))),
            rate: selectedBracket.rate, // Alíquota da faixa
            deduction: selectedBracket.deduction
        };
    },

    /**
     * Calcula Salário Líquido Completo
     */
    calculateNetSalary(gross, dependantsCount, settings) {
        // 1. INSS
        const inss = this.calculateINSS(gross, settings.inss_brackets);

        // 2. Base IRRF
        const deductionDependants = dependantsCount * settings.dependant_deduction;
        const baseIRRF = gross - inss.value - deductionDependants;

        // 3. IRRF
        const irrf = this.calculateIRRF(baseIRRF, settings.irrf_brackets);

        // 4. Net
        const net = gross - inss.value - irrf.value;

        return {
            gross,
            inss: inss.value,
            irrf: irrf.value,
            net,
            details: {
                baseIRRF,
                deductionDependants
            }
        };
    },
    /**
     * Calcula Custo Total da Empresa
     * @param {number} grossSalary Salário Bruto
     * @param {Object} companyTaxes Taxas da empresa { fgts, provision_vacation, provision_13th, etc }
     */
    calculateCompanyCost(grossSalary, companyTaxes) {
        if (!companyTaxes) return { totalCost: grossSalary, details: {} };

        const fgts = grossSalary * (companyTaxes.fgts || 0.08);
        const provisionVacation = grossSalary * (companyTaxes.provision_vacation || 0); // Include 1/3 logic if needed, usually baked into rate
        const provision13th = grossSalary * (companyTaxes.provision_13th || 0.0833);

        // Add other taxes if present (e.g. Patronal)
        const otherTaxes = 0; // Placeholder for future expansion

        const totalBurdens = fgts + provisionVacation + provision13th + otherTaxes;

        return {
            grossSalary,
            totalCost: grossSalary + totalBurdens,
            burdens: {
                fgts,
                provisionVacation,
                provision13th,
                total: totalBurdens
            }
        };
    }
};
