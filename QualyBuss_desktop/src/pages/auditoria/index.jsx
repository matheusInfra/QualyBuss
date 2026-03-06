import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { kpiService } from '../../services/kpiService';
import { timeManagementService } from '../../services/timeManagementService'; // Added for Risk Data
import { useNotification } from '../../contexts/NotificationContext';
// Import Drawer
import LogDetailsDrawer from '../../components/LogDetailsDrawer';
import RiskDetailDrawer from '../../components/RiskDetailDrawer'; // New Drawer
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

    // State for Drawers
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isRiskDrawerOpen, setIsRiskDrawerOpen] = useState(false); // New Risk State

    // Filters (Local state for now, could be moved to URL params)
    const [filters, setFilters] = useState({ module: 'all', search: '' });

    // --- Data Fetching (React Query) ---

    // 1. Logs Table
    const { data: logs = [], isLoading: loadingLogs, refetch } = useQuery({
        queryKey: ['auditLogs', filters], // Filters in key triggers refetch on change
        queryFn: async () => {
            // Pass filters to service
            const { data } = await auditService.getLogs({
                limit: 50,
                filters: {
                    search: filters.search
                }
            });
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

    // 3. Risks (Fetch Critical Anomalies)
    // We reuse the timeManagement logic to find daily anomalies
    // 3. Risks (Fetch Critical Anomalies from TIME and SECURITY)
    const { data: risks = [] } = useQuery({
        queryKey: ['riskAlerts'],
        queryFn: async () => {
            const today = new Date().toISOString().slice(0, 10);

            // A. Time Anomalies
            const timePromise = timeManagementService.getAllEntries({ startDate: today, endDate: today });

            // B. Security Alerts (DELETEs last 24h)
            const secPromise = auditService.getSecurityAlerts(24);

            const [entries, securityLogs] = await Promise.all([timePromise, secPromise]);

            // Map Time Risks
            const timeRisks = entries
                .filter(e => e.computedAnomaly && e.computedAnomaly.type === 'CRITICAL')
                .map(e => ({
                    id: `time_${e.id}`,
                    user: e.userName,
                    type: `PONTO: ${e.computedAnomaly.text}`,
                    severity: 'HIGH',
                    time: new Date(e.clock_in).toLocaleTimeString().slice(0, 5),
                    source: 'TIME'
                }));

            // Map Security Risks
            const secRisks = securityLogs.map(log => ({
                id: `sec_${log.id}`,
                user: log.changed_by || 'Sistema',
                type: `SEGURANÇA: Remoção em ${log.table_name}`,
                severity: 'CRITICAL',
                time: new Date(log.changed_at).toLocaleTimeString().slice(0, 5),
                source: 'SECURITY'
            }));

            return [...secRisks, ...timeRisks];
        },
        refetchInterval: 60000
    });

    // 4. Realtime
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
                <div
                    onClick={() => setIsRiskDrawerOpen(true)}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-red-300 transition-colors group"
                >
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1 group-hover:text-red-700">Alertas Críticos</p>
                        <h2 className="text-2xl font-bold text-slate-900 group-hover:text-red-700">{displayStats.criticalAlerts}</h2>
                        <span className="text-xs text-red-600 font-bold">Últimas 24h</span>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100">
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

            {/* Risk Drawer */}
            <RiskDetailDrawer
                isOpen={isRiskDrawerOpen}
                onClose={() => setIsRiskDrawerOpen(false)}
                risks={risks} // Real Data
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
        </div>
    );
};

export default Auditoria;
