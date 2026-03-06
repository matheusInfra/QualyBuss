import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../../services/payrollService';
import { CheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const TaxConfiguration = () => {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    const { data: settings, isLoading } = useQuery({
        queryKey: ['payrollSettings'],
        queryFn: payrollService.getSettings
    });

    useEffect(() => {
        if (settings) {
            setLocalSettings(JSON.parse(JSON.stringify(settings))); // Deep copy
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: payrollService.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries(['payrollSettings']);
            setHasChanges(false);
            alert("Configurações salvas com sucesso!"); // Primitive alert for MVP
        }
    });

    const handleSave = () => {
        mutation.mutate(localSettings);
    };

    const updateBracket = (type, index, field, value) => {
        const newSettings = { ...localSettings };
        newSettings[type][index][field] = Number(value);
        setLocalSettings(newSettings);
        setHasChanges(true);
    };

    const addBracket = (type) => {
        const newSettings = { ...localSettings };
        const newBracket = type === 'inss_brackets'
            ? { limit: 0, rate: 0, deduction: 0 }
            : { limit: 0, rate: 0, deduction: 0 };
        newSettings[type].push(newBracket);
        setLocalSettings(newSettings);
        setHasChanges(true);
    };

    const removeBracket = (type, index) => {
        const newSettings = { ...localSettings };
        newSettings[type].splice(index, 1);
        setLocalSettings(newSettings);
        setHasChanges(true);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;

    if (!localSettings) {
        return (
            <div className="p-12 text-center animate-fade-in">
                <div className="bg-amber-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma Configuração Encontrada</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    O banco de dados de taxas fiscais está vazio. Clique abaixo para carregar as tabelas de INSS e IRRF vigentes (2024).
                </p>
                <button
                    onClick={() => {
                        payrollService.initializeDefaults().then(() => {
                            queryClient.invalidateQueries(['payrollSettings']);
                            alert("Padrões 2024 carregados com sucesso!");
                        }).catch(err => alert("Erro ao inicializar: " + err.message));
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                >
                    Inicializar Tabelas 2024
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Actions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Tabelas de Incidência (2024/2025)</h2>
                    <p className="text-sm text-slate-500">Defina as faixas de tributação. Cuidado: Alterações impactam todos os cálculos.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                    <CheckIcon className="w-5 h-5" />
                    Salvar Alterações
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* INSS Config */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Tabela INSS (Progressiva)</h3>
                        <button onClick={() => addBracket('inss_brackets')} className="text-xs text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">+ Add Faixa</button>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase">
                            <div className="col-span-5">Até (Limite R$)</div>
                            <div className="col-span-3">Alíquota (%)</div>
                            <div className="col-span-3">Dedução (R$)</div>
                            <div className="col-span-1"></div>
                        </div>
                        {localSettings.inss_brackets.map((bracket, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5">
                                    <input
                                        type="number"
                                        value={bracket.limit}
                                        onChange={(e) => updateBracket('inss_brackets', idx, 'limit', e.target.value)}
                                        className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="col-span-3 relative">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={bracket.rate}
                                        onChange={(e) => updateBracket('inss_brackets', idx, 'rate', e.target.value)}
                                        className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500 pr-4"
                                    />
                                    <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        value={bracket.deduction || 0}
                                        onChange={(e) => updateBracket('inss_brackets', idx, 'deduction', e.target.value)}
                                        className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => removeBracket('inss_brackets', idx)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* IRRF Config */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Tabela IRRF</h3>
                        <div className="flex items-center gap-3">
                            <div className="text-xs">
                                <span className="text-slate-500 mr-1">Por Dependente:</span>
                                <input
                                    type="number"
                                    className="w-20 border-slate-200 rounded p-1 text-xs"
                                    value={localSettings.dependant_deduction}
                                    onChange={(e) => {
                                        setLocalSettings({ ...localSettings, dependant_deduction: Number(e.target.value) });
                                        setHasChanges(true);
                                    }}
                                />
                            </div>
                            <button onClick={() => addBracket('irrf_brackets')} className="text-xs text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">+ Add Faixa</button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase">
                            <div className="col-span-5">Até (Limite R$)</div>
                            <div className="col-span-3">Alíquota (%)</div>
                            <div className="col-span-3">Dedução (R$)</div>
                            <div className="col-span-1"></div>
                        </div>
                        {localSettings.irrf_brackets.map((bracket, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5">
                                    <input
                                        type="number"
                                        value={bracket.limit}
                                        onChange={(e) => updateBracket('irrf_brackets', idx, 'limit', e.target.value)}
                                        className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="col-span-3 relative">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={bracket.rate}
                                        onChange={(e) => updateBracket('irrf_brackets', idx, 'rate', e.target.value)}
                                        className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500 pr-4"
                                    />
                                    <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        value={bracket.deduction || 0}
                                        onChange={(e) => updateBracket('irrf_brackets', idx, 'deduction', e.target.value)}
                                        className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => removeBracket('irrf_brackets', idx)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxConfiguration;
