import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Using same icon style as others

export default function RiskDetailDrawer({ isOpen, onClose, risks = [], onResolve }) {
    // Mock Data if empty (for demo)
    const displayRisks = risks.length > 0 ? risks : [
        { id: 1, user: 'João Silva', type: 'Ponto fora do Perímetro', severity: 'HIGH', time: '10:00' },
        { id: 2, user: 'Maria Souza', type: 'Documento Expirado', severity: 'MEDIUM', time: 'Yesterday' }
    ];

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />

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
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="px-4 py-6 sm:px-6 bg-red-50 border-b border-red-100">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className="text-lg font-bold text-red-900 flex items-center gap-2">
                                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                                    Alertas de Risco
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md text-red-400 hover:text-red-500 focus:outline-none"
                                                        onClick={onClose}
                                                    >
                                                        <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-sm text-red-700">
                                                Ações imediatas requeridas para conformidade.
                                            </p>
                                        </div>

                                        <div className="relative mt-6 flex-1 px-4 sm:px-6 space-y-4">
                                            {displayRisks.map((risk) => (
                                                <div key={risk.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{risk.type}</h4>
                                                            <p className="text-xs text-slate-500">{risk.user} • {risk.time}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${risk.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {risk.severity}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                                                        <button
                                                            onClick={() => onResolve && onResolve(risk.id)}
                                                            className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded hover:bg-slate-100"
                                                        >
                                                            Ignorar
                                                        </button>
                                                        <button className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-sm shadow-red-200">
                                                            Resolver
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
