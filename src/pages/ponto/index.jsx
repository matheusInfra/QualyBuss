import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeManagementService } from '../../services/timeManagementService';
import { collaboratorService } from '../../services/collaboratorService'; // Added Service
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNotification } from '../../contexts/NotificationContext';
import {
    ClockIcon,
    MapPinIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    ArrowPathIcon,
    UserCircleIcon,
    XMarkIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline'; // Added PencilSquareIcon

// Fix Leaflet Icons
import L from 'leaflet';
import EditEntryModal from '../../components/EditEntryModal'; // Imported Modal
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const GestaoPonto = () => {
    const queryClient = useQueryClient();
    const [selectedEntry, setSelectedEntry] = useState(null); // For Map View
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit Modal
    const [entryToEdit, setEntryToEdit] = useState(null);
    const { notify } = useNotification();

    // Folha de Pagamento locks variables
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isLocking, setIsLocking] = useState(false);

    // --- FILTERS STATE ---
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().slice(0, 10), // Default Today
        endDate: new Date().toISOString().slice(0, 10),
        userId: ''
    });

    // --- COLLABORATORS QUERY (For Filter Dropdown) ---
    const { data: collaborators = [] } = useQuery({
        queryKey: ['collaboratorsList'],
        queryFn: () => collaboratorService.getAllRaw(),
        staleTime: 300000 // Cache for 5 min
    });

    // --- QUERY ---
    const { data: entries = [], isLoading, refetch } = useQuery({
        queryKey: ['timeEntries', filters], // Trigger refetch on filter change
        queryFn: () => timeManagementService.getAllEntries({
            startDate: filters.startDate,
            endDate: filters.endDate,
            userId: filters.userId || null
        }),
        refetchInterval: 30000
    });

    // --- TIME BANK QUERY (NEW) ---
    const { data: bankSummary } = useQuery({
        queryKey: ['bankSummary', filters.userId],
        queryFn: () => timeManagementService.getBankOfHoursSummary(filters.userId),
        refetchInterval: 60000
    });

    // --- REALTIME ---
    useEffect(() => {
        const channel = supabase.channel('ponto-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => {
                queryClient.invalidateQueries(['timeEntries']);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'time_bank' }, () => {
                queryClient.invalidateQueries(['bankSummary']);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    // --- NEW: FECHAMENTO DE FOLHA FUNCTION ---
    const handleLockCycle = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente FECHAR a folha de ${selectedMonth}/${selectedYear}? Após fechada, NINGUÉM poderá editar os pontos desta competência.`)) return;

        setIsLocking(true);
        try {
            const { data, error } = await supabase.rpc('lock_payroll_cycle', {
                p_month: parseInt(selectedMonth),
                p_year: parseInt(selectedYear)
            });

            if (error) throw error;
            if (data && data.success === false) {
                throw new Error(data.message);
            }

            console.log('Folha Fechada', `Competência ${selectedMonth}/${selectedYear} bloqueada contra alterações retroativas.`);
            // You might want to reload entries or visual state here to lock the UI edit buttons
            refetch(); // Re-fetch entries to reflect            loadEntries();

        } catch (error) {
            console.error(error);
            // Mostrar a mensagem de erro que vem da Trigger do Postgres
            if (error?.message?.includes('fechada')) {
                notify.error('Folha Fechada', 'Esta competência foi fechada. Não é possível alterar pontos retroativamente.');
            } else {
                notify.error('Erro', 'Falha ao atualizar ponto.');
            }
        } finally {
            setIsLocking(false);
        }
    };

    // --- MUTATION (Approve/Flag) ---
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => timeManagementService.updateEntryStatus(id, status, 'Revisão Manual'),
        onSuccess: () => queryClient.invalidateQueries(['timeEntries'])
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-fade-in">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Ponto</h1>
                    <p className="text-sm text-slate-500">Controle de frequência e auditoria biométrica.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (confirm("Deseja recalcular o banco de horas de todos os usuários refletidos na tela? Isso extrairá novamente informações de Adicional Noturno, Atrasos e Faltas para a Data selecionada.")) {
                                try {
                                    // If a specific user is selected, calculate for them
                                    if (filters.userId) {
                                        notify.info("Processando...", `Recalculando espelho de ${filters.userId}`);
                                        const { timeCalculationService } = await import('../../services/timeCalculationService');
                                        await timeCalculationService.recalculatePeriod(filters.userId, filters.startDate, filters.endDate);
                                        notify.success("Sucesso", "Recálculo finalizado.");
                                    } else {
                                        notify.warning("Atenção", "Para recalcular a folha, selecione primeiro um Colaborador no filtro.");
                                    }
                                } catch (err) {
                                    console.error(err);
                                    notify.error("Erro", "Falha ao acionar motor de cálculo.");
                                } finally {
                                    refetch();
                                }
                            }
                        }}
                        className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Recalcular"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-transform hover:scale-105 active:scale-95">
                        Exportar Folha
                    </button>
                </div>
            </div>

            {/* --- FILTER BAR (NEW) --- */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="flex-1 w-full md:w-auto grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">De</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Até</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Collaborator Select */}
                    <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Colaborador</label>
                        <div className="relative">
                            <select
                                value={filters.userId}
                                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                            >
                                <option value="">Todos os Colaboradores</option>
                                {collaborators.map(c => (
                                    <option key={c.id} value={c.user_id || c.id}>
                                        {c.full_name}
                                    </option>
                                ))}
                            </select>
                            <UserCircleIcon className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Clear Filters */}
                {(filters.userId || filters.startDate !== new Date().toISOString().slice(0, 10)) && (
                    <button
                        onClick={() => setFilters({
                            startDate: new Date().toISOString().slice(0, 10),
                            endDate: new Date().toISOString().slice(0, 10),
                            userId: ''
                        })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Limpar Filtros"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Bank of Hours Summary (New) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco de Horas (Geral)</h3>
                    <p className="text-xs text-slate-400 mt-1">Saldo acumulado processado pelo Motor de Cálculo</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <span className={`block text-2xl font-black ${bankSummary && bankSummary.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                            {bankSummary === undefined ? (
                                <span className="animate-pulse text-slate-300">--:--</span>
                            ) : (
                                bankSummary
                            )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {filters.userId ? 'Saldo do Colaborador' : 'Saldo Global'}
                        </span>
                    </div>
                </div>
            </div>

            {/* NEW: Fechamento de Folha Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fechamento de Folha</h3>
                    <p className="text-xs text-slate-400 mt-1">Bloqueie edições retroativas para uma competência.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none w-32 focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                            <option key={m} value={m}>
                                {new Date(2000, parseInt(m) - 1).toLocaleString('pt-BR', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none w-24 focus:ring-2 focus:ring-blue-500"
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleLockCycle}
                        disabled={isLocking}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium shadow ml-4 disabled:opacity-50"
                        title="Bloquear edições retroativas para este mês"
                    >
                        {isLocking ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        )}
                        <span className="hidden sm:inline">Fechar Folha</span>
                    </button>
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
                                        className={`transition-colors cursor-pointer border-l-4 
                                            ${selectedEntry?.id === entry.id ? 'bg-indigo-50 border-indigo-500' :
                                                entry.computedAnomaly?.type === 'CRITICAL' ? 'bg-red-50/30 border-red-400 hover:bg-red-50' :
                                                    entry.computedAnomaly?.type === 'WARNING' ? 'bg-amber-50/30 border-amber-400 hover:bg-amber-50' :
                                                        'bg-white border-transparent hover:bg-slate-50'
                                            }`}
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
                                            {entry.computedAnomaly && (
                                                <div className="flex items-center gap-1.5 mt-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 max-w-max">
                                                    {entry.computedAnomaly.type === 'CRITICAL' ? (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                    ) : entry.computedAnomaly.type === 'SAFE' ? (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                    )}
                                                    <span className={`text-[10px] font-bold ${entry.computedAnomaly.type === 'CRITICAL' ? 'text-red-700' :
                                                        entry.computedAnomaly.type === 'SAFE' ? 'text-emerald-700 uppercase' :
                                                            'text-amber-700'
                                                        }`}>
                                                        {entry.computedAnomaly.text}
                                                    </span>
                                                </div>
                                            )}
                                            {entry.status === 'VALID' ? (
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
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                title="Editar Registro"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEntryToEdit(entry);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <PencilSquareIcon className="w-5 h-5" />
                                            </button>
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

            {/* EDIT MODAL */}
            <EditEntryModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                entry={entryToEdit}
                onSave={() => refetch()}
            />
        </div>
    );
};

export default GestaoPonto;
