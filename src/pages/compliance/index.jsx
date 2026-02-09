import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { kpiService } from '../../services/kpiService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    ClockIcon,
    ShieldCheckIcon,
    DocumentCheckIcon
} from '@heroicons/react/24/solid';

// Fix for Leaflet Icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Compliance = () => {
    const queryClient = useQueryClient();

    // State for Filter & Map Interaction
    const [selectedUser, setSelectedUser] = useState(null); // 'null' for all
    const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);
    const [mapZoom, setMapZoom] = useState(10);
    const [triggerFly, setTriggerFly] = useState(0); // Incr to trigger effect

    // 1. Fetch Stats (Score, Pending, etc.)
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['complianceStats'],
        queryFn: kpiService.getComplianceStats,
        refetchInterval: 30000, // Refresh every 30s
    });

    // 2. Fetch Geo Events (Map Feed) with Filter
    const { data: events = [], isLoading: loadingEvents } = useQuery({
        queryKey: ['geoEvents', selectedUser], // Re-fetch when user changes
        queryFn: () => kpiService.getGeoEvents(50, selectedUser),
        refetchInterval: 15000,
    });

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase.channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborator_documents' }, () => {
                queryClient.invalidateQueries(['complianceStats']);
                queryClient.invalidateQueries(['geoEvents']);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_term_acceptances' }, () => {
                queryClient.invalidateQueries(['geoEvents']);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    const isLoading = loadingStats || loadingEvents;

    // Default stats if loading or error
    const displayStats = stats || {
        complianceScore: 0,
        pendingSignatures: 0,
        activeAlerts: 0,
        verifiedLocations: 0
    };

    // Helper: Fly Map to Location
    const flyToLocation = (lat, lng) => {
        setMapCenter([lat, lng]);
        setMapZoom(16); // Close up zoom
        setTriggerFly(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-fade-in">

            {/* Header / Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitor de Conformidade DP</h1>
                    <p className="text-sm text-slate-500">Supervisão em tempo real de conformidade e segurança geográfica.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* User Filter Mockup (Ideally fetch users list) */}
                    <select
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => setSelectedUser(e.target.value || null)}
                        value={selectedUser || ''}
                    >
                        <option value="">Todos Colaboradores</option>
                        {/* In real app, map users here. For verify, paste a UUID if needed */}
                    </select>

                    <span className={`flex items-center px-3 py-1 rounded-full text-xs font-bold ring-1 transition-colors ${isLoading ? 'bg-amber-100 text-amber-700 ring-amber-500/20' : 'bg-emerald-100 text-emerald-700 ring-emerald-500/20'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${isLoading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                        {isLoading ? 'ATUALIZANDO...' : 'SISTEMA ATIVO'}
                    </span>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Score de Conformidade"
                    value={`${displayStats.complianceScore}%`}
                    icon={<ShieldCheckIcon className="w-6 h-6 text-white" />}
                    color="bg-indigo-600"
                    trend={displayStats.complianceScore < 100 ? "Atenção Requerida" : "Excelente"}
                    trendColor={displayStats.complianceScore < 100 ? "text-amber-600" : "text-emerald-600"}
                />
                <StatCard
                    title="Assinaturas Pendentes"
                    value={displayStats.pendingSignatures}
                    icon={<DocumentCheckIcon className="w-6 h-6 text-white" />}
                    color="bg-amber-500"
                    trend={displayStats.pendingSignatures > 0 ? "Aguardando ação" : "Tudo em dia"}
                    trendColor="text-amber-600"
                />
                <StatCard
                    title="Alertas de Risco"
                    value={displayStats.activeAlerts}
                    icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
                    color="bg-red-500"
                    trend="Últimas 24h"
                    trendColor="text-red-600"
                />
                <StatCard
                    title="Locais Verificados"
                    value={displayStats.verifiedLocations.toLocaleString()}
                    icon={<MapPinIcon className="w-6 h-6 text-white" />}
                    color="bg-emerald-500"
                    trend="Geolocalização"
                />
            </div>

            {/* Main Content Split: Map (2/3) + Feed (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

                {/* Map Section */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-indigo-500" />
                            Geolocalização Ativa
                        </h3>
                        <div className="flex gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-500">Satélite</span>
                            <span className="text-xs px-2 py-1 bg-slate-800 text-white rounded">Mapa</span>
                        </div>
                    </div>
                    <div className="flex-1 relative z-0">
                        <MapContainer
                            center={mapCenter}
                            zoom={mapZoom}
                            style={{ height: '100%', width: '100%' }}
                            key={`${triggerFly}`} // Hack to force recenter on simple map setup
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            {events.map((evt) => (
                                evt.lat && (
                                    <Marker key={evt.event_id} position={[evt.lat, evt.lng]}>
                                        <Popup>
                                            <div className="p-1">
                                                <strong className="text-slate-800 text-xs">{evt.title}</strong>
                                                <br />
                                                <span className="text-[10px] text-slate-500">{evt.user_ref || 'Usuário'}</span>
                                                <br />
                                                <span className="text-[9px] text-slate-400">{new Date(evt.event_time).toLocaleString()}</span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                        </MapContainer>
                    </div>
                </div>

                {/* Live Feed Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-slate-500" />
                            Feed de Eventos
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold animate-pulse">LIVE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
                        {loadingEvents && events.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Carregando feed...</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {events.map((evt) => (
                                    <div
                                        key={evt.event_id}
                                        onClick={() => evt.lat && flyToLocation(evt.lat, evt.lng)}
                                        className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-indigo-500"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Status Dot Line */}
                                            <div className="flex flex-col items-center mt-1.5">
                                                <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white
                                                    ${evt.event_type === 'ALERT' ? 'bg-red-500' :
                                                        evt.event_type === 'TIME' ? 'bg-indigo-500' : 'bg-emerald-500'}
                                                `}></div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate mb-0.5">{evt.title}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 font-medium">{evt.user_ref || 'Usuário'}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(evt.event_time).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 text-xs">
                                        Nenhum evento recente encontrado.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Ver Todos os Eventos</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, trend, trendColor = "text-emerald-600" }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1 opacity-80">{title}</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h2>
            {trend && <p className={`text-xs font-bold mt-2 ${trendColor}`}>{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl shadow-lg shadow-indigo-100 ${color}`}>
            {icon}
        </div>
    </div>
);

export default Compliance;

