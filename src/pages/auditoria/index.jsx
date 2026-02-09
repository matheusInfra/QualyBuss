import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
<<<<<<< HEAD
import { kpiService } from '../../services/kpiService';
import { useNotification } from '../../context/NotificationContext';
// Import Drawer
import LogDetailsDrawer from '../../components/LogDetailsDrawer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    DocumentChartBarIcon,
    ExclamationCircleIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const Auditoria = () => {
    const { notify } = useNotification();
    const queryClient = useQueryClient();

    // State for Drawer
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Filters (Local state for now, could be moved to URL params)
    const [filters, setFilters] = useState({ module: 'all', search: '' });

    // --- Data Fetching (React Query) ---

    // 1. Logs Table
    const { data: logs = [], isLoading: loadingLogs, refetch } = useQuery({
        queryKey: ['auditLogs', filters], // Filters in key triggers refetch on change
        queryFn: async () => {
            // Note: Currently auditService.getLogs ignores filters if not passed
            // Ideally we pass filters here.
            const { data } = await auditService.getLogs({ limit: 50 });
            return data || [];
        },
        refetchInterval: 30000
    });

    // 2. Stats
    const { data: stats } = useQuery({
        queryKey: ['auditStats'],
        queryFn: kpiService.getAuditStats,
        refetchInterval: 60000
    });

    // 3. Realtime
    useEffect(() => {
        const channel = supabase.channel('audit-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                // When new log comes in:
                queryClient.invalidateQueries(['auditLogs']);
                queryClient.invalidateQueries(['auditStats']);
                // Optional: Show toast for critical actions
                if (payload.new.operation === 'DELETE') {
                    notify.info('Alerta de Segurança', 'Uma remoção de dados foi detectada.');
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient, notify]);


    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setIsDrawerOpen(true);
    };

    // Helper: Friendly Module Names
    const getModuleLabel = (tableName) => {
        const map = {
            'leave_requests': 'Solicitações de Férias',
            'absence_transactions': 'Banco de Horas',
            'collaborators': 'Cadastro de Colaboradores',
            'user_term_acceptances': 'Termos de Uso',
            'collaborator_documents': 'Gestão Documental',
            'salaries': 'Salários & Benefícios'
        };
        return map[tableName] || tableName;
    };

    // Default stats
    const displayStats = stats || { totalLogs: 0, criticalAlerts: 0, activeUsers: 0 };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Auditoria e Governança</h1>
                    <p className="text-sm text-slate-500">Log detalhado de alterações e segurança do sistema.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors" title="Atualizar">
                        <ArrowPathIcon className={`w-5 h-5 ${loadingLogs ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar logs..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm">
                        <FunnelIcon className="w-4 h-4" /> Filtros
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200">
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total de Auditorias</p>
                        <h2 className="text-2xl font-bold text-slate-900">{displayStats.totalLogs.toLocaleString()}</h2>
                        <span className="text-xs text-emerald-600 font-bold">Base Total</span>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <DocumentChartBarIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Alertas Críticos</p>
                        <h2 className="text-2xl font-bold text-slate-900">{displayStats.criticalAlerts}</h2>
                        <span className="text-xs text-red-600 font-bold">Últimas 24h</span>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <ExclamationCircleIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Usuários Ativos</p>
                        <h2 className="text-2xl font-bold text-slate-900">{displayStats.activeUsers}</h2>
                        <span className="text-xs text-slate-400">Recentes</span>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-4 py-3">Timestamp</th>
                            <th className="p-4 py-3">Usuário</th>
                            <th className="p-4 py-3">Módulo</th>
                            <th className="p-4 py-3">Ação</th>
                            <th className="p-4 py-3">Detalhes (Valor Anterior → Novo)</th>
                            <th className="p-4 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4 py-3 align-top whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">{new Date(log.changed_at).toLocaleDateString()}</span>
                                            <span className="text-xs text-slate-400">{new Date(log.changed_at).toLocaleTimeString()}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 py-3 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {log.changed_by ? log.changed_by.slice(0, 2).toUpperCase() : 'SYS'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {log.changed_by ? 'Usuário' : 'Sistema'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">{log.changed_by ? log.changed_by.slice(0, 6) + '...' : 'Automático'}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 py-3 align-top">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                            {getModuleLabel(log.table_name)}
                                        </span>
                                    </td>

                                    <td className="p-4 py-3 align-top">
                                        <ActionBadge op={log.operation} />
                                    </td>

                                    <td className="p-4 py-3 align-top">
                                        <div
                                            className="cursor-pointer hover:bg-indigo-50 p-2 -m-2 rounded transition-colors group/edit"
                                            onClick={() => handleViewDetails(log)}
                                        >
                                            <ChangesRenderer log={log} />
                                            <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover/edit:opacity-100 transition-opacity mt-1 block">
                                                Clique para ver detalhes completos
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4 py-3 align-top text-right">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sucesso
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <span>Mostrando registros recentes</span>
                </div>
            </div>

            {/* Details Drawer */}
            <LogDetailsDrawer
                log={selectedLog}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div>
    );
};

const ActionBadge = ({ op }) => {
    const styles = {
        'INSERT': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'UPDATE': 'bg-blue-50 text-blue-700 border-blue-100',
        'DELETE': 'bg-red-50 text-red-700 border-red-100'
    };
    const label = { 'INSERT': 'Criação', 'UPDATE': 'Edição', 'DELETE': 'Exclusão' };

    return (
        <span className={`px-2 py-0.5 rounded textxs font-bold border ${styles[op] || 'bg-gray-100'}`}>
            {label[op] || op}
        </span>
    );
};

const ChangesRenderer = ({ log }) => {
    if (log.operation === 'DELETE') return <span className="text-xs text-slate-400 italic">Registro removido permanentemente.</span>;
    if (log.operation === 'INSERT') return <span className="text-xs text-slate-500">Novo registro criado.</span>;

    const changes = Object.keys(log.new_data || {}).filter(k =>
        JSON.stringify(log.new_data[k]) !== JSON.stringify(log.old_data?.[k]) &&
        !['updated_at', 'created_at'].includes(k)
    );

    if (changes.length === 0) return <span className="text-xs text-slate-400">-</span>;

    return (
        <div className="space-y-1">
            {changes.slice(0, 3).map(key => (
                <div key={key} className="text-xs flex gap-2 items-center">
                    <span className="font-mono text-slate-500">{key}:</span>
                    <span className="text-red-400 line-through decoration-red-400/50 max-w-[60px] truncate">{String(log.old_data?.[key])}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-600 font-medium max-w-[100px] truncate">{String(log.new_data?.[key])}</span>
                </div>
            ))}
            {changes.length > 3 && <span className="text-[10px] text-indigo-500 font-medium cursor-pointer">+{changes.length - 3} outros campos</span>}
=======
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
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
        </div>
    );
};

export default Auditoria;
