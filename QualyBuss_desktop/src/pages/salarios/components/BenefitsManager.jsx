import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '../../../services/payrollService';
import { PlusIcon, TicketIcon, HeartIcon, TruckIcon } from '@heroicons/react/24/outline';

import BenefitFormModal from './BenefitFormModal';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Ensure useQueryClient is imported

const getBenefitIcon = (category) => {
    switch (category) {
        case 'HEALTH': return <HeartIcon className="w-5 h-5 text-rose-500" />;
        case 'TRANSPORT': return <TruckIcon className="w-5 h-5 text-blue-500" />;
        case 'MEAL': return <TicketIcon className="w-5 h-5 text-amber-500" />;
        default: return <PlusIcon className="w-5 h-5 text-slate-500" />;
    }
}

const BenefitsManager = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState(null);

    const { data: benefits = [], isLoading } = useQuery({
        queryKey: ['benefitsCatalog'],
        queryFn: payrollService.getBenefitsCatalog
    });

    const createMutation = useMutation({
        mutationFn: payrollService.createBenefit,
        onSuccess: () => {
            queryClient.invalidateQueries(['benefitsCatalog']);
            setIsModalOpen(false);
            setEditingBenefit(null);
            alert("Benefício criado com sucesso!");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => payrollService.updateBenefit(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries(['benefitsCatalog']);
            setIsModalOpen(false);
            setEditingBenefit(null);
            alert("Benefício atualizado com sucesso!");
        }
    });

    const handleSave = (benefitData) => {
        if (editingBenefit) {
            updateMutation.mutate({ id: editingBenefit.id, updates: benefitData });
        } else {
            createMutation.mutate(benefitData);
        }
    };

    const handleEdit = (benefit) => {
        setEditingBenefit(benefit);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingBenefit(null);
        setIsModalOpen(true);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando catálogo...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Catálogo de Benefícios</h2>
                    <p className="text-sm text-slate-500">Gerencie os benefícios oferecidos pela empresa.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Novo Benefício
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map(benefit => (
                    <div key={benefit.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-slate-50 rounded-lg">
                                {getBenefitIcon(benefit.category)}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${benefit.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {benefit.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>

                        <h3 className="font-bold text-slate-900">{benefit.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">{benefit.category}</p>

                        <div className="space-y-2 border-t border-slate-100 pt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Valor Base:</span>
                                <span className="font-mono text-slate-900 font-medium">
                                    {benefit.cost_type === 'FIXED'
                                        ? benefit.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                        : `${(benefit.value * 100).toFixed(1)}% do Salário`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Coparticipação:</span>
                                <span className="font-mono text-slate-900">
                                    {(benefit.default_coparticipation * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(benefit)}
                                className="text-xs text-indigo-600 font-medium hover:underline"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <BenefitFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                benefitToEdit={editingBenefit}
                onSave={handleSave}
            />
        </div>
    );
};

export default BenefitsManager;
