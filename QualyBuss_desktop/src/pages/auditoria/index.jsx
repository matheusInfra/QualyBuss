import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { useNotification } from '../../context/NotificationContext';
import { AUDIT_Dictionary, formatChange } from '../../utils/auditDictionary';

const Auditoria = () => {
    const { notify } = useNotification();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ tableName: '', operation: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        loadLogs();
    }, [page, filters]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const { data, totalPages: pages } = await auditService.getLogs({
                page,
                limit: 20,
                filters: {
                    tableName: filters.tableName !== 'all' ? filters.tableName : null,
                    operation: filters.operation !== 'all' ? filters.operation : null
                }
            });
            setLogs(data || []);
            setTotalPages(pages);
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao carregar logs de auditoria.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1); // Reset to page 1 on filter change
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Trilha de Auditoria</h1>
                    <p className="text-slate-500 mt-1">Histórico completo de segurança e alterações do sistema.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <select
                    name="tableName"
                    value={filters.tableName}
                    onChange={handleFilterChange}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">Todas as Tabelas</option>
                    <option value="leave_requests">Solicitações de Férias</option>
                    <option value="absence_transactions">Banco de Horas</option>
                    <option value="collaborators">Colaboradores</option>
                </select>

                <select
                    name="operation"
                    value={filters.operation}
                    onChange={handleFilterChange}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">Todas as Operações</option>
                    <option value="INSERT">Criação (INSERT)</option>
                    <option value="UPDATE">Alteração (UPDATE)</option>
                    <option value="DELETE">Exclusão (DELETE)</option>
                </select>

                <button onClick={loadLogs} className="ml-auto p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Atualizar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Data/Hora</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Tabela</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Operação</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">ID Registro</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Carregando auditoria...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                                {new Date(log.changed_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-sm text-slate-700 font-bold">{log.table_name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                                    ${log.operation === 'INSERT' ? 'bg-green-100 text-green-700' :
                                                        log.operation === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {log.operation}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500 font-mono">{log.record_id?.slice(0, 8)}...</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {expandedRow === log.id ? 'Ocultar' : 'Ver Alterações'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === log.id && (
                                            <tr className="bg-slate-50 border-b border-slate-200 animate-fade-in">
                                                <td colSpan="5" className="p-4">
                                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                                        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                                                            Detalhes da Alteração
                                                        </h4>

                                                        {(() => {
                                                            const changes = [];
                                                            const oldData = log.old_data || {};
                                                            const newData = log.new_data || {};

                                                            if (log.operation === 'INSERT') {
                                                                Object.keys(newData).forEach(key => {
                                                                    if (['id', 'created_at', 'updated_at', 'company_id'].includes(key)) return;
                                                                    changes.push(formatChange(key, null, newData[key]));
                                                                });
                                                            } else if (log.operation === 'UPDATE') {
                                                                Object.keys(newData).forEach(key => {
                                                                    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                                                                        if (['updated_at'].includes(key)) return;
                                                                        changes.push(formatChange(key, oldData[key], newData[key]));
                                                                    }
                                                                });
                                                            } else if (log.operation === 'DELETE') {
                                                                changes.push({ label: 'Registro Removido', text: 'Todos os dados foram apagados.' });
                                                            }

                                                            if (changes.length === 0) {
                                                                return <p className="text-sm text-slate-400 italic">Nenhuma alteração visível registrada.</p>;
                                                            }

                                                            return (
                                                                <ul className="space-y-3">
                                                                    {changes.map((change, idx) => (
                                                                        <li key={idx} className="flex items-start gap-3 text-sm">
                                                                            <span className="font-bold text-slate-700 min-w-[150px] text-right">
                                                                                {change.label}:
                                                                            </span>
                                                                            <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                                                {change.text}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            );
                                                        })()}

                                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                                            <span>ID do Registro: {log.record_id}</span>
                                                            <span>Alterado por: {log.changed_by}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 text-sm font-medium"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-slate-500">Página {page} de {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 text-sm font-medium"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auditoria;
