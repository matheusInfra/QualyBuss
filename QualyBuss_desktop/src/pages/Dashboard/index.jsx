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
    UserMinusIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

// Mapa estático de cores — Tailwind JIT não detecta classes interpoladas com template literals
const COLOR_MAP = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100',    border: 'border-blue-100',    blob: 'bg-blue-100/50',    badgeBg: 'bg-blue-50/50' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100',     border: 'border-red-100',     blob: 'bg-red-100/50',     badgeBg: 'bg-red-50/50' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', border: 'border-emerald-100', blob: 'bg-emerald-100/50', badgeBg: 'bg-emerald-50/50' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  ring: 'ring-orange-100',  border: 'border-orange-100',  blob: 'bg-orange-100/50',  badgeBg: 'bg-orange-50/50' },
    yellow:  { bg: 'bg-yellow-50',  text: 'text-yellow-600',  ring: 'ring-yellow-100',  border: 'border-yellow-100',  blob: 'bg-yellow-100/50',  badgeBg: 'bg-yellow-50/50' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  ring: 'ring-purple-100',  border: 'border-purple-100',  blob: 'bg-purple-100/50',  badgeBg: 'bg-purple-50/50' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    ring: 'ring-pink-100',    border: 'border-pink-100',    blob: 'bg-pink-100/50',    badgeBg: 'bg-pink-50/50' },
};

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

    // Formatação abreviada para evitar overflow em cards pequenos
    const formatCurrencyShort = (val) => {
        if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(1)}K`;
        return formatCurrency(val);
    };

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
            value: formatCurrencyShort(stats?.payroll || 0),
            fullValue: formatCurrency(stats?.payroll || 0),
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
                    const c = COLOR_MAP[card.color] || COLOR_MAP.blue;
                    return (
                        <div key={idx} className="relative group bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-slate-100/60 overflow-hidden flex flex-col justify-between h-full">
                            {/* Decorative Gradient Blob */}
                            <div className={`absolute -right-10 -top-10 w-32 h-32 ${c.blob} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-5">
                                    <div className={`p-3.5 rounded-2xl ${c.bg} ${c.text} ring-1 ${c.ring} shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.badgeBg} ${c.text} border ${c.border} backdrop-blur-sm`}>
                                        {card.trend}
                                    </span>
                                </div>
                                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">{card.title}</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight truncate" title={card.fullValue || String(card.value)}>{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- SEÇÃO: SAÚDE OPERACIONAL E COMPLIANCE (NOVO) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Compliance Score (Pie Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            Compliance
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm ${stats?.complianceRate >= 90 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                            {stats?.complianceRate || 0}% Score
                        </span>
                    </div>

                    <div className="flex-1 min-h-[160px] relative mt-4">
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Regular', value: stats?.complianceRate || 100 },
                                        { name: 'Pendente', value: 100 - (stats?.complianceRate || 0) }
                                    ]}
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell key="cell-0" fill="#6366f1" /> {/* Indigo */}
                                    <Cell key="cell-1" fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} /> {/* Slate 50 w/ border */}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mt-1">
                            <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats?.missingDocsCount || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Pendentes</span>
                        </div>
                    </div>
                </div>

                {/* 2. Auditoria e Segurança */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        Auditoria (24h)
                    </h3>

                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="group bg-gradient-to-br from-rose-50/50 to-orange-50/50 hover:from-rose-50 hover:to-orange-50 transition-colors rounded-xl p-4 border border-rose-100/50 flex items-center justify-between">
                            <div>
                                <p className="text-rose-900 font-bold text-sm tracking-tight">Ações Críticas</p>
                                <p className="text-[10px] text-rose-600/80 uppercase tracking-widest mt-1">Deleções ou alterações</p>
                            </div>
                            <span className="text-3xl font-black text-rose-600 drop-shadow-sm group-hover:scale-110 transition-transform">{stats?.auditCriticalAlerts || 0}</span>
                        </div>

                        <div className="group bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-800 font-bold text-sm tracking-tight">Logs Gerados</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Tráfego no sistema</p>
                            </div>
                            <span className="text-3xl font-black text-slate-700 group-hover:scale-110 transition-transform">{stats?.auditDailyLogs || 0}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Tempo Real (Métricas de Ponto Reais) */}
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-6 rounded-2xl shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] text-white flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.7)] transition-all duration-500">
                    {/* Background Pattern Effects */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl group-hover:bg-blue-300 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-indigo-900 opacity-20 rounded-full blur-2xl" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h3 className="font-extrabold text-white text-lg flex items-center gap-2 mb-1 tracking-tight">
                                <ChartBarIcon className="w-6 h-6 text-sky-200" />
                                Gestão de Jornada
                            </h3>
                            <p className="text-blue-100/80 text-xs font-medium tracking-wide uppercase">Taxa de Assiduidade (Mês)</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                            <span className="text-xl font-black text-white">{stats?.pontoComplianceRate ?? '--'}%</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-end mt-8">
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-sky-200 tracking-wider mb-1">Presenças Hoje</span>
                            <span className="text-5xl font-black tracking-tighter drop-shadow-md">
                                {stats?.pontoTodayOnTime !== undefined ? stats.pontoTodayOnTime : '--'}
                            </span>
                            <span className="text-sm font-medium text-blue-100 ml-2 animate-pulse">/ {stats?.pontoTotalExpectedToday || '--'}</span>
                        </div>
                        <div className="text-right bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/5 group-hover:bg-white/15 transition-colors">
                            <span className="block text-2xl font-bold text-rose-300 drop-shadow">
                                {stats?.pontoTodayDelays !== undefined ? stats.pontoTodayDelays : '--'}
                            </span>
                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wide">Atrasos / Faltas</p>
                        </div>
                    </div>

                    <button className="relative z-10 mt-6 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-indigo-700 rounded-xl text-xs font-bold transition-all duration-300 border border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] backdrop-blur-md">
                        Acessar Relatório Completo &rarr;
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Occurrences Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 mb-6">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </div>
                                Ocorrências do Mês
                            </h3>
                            <div className="space-y-5">
                                {Object.entries(stats?.occurrencesByType || {}).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <ClipboardDocumentCheckIcon className="w-12 h-12 text-slate-300 mb-2" />
                                        <p className="text-center text-slate-400 font-medium">Nenhuma ocorrência registrada.</p>
                                    </div>
                                ) : (
                                    Object.entries(stats?.occurrencesByType || {}).map(([type, count]) => {
                                        const percentage = Math.round((count / (stats?.occurrencesThisMonth || 1)) * 100);
                                        let color = 'bg-slate-500';
                                        let lightColor = 'bg-slate-100';
                                        if (type === 'ADVERTENCIA_VERBAL') { color = 'bg-amber-400'; lightColor = 'bg-amber-50'; }
                                        if (type === 'ADVERTENCIA_ESCRITA') { color = 'bg-orange-500'; lightColor = 'bg-orange-50'; }
                                        if (type === 'SUSPENSAO') { color = 'bg-rose-500'; lightColor = 'bg-rose-50'; }
                                        if (type === 'MERITO') { color = 'bg-emerald-500'; lightColor = 'bg-emerald-50'; }

                                        return (
                                            <div key={type} className="space-y-1.5 group">
                                                <div className="flex justify-between text-xs font-semibold items-center">
                                                    <span className="text-slate-600 capitalize tracking-wide">{type.replace('_', ' ').toLowerCase()}</span>
                                                    <span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{count}</span>
                                                </div>
                                                <div className={`h-2 ${lightColor} rounded-full overflow-hidden`}>
                                                    <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Department Distribution (PieChart) */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col">
                            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 mb-6">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <BuildingOfficeIcon className="w-5 h-5" />
                                </div>
                                Por Departamento
                            </h3>
                            <div className="flex-1 min-h-[250px] relative">
                                {Object.keys(stats?.deptDist || {}).length === 0 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                                        <BuildingOfficeIcon className="w-12 h-12 text-slate-300 mb-2" />
                                        <p className="text-center text-slate-400 font-medium pb-10">Sem departamentos vinculados.</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(stats?.deptDist || {})
                                                    .sort((a, b) => b[1] - a[1])
                                                    .map(([name, value]) => ({ name, value }))
                                                }
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {Object.entries(stats?.deptDist || {}).map((entry, index) => {
                                                    // Soft cool colors palette
                                                    const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#ec4899', '#3b82f6', '#0ea5e9'];
                                                    return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                                })}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}
                                                formatter={(value) => [value, 'Colaboradores']}
                                            />
                                            <Legend
                                                layout="vertical"
                                                verticalAlign="middle"
                                                align="right"
                                                wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}
                                                payload={Object.entries(stats?.deptDist || {})
                                                    .sort((a, b) => b[1] - a[1])
                                                    .slice(0, 5) // Max 5 label pra não quebrar UI
                                                    .map(([name, value], index) => {
                                                        const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#ec4899', '#3b82f6', '#0ea5e9'];
                                                        return { id: name, type: 'circle', value: `${name} (${value})`, color: COLORS[index % COLORS.length] };
                                                    })}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Birthdays List */}
                    {stats?.birthdays?.length > 0 && (
                        <div className="bg-gradient-to-r from-fuchsia-50 via-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100/50 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                            <h3 className="font-extrabold text-pink-900 text-lg flex items-center gap-2 mb-6 relative z-10 tracking-tight">
                                <div className="p-2 bg-white/60 backdrop-blur-sm rounded-lg text-pink-600 shadow-sm">
                                    <CakeIcon className="w-5 h-5" />
                                </div>
                                Aniversariantes do Mês
                            </h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar relative z-10 px-1">
                                {stats.birthdays.map(c => {
                                    const bday = new Date(c.birth_date);
                                    return (
                                        <div key={c.id} className="min-w-[140px] bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-white flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-all duration-300">
                                            <div className="w-14 h-14 rounded-full mb-3 bg-pink-100 overflow-hidden ring-4 ring-white shadow-sm">
                                                <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${c.full_name}`} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="font-bold text-slate-800 text-xs truncate w-full">{c.full_name}</p>
                                            <p className="text-[10px] font-black tracking-widest uppercase text-pink-500 mt-1.5 bg-pink-50 px-2 py-0.5 rounded-full ring-1 ring-pink-100">
                                                Dia {bday.getUTCDate()}
                                            </p>
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
