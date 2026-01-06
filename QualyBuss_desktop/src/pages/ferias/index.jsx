import React, { useState, useEffect } from 'react';
import { holidayService } from '../../services/holidayService';
import { leaveService } from '../../services/leaveService';
import { collaboratorService } from '../../services/collaboratorService';
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

    const [activeTab, setActiveTab] = useState('CALENDAR');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    }, [currentDate, isModalOpen]);

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
            const data = await leaveService.getRequests();
            setLeaves(data || []);
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
                // Check intersection
                return dateStr >= l.start_date && dateStr <= l.end_date;
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

    const validateDate = (startStr) => {
        if (!startStr) return;
        const startObj = new Date(startStr + 'T12:00:00'); // mid-day to avoid timezone edge cases
        const check = holidayService.isBlockedForStart(startObj, holidays);
        // If editing, maybe relax rules? No, let's keep them strict.
        setValidationError(check.blocked ? check.reasons : null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'startDate') {
            validateDate(value);
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
            loadLeaves();
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

                    {/* Weekdays Header */}
                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                        {days.map((day, idx) => {
                            if (day.type === 'padding') return <div key={idx} className="bg-slate-50/30 border-b border-r border-slate-100" />;

                            return (
                                <div
                                    key={day.dateStr}
                                    onClick={() => openModal(day.dateStr)}
                                    className={`
                                        relative border-b border-r border-slate-100 p-2 group transition-all min-h-[100px] cursor-pointer
                                        ${day.isToday ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                                        ${day.isWeekend ? 'bg-slate-50/50' : ''}
                                    `}
                                >
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-2 transition-colors
                                        ${day.isToday ? 'bg-blue-600 text-white shadow-md' : day.holiday ? 'text-red-500' : 'text-slate-700 group-hover:bg-slate-200'}
                                    `}>
                                        {day.value}
                                    </div>
                                    {day.holiday && (
                                        <div className="mb-1">
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 truncate max-w-full" title={day.holiday.name}>
                                                {day.holiday.name}
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                                        {day.dayLeaves.filter(l => l.status === 'APPROVED').map(leave => {
                                            const isStart = leave.start_date === day.dateStr;
                                            const isEnd = leave.end_date === day.dateStr;
                                            const colorClass = leave.type === 'FERIAS' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200';
                                            const showTitle = isStart || day.date.getDay() === 0;

                                            return (
                                                <div
                                                    key={leave.id}
                                                    className={`
                                                        text-[10px] font-medium px-2 py-1 rounded border shadow-sm truncate transition-all hover:scale-105 active:scale-95
                                                        ${colorClass}
                                                        ${isStart ? 'rounded-l-md ml-0' : '-ml-3 rounded-l-none border-l-0 opacity-80'} 
                                                        ${isEnd ? 'rounded-r-md mr-0' : '-mr-3 rounded-r-none border-r-0'}
                                                    `}
                                                    title={`${leave.collaborators?.full_name} - ${leave.type}`}
                                                >
                                                    {showTitle && leave.collaborators?.full_name.split(' ')[0]}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: REQUESTS LIST */}
            {activeTab === 'REQUESTS' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Colaborador</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Período</th>
                                    <th className="p-4">Qtd. Dias</th>
                                    <th className="p-4">Justificativa Original</th>
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
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${req.type === 'FERIAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
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
                                                                setIsModalOpen(true);
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
                </div>
            )}

            {/* Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Registrar Ausência</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Validation Errors */}
                            {validationError && validationError.length > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-red-800">Data de Início Inválida (CLT)</h4>
                                        <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                                            {validationError.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Colaborador</label>
                                <select
                                    name="collaboratorId"
                                    value={formData.collaboratorId}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    required
                                >
                                    <option value="">Selecione o colaborador...</option>
                                    {collaborators.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Início</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 ${validationError ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500'}`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fim</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleFormChange}
                                        min={formData.startDate}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['FERIAS', 'FOLGA', 'LICENCA'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${formData.type === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!validationError}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ferias;
