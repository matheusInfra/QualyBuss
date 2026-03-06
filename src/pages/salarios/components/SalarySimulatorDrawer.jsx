import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { TaxEngine } from '../../../utils/payroll/TaxEngine';
import { BenefitsEngine } from '../../../utils/payroll/BenefitsEngine';
import { payrollService } from '../../../services/payrollService';
import { XMarkIcon, CalculatorIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const COLORS = ['#10B981', '#F43F5E', '#3B82F6', '#F59E0B']; // Emerald, Rose, Blue, Amber

export default function SalarySimulatorDrawer({ isOpen, onClose, collaborator, settings }) {
    const [benefits, setBenefits] = useState([]);
    const [dependants, setDependants] = useState(0);

    // Simulation State
    const [simParams, setSimParams] = useState({
        adjustmentType: 'PERCENTAGE', // 'PERCENTAGE' | 'FIXED'
        adjustmentValue: 0,
        extraIncome: 0,
        extraDiscount: 0
    });

    // Comparison State (Current vs Simulated)
    const [comparison, setComparison] = useState(null);

    // Initialize Data
    useEffect(() => {
        if (collaborator && isOpen) {
            payrollService.getCollaboratorBenefits(collaborator.id).then(setBenefits);
            setDependants(collaborator.dependents || 0);
            // Reset params
            setSimParams({
                adjustmentType: 'PERCENTAGE',
                adjustmentValue: 0,
                extraIncome: 0,
                extraDiscount: 0
            });
        }
    }, [collaborator, isOpen]);

    // Calculation Engine
    useEffect(() => {
        if (!collaborator || !settings) return;

        const calculateScenario = (baseSalary, extraInc, extraDisc) => {
            const gross = Number(baseSalary) + Number(extraInc);

            // 1. Benefits
            const benefitsResult = BenefitsEngine.calculateBenefits(gross, benefits); // Recalculate if % based

            // 2. Taxes
            const taxResult = TaxEngine.calculateNetSalary(gross, dependants, settings);

            // 3. Final Net
            // Net = (Gross - INSS - IRRF) - Benefits(Employee) - ExtraDiscounts
            const finalNet = taxResult.net - benefitsResult.totalDeduction - Number(extraDisc);

            // 4. Company Cost
            const fgts = gross * (settings.company_taxes.fgts || 0.08);
            const vacationProvision = gross * (settings.company_taxes.provision_vacation || 0.1111);
            const thwelfProvision = gross * (settings.company_taxes.provision_13th || 0.0833);
            const totalCompany = gross + fgts + vacationProvision + thwelfProvision + benefitsResult.totalCompanyCost;

            return {
                gross,
                net: finalNet,
                inss: taxResult.inss,
                irrf: taxResult.irrf,
                benefitsDed: benefitsResult.totalDeduction,
                totalCompany
            };
        };

        // 1. Current Scenario
        const current = calculateScenario(collaborator.salary, 0, 0);

        // 2. Simulated Scenario
        let newBaseSalary = Number(collaborator.salary);
        if (simParams.adjustmentValue > 0) {
            if (simParams.adjustmentType === 'PERCENTAGE') {
                newBaseSalary += newBaseSalary * (simParams.adjustmentValue / 100);
            } else {
                newBaseSalary += Number(simParams.adjustmentValue);
            }
        }

        const simulated = calculateScenario(newBaseSalary, simParams.extraIncome, simParams.extraDiscount);

        setComparison({
            current,
            simulated,
            diff: {
                net: simulated.net - current.net,
                company: simulated.totalCompany - current.totalCompany
            }
        });

    }, [collaborator, settings, benefits, dependants, simParams]);

    // Charts Data Preparation
    const distributionData = useMemo(() => {
        if (!comparison) return [];
        const s = comparison.simulated;
        return [
            { name: 'Líquido', value: s.net },
            { name: 'Impostos (INSS/IRRF)', value: s.inss + s.irrf },
            { name: 'Benefícios', value: s.benefitsDed },
            // { name: 'Outros Desc.', value: simParams.extraDiscount }
        ];
    }, [comparison]);

    const companyCostData = useMemo(() => {
        if (!comparison) return [];
        return [
            { name: 'Atual', Custo: comparison.current.totalCompany },
            { name: 'Simulado', Custo: comparison.simulated.totalCompany }
        ];
    }, [comparison]);

    if (!collaborator || !comparison) return null;

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl"> {/* Wider Panel */}
                                    <div className="flex h-full flex-col bg-slate-50 shadow-2xl">

                                        {/* Header */}
                                        <div className="px-6 py-6 bg-slate-900 text-white flex justify-between items-start shadow-md z-10">
                                            <div>
                                                <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                                    <CalculatorIcon className="w-6 h-6 text-indigo-400" />
                                                    Simulador de Salários
                                                </Dialog.Title>
                                                <p className="text-slate-400 text-sm mt-1">
                                                    {collaborator.full_name} • {collaborator.role}
                                                </p>
                                            </div>
                                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                                <XMarkIcon className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {/* Main Content - Split View */}
                                        <div className="flex-1 overflow-y-auto">
                                            <div className="grid grid-cols-12 h-full min-h-[600px]">

                                                {/* LEFT COLUMN: CONTROLS (Span 4) */}
                                                <div className="col-span-12 md:col-span-4 bg-white border-r border-slate-200 p-6 space-y-8">

                                                    {/* Section 1: Adjustment */}
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                                            <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-600" />
                                                            Cenário de Reajuste
                                                        </h3>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Tipo de Ajuste</label>
                                                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                                                    <button
                                                                        onClick={() => setSimParams({ ...simParams, adjustmentType: 'PERCENTAGE', adjustmentValue: 0 })}
                                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${simParams.adjustmentType === 'PERCENTAGE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                                    >
                                                                        Porcentagem (%)
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSimParams({ ...simParams, adjustmentType: 'FIXED', adjustmentValue: 0 })}
                                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${simParams.adjustmentType === 'FIXED' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                                    >
                                                                        Valor Fixo (R$)
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="relative">
                                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">
                                                                    {simParams.adjustmentType === 'PERCENTAGE' ? 'Percentual de Aumento' : 'Valor a Adicionar'}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step={simParams.adjustmentType === 'PERCENTAGE' ? "0.1" : "10"}
                                                                    value={simParams.adjustmentValue}
                                                                    onChange={e => setSimParams({ ...simParams, adjustmentValue: parseFloat(e.target.value) || 0 })}
                                                                    className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-slate-700 font-bold"
                                                                />
                                                                {simParams.adjustmentType === 'PERCENTAGE' && (
                                                                    <div className="mt-2">
                                                                        <input
                                                                            type="range"
                                                                            min="0"
                                                                            max="30"
                                                                            step="0.5"
                                                                            value={simParams.adjustmentValue}
                                                                            onChange={e => setSimParams({ ...simParams, adjustmentValue: parseFloat(e.target.value) })}
                                                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                                        />
                                                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                                            <span>0%</span>
                                                                            <span>15%</span>
                                                                            <span>30%</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <hr className="border-slate-100" />

                                                    {/* Section 2: Variables */}
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
                                                            Variáveis Mensais
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-xs font-medium text-slate-500">Renda Extra (Bônus/Hora Extra)</label>
                                                                <div className="relative mt-1">
                                                                    <span className="absolute left-3 top-2 text-slate-400 text-xs">R$</span>
                                                                    <input
                                                                        type="number"
                                                                        value={simParams.extraIncome}
                                                                        onChange={e => setSimParams({ ...simParams, extraIncome: Number(e.target.value) })}
                                                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-slate-500">Descontos Extras (Faltas/Adiant.)</label>
                                                                <div className="relative mt-1">
                                                                    <span className="absolute left-3 top-2 text-slate-400 text-xs">R$</span>
                                                                    <input
                                                                        type="number"
                                                                        value={simParams.extraDiscount}
                                                                        onChange={e => setSimParams({ ...simParams, extraDiscount: Number(e.target.value) })}
                                                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-slate-500">Dependentes IRRF</label>
                                                                <input
                                                                    type="number"
                                                                    value={dependants}
                                                                    onChange={e => setDependants(Number(e.target.value))}
                                                                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* RIGHT COLUMN: VISUALIZATION (Span 8) */}
                                                <div className="col-span-12 md:col-span-8 p-8 bg-slate-50 space-y-8">

                                                    {/* 1. HERO CARDS (Comparison) */}
                                                    <div className="grid grid-cols-2 gap-6">
                                                        {/* Current */}
                                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 opacity-70">
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Líquido Atual</p>
                                                            <p className="text-2xl font-bold text-slate-600 mt-1">
                                                                {comparison.current.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                            </p>
                                                        </div>

                                                        {/* Simulated */}
                                                        <div className="bg-white p-5 rounded-2xl shadow-md border border-emerald-100 ring-1 ring-emerald-50 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                <CalculatorIcon className="w-20 h-20 text-emerald-500" />
                                                            </div>
                                                            <p className="text-xs font-bold text-emerald-600 uppercase">Líquido Simulado</p>
                                                            <div className="flex items-end gap-3 mt-1">
                                                                <p className="text-4xl font-extrabold text-slate-900">
                                                                    {comparison.simulated.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                </p>
                                                                {comparison.diff.net !== 0 && (
                                                                    <span className={`text-sm font-bold px-2 py-1 rounded-full mb-1 flex items-center ${comparison.diff.net > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                        {comparison.diff.net > 0 ? '+' : ''}
                                                                        {comparison.diff.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 2. CHARTS ROW */}
                                                    <div className="grid grid-cols-2 gap-6 h-64">

                                                        {/* Distribuicao (Pie) */}
                                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                                                            <h4 className="text-sm font-bold text-slate-700 mb-2">Distribuição do Bruto</h4>
                                                            <div className="flex-1 w-full relative min-h-[150px]">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={distributionData}
                                                                            cx="50%"
                                                                            cy="50%"
                                                                            innerRadius={40}
                                                                            outerRadius={70}
                                                                            paddingAngle={5}
                                                                            dataKey="value"
                                                                        >
                                                                            {distributionData.map((entry, index) => (
                                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                            ))}
                                                                        </Pie>
                                                                        <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                            <div className="flex justify-center gap-4 text-[10px] text-slate-500">
                                                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Líquido</div>
                                                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Impostos</div>
                                                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Benefícios</div>
                                                            </div>
                                                        </div>

                                                        {/* Custo Empresa (Bar) */}
                                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                                                            <h4 className="text-sm font-bold text-slate-700 mb-2">Impacto no Custo Empresa</h4>
                                                            <div className="flex-1 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={companyCostData}>
                                                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                                        <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cursor={{ fill: 'transparent' }} />
                                                                        <Bar dataKey="Custo" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                            <div className="text-center mt-2">
                                                                <span className={`text-xs font-bold ${comparison.diff.company > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                    Diferença: +{comparison.diff.company.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 3. DETAILED TABLE */}
                                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                        <table className="min-w-full text-sm">
                                                            <thead className="bg-slate-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left font-medium text-slate-500">Item</th>
                                                                    <th className="px-4 py-3 text-right font-medium text-slate-500">Atual</th>
                                                                    <th className="px-4 py-3 text-right font-bold text-indigo-900 bg-indigo-50/50">Simulado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                <tr>
                                                                    <td className="px-4 py-2 text-slate-600">Salário Bruto</td>
                                                                    <td className="px-4 py-2 text-right font-mono">{comparison.current.gross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                    <td className="px-4 py-2 text-right font-mono font-bold bg-indigo-50/30">{comparison.simulated.gross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="px-4 py-2 text-slate-600">Descontos (INSS/IRRF)</td>
                                                                    <td className="px-4 py-2 text-right font-mono text-rose-600">- {(comparison.current.inss + comparison.current.irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                    <td className="px-4 py-2 text-right font-mono text-rose-600 bg-indigo-50/30">- {(comparison.simulated.inss + comparison.simulated.irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                </tr>
                                                                <tr className="bg-amber-50/50">
                                                                    <td className="px-4 py-2 font-medium text-amber-800">Custo Total Empresa</td>
                                                                    <td className="px-4 py-2 text-right font-mono text-amber-700">{comparison.current.totalCompany.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                    <td className="px-4 py-2 text-right font-mono font-bold text-amber-700 bg-indigo-50/30">{comparison.simulated.totalCompany.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
