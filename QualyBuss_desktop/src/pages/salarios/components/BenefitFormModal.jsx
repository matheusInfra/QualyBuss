import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const BenefitFormModal = ({ isOpen, onClose, benefitToEdit, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'OTHER',
        cost_type: 'FIXED',
        value: '',
        default_coparticipation: '',
        active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (benefitToEdit) {
                setFormData({
                    name: benefitToEdit.name,
                    category: benefitToEdit.category,
                    cost_type: benefitToEdit.cost_type,
                    value: benefitToEdit.value,
                    default_coparticipation: benefitToEdit.default_coparticipation,
                    active: benefitToEdit.active
                });
            } else {
                // Reset for new
                setFormData({
                    name: '',
                    category: 'OTHER',
                    cost_type: 'FIXED',
                    value: '',
                    default_coparticipation: '0',
                    active: true
                });
            }
        }
    }, [isOpen, benefitToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            value: Number(formData.value),
            default_coparticipation: Number(formData.default_coparticipation)
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 leading-6">
                                        {benefitToEdit ? 'Editar Benefício' : 'Novo Benefício'}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Nome do Benefício</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            placeholder="Ex: Vale Cultura"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Categoria</label>
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            >
                                                <option value="HEALTH">Saúde</option>
                                                <option value="TRANSPORT">Transporte</option>
                                                <option value="MEAL">Alimentação</option>
                                                <option value="OTHER">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Tipo de Custo</label>
                                            <select
                                                value={formData.cost_type}
                                                onChange={e => setFormData({ ...formData, cost_type: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            >
                                                <option value="FIXED">Valor Fixo (R$)</option>
                                                <option value="PERCENTAGE">Porcentagem (%)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">
                                                {formData.cost_type === 'FIXED' ? 'Valor (R$)' : 'Alíquota (0.0 - 1.0)'}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.value}
                                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Coparticipação (0-1)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                required
                                                value={formData.default_coparticipation}
                                                onChange={e => setFormData({ ...formData, default_coparticipation: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Ex: 0.2 para 20%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="active"
                                            checked={formData.active}
                                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="active" className="text-sm font-medium text-slate-700">
                                            Benefício Ativo
                                        </label>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex justify-center rounded-lg border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default BenefitFormModal;
