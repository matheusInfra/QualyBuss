import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../../services/payrollService';
import { collaboratorService } from '../../../services/collaboratorService';
import { TaxEngine } from '../../../utils/payroll/TaxEngine';
import {
    UserGroupIcon,
    CurrencyDollarIcon,
    GiftIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ChartBarIcon,
    FunnelIcon,
    ChevronDownIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MassManager() {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [mode, setMode] = useState('SALARY'); // 'SALARY' | 'BENEFITS'

    // Filters & Grouping
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'ANALYTICS'
    const [groupBy, setGroupBy] = useState('NONE'); // 'NONE' | 'DEPARTMENT' | 'ROLE'
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    // Action State
    const [adjustmentPercent, setAdjustmentPercent] = useState(0);
    const [selectedBenefitToAssign, setSelectedBenefitToAssign] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Fetch Data
    const { data: collaborators = [] } = useQuery({
        queryKey: ['collaborators_mass'],
        queryFn: async () => {
            const data = await collaboratorService.getAllRaw();
            return data || [];
        }
    });

    const { data: benefits = [] } = useQuery({
        queryKey: ['benefitsCatalog'],
        queryFn: payrollService.getBenefitsCatalog
    });

    const { data: payrollSettings } = useQuery({
        queryKey: ['payrollSettings'],
        queryFn: payrollService.getSettings
    });

    // Filtering
    const filteredCollaborators = useMemo(() => {
        return collaborators.filter(c => {
            if (departmentFilter !== 'ALL' && c.department !== departmentFilter) return false;
            return true;
        });
    }, [collaborators, departmentFilter]);

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (groupBy === 'NONE') return { 'Todos': filteredCollaborators };

        return filteredCollaborators.reduce((acc, curr) => {
            const key = curr[groupBy.toLowerCase()] || 'Sem Categoria';
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {});
    }, [filteredCollaborators, groupBy]);

    // Derived Selection Stats
    const selectedCollaborators = useMemo(() => {
        return filteredCollaborators.filter(c => selectedIds.has(c.id));
    }, [filteredCollaborators, selectedIds]);

    const stats = useMemo(() => {
        // Defaults if settings not loaded
        const safeSettings = payrollSettings || { inss_brackets: [], irrf_brackets: [], company_taxes: { fgts: 0.08 } };

        return selectedCollaborators.reduce((acc, c) => {
            const currentSalary = Number(c.salary);
            const projectedSalary = currentSalary * (1 + (adjustmentPercent / 100));

            // Current Costs (Base) - Approximation for comparision
            const currentCompCost = TaxEngine.calculateCompanyCost(currentSalary, safeSettings.company_taxes);

            // New Costs
            const netCalc = TaxEngine.calculateNetSalary(projectedSalary, 0, safeSettings); // Todo: pass real dependants count
            const compCost = TaxEngine.calculateCompanyCost(projectedSalary, safeSettings.company_taxes);

            acc.totalSalary += currentSalary;
            acc.projectedSalary += projectedSalary;

            acc.totalNet += netCalc.net;
            acc.totalEmployeeTaxes += (netCalc.inss + netCalc.irrf);

            acc.totalCompanyBurdens += compCost.burdens.total;
            acc.totalCompanyCost += compCost.totalCost;
            acc.currentTotalCompanyCost += currentCompCost.totalCost;

            return acc;
        }, { totalSalary: 0, projectedSalary: 0, totalNet: 0, totalEmployeeTaxes: 0, totalCompanyBurdens: 0, totalCompanyCost: 0, currentTotalCompanyCost: 0, diff: 0 });
    }, [selectedCollaborators, adjustmentPercent, payrollSettings]);

    // Diff simple calc
    stats.diff = stats.projectedSalary - stats.totalSalary;

    // Analytics Data (Stacked)
    const chartData = useMemo(() => {
        if (selectedIds.size === 0) return [];
        const safeSettings = payrollSettings || { inss_brackets: [], irrf_brackets: [], company_taxes: { fgts: 0.08 } };

        // Aggregate by Department for Chart
        const deptStats = selectedCollaborators.reduce((acc, c) => {
            const dept = c.department || 'Outros';
            if (!acc[dept]) acc[dept] = { name: dept, totalBruto: 0, net: 0, taxes: 0, companyBurdens: 0 };

            const current = Number(c.salary);
            const simulated = current * (1 + (adjustmentPercent / 100));

            const netCalc = TaxEngine.calculateNetSalary(simulated, 0, safeSettings);
            const compCost = TaxEngine.calculateCompanyCost(simulated, safeSettings.company_taxes);

            acc[dept].totalBruto += simulated;
            acc[dept].net += netCalc.net;
            acc[dept].taxes += (netCalc.inss + netCalc.irrf);
            acc[dept].companyBurdens += compCost.burdens.total;

            return acc;
        }, {});

        return Object.values(deptStats);
    }, [selectedCollaborators, adjustmentPercent, payrollSettings]);

    // Handlers
    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleGroupSelection = (groupKey) => {
        const groupItems = groupedData[groupKey];
        const allSelected = groupItems.every(c => selectedIds.has(c.id));

        const newSet = new Set(selectedIds);
        groupItems.forEach(c => {
            if (allSelected) newSet.delete(c.id);
            else newSet.add(c.id);
        });
        setSelectedIds(newSet);
    };

    const toggleGroupExpand = (groupKey) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(groupKey)) newSet.delete(groupKey);
        else newSet.add(groupKey);
        setExpandedGroups(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredCollaborators.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCollaborators.map(c => c.id)));
        }
    };

    const departments = useMemo(() => {
        const deps = new Set(collaborators.map(c => c.department).filter(Boolean));
        return ['ALL', ...Array.from(deps)];
    }, [collaborators]);

    // BULK ACTIONS
    const applySalaryAdjustment = async () => {
        if (!confirm(`Confirma o reajuste de ${adjustmentPercent}% para ${selectedCollaborators.length} colaboradores?`)) return;

        setProcessing(true);
        try {
            // Emulation of Batch Process (in production, use RPC)
            const promises = selectedCollaborators.map(c => {
                const newSalary = Number(c.salary) * (1 + (adjustmentPercent / 100));
                return payrollService.saveSalaryChange({
                    collaboratorId: c.id,
                    newSalary: newSalary,
                    reason: `Reajuste em Massa (${adjustmentPercent}%)`
                });
            });

            await Promise.all(promises);
            alert('Reajustes aplicados com sucesso!');
            setAdjustmentPercent(0);
            setSelectedIds(new Set());
            queryClient.invalidateQueries(['collaborators_mass']);
        } catch (error) {
            console.error(error);
            alert('Erro ao processar lote. Verifique o console.');
        } finally {
            setProcessing(false);
        }
    };

    const applyBenefitAssignment = async () => {
        if (!selectedBenefitToAssign) return;
        if (!confirm(`Atribuir ${selectedBenefitToAssign.name} para ${selectedCollaborators.length} colaboradores?`)) return;

        setProcessing(true);
        try {
            const assignments = selectedCollaborators.map(c =>
                payrollService.assignBenefits(c.id, { [selectedBenefitToAssign.id]: true })
            );

            await Promise.all(assignments);
            alert('Benefícios atribuídos!');
            setSelectedBenefitToAssign(null);
            setSelectedIds(new Set());
        } catch (error) {
            console.error(error);
            alert('Erro na atribuição.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">

            {/* Control Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4">
                <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
                    {/* Mode Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('SALARY')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${mode === 'SALARY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Salários
                        </button>
                        <button
                            onClick={() => setMode('BENEFITS')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${mode === 'BENEFITS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <GiftIcon className="w-4 h-4" />
                            Benefícios
                        </button>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <span className="text-xs font-medium text-slate-400">Visualização:</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode('TABLE')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'TABLE' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-400'}`}
                                title="Lista"
                            >
                                <UserGroupIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('ANALYTICS')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'ANALYTICS' ? 'bg-purple-50 text-purple-600' : 'hover:bg-slate-50 text-slate-400'}`}
                                title="Analítico"
                            >
                                <ChartBarIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 w-full">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">Filtros:</span>
                    </div>

                    <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'Todos Deptos' : d}</option>)}
                    </select>

                    <div className="w-px h-4 bg-slate-300 mx-2"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Agrupar por:</span>
                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setGroupBy('NONE')}
                                className={`px-3 py-1 text-xs font-medium rounded-md ${groupBy === 'NONE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                            >
                                Nenhum
                            </button>
                            <button
                                onClick={() => { setGroupBy('DEPARTMENT'); setExpandedGroups(new Set(departments)); }} // Auto expand all on switch
                                className={`px-3 py-1 text-xs font-medium rounded-md ${groupBy === 'DEPARTMENT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                            >
                                Departamento
                            </button>
                            <button
                                onClick={() => { setGroupBy('ROLE'); setExpandedGroups(new Set(['ALL'])); }} // Simplified logic
                                className={`px-3 py-1 text-xs font-medium rounded-md ${groupBy === 'ROLE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                            >
                                Cargo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION PANEL (Floating) */}
            {selectedIds.size > 0 && (
                <div className="sticky top-4 z-20 bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6 animate-fade-in-down">

                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-2 rounded-full">
                            <UserGroupIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white leading-tight">
                                {selectedIds.size} Colaboradores
                            </h3>
                            {mode === 'SALARY' && (
                                <p className="text-xs text-slate-400">
                                    Impacto: <span className="text-emerald-400 font-mono">+ {stats.diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto bg-slate-800/50 p-2 rounded-lg">
                        {mode === 'SALARY' ? (
                            <>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Reajuste (%)</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            value={adjustmentPercent}
                                            onChange={e => setAdjustmentPercent(Number(e.target.value))}
                                            className="w-16 bg-transparent border-b border-indigo-500 text-center font-bold text-lg outline-none focus:border-emerald-400 transition-colors"
                                            placeholder="0"
                                        />
                                        <span className="text-slate-500">%</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                                <button
                                    onClick={applySalaryAdjustment}
                                    disabled={processing || adjustmentPercent <= 0}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
                                >
                                    {processing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CurrencyDollarIcon className="w-4 h-4" />}
                                    Aplicar Agora
                                </button>
                            </>
                        ) : (
                            <>
                                <select
                                    value={selectedBenefitToAssign ? selectedBenefitToAssign.id : ''}
                                    onChange={e => setSelectedBenefitToAssign(benefits.find(b => b.id === e.target.value))}
                                    className="bg-slate-700 border-none rounded-lg text-sm px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                                >
                                    <option value="">Selecione Benefício...</option>
                                    {benefits.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={applyBenefitAssignment}
                                    disabled={processing || !selectedBenefitToAssign}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                                >
                                    Atribuir
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT: SPLIT VIEW (ANALYTICS or TABLE) */}
            <div className="grid grid-cols-1 gap-6">

                {/* ANALYTICS MODE */}
                {viewMode === 'ANALYTICS' && selectedIds.size > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

                        {/* CHART SECTION */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                                    Análise Detalhada (Colaborador vs Empresa)
                                </h3>
                                <div className="flex gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Líquido
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-rose-500"></span> Descontos
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Encargos Empresa
                                    </div>
                                </div>
                            </div>

                            <div className="h-80 w-full" style={{ minHeight: '300px' }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="99%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                                formatter={(value, name) => [
                                                    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                                    name === 'net' ? 'Salário Líquido' :
                                                        name === 'taxes' ? 'Impostos/Desc' :
                                                            name === 'companyCost' ? 'Encargos Empresa' : name
                                                ]}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            {/* Stacked Bars for User Side */}
                                            <Bar dataKey="net" stackId="a" name="Líquido (Colaborador)" fill="#10b981" radius={[0, 0, 4, 4]} barSize={40} />
                                            <Bar dataKey="taxes" stackId="a" name="Impostos (Colaborador)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />

                                            {/* Bar for Company Cost (Separated or Stacked? Let's show TOTAL Company Cost vs Total Gross to show the "Extra") 
                                                Actually user wants to see "User Part" vs "Company Part". 
                                                Let's do two bars per department: 
                                                1. Gross Salary (Split into Net + Taxes)
                                                2. Total Cost (Gross + Agency Costs)
                                            */}
                                            <Bar dataKey="companyBurdens" stackId="b" name="Encargos (Empresa)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                                        Selecione colaboradores para ver o gráfico
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* METRICS CARDS */}
                        <div className="space-y-6">
                            {/* Card Colaborador */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                <h3 className="font-bold text-slate-700 mb-4 flex justify-between">
                                    <span>Visão Colaborador</span>
                                    <UserGroupIcon className="w-5 h-5 text-emerald-500" />
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Salário Bruto (Total)</span>
                                        <span className="font-mono text-slate-700">{stats.projectedSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-rose-500">Descontos (INSS/IRRF)</span>
                                        <span className="font-mono text-rose-500">- {stats.totalEmployeeTaxes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-emerald-700">Líquido Estimado</span>
                                        <span className="font-mono font-bold text-xl text-emerald-600">{stats.totalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">*Considerando INSS e IRRF padrão 2024.</p>
                                </div>
                            </div>

                            {/* Card Empresa */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h3 className="font-bold text-slate-700 mb-4 flex justify-between">
                                    <span>Custo Empresa</span>
                                    <span className="text-xs font-normal px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">Simulado</span>
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Folha Bruta</span>
                                        <span className="font-mono text-slate-700">{stats.projectedSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-500">Encargos (FGTS/Provisões)</span>
                                        <span className="font-mono text-indigo-500">+ {stats.totalCompanyBurdens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-slate-800">Custo Total</span>
                                        <span className="font-mono font-bold text-xl text-indigo-600">{stats.totalCompanyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div className="text-xs text-center mt-2 p-2 bg-slate-50 rounded text-slate-500">
                                        Aumento Real de Custo: <span className="font-bold text-rose-500">+ {(stats.totalCompanyCost - stats.currentTotalCompanyCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TABLE MODE (Always visible or toggleable) */}
                {viewMode === 'TABLE' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {Object.entries(groupedData).map(([groupKey, items]) => {
                            const isExpanded = groupBy === 'NONE' || expandedGroups.has(groupKey);
                            const allSelected = items.every(c => selectedIds.has(c.id));
                            const someSelected = items.some(c => selectedIds.has(c.id));

                            return (
                                <div key={groupKey} className="border-b border-slate-100 last:border-none">
                                    {/* Group Header (Only if Grouping is Active) */}
                                    {groupBy !== 'NONE' && (
                                        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleGroupExpand(groupKey)}>
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? <ChevronDownIcon className="w-4 h-4 text-slate-400" /> : <ChevronRightIcon className="w-4 h-4 text-slate-400" />}
                                                <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{groupKey}</span>
                                                <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{items.length}</span>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <label className="text-xs text-slate-500 cursor-pointer">Selecionar Todos</label>
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={input => { if (input) input.indeterminate = someSelected && !allSelected; }}
                                                    onChange={() => toggleGroupSelection(groupKey)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Items List */}
                                    {isExpanded && (
                                        <table className="min-w-full divide-y divide-slate-200">
                                            {groupBy === 'NONE' && (
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left w-12">
                                                            <input type="checkbox" checked={selectedIds.size === filteredCollaborators.length && filteredCollaborators.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Colaborador</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cargo</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Salário Base</th>
                                                        {mode === 'SALARY' && selectedIds.size > 0 && (
                                                            <>
                                                                <th className="px-6 py-3 text-right text-xs font-bold text-emerald-600 uppercase bg-emerald-50">Líquido Est.</th>
                                                                <th className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase bg-indigo-50">Custo Empresa</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                            )}
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {items.map((collab) => {
                                                    const isSelected = selectedIds.has(collab.id);
                                                    const currentSalary = Number(collab.salary);
                                                    const simulatedSalary = currentSalary * (1 + (adjustmentPercent / 100));

                                                    // Quick calc for table view (using same logic as analytics)
                                                    // Note: Ideally memoize this if list is huge, but fine for now
                                                    // We can't access memoized total stats here easily per row without re-calc or map
                                                    // Let's do a lightweight calc
                                                    const compCost = TaxEngine.calculateCompanyCost(simulatedSalary, payrollSettings?.company_taxes);
                                                    const netCalc = TaxEngine.calculateNetSalary(simulatedSalary, 0, payrollSettings || { inss_brackets: [], irrf_brackets: [], dependant_deduction: 0 }); // Passing 0 dependants for quick view

                                                    return (
                                                        <tr key={collab.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                                                            <td className="px-6 py-4 whitespace-nowrap w-12">
                                                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(collab.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden">
                                                                        {collab.avatar_url ? <img src={collab.avatar_url} alt="" className="h-full w-full object-cover" /> : collab.full_name.charAt(0)}
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <div className="text-sm font-medium text-slate-900">{collab.full_name}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{collab.role}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-slate-700">
                                                                {currentSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                {adjustmentPercent > 0 && <span className="text-xs text-emerald-500 ml-1">+{adjustmentPercent}%</span>}
                                                            </td>
                                                            {mode === 'SALARY' && selectedIds.size > 0 && (
                                                                <>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono text-emerald-600 bg-emerald-50/50">
                                                                        {netCalc.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono text-indigo-600 bg-indigo-50/50">
                                                                        {compCost.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
