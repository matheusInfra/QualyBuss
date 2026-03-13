import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../../services/payrollService';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import BenefitFormModal from './BenefitFormModal';

const BenefitAssignmentModal = ({ isOpen, onClose, collaborator }) => {
    const queryClient = useQueryClient();
    const [selectedBenefits, setSelectedBenefits] = useState({});
    const [isCreateOpen, setIsCreateOpen] = useState(false); // New State

    const { data: allBenefits = [] } = useQuery({
        queryKey: ['benefitsCatalog'],
        queryFn: payrollService.getBenefitsCatalog
    });

    const { data: userBenefits = [] } = useQuery({
        queryKey: ['collaboratorBenefits', collaborator?.id],
        queryFn: () => payrollService.getCollaboratorBenefits(collaborator.id),
        enabled: !!collaborator
    });

    useEffect(() => {
        if (isOpen && collaborator) {
            const initialSelection = {};
            userBenefits.forEach(b => {
                initialSelection[b.benefit_id] = true;
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedBenefits(initialSelection);
        }
    }, [isOpen, collaborator, userBenefits]);

    const mutation = useMutation({
        mutationFn: payrollService.assignBenefits,
        onSuccess: () => {
            queryClient.invalidateQueries(['collaboratorsSalary']);
            onClose();
            alert(`Benefícios de ${collaborator.full_name} atualizados!`);
        }
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: payrollService.createBenefit,
        onSuccess: () => {
            queryClient.invalidateQueries(['benefitsCatalog']);
            setIsCreateOpen(false);
            // Optional: Auto-select the created benefit?
        }
    });

    const toggleBenefit = (id) => {
        setSelectedBenefits(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSave = () => {
        const activeIds = Object.keys(selectedBenefits).filter(k => selectedBenefits[k]);
        mutation.mutate({ userId: collaborator.id, benefitIds: activeIds });
    };

    if (!collaborator) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">

                            {/* Header with Add Button */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 leading-6">
                                        Gerenciar Benefícios
                                    </Dialog.Title>
                                    <span className="text-sm font-normal text-slate-500">
                                        {collaborator.full_name}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsCreateOpen(true)}
                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        + Novo Tipo
                                    </button>
                                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {allBenefits.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-8">
                                        Nenhum benefício cadastrado no sistema.
                                    </p>
                                )}
                                {allBenefits.map(benefit => (
                                    <div
                                        key={benefit.id}
                                        onClick={() => toggleBenefit(benefit.id)}
                                        className={`
                                            cursor-pointer border rounded-xl p-4 flex items-center justify-between transition-all group
                                            ${selectedBenefits[benefit.id]
                                                ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedBenefits[benefit.id] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                                                {selectedBenefits[benefit.id] && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{benefit.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {benefit.category === 'HEALTH' ? 'Saúde' : benefit.category === 'TRANSPORT' ? 'Transporte' : benefit.category === 'MEAL' ? 'Alimentação' : 'Outros'}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {benefit.cost_type === 'FIXED'
                                                            ? `R$ ${benefit.value}`
                                                            : `${(benefit.value * 100).toFixed(1)}%`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${selectedBenefits[benefit.id] ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {selectedBenefits[benefit.id] ? 'VINCULADO' : 'DISPONÍVEL'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                    onClick={onClose}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
                                    onClick={handleSave}
                                >
                                    Salvar Vínculos
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>

                {/* Sub-Modal: Create Benefit */}
                <BenefitFormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSave={(newBenefit) => createMutation.mutate(newBenefit)}
                />
            </Dialog>
        </Transition>
    );
};

export default BenefitAssignmentModal;
