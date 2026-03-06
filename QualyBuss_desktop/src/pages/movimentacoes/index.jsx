import React, { useState, useEffect } from 'react';
import { movementService } from '../../services/movementService';
import { collaboratorService } from '../../services/collaboratorService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const PIPELINE_STEPS = [
    { id: 'PENDING_APPROVAL', label: 'Solicitado', color: 'blue', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'APPROVED', label: 'Aprovado (Agendado)', color: 'amber', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'COMPLETED', label: 'Efetivado', color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'REJECTED', label: 'Reprovado', color: 'red', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
];

const MOVEMENT_TYPES = {
    'PROMOTION': 'Promoção de Cargo',
    'SALARY_ADJUSTMENT': 'Ajuste Salarial',
    'TRANSFER': 'Transferência de Setor',
    'BONUS': 'Bonificação'
};

const Movimentacoes = () => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('PENDING_APPROVAL');
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState([]);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 5; // Smaller limit for cards

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
    const [formData, setFormData] = useState({
        type: 'PROMOTION',
        effectiveDate: '',
        newSalary: '',
        newRole: '',
        newDepartment: '',
        justification: ''
    });

    useEffect(() => {
        loadMovements();
    }, [activeTab, page]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    useEffect(() => {
        loadCollaborators();
    }, []);

    const loadCollaborators = async () => {
        const { data } = await collaboratorService.getPaginated({ limit: 1000, status: 'active' });
        setCollaborators(data || []);
    };

    const loadMovements = async () => {
        setLoading(true);
        try {
            const { data, count } = await movementService.getMovements({
                status: activeTab,
                page: page,
                limit: ITEMS_PER_PAGE
            });
            setMovements(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao carregar movimentações.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (!selectedCollaboratorId) {
                notify.error('Erro', 'Selecione um colaborador.');
                return;
            }

            // Prepare Payload
            const payload = {
                collaborator_id: selectedCollaboratorId,
                type: formData.type,
                effective_date: formData.effectiveDate,
                justification: formData.justification,
                status: 'PENDING_APPROVAL', // Default start
                new_data: {
                    salary: formData.newSalary ? parseFloat(formData.newSalary) : undefined,
                    role: formData.newRole || undefined,
                    department: formData.newDepartment || undefined
                },
                // Ideally we should snapshot old_data here too, but let's simplify for V1
                requestor_id: user?.id
            };

            await movementService.createMovement(payload);
            notify.success('Sucesso', 'Movimentação solicitada!');
            setIsModalOpen(false);
            if (activeTab === 'PENDING_APPROVAL') loadMovements();
            else setActiveTab('PENDING_APPROVAL');

        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao criar movimentação.');
        }
    };

    const handleApprove = async (id) => {
        try {
            await movementService.updateStatus(id, 'APPROVED', user?.id);
            notify.success('Aprovado', 'Movimentação agendada.');
            loadMovements();
        } catch (error) {
            notify.error('Erro', 'Falha ao aprovar.');
        }
    };

    const handleComplete = async (id) => {
        try {
            await movementService.updateStatus(id, 'COMPLETED', user?.id);
            notify.success('Efetivado', 'Alterações aplicadas ao cadastro.');
            loadMovements();
        } catch (error) {
            notify.error('Erro', 'Falha ao efetivar.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Pipeline de Carreira</h1>
                    <p className="text-slate-500 mt-1">Gestão de promoções, aumentos e transferências.</p>
                </div>
                <button
                    onClick={() => { setIsModalOpen(true); setFormData({ ...formData, effectiveDate: new Date().toISOString().split('T')[0] }); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Nova Movimentação
                </button>
            </div>

            {/* Pipeline Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2">
                {PIPELINE_STEPS.map(step => (
                    <button
                        key={step.id}
                        onClick={() => setActiveTab(step.id)}
                        className={`
                            flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all border
                            ${activeTab === step.id
                                ? `bg-white text-${step.color}-600 border-${step.color}-200 shadow-md ring-1 ring-${step.color}-100`
                                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-white hover:text-slate-600'}
                        `}
                    >
                        <svg className={`w-5 h-5 ${activeTab === step.id ? '' : 'grayscale opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} /></svg>
                        {step.label}
                        {activeTab === step.id && (
                            <span className={`bg-${step.color}-100 text-${step.color}-700 text-xs px-2 py-0.5 rounded-full`}>
                                {movements.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Carregando pipeline...</div>
                ) : movements.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 font-medium">Nenhuma movimentação neste estágio.</p>
                    </div>
                ) : (
                    movements.map(mov => (
                        <div key={mov.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center">

                            {/* Collaborator Info */}
                            <div className="flex items-center gap-4 min-w-[250px]">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden border-2 border-white shadow-sm">
                                    {mov.collaborators?.avatar_url ? <img src={mov.collaborators.avatar_url} className="w-full h-full object-cover" /> : mov.collaborators?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{mov.collaborators?.full_name}</h3>
                                    <p className="text-xs text-slate-400 font-mono uppercase">{MOVEMENT_TYPES[mov.type]}</p>
                                </div>
                            </div>

                            {/* Change Details */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {mov.new_data?.role && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Novo Cargo</p>
                                        <p className="font-medium text-slate-700">{mov.new_data.role}</p>
                                    </div>
                                )}
                                {mov.new_data?.salary && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Novo Salário</p>
                                        <p className="font-medium text-slate-700">R$ {mov.new_data.salary.toLocaleString('pt-BR')}</p>
                                    </div>
                                )}
                                <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Justificativa</p>
                                    <p className="text-slate-500 italic">"{mov.justification}"</p>
                                </div>
                            </div>

                            {/* Actions / Date */}
                            <div className="flex flex-col items-end gap-2 min-w-[150px]">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Vigência</p>
                                    <p className={`font-bold ${new Date(mov.effective_date) <= new Date() ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {new Date(mov.effective_date).toLocaleDateString()}
                                    </p>
                                </div>

                                {activeTab === 'PENDING_APPROVAL' && (
                                    <button
                                        onClick={() => handleApprove(mov.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Aprovar
                                    </button>
                                )}

                                {activeTab === 'APPROVED' && (
                                    <button
                                        onClick={() => handleComplete(mov.id)}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        Efetivar Agora
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {movements.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Mostrando <span className="font-bold">{(page - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-bold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> de <span className="font-bold">{totalCount}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * ITEMS_PER_PAGE >= totalCount}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Nova Movimentação</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="label-text">Colaborador</label>
                                    <select
                                        className="input-field"
                                        value={selectedCollaboratorId}
                                        onChange={e => setSelectedCollaboratorId(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="label-text">Tipo</label>
                                    <select
                                        className="input-field"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {Object.entries(MOVEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="label-text">Data de Vigência</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={formData.effectiveDate}
                                        onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4">Dados da Mudança</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="label-text">Novo Salário (R$)</label>
                                            <input type="number" step="0.01" className="input-field" value={formData.newSalary} onChange={e => setFormData({ ...formData, newSalary: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label-text">Novo Cargo</label>
                                            <input type="text" className="input-field" value={formData.newRole} onChange={e => setFormData({ ...formData, newRole: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label-text">Novo Setor</label>
                                            <input type="text" className="input-field" value={formData.newDepartment} onChange={e => setFormData({ ...formData, newDepartment: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="label-text">Justificativa</label>
                                    <textarea
                                        className="input-field min-h-[100px]"
                                        placeholder="Descreva o motivo da movimentação..."
                                        value={formData.justification}
                                        onChange={e => setFormData({ ...formData, justification: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                                Criar Solicitação
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Movimentacoes;
