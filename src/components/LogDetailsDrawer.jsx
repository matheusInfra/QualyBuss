import React, { useEffect } from 'react';
import { XMarkIcon, UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const LogDetailsDrawer = ({ log, onClose, isOpen }) => {
    // Determine friendly titles
    const getModuleLabel = (tableName) => {
        const map = {
            'leave_requests': 'Solicitações de Férias',
            'absence_transactions': 'Banco de Horas',
            'collaborators': 'Cadastro de Colaboradores',
            'user_term_acceptances': 'Termos de Uso',
            'collaborator_documents': 'Gestão Documental'
        };
        return map[tableName] || tableName;
    };

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity opacity-100"
                    onClick={onClose}
                />

                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    {/* Slide-over panel */}
                    <div className="pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 translate-x-0">
                        <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">

                            {/* Header */}
                            <div className="bg-slate-900 px-4 py-6 sm:px-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold leading-6 text-white" id="slide-over-title">
                                            Detalhes da Auditoria
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-400">
                                            ID: {log?.id?.slice(0, 8)}...
                                        </p>
                                    </div>
                                    <div className="ml-3 flex h-7 items-center">
                                        <button
                                            type="button"
                                            className="relative rounded-md bg-slate-800 text-slate-200 hover:text-white focus:outline-none"
                                            onClick={onClose}
                                        >
                                            <span className="absolute -inset-2.5"></span>
                                            <span className="sr-only">Fechar painel</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            {log && (
                                <div className="relative mt-6 flex-1 px-4 sm:px-6 space-y-8 pb-10">

                                    {/* Action Summary */}
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                                            ${log.operation === 'INSERT' ? 'bg-emerald-100 text-emerald-600' :
                                                log.operation === 'DELETE' ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-600'}`}>
                                            {log.operation?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">
                                                {log.operation === 'INSERT' ? 'Novo Registro Criado' :
                                                    log.operation === 'DELETE' ? 'Registro Removido' :
                                                        'Registro Atualizado'}
                                            </h3>
                                            <p className="text-sm text-slate-500">{getModuleLabel(log.table_name)}</p>
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <UserCircleIcon className="w-4 h-4" /> Responsável
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                {log.changed_by ? 'U' : 'S'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{log.changed_by || 'Sistema Automático'}</p>
                                                <p className="text-xs text-slate-400">ID: {log.changed_by || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Info */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4" /> Metadados de Tempo
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-[10px] text-slate-400 uppercase">Data</p>
                                                <p className="text-sm font-medium text-slate-800">{new Date(log.changed_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-[10px] text-slate-400 uppercase">Hora</p>
                                                <p className="text-sm font-medium text-slate-800">{new Date(log.changed_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Diff (The Core) */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                                            Detalhamento das Alterações
                                        </h4>

                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            {(() => {
                                                if (log.operation === 'INSERT') {
                                                    return (
                                                        <div className="bg-emerald-50/50 p-4">
                                                            <pre className="text-xs text-emerald-800 overflow-x-auto whitespace-pre-wrap">
                                                                {JSON.stringify(log.new_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                                if (log.operation === 'DELETE') {
                                                    return (
                                                        <div className="bg-red-50/50 p-4">
                                                            <pre className="text-xs text-red-800 overflow-x-auto whitespace-pre-wrap">
                                                                {JSON.stringify(log.old_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                                // UPDATE
                                                const keys = Array.from(new Set([...Object.keys(log.old_data || {}), ...Object.keys(log.new_data || {})]));
                                                const changes = keys.filter(k =>
                                                    JSON.stringify(log.old_data?.[k]) !== JSON.stringify(log.new_data?.[k]) &&
                                                    !['updated_at'].includes(k)
                                                );

                                                if (changes.length === 0) return <div className="p-4 text-sm text-slate-400">Sem alterações detectáveis.</div>;

                                                return (
                                                    <div className="divide-y divide-slate-200">
                                                        {changes.map(key => (
                                                            <div key={key} className="p-3 bg-white hover:bg-slate-50 transition-colors">
                                                                <p className="text-xs font-bold text-slate-700 mb-1">{key}</p>
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <div className="bg-red-50 text-red-700 p-2 rounded border border-red-100 break-all">
                                                                        <span className="block text-[9px] uppercase text-red-400 mb-0.5">Antes</span>
                                                                        {String(JSON.stringify(log.old_data?.[key]))}
                                                                    </div>
                                                                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded border border-emerald-100 break-all">
                                                                        <span className="block text-[9px] uppercase text-emerald-400 mb-0.5">Depois</span>
                                                                        {String(JSON.stringify(log.new_data?.[key]))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogDetailsDrawer;
