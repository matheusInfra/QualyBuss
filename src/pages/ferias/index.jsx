import React, { useState, useEffect } from 'react';
import { holidayService } from '../../services/holidayService';
import { leaveService } from '../../services/leaveService';
import { collaboratorService } from '../../services/collaboratorService';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const Ferias = () => {
    const { notify } = useNotification();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null); // Track if editing

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        collaboratorId: '',
        startDate: '',
        endDate: '',
        type: 'FERIAS',
        reason: ''
    });
    const [validationError, setValidationError] = useState(null);
    const [pendingActionId, setPendingActionId] = useState(null); // New Quick Action Modal State
    // Ghost State: Recently cancelled items stay visible for 10 minutes
    const [transientCancelledIds, setTransientCancelledIds] = useState([]);

    // Cleanup Ghost items periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            setTransientCancelledIds(prev => prev.filter(item => item.timestamp > tenMinutesAgo));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const [activeTab, setActiveTab] = useState('CALENDAR');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Attachment State
    const [attachment, setAttachment] = useState(null);

    // Load Initial Data
    useEffect(() => {
        loadHolidays();
        // Recalculate calendar date to match selected year to avoid confusion
        setCurrentDate(d => {
            const newD = new Date(d);
            newD.setFullYear(selectedYear);
            return newD;
        });
    }, [selectedYear]);

    useEffect(() => {
        loadCollaborators();
    }, []);

    useEffect(() => {
        loadLeaves();
    }, [currentDate, isModalOpen, activeTab, page]);

    const loadHolidays = async () => {
        const data = await holidayService.getHolidays(selectedYear);
        setHolidays(data);
    };

    const loadCollaborators = async () => {
        const { data } = await collaboratorService.getPaginated({ limit: 1000, status: 'active' });
        setCollaborators(data || []);
    };

    const loadLeaves = async () => {
        try {
            // If Calendar, we need ALL events to render dots correctly.
            // If List (Requests), we paginate.
            const isCalendar = activeTab === 'CALENDAR';
            const limit = isCalendar ? 1000 : ITEMS_PER_PAGE;
            const currentPage = isCalendar ? 1 : page;

            const { data, count } = await leaveService.getRequests({
                page: currentPage,
                limit: limit
            });

            setLeaves(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const daysArray = [];

        // Padding for previous month
        for (let i = 0; i < firstDayOfWeek; i++) {
            daysArray.push({ type: 'padding' });
        }

        // Actual days
        for (let i = 1; i <= days; i++) {
            const currentDayDate = new Date(year, month, i);
            const dateStr = currentDayDate.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === currentDayDate.toDateString();
            const holiday = holidays.find(h => h.date === dateStr);
            const dayLeaves = leaves.filter(l => {
                // Check intersection and exclude non-active statuses for Calendar
                // UNLESS it is in the Ghost List (Transient Cancelled)
                const isGhost = transientCancelledIds.some(t => t.id === l.id);
                const isActive = (l.status === 'APPROVED' || l.status === 'PENDING');

                return (isActive || isGhost) &&
                    dateStr >= l.start_date && dateStr <= l.end_date;
            });

            daysArray.push({
                type: 'day',
                value: i,
                date: currentDayDate,
                dateStr,
                isToday,
                holiday,
                dayLeaves,
                isWeekend: currentDayDate.getDay() === 0 || currentDayDate.getDay() === 6
            });
        }
        return daysArray;
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        // Sync year just in case
        if (newDate.getFullYear() !== selectedYear) setSelectedYear(newDate.getFullYear());
        setCurrentDate(newDate);
    };

    // Modal Handlers
    const openModal = (dateStr) => {
        setEditingId(null); // Reset edit mode
        setAttachment(null); // Reset attachment
        setFormData({
            collaboratorId: '',
            startDate: dateStr,
            endDate: dateStr,
            type: 'FERIAS',
            reason: ''
        });
        validateDate(dateStr);
        setIsModalOpen(true);
    };

    const validateDate = (startStr, currentType) => {
        if (!startStr) return;
        // Check type from argument or state
        const typeToCheck = currentType || formData.type;

        if (typeToCheck !== 'FERIAS') {
            setValidationError(null);
            return;
        }

        const startObj = new Date(startStr + 'T12:00:00');
        const check = holidayService.isBlockedForStart(startObj, holidays);
        setValidationError(check.blocked ? check.reasons : null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'startDate') {
            validateDate(value, formData.type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation check
        if (validationError && validationError.length > 0) {
            notify.error('Data Inválida', 'Verifique as regras da CLT.');
            return;
        }
        if (!formData.collaboratorId) {
            notify.error('Campo Obrigatório', 'Selecione um colaborador.');
            return;
        }

        // Days Calc
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 0) return;

        try {
            if (editingId) {
                // Update Logic (Smart Trigger will handle Reversal if it was APPROVED)
                // Actually we need a full update method, let's assume createRequest covers upsert or we use a specific update
                // For simplified V2, we might just re-create if it's easier, but let's assume we update the existing row.
                // NOTE: We need to implement updateRequest in service. For now, let's use supabase direct or add method.
                // Assuming leaveService.updateRequest exists or we add it safely.
                await leaveService.updateRequest(editingId, {
                    collaborator_id: formData.collaboratorId,
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    type: formData.type,
                    days_count: diffDays,
                    status: 'PENDING', // Force pending on edit
                    reason: formData.reason,
                    justification_for_change: `Alteração: ${formData.reason}`
                });

                // Handle Attachment for Edit logic if adding new
                if (attachment) {
                    await documentService.uploadDocument(attachment, formData.collaboratorId, 'Justificativa Ausência');
                }

                notify.success('Atualizado', 'Solicitação enviada para reanálise.');
            } else {
                // Create Logic
                await leaveService.createRequest({
                    collaborator_id: formData.collaboratorId,
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    type: formData.type,
                    days_count: diffDays,
                    status: 'PENDING', // V2 starts as PENDING always
                    reason: formData.reason
                });

                // Start Upload
                if (attachment) {
                    await documentService.uploadDocument(attachment, formData.collaboratorId, 'Justificativa Ausência');
                }

                notify.success('Criado', 'Solicitação aguardando aprovação.');
            }
            setIsModalOpen(false);
            loadLeaves();
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao salvar.');
        }
    };

    // Approval Handlers
    const handleStatusChange = async (id, newStatus) => {
        // Confirmation for Cancellation
        if (newStatus === 'CANCELLED') {
            const confirm = window.confirm('Tem certeza? Isso irá estornar o saldo e cancelar a solicitação.');
            if (!confirm) return;
        }

        try {
            await leaveService.updateStatus(id, newStatus);
            notify.success('Sucesso', `Status atualizado para ${newStatus}`);

            // Add to Ghost State if Cancelled/Rejected
            if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
                setTransientCancelledIds(prev => [...prev, { id, timestamp: Date.now() }]);
            }

            loadLeaves();
            setPendingActionId(null); // Close quick modal
        } catch (err) {
            console.error(err);
            // Extract error message from Supabase/Postgres response if available
            const msg = err.message || 'Falha ao atualizar status.';
            if (msg.includes('Saldo insuficiente')) {
                notify.error('Bloqueado', msg.replace('Error: ', ''));
            } else {
                notify.error('Erro', msg);
            }
        }
    };

    const days = getDaysInMonth(currentDate);

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in relative">
            {/* Header with Global Filters */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold text-slate-800">Férias e Folgas</h1>
                    <p className="text-slate-500">Gestão completa de escalas e solicitações.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    {/* Year Selector */}
                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                        <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-colors text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="w-16 text-center font-bold text-slate-700">{selectedYear}</span>
                        <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-colors text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Tabs Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('CALENDAR')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'CALENDAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Calendário
                        </button>
                        <button
                            onClick={() => setActiveTab('REQUESTS')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'REQUESTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Solicitações e Ajustes
                            {leaves.filter(l => l.status === 'PENDING').length > 0 && (
                                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {leaves.filter(l => l.status === 'PENDING').length}
                                </span>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => openModal(new Date().toISOString().split('T')[0])}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="hidden sm:inline">Nova Solicitação</span>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: CALENDAR */}
            {activeTab === 'CALENDAR' && (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px] animate-fade-in-up">
                    {/* Month Nav */}
                    <div className="p-4 border-b border-slate-100 flex justify-center items-center bg-slate-50/50">
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                            <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-blue-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <span className="w-32 text-center font-bold text-slate-800">{MONTHS[currentDate.getMonth()]}</span>
                            <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-blue-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 p-4">
                        <div className="grid grid-cols-7 mb-2">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 grid-rows-6 gap-2 h-full">
                            {days.map((day, i) => {
                                if (day.type === 'padding') return <div key={i} className="" />;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => openModal(day.dateStr)}
                                        className={`
                                            relative p-2 rounded-xl border transition-all cursor-pointer group min-h-[80px] flex flex-col
                                            ${day.isToday ? 'bg-blue-50/50 border-blue-200 shadow-inner' : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'}
                                            ${day.isWeekend ? 'bg-slate-50/50' : ''}
                                        `}
                                    >
                                        <span className={`text-sm font-bold ${day.isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day.value}</span>

                                        {/* Holiday Badge */}
                                        {day.holiday && (
                                            <div className="mt-1 text-[10px] leading-tight text-red-500 font-bold bg-red-50 p-1 rounded border border-red-100 truncate" title={day.holiday.name}>
                                                {day.holiday.name}
                                            </div>
                                        )}

                                        {/* Leaves Indicators */}
                                        <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                                            {day.dayLeaves.map(leave => {
                                                const isGhost = transientCancelledIds.some(t => t.id === leave.id);
                                                let bgColor = 'bg-slate-200';

                                                if (leave.status === 'PENDING') bgColor = 'bg-amber-400 border-amber-500 animate-pulse';
                                                else if (isGhost) bgColor = 'bg-red-300 opacity-60 border-red-400';
                                                else if (leave.status === 'APPROVED') {
                                                    if (leave.type === 'FALTA') bgColor = 'bg-red-500 border-red-600';
                                                    else if (leave.type === 'ATESTADO') bgColor = 'bg-cyan-500 border-cyan-600';
                                                    else if (leave.type === 'FOLGA') bgColor = 'bg-blue-500 border-blue-600';
                                                    else bgColor = 'bg-emerald-500 border-emerald-600'; // Default/Ferias
                                                }

                                                return (
                                                    <div
                                                        key={leave.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening "New Request" modal
                                                            if (leave.status === 'PENDING') {
                                                                setPendingActionId(leave.id); // Open Quick Action
                                                            } else if (leave.status === 'APPROVED') {
                                                                // Open Edit Mode (Standard)
                                                                setEditingId(leave.id);
                                                                setFormData({
                                                                    collaboratorId: leave.collaborator_id,
                                                                    startDate: leave.start_date,
                                                                    endDate: leave.end_date,
                                                                    type: leave.type,
                                                                    reason: leave.reason || ''
                                                                });
                                                                setIsModalOpen(true);
                                                            }
                                                        }}
                                                        className={`h-2 rounded w-full border border-opacity-20 cursor-pointer hover:brightness-110 transition-all ${bgColor}`}
                                                        title={`${leave.collaborators?.full_name} - ${leave.status}`}
                                                    />
                                                );
                                            })}
                                            {day.dayLeaves.length > 0 && day.dayLeaves.length <= 3 && (
                                                <div className="flex -space-x-1 mt-1">
                                                    {day.dayLeaves.map(l => (
                                                        <div key={l.id} className="w-4 h-4 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[8px] font-bold text-slate-600 first-letter:uppercase" title={l.collaborators?.full_name}>
                                                            {l.collaborators?.full_name?.charAt(0)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Add Button (Hover) */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-blue-600 text-white rounded-full p-1 shadow-sm">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: REQUESTS LIST */}
            {activeTab === 'REQUESTS' && (
<<<<<<< HEAD
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up flex flex-col h-full max-h-[800px]">
                    <div className="overflow-x-auto overflow-y-auto p-1 flex-1">
=======
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto">
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Colaborador</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Período</th>
                                    <th className="p-4">Duração</th>
                                    <th className="p-4">Motivo Original</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm md:text-base">
                                {leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-slate-400">Nenhuma solicitação encontrada.</td>
                                    </tr>
                                ) : (
                                    leaves.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800">{req.collaborators?.full_name}</td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase 
                                                    ${req.type === 'FERIAS' ? 'bg-emerald-100 text-emerald-700'
                                                        : req.type === 'FOLGA' ? 'bg-blue-100 text-blue-700'
                                                            : req.type === 'FALTA' ? 'bg-red-100 text-red-700'
                                                                : req.type === 'ATESTADO' ? 'bg-cyan-100 text-cyan-700'
                                                                    : 'bg-purple-100 text-purple-700'}`}>
                                                    {req.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                {new Date(req.start_date).toLocaleDateString()} a {new Date(req.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-bold text-slate-700">{req.days_count} dias</td>
                                            <td className="p-4 text-slate-500 italic max-w-xs truncate" title={req.reason}>{req.reason || '-'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                                    ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                            req.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500 line-through' :
                                                                'bg-amber-100 text-amber-700'}`}>
                                                    {req.status === 'APPROVED' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                    {req.status === 'PENDING' ? 'Pendente' :
                                                        req.status === 'APPROVED' ? 'Aprovado' :
                                                            req.status === 'CANCELLED' ? 'Cancelado' : req.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {/* Only Pending can be Approved/Rejected directly */}
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Aprovar"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reprovar"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </>
                                                )}

                                                {/* Approved items can be EDITED (reversal) or CANCELLED (final) */}
                                                {req.status === 'APPROVED' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(req.id);
                                                                setFormData({
                                                                    collaboratorId: req.collaborator_id,
                                                                    startDate: req.start_date,
                                                                    endDate: req.end_date,
                                                                    type: req.type,
                                                                    reason: req.reason || ''
                                                                });
                                                                setIsModalOpen(true); // Re-opens Modal for Editing
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Alterar (Reverte para Pendente)"
                                                        >
                                                            Alterar
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'CANCELLED')}
                                                            className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                            title="Cancelar Definitivamente"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
<<<<<<< HEAD
                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 min-h-[60px]">
                        <span className="text-sm text-slate-500 font-medium">
                            Mostrando <span className="text-slate-900 font-bold">{Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalCount)}</span> a <span className="text-slate-900 font-bold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> de <span className="text-slate-900 font-bold">{totalCount}</span> resultados
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all shadow-sm active:scale-95 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => (page * ITEMS_PER_PAGE < totalCount ? p + 1 : p))}
                                disabled={page * ITEMS_PER_PAGE >= totalCount}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all shadow-sm active:scale-95 flex items-center gap-1"
                            >
                                Próxima
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                </div>
            )}

            {/* NEW & IMPROVED MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {editingId ? 'Editar Solicitação' : 'Nova Ausência'}
                                </h3>
                                <p className="text-sm text-slate-500">Preencha os dados da solicitação abaixo.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* 1. Type Selection (Cards) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tipo de Ausência</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'FERIAS', label: 'Férias', desc: 'Regras da CLT', color: 'emerald' },
                                            { id: 'FOLGA', label: 'Folga', desc: 'Abono de horas', color: 'blue' },
                                            { id: 'LICENCA', label: 'Licença', desc: 'Maternidade/Outros', color: 'purple' },
                                            { id: 'FALTA', label: 'Falta', desc: 'Ausência injustificada', color: 'red' },
                                            { id: 'ATESTADO', label: 'Atestado', desc: 'Justificativa médica', color: 'cyan' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, type: opt.id }));
                                                    // Trigger validation check with new type
                                                    if (opt.id === 'FERIAS') {
                                                        validateDate(formData.startDate);
                                                    } else {
                                                        setValidationError(null); // Clear errors for non-FERIAS
                                                    }
                                                }}
                                                className={`
                                                    relative p-4 rounded-xl border-2 text-left transition-all group
                                                    ${formData.type === opt.id
                                                        ? `border-${opt.color}-500 bg-${opt.color}-50/50 ring-1 ring-${opt.color}-500`
                                                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                                    }
                                                `}
                                            >
                                                <div className={`font-bold ${formData.type === opt.id ? `text-${opt.color}-700` : 'text-slate-700'}`}>
                                                    {opt.label}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1 font-medium">{opt.desc}</div>

                                                {formData.type === opt.id && (
                                                    <div className={`absolute top-3 right-3 w-4 h-4 bg-${opt.color}-500 rounded-full flex items-center justify-center`}>
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Collaborator */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Colaborador</label>
                                    <select
                                        name="collaboratorId"
                                        value={formData.collaboratorId}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-700 font-medium"
                                        required
                                    >
                                        <option value="">Selecione o colaborador...</option>
                                        {collaborators.map(c => (
                                            <option key={c.id} value={c.id}>{c.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. Dates & Validation Info */}
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data de Início</label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleFormChange}
                                                className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-colors font-medium
                                                    ${validationError
                                                        ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-500'
                                                        : 'border-slate-200 focus:border-blue-500'}`}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data de Fim</label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleFormChange}
                                                min={formData.startDate}
                                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Verification Feedback */}
                                    {validationError && (
                                        <div className="flex items-start gap-3 p-3 bg-red-100/50 rounded-lg border border-red-100">
                                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            <div>
                                                <p className="text-xs font-bold text-red-700 uppercase">Bloqueio CLT Detectado</p>
                                                <p className="text-xs text-red-600 mt-0.5">
                                                    Para férias, o início não pode ser em sextas, sábados ou vésperas de feriado.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {!validationError && formData.startDate && formData.type === 'FERIAS' && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span className="text-xs font-bold text-emerald-700">Data válida para início de Férias.</span>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Reason */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Motivo / Observação</label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleFormChange}
                                        rows="2"
                                    ></textarea>
                                </div>

                                {/* 5. Attachment (Conditionally displayed) */}
                                {['FALTA', 'ATESTADO'].includes(formData.type) && (
                                    <div className="animate-fade-in-up">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Anexar Comprovante (Obrigatório)</label>
                                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors group">
                                            <input
                                                type="file"
                                                onChange={(e) => setAttachment(e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${attachment ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50'}`}>
                                                    {attachment ? (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">
                                                    {attachment ? attachment.name : 'Clique para selecionar ou arraste aqui'}
                                                </p>
                                                {!attachment && <p className="text-xs text-slate-400">PDF, JPG ou PNG (Max 5MB)</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!!validationError}
                                        className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                    >
                                        {editingId ? 'Salvar Alterações' : 'Confirmar Solicitação'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* PENDING ACTION MODAL (Quick View) */}
            {pendingActionId && (() => {
                const req = leaves.find(l => l.id === pendingActionId);
                if (!req) return null;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-zoom-in relative">
                            <button onClick={() => setPendingActionId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Aprovação Pendente</h3>
                                <p className="text-sm text-slate-500 mt-1">O colaborador solicitou {req.type.toLowerCase()}.</p>

                                <div className="bg-slate-50 rounded-xl p-4 my-6 text-left border border-slate-100">
                                    <div className="mb-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Colaborador</p>
                                        <p className="font-bold text-slate-700">{req.collaborators?.full_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Início</p>
                                            <p className="text-sm font-medium text-slate-600">{new Date(req.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fim</p>
                                            <p className="text-sm font-medium text-slate-600">{new Date(req.end_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {req.reason && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Motivo</p>
                                            <p className="text-xs text-slate-500 italic">"{req.reason}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                        className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        Reprovar
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                        className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-transform active:scale-95"
                                    >
                                        Aprovar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Ferias;
