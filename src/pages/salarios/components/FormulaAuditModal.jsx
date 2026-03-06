import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, CalculatorIcon } from '@heroicons/react/24/outline';

const FormulaAuditModal = ({ isOpen, onClose }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[85vh]">

                            {/* Header */}
                            <div className="px-6 py-4 bg-slate-900 flex justify-between items-center sticky top-0 z-10">
                                <Dialog.Title as="h3" className="text-lg font-bold text-white flex items-center gap-2">
                                    <CalculatorIcon className="w-5 h-5 text-indigo-400" />
                                    Auditoria de Fórmulas e Cálculos
                                </Dialog.Title>
                                <button onClick={onClose} className="text-slate-400 hover:text-white">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-8 bg-slate-50">

                                {/* 1. INSS */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
                                        INSS Progressivo
                                    </h4>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Calculado faixa a faixa. Para cada faixa salarial, aplica-se a alíquota correspondente sobre a parcela do salário que se enquadra nela.
                                    </p>
                                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-indigo-300 overflow-x-auto">
                                        <p className="mb-2">// Pseudocódigo</p>
                                        <p>Base_Faixa = Min(Salario_Restante, Limite_Faixa - Limite_Anterior)</p>
                                        <p>Imposto_Faixa = Base_Faixa * Aliquota_Faixa</p>
                                        <p>Total_INSS = Soma(Imposto_Faixa)</p>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                            <span className="font-bold text-slate-700">Teto INSS:</span>
                                            <p className="text-slate-500">Se o salário ultrapassar a última faixa, cobra-se o valor máximo acumulado.</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                            <span className="font-bold text-slate-700">Precisão:</span>
                                            <p className="text-slate-500">2 casas decimais (arredondamento padrão).</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. IRRF */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">2</span>
                                        Imposto de Renda (IRRF)
                                    </h4>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Calculado sobre o Salário Base deduzido de INSS e Dependentes.
                                    </p>
                                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-rose-300 overflow-x-auto">
                                        <p>Base_IRRF = Bruto - INSS - (Num_Dependentes * 189.59)</p>
                                        <p>IRRF = (Base_IRRF * Aliquota) - Deducao_Faixa</p>
                                    </div>
                                </div>

                                {/* 3. Benefícios */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">3</span>
                                        Benefícios e Coparticipação
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="border-l-4 border-emerald-500 pl-4 py-1">
                                            <h5 className="font-bold text-sm text-slate-900">Vale Transporte (Regra Legal)</h5>
                                            <p className="text-xs text-slate-600 mt-1">
                                                Desconto limitado a 6% do Salário Base.
                                            </p>
                                            <code className="block mt-2 text-xs bg-slate-100 p-2 rounded text-slate-700">
                                                Desconto = Min(Bruto * 0.06, Valor_Integra_VT)
                                            </code>
                                        </div>

                                        <div className="border-l-4 border-blue-500 pl-4 py-1">
                                            <h5 className="font-bold text-sm text-slate-900">Outros Benefícios</h5>
                                            <p className="text-xs text-slate-600 mt-1">
                                                Desconto baseado na coparticipação configurada.
                                            </p>
                                            <code className="block mt-2 text-xs bg-slate-100 p-2 rounded text-slate-700">
                                                Desconto = Valor_Beneficio * %Coparticipacao
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Custo Empresa */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">4</span>
                                        Encargos Trabalhistas (Empresa)
                                    </h4>
                                    <table className="w-full text-sm text-left text-slate-600">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 text-left">
                                            <tr>
                                                <th className="px-4 py-2">Item</th>
                                                <th className="px-4 py-2">Cálculo Base</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                                            <tr>
                                                <td className="px-4 py-2 font-medium">FGTS</td>
                                                <td className="px-4 py-2">Bruto * 8%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 font-medium">Férias + 1/3 (Provisão)</td>
                                                <td className="px-4 py-2">Bruto * 11.11%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 font-medium">13º Salário (Provisão)</td>
                                                <td className="px-4 py-2">Bruto * 8.33%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
                                As fórmulas seguem a legislação vigente (CLT 2024) e as configurações fiscais do sistema.
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default FormulaAuditModal;
