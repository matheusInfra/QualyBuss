import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeManagementService } from '../../services/timeManagementService';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    ClockIcon,
    MapPinIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    ArrowPathIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

// Fix Leaflet Icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const GestaoPonto = () => {
    const queryClient = useQueryClient();
    const [selectedEntry, setSelectedEntry] = useState(null); // For Map View

    // --- QUERY ---
    const { data: entries = [], isLoading, refetch } = useQuery({
        queryKey: ['timeEntries'],
        queryFn: () => timeManagementService.getAllEntries({}),
        refetchInterval: 30000
    });

    // --- REALTIME ---
    useEffect(() => {
        const channel = supabase.channel('ponto-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => {
                queryClient.invalidateQueries(['timeEntries']);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    // --- MUTATION (Approve/Flag) ---
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => timeManagementService.updateEntryStatus(id, status, 'Revisão Manual'),
        onSuccess: () => queryClient.invalidateQueries(['timeEntries'])
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Ponto</h1>
                    <p className="text-sm text-slate-500">Controle de frequência e auditoria biométrica.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (confirm("Deseja recalcular o banco de horas de todos os usuários refletidos na tela?")) {
                                // Demo: Just recalc for the selected entry user or current list logic (to be refined)
                                // For now, simple refresh
                                refetch();
                            }
                        }}
                        className="p-2 text-slate-500 hover:text-indigo-600"
                        title="Recalcular Banco de Horas"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                        Exportar Folha
                    </button>
                </div>
            </div>

            {/* Bank of Hours Summary (New) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco de Horas (Geral)</h3>
                    <p className="text-xs text-slate-400 mt-1">Saldo acumulado processado pelo Motor de Cálculo</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <span className="block text-2xl font-black text-slate-800">
                            {/* Placeholder: In real app, fetch sum of all banks or selected user bank */}
                            --:--
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Saldo Atual</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Section (2/3) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-indigo-500" />
                            Registros Recentes
                        </h3>
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 font-bold">{entries.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="p-3">Colaborador</th>
                                    <th className="p-3">Data/Hora</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">Dispositivo</th>
                                    <th className="p-3 text-right">Status</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.map(entry => (
                                    <tr
                                        key={entry.id}
                                        className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${selectedEntry?.id === entry.id ? 'bg-indigo-50' : ''}`}
                                        onClick={() => setSelectedEntry(entry)}
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {entry.userName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{entry.userName}</p>
                                                    <p className="text-[10px] text-slate-400">ID: {entry.user_id.slice(0, 4)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{new Date(entry.clock_in).toLocaleTimeString().slice(0, 5)}</span>
                                                <span className="text-xs text-slate-400">{new Date(entry.clock_in).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold 
                                                ${entry.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {entry.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-600">{entry.device_info?.model || 'Mobile'}</span>
                                                {entry.device_info?.biometric_method && (
                                                    <span className="text-[9px] text-indigo-500 flex items-center gap-1">
                                                        <UserCircleIcon className="w-3 h-3" /> Bio OK
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            {/* Priority: Computed Anomaly > DB Status */}
                                            {entry.computedAnomaly ? (
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${entry.computedAnomaly.type === 'CRITICAL' ? 'text-red-600 bg-red-50 px-2 py-1 rounded' :
                                                    'text-amber-600 bg-amber-50 px-2 py-1 rounded'
                                                    }`}>
                                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                                    {entry.computedAnomaly.text}
                                                </span>
                                            ) : entry.status === 'VALID' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                    <CheckCircleIcon className="w-4 h-4" /> Validado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold">
                                                    <ExclamationTriangleIcon className="w-4 h-4" /> {entry.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                className="text-xs text-indigo-600 hover:underline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newStatus = entry.status === 'VALID' ? 'FLAGGED' : 'VALID';
                                                    updateStatusMutation.mutate({ id: entry.id, status: newStatus });
                                                }}
                                            >
                                                {entry.status === 'VALID' ? 'Sinalizar' : 'Validar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Map/Detail Section (1/3) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden sticky top-6">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-indigo-500" />
                            Prova de Localização
                        </h3>
                    </div>

                    <div className="flex-1 relative z-0">
                        {selectedEntry?.location ? (
                            <MapContainer
                                key={selectedEntry.id} // Re-mount map when selection changes
                                center={[selectedEntry.location.lat, selectedEntry.location.lng]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                                <Marker position={[selectedEntry.location.lat, selectedEntry.location.lng]}>
                                    <Popup>
                                        <strong>{selectedEntry.userName}</strong><br />
                                        {new Date(selectedEntry.clock_in).toLocaleString()}<br />
                                        Precisão: {Math.round(selectedEntry.location.accuracy || 0)}m
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 px-8 text-center">
                                <p>Selecione um registro na lista para ver a localização no mapa.</p>
                            </div>
                        )}
                    </div>

                    {selectedEntry && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <h4 className="font-bold text-sm text-slate-800 mb-2">Metadados de Auditoria</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-white rounded border border-slate-200">
                                    <span className="block text-slate-400 uppercase text-[9px]">Hash</span>
                                    <span className="font-mono text-slate-600 truncate">{selectedEntry.id}</span>
                                </div>
                                <div className="p-2 bg-white rounded border border-slate-200">
                                    <span className="block text-slate-400 uppercase text-[9px]">Fake GPS Check</span>
                                    <span className={selectedEntry.location?.is_mocked ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                                        {selectedEntry.location?.is_mocked ? "DETECTADO" : "LIMPO"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestaoPonto;
