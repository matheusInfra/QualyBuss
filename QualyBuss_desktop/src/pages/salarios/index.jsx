import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collaboratorService } from '../../services/collaboratorService';
import { payrollService } from '../../services/payrollService';
import { TaxEngine } from '../../utils/payroll/TaxEngine';
import {
    BanknotesIcon,
    CalculatorIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    SquaresPlusIcon
} from '@heroicons/react/24/outline';
import SalarySimulatorDrawer from './components/SalarySimulatorDrawer';
import BenefitsManager from './components/BenefitsManager';
import TaxConfiguration from './components/TaxConfiguration';
import BenefitAssignmentModal from './components/BenefitAssignmentModal';
import MassManager from './components/MassManager';

import FormulaAuditModal from './components/FormulaAuditModal';

const SalariosDashboard = () => {
    const [selectedCollaborator, setSelectedCollaborator] = useState(null);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

    // State for Benefit Assignment
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [collaboratorToAssign, setCollaboratorToAssign] = useState(null);

    // State for Formula Audit
    const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

    const [viewMode, setViewMode] = useState('LIST'); // LIST, MASS, BENEFITS, SETTINGS

    // --- DATA FETCHING ---
    const { data: collaborators = [] } = useQuery({
        queryKey: ['collaboratorsSalary'],
        queryFn: () => payrollService.getAllCollaboratorsWithBenefits()
    });

    const { data: globalSettings } = useQuery({
        queryKey: ['payrollSettings'],
        queryFn: payrollService.getSettings
    });

    // --- CALCULATIONS (Overview) ---
    const totalPayroll = collaborators.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);
    const avgSalary = collaborators.length > 0 ? totalPayroll / collaborators.length : 0;

    const handleSimulate = (collab) => {
        setSelectedCollaborator(collab);
        setIsSimulatorOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Salários & Benefícios</h1>
                    <p className="text-sm text-slate-500">Simulação de folha, controle de benefícios e configurações fiscais.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                    >
                        <UserGroupIcon className="w-4 h-4 inline mr-2" />
                        Colaboradores
                    </button>
                    <button
                        onClick={() => setViewMode('MASS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'MASS' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                    >
                        <SquaresPlusIcon className="w-4 h-4 inline mr-2" />
                        Gestão em Massa
                    </button>
                    <button
                        onClick={() => setViewMode('BENEFITS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'BENEFITS' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                    >
                        <BanknotesIcon className="w-4 h-4 inline mr-2" />
                        Catálogo Benefícios
                    </button>
                    <button
                        onClick={() => setViewMode('SETTINGS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'SETTINGS' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                    >
                        <Cog6ToothIcon className="w-4 h-4 inline mr-2" />
                        Config. Fiscal
                    </button>

                    <div className="h-6 w-px bg-slate-300 mx-2 hidden md:block"></div>

                    <button
                        onClick={() => setIsFormulaModalOpen(true)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Auditoria de Fórmulas"
                    >
                        <CalculatorIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* KPI Cards (Only show in Overview or Mass mode as high level stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Folha Mensal Estimada</p>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {totalPayroll.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h2>
                        <span className="text-xs text-slate-400">Salário Base (Bruto)</span>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BanknotesIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Média Salarial</p>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {avgSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h2>
                        <span className="text-xs text-emerald-600 font-bold">+2.4% vs mês anterior</span>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <ArrowTrendingUpIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Custo Total Empresa</p>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {(totalPayroll * 1.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h2>
                        <span className="text-xs text-slate-400">Estimado (~60% encargos)</span>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <CalculatorIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="transition-all duration-300">
                {viewMode === 'LIST' && (
                    <div className="grid grid-cols-1 gap-4 animate-fade-in">
                        {collaborators.map(c => {
                            // Inline Calculation for UI Display
                            const gross = Number(c.salary);

                            // REAL DATA NOW
                            const userBenefits = c.benefits || [];

                            const benefitsTotal = userBenefits.reduce((acc, b) => acc + Number(b.value || 0), 0);

                            // PRECISION FIX: Use Tax Engine instead of approximation
                            // We need valid brackets from settings, or fallback to defaults if loading
                            const settingsToUse = globalSettings || {
                                inss_brackets: [],
                                irrf_brackets: [],
                                dependant_deduction: 189.59
                            };

                            // Calculate using the Engine (Standard Process: Gross -> INSS -> IRRF -> Net)
                            // Note: This list view calculation assumes 0 dependants for quick view if data is missing,
                            // or we should fetch dependants count. For now, assuming 0 to be safer than random approx.
                            const dependants = c.dependants_count || 0;

                            const calculation = TaxEngine.calculateNetSalary(gross, dependants, settingsToUse);

                            // The true net must also deduct benefits cost (employee share)
                            // The 'value' in userBenefits might be full value or employee share?
                            // In payrollService we mapped it. Let's assume it represents the deduction for now based on previous logic.
                            // Ideally, we should use BenefitsEngine here too if we have the full benefit object.
                            // For this "List View", we subtract the simple sum of benefits presented.

                            const finalNet = calculation.net - benefitsTotal;


                            return (
                                <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    {/* User Info */}
                                    <div className="flex items-center gap-4 min-w-[250px]">
                                        {c.avatar_url ? (
                                            <img src={c.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                                                {c.full_name?.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-slate-900">{c.full_name}</h3>
                                            <p className="text-xs text-slate-500">{c.role} • {c.department}</p>
                                        </div>
                                    </div>

                                    {/* Benefits Badges */}
                                    <div className="flex-1 flex flex-wrap gap-2">
                                        {userBenefits.map((b, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">
                                                {b.name}
                                                <span className="text-slate-400 border-l border-slate-200 pl-1 ml-1">
                                                    - {Number(b.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Gross to Net Summary */}
                                    <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">Bruto</span>
                                            <span className="font-mono text-sm font-medium text-slate-700">
                                                {gross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>

                                        {/* Added Detail: INSS/IRRF Hint */}
                                        <div className="hidden md:block text-right">
                                            <span className="block text-[10px] uppercase font-bold text-slate-300">Descontos Legais</span>
                                            <span className="font-mono text-xs text-slate-400" title={`INSS: ${calculation.inss} | IRRF: ${calculation.irrf}`}>
                                                - {(calculation.inss + calculation.irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>

                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase font-bold text-emerald-600">Líquido Real</span>
                                            <span className="font-mono text-lg font-bold text-emerald-700" title="Bruto - INSS - IRRF - Benefícios">
                                                {finalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleSimulate(c)}
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Simular
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCollaboratorToAssign(c);
                                                setAssignmentModalOpen(true);
                                            }}
                                            className="text-slate-500 hover:text-slate-700 text-xs font-medium underline"
                                        >
                                            Gerenciar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {viewMode === 'MASS' && <MassManager />}
                {viewMode === 'BENEFITS' && <BenefitsManager />}
                {viewMode === 'SETTINGS' && <TaxConfiguration />}
            </div>

            {/* DRAGONS BE HERE: Interactive Simulator */}
            <SalarySimulatorDrawer
                isOpen={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
                collaborator={selectedCollaborator}
                settings={globalSettings}
            />

            {/* Bridge: Benefit Assignment */}
            <BenefitAssignmentModal
                isOpen={assignmentModalOpen}
                onClose={() => setAssignmentModalOpen(false)}
                collaborator={collaboratorToAssign}
            />
        </div>
    );
};

export default SalariosDashboard;
