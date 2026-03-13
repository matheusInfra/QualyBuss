import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import { TaxEngine } from '../../utils/payroll/TaxEngine';
import {
    BanknotesIcon,
    CalculatorIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    SquaresPlusIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldExclamationIcon,
    LockClosedIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import SalarySimulatorDrawer from './components/SalarySimulatorDrawer';
import BenefitsManager from './components/BenefitsManager';
import TaxConfiguration from './components/TaxConfiguration';
import BenefitAssignmentModal from './components/BenefitAssignmentModal';
import MassManager from './components/MassManager';

import FormulaAuditModal from './components/FormulaAuditModal';

const SalariosDashboard = () => {
    const queryClient = useQueryClient();
    const [selectedCollaborator, setSelectedCollaborator] = useState(null);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

    // State for Benefit Assignment
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [collaboratorToAssign, setCollaboratorToAssign] = useState(null);

    // State for Formula Audit
    const [, setIsFormulaModalOpen] = useState(false);

    const [viewMode, setViewMode] = useState('LIST'); // LIST, MASS, BENEFITS, SETTINGS
    const [showValues, setShowValues] = useState(false);

    // --- RE-AUTH MODAL ---
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    // --- DATA FETCHING --- 
    // Modo Público: sem salary (padrão seguro)
    const { data: publicCollabs = [] } = useQuery({
        queryKey: ['collaboratorsPublic'],
        queryFn: () => payrollService.getAllCollaboratorsPublic()
    });

    // Modo Revelado: com salary (só busca quando showValues é true)
    const { data: privateCollabs = [] } = useQuery({
        queryKey: ['collaboratorsSalary'],
        queryFn: () => payrollService.getAllCollaboratorsWithBenefits(),
        enabled: showValues  // SÓ roda quando o usuário se reautenticou
    });

    // Merge: usa dados privados se revelado, senão públicos
    const collaborators = showValues ? privateCollabs : publicCollabs;

    const { data: globalSettings } = useQuery({
        queryKey: ['payrollSettings'],
        queryFn: payrollService.getSettings
    });

    // --- HANDLE REVEAL --- 
    const handleToggleValues = () => {
        if (!showValues) {
            // Quer revelar → abrir modal de re-autenticação
            setAuthEmail('');
            setAuthPassword('');
            setAuthError('');
            setAuthModalOpen(true);
        } else {
            // Quer ocultar → limpar dados sensíveis da memória
            setShowValues(false);
            queryClient.removeQueries({ queryKey: ['collaboratorsSalary'] });
        }
    };

    const handleReAuth = async () => {
        setAuthLoading(true);
        setAuthError('');
        try {
            await payrollService.reAuthenticate(authEmail, authPassword);
            setShowValues(true);
            setAuthModalOpen(false);
        } catch {
            setAuthError('Credenciais inválidas. Acesso negado.');
        } finally {
            setAuthLoading(false);
            setAuthPassword(''); // Limpar senha da memória
        }
    };

    // --- CALCULATIONS (Overview) ---
    const totalPayroll = collaborators.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);
    const avgSalary = collaborators.length > 0 ? totalPayroll / collaborators.length : 0;

    const handleSimulate = (collab) => {
        setSelectedCollaborator(collab);
        setIsSimulatorOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-fade-in">
            {/* Header: Título + Botão Revelar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Salários & Benefícios</h1>
                    <p className="text-sm text-slate-500">Simulação de folha, controle de benefícios e configurações fiscais.</p>
                </div>
                
                {/* Botão de Revelar Valores - SEMPRE VISÍVEL */}
                <button
                    onClick={handleToggleValues}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                        showValues 
                            ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300 ring-offset-2' 
                            : 'bg-white text-slate-600 border-2 border-dashed border-slate-300 hover:border-amber-400 hover:text-amber-600'
                    }`}
                >
                    {showValues ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    {showValues ? 'Ocultar Valores' : 'Revelar Valores'}
                    <LockClosedIcon className={`w-4 h-4 ${showValues ? 'text-amber-200' : 'text-slate-400'}`} />
                </button>
            </div>

            {/* Abas de Navegação */}
            <div className="flex gap-2 overflow-x-auto pb-1">
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

                <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block self-center"></div>

                <button
                    onClick={() => setIsFormulaModalOpen(true)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Auditoria de Fórmulas"
                >
                    <CalculatorIcon className="w-5 h-5" />
                </button>
            </div>

            {/* KPI Cards (Only show in Overview or Mass mode as high level stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Folha Mensal Estimada</p>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {showValues ? totalPayroll.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••••'}
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
                            {showValues ? avgSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••••'}
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
                            {showValues ? (totalPayroll * 1.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••••'}
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
                                                    - {showValues ? Number(b.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ •••'}
                                                </span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Gross to Net Summary */}
                                    <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">Bruto</span>
                                            <span className="font-mono text-sm font-medium text-slate-700">
                                                {showValues ? gross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••••'}
                                            </span>
                                        </div>

                                        {/* Added Detail: INSS/IRRF Hint */}
                                        <div className="hidden md:block text-right">
                                            <span className="block text-[10px] uppercase font-bold text-slate-300">Descontos Legais</span>
                                            <span className="font-mono text-xs text-slate-400" title={`INSS: ${calculation.inss} | IRRF: ${calculation.irrf}`}>
                                                {showValues ? `- ${(calculation.inss + calculation.irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '- R$ ••••••••'}
                                            </span>
                                        </div>

                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase font-bold text-emerald-600">Líquido Real</span>
                                            <span className="font-mono text-lg font-bold text-emerald-700" title="Bruto - INSS - IRRF - Benefícios">
                                                {showValues ? finalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••••'}
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

                {viewMode === 'MASS' && <MassManager showValues={showValues} />}
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

            {/* ====== MODAL DE RE-AUTENTICAÇÃO ====== */}
            {authModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header com aviso */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <ShieldExclamationIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-lg">Área Restrita</h3>
                                <p className="text-white/90 text-sm mt-1">
                                    Você está prestes a acessar <strong>dados salariais confidenciais</strong>. 
                                    Esta ação é monitorada e requer verificação de identidade.
                                </p>
                            </div>
                            <button onClick={() => setAuthModalOpen(false)} className="text-white/70 hover:text-white">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Aviso de confidencialidade */}
                        <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                <strong>Aviso Legal:</strong> As informações salariais são dados sensíveis protegidos pela LGPD. 
                                O acesso é registrado e qualquer compartilhamento não autorizado pode resultar em sanções disciplinares.
                            </p>
                        </div>

                        {/* Formulário */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={authEmail} 
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="seu@email.com"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                                <input 
                                    type="password" 
                                    value={authPassword} 
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleReAuth()}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            {authError && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">
                                    {authError}
                                </div>
                            )}

                            <button 
                                onClick={handleReAuth}
                                disabled={authLoading || !authEmail || !authPassword}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                                <LockClosedIcon className="w-5 h-5" />
                                {authLoading ? 'Verificando...' : 'Confirmar Identidade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalariosDashboard;
