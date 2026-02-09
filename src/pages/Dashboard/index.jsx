import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import {
    UsersIcon,
    ClipboardDocumentCheckIcon,
    SunIcon,
    BriefcaseIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    CurrencyDollarIcon,
    CakeIcon,
    BuildingOfficeIcon,
<<<<<<< HEAD
    UserMinusIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
=======
    UserMinusIcon
} from '@heroicons/react/24/outline';
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Initial Load
                const kpis = await dashboardService.getKPIs();
                const activity = await dashboardService.getRecentActivity();
                setStats(kpis);
                setRecentActivity(activity);
            } catch (error) {
                console.error("Failed to load dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Realtime Subscription
        const unsubscribe = dashboardService.subscribeToChanges((newData, isActivity = false) => {
            if (isActivity) {
                setRecentActivity(newData.recentActivity);
            } else {
                setStats(prev => ({ ...prev, ...newData }));
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p>Carregando indicadores...</p>
            </div>
        );
    }

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const cards = [
        {
            title: 'Colaboradores Ativos',
            value: stats?.activeCollaborators || 0,
            icon: UsersIcon,
            color: 'blue',
            trend: `Tempo Médio: ${stats?.avgTenureYears || 0} anos`
        },
        {
            title: 'Turnover (Rotatividade)',
            value: `${stats?.turnoverRate || 0}%`,
            icon: ArrowTrendingUpIcon, // Reusing trending up or maybe ArrowPath would be better if imported
            color: 'red',
            trend: 'Taxa Trimestral'
        },
        {
            title: 'Folha Estimada',
            value: formatCurrency(stats?.payroll || 0),
            icon: CurrencyDollarIcon,
            color: 'emerald',
            trend: 'Mensal'
        },
        {
            title: 'Ausências Hoje',
            value: stats?.activeAbsences || 0,
            icon: UserMinusIcon,
            color: 'orange',
            trend: 'Atestados / Falta'
        },
        {
            title: 'Férias Ativas',
            value: stats?.activeVacations || 0,
            icon: SunIcon,
            color: 'yellow',
            trend: `${stats?.upcomingVacations || 0} programadas`
        },
        {
            title: 'Movimentações',
            value: stats?.pendingMovements || 0,
            icon: BriefcaseIcon,
            color: 'purple',
            trend: 'Pendentes de Aprovação'
        },
        {
            title: 'Aniversariantes',
            value: stats?.birthdays?.length || 0,
            icon: CakeIcon,
            color: 'pink',
            trend: 'Neste Mês 🎉'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-2 pb-20 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg font-light">Visão geral dos indicadores de RH e performance.</p>
                </div>
                <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm font-medium">
                    Última atualização: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-${card.color}-50 text-${card.color}-600`}>
                                        {card.trend}
                                    </span>
                                </div>
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight truncate" title={String(card.value)}>{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

<<<<<<< HEAD
            {/* --- SEÇÃO: SAÚDE OPERACIONAL E COMPLIANCE (NOVO) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Compliance Score (Pie Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
                            Compliance de Documentos
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${stats?.complianceRate >= 90 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {stats?.complianceRate || 0}% Score
                        </span>
                    </div>

                    <div className="flex-1 min-h-[160px] relative">
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Regular', value: stats?.complianceRate || 100 },
                                        { name: 'Pendente', value: 100 - (stats?.complianceRate || 0) }
                                    ]}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell key="cell-0" fill="#6366f1" /> {/* Indigo */}
                                    <Cell key="cell-1" fill="#f1f5f9" /> {/* Slate 100 */}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-2xl font-black text-slate-800">{stats?.missingDocsCount || 0}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pendentes</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                        Colaboradores com documentação incompleta/ausente.
                    </p>
                </div>

                {/* 2. Auditoria e Segurança */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                        Auditoria & Segurança (24h)
                    </h3>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex items-center justify-between">
                            <div>
                                <p className="text-red-800 font-bold text-sm">Ações Críticas</p>
                                <p className="text-xs text-red-600">Deleções ou alterações sensíveis</p>
                            </div>
                            <span className="text-2xl font-black text-red-600">{stats?.auditCriticalAlerts || 0}</span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-800 font-bold text-sm">Logs Gerados</p>
                                <p className="text-xs text-slate-500">Movimentação total do sistema</p>
                            </div>
                            <span className="text-2xl font-black text-slate-700">{stats?.auditDailyLogs || 0}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Tempo Real (Mock/Placeholder para Ponto) */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl" />

                    <div>
                        <h3 className="font-bold text-blue-100 flex items-center gap-2 mb-1">
                            <ChartBarIcon className="w-5 h-5" />
                            Gestão de Jornada (Hoje)
                        </h3>
                        <p className="text-blue-200 text-xs">Visão em tempo real do ponto.</p>
                    </div>

                    <div className="flex justify-between items-end mt-6">
                        <div>
                            <span className="text-4xl font-black tracking-tighter">
                                {Math.round((stats?.activeCollaborators || 0) * 0.9)} {/* Simulando 90% presentes */}
                            </span>
                            <p className="text-sm font-bold text-blue-100">Presenças Confirmadas</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-orange-300">
                                {Math.round((stats?.activeCollaborators || 0) * 0.05)} {/* 5% atrasos */}
                            </span>
                            <p className="text-xs font-bold text-blue-200">Atrasos / Irregulares</p>
                        </div>
                    </div>

                    <button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors border border-white/10">
                        Ver Espelho de Ponto &rarr;
                    </button>
                </div>
            </div>

=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Occurrences Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
                                <ClipboardDocumentCheckIcon className="w-5 h-5 text-slate-400" />
                                Ocorrências do Mês
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(stats?.occurrencesByType || {}).length === 0 ? (
                                    <p className="text-center text-slate-400 py-10">Sem ocorrências este mês.</p>
                                ) : (
                                    Object.entries(stats?.occurrencesByType || {}).map(([type, count]) => {
                                        const percentage = Math.round((count / (stats?.occurrencesThisMonth || 1)) * 100);
                                        let color = 'bg-slate-500';
                                        if (type === 'ADVERTENCIA_VERBAL') color = 'bg-yellow-400';
                                        if (type === 'ADVERTENCIA_ESCRITA') color = 'bg-orange-400';
                                        if (type === 'SUSPENSAO') color = 'bg-red-500';
                                        if (type === 'MERITO') color = 'bg-green-500';

                                        return (
                                            <div key={type} className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-slate-700 capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                                                    <span className="text-slate-500">{count}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Department Distribution */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
                                <BuildingOfficeIcon className="w-5 h-5 text-slate-400" />
                                Por Departamento
                            </h3>
                            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {Object.entries(stats?.deptDist || {}).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                                    <div key={dept} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{dept}</span>
                                        <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200">{count} colab.</span>
                                    </div>
                                ))}
                                {Object.keys(stats?.deptDist || {}).length === 0 && <p className="text-center text-slate-400 py-4">Sem dados.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Birthdays List */}
                    {stats?.birthdays?.length > 0 && (
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-100">
                            <h3 className="font-bold text-pink-800 text-lg flex items-center gap-2 mb-4">
                                <CakeIcon className="w-6 h-6 text-pink-500" />
                                Aniversariantes do Mês
                            </h3>
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                {stats.birthdays.map(c => {
                                    const bday = new Date(c.birth_date);
                                    return (
                                        <div key={c.id} className="min-w-[140px] bg-white p-4 rounded-xl shadow-sm border border-pink-100 flex flex-col items-center text-center hover:scale-105 transition-transform">
                                            <div className="w-12 h-12 rounded-full mb-2 bg-pink-100 overflow-hidden ring-2 ring-white shadow-sm">
                                                <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${c.full_name}`} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="font-bold text-slate-800 text-xs truncate w-full">{c.full_name}</p>
                                            <p className="text-[10px] font-bold text-pink-500 mt-1">Dia {bday.getUTCDate()}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-slate-400" />
                            Atividade Recente
                        </h3>

                        <div className="space-y-6">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Nenhuma atividade recente.</p>
                            ) : (
                                recentActivity.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        {idx !== recentActivity.length - 1 && (
                                            <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6" />
                                        )}
                                        <div className={`
                                            w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0 z-10
                                            ${item.category === 'OCCURRENCE' ? 'bg-orange-400' : 'bg-purple-400'}
                                        `} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">
                                                {item.collaborators?.full_name || 'Desconhecido'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {item.category === 'OCCURRENCE'
                                                    ? `Ocorrência: ${item.title}`
                                                    : `Movimentação: ${item.type}`}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(item.created_at).toLocaleDateString()} às {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
