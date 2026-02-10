import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { timeManagementService } from '../services/timeManagementService';

export default function EditEntryModal({ isOpen, onClose, entry, onSave }) {
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        type: '',
        justification: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (entry) {
            const d = new Date(entry.clock_in);
            // Format for datetime-local usage or separate inputs
            setFormData({
                date: d.toISOString().slice(0, 10),
                time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: entry.type,
                justification: entry.admin_notes || ''
            });
        }
    }, [entry]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Reconstruct ISO/Timestamp
            const [hours, minutes] = formData.time.split(':');
            const newDate = new Date(formData.date);
            newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Timezone offset correction if needed, but local construction usually works for simple cases.
            // Ideally use date-fns or moment but sticking to vanilla for now.

            await timeManagementService.updateEntryDetails(entry.id, {
                clock_in: newDate.toISOString(),
                type: formData.type,
                justification: formData.justification
            });
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to update entry", error);
            alert("Erro ao atualizar registro.");
        } finally {
            setIsLoading(false);
        }
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
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                >
                                    Editar Registro de Ponto
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Data</label>
                                            <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Hora</label>
                                            <input
                                                type="time"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.time}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tipo de Marcação</label>
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="ENTRY">Entrada</option>
                                            <option value="BREAK_START">Início Intervalo</option>
                                            <option value="BREAK_END">Fim Intervalo</option>
                                            <option value="EXIT">Saída</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Justificativa / Motivo</label>
                                        <textarea
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            rows={3}
                                            required
                                            value={formData.justification}
                                            onChange={e => setFormData({ ...formData, justification: e.target.value })}
                                            placeholder="Ex: Esquecimento, Ajuste de horário..."
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none"
                                            onClick={onClose}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                                        >
                                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
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
}
