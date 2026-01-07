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
    UserMinusIcon
} from '@heroicons/react/24/outline';

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
            color: 'red',
            trend: 'Atestados / Falta'
        },
        {
            title: 'Aniversariantes (Mês)',
            value: stats?.birthdays?.length || 0,
            icon: CakeIcon,
            color: 'pink',
            trend: 'Celebrar! 🎉'
        },
        {
            title: 'Férias Ativas',
            value: stats?.activeVacations || 0,
            icon: SunIcon,
            color: 'orange',
            trend: `${stats?.upcomingVacations || 0} programadas próx. semana`
        },
        {
            title: 'Movimentações Pendentes',
            value: stats?.pendingMovements || 0,
            icon: BriefcaseIcon,
            color: 'purple',
            trend: 'Aguardando aprovação'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-2 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Visão geral dos indicadores de RH e performance.</p>
                </div>
                <div className="text-sm text-slate-400 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    Última atualização: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2.5 rounded-xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{card.title}</h3>
                                <p className="text-2xl font-extrabold text-slate-800 mt-1 truncate" title={String(card.value)}>{card.value}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-50">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-${card.color}-50 text-${card.color}-600 inline-block`}>
                                    {card.trend}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

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
