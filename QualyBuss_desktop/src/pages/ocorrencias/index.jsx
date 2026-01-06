import React, { useState, useEffect } from 'react';
import { occurrenceService } from '../../services/occurrenceService';
import { collaboratorService } from '../../services/collaboratorService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import {
    ExclamationTriangleIcon,
    HandThumbUpIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    XMarkIcon,
    CalendarIcon,
    UserIcon,
    ScaleIcon
} from '@heroicons/react/24/outline';

const OCCURRENCE_TYPES = {
    'ADVERTENCIA_VERBAL': { label: 'Advertência Verbal', color: 'yellow', icon: ExclamationTriangleIcon },
    'ADVERTENCIA_ESCRITA': { label: 'Advertência Escrita', color: 'orange', icon: DocumentTextIcon },
    'SUSPENSAO': { label: 'Suspensão', color: 'red', icon: ScaleIcon },
    'MERITO': { label: 'Mérito / Elogio', color: 'green', icon: HandThumbUpIcon },
    'FEEDBACK': { label: 'Feedback de Desenvolvimento', color: 'blue', icon: ChatBubbleLeftRightIcon },
    'OUTROS': { label: 'Outros Documentos', color: 'slate', icon: DocumentTextIcon }
};

const Ocorrencias = () => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [occurrences, setOccurrences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        collaboratorId: '',
        type: 'FEEDBACK',
        title: '',
        description: '',
        dateEvent: new Date().toISOString().split('T')[0],
        severityLevel: 1,
        // Dynamic Fields (controlled primarily on UI)
        suspensionDays: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [occData, collabData] = await Promise.all([
                occurrenceService.getAll(),
                collaboratorService.getPaginated({ limit: 1000, status: 'active' })
            ]);
            setOccurrences(occData || []);
            setCollaborators(collabData.data || []);
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let finalDescription = formData.description;

        // Prepend dynamic fields to description
        if (formData.type === 'SUSPENSAO' && formData.suspensionDays) {
            finalDescription = `[SUSPENSÃO DE ${formData.suspensionDays} DIAS]\n\n${finalDescription}`;
        }

        try {
            // 1. Create Occurrence
            const newOccurrence = await occurrenceService.create({
                collaborator_id: formData.collaboratorId,
                type: formData.type,
                title: formData.title,
                description: finalDescription,
                date_event: formData.dateEvent,
                severity_level: formData.type === 'MERITO' ? 0 : formData.severityLevel, // 0 for Merit
                created_by: user?.id
            });

            // 2. Upload Evidence if selected
            if (formData.file) {
                try {
                    await import('../../services/documentService').then(mod =>
                        mod.documentService.uploadDocument(
                            formData.file,
                            formData.collaboratorId,
                            'Evidência',
                            newOccurrence.id
                        )
                    );
                } catch (uploadError) {
                    console.error("Failed to upload evidence", uploadError);
                    notify.warning('Atenção', 'Ocorrência salva, mas falha ao anexar arquivo.');
                }
            }

            notify.success('Registrado', 'Ocorrência criada com sucesso.');
            setIsModalOpen(false);
            setFormData({
                collaboratorId: '',
                type: 'FEEDBACK',
                title: '',
                description: '',
                dateEvent: new Date().toISOString().split('T')[0],
                severityLevel: 1,
                suspensionDays: '',
                file: null
            });
            loadData();
        } catch (error) {
            notify.error('Erro', 'Falha ao registrar.');
        }
    };

    const getTypeConfig = (type) => OCCURRENCE_TYPES[type] || OCCURRENCE_TYPES['OUTROS'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-2 pb-20">
            {/* ... Header ... */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Prontuário de Ocorrências</h1>
                    <p className="text-slate-500 mt-2 text-lg">Central de gestão disciplinar e reconhecimento de talentos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-300 transition-all active:scale-95 flex items-center gap-2 group"
                >
                    <div className="bg-white/10 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    Nova Ocorrência
                </button>
            </div>
            {/* ... List ... */}

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                        <p>Carregando prontuário...</p>
                    </div>
                ) : occurrences.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
                        <DocumentTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">Nenhum registro encontrado</h3>
                        <p className="text-slate-400">Clique em "Nova Ocorrência" para começar.</p>
                    </div>
                ) : (
                    occurrences.map(item => {
                        const typeInfo = getTypeConfig(item.type);
                        const Icon = typeInfo.icon;

                        return (
                            <div key={item.id} className="bg-white p-0 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-stretch overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="flex flex-col md:flex-row">
                                    {/* Sidebar Color */}
                                    <div className={`w-full md:w-2 bg-${typeInfo.color}-500 transition-colors group-hover:w-3`} />

                                    <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                                        {/* Avatar & Info */}
                                        <div className="flex items-start gap-4 min-w-[250px] border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full bg-slate-100 ring-4 ring-white shadow-md overflow-hidden">
                                                    <img
                                                        src={item.collaborators?.avatar_url || `https://ui-avatars.com/api/?name=${item.collaborators?.full_name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-600 border-2 border-white`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{item.collaborators?.full_name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-${typeInfo.color}-50 text-${typeInfo.color}-600 border border-${typeInfo.color}-100`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    {new Date(item.date_event).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h4>
                                                {item.type !== 'MERITO' && item.severity_level > 0 && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Gravidade</span>
                                                        <div className="flex gap-0.5 mt-1">
                                                            {[1, 2, 3, 4, 5].map(lvl => (
                                                                <div
                                                                    key={lvl}
                                                                    className={`w-2 h-6 rounded-sm ${lvl <= item.severity_level ? (item.severity_level >= 4 ? 'bg-red-500' : 'bg-orange-400') : 'bg-slate-100'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Premium Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-fade-in"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Card */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">Nova Ocorrência</h3>
                                <p className="text-slate-500 text-sm mt-1">Preencha os dados do evento disciplinar ou mérito.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <form id="ocorrenciaInfos" onSubmit={handleSubmit} className="space-y-6">

                                {/* Row 1 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <UserIcon className="w-4 h-4 text-slate-400" />
                                            Colaborador
                                        </label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 transition-shadow outline-none"
                                            value={formData.collaboratorId}
                                            onChange={e => setFormData({ ...formData, collaboratorId: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            Data do Fato
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 transition-shadow outline-none"
                                            value={formData.dateEvent}
                                            onChange={e => setFormData({ ...formData, dateEvent: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Tipo de Evento</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(OCCURRENCE_TYPES).map(([key, value]) => {
                                            const TypeIcon = value.icon;
                                            const isSelected = formData.type === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: key })}
                                                    className={`
                                                        relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
                                                        ${isSelected
                                                            ? `bg-${value.color}-50 border-${value.color}-500 ring-1 ring-${value.color}-500`
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    <TypeIcon className={`w-6 h-6 mb-2 ${isSelected ? `text-${value.color}-600` : 'text-slate-400'}`} />
                                                    <span className={`text-xs font-bold ${isSelected ? `text-${value.color}-700` : 'text-slate-600'}`}>
                                                        {value.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dynamic Fields Section */}
                                <div className="animate-fade-in space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Título do Evento</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none"
                                            placeholder="Ex: Atraso recorrente, Meta superada..."
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {formData.type === 'SUSPENSAO' && (
                                        <div className="space-y-2 animate-zoom-in">
                                            <label className="text-sm font-bold text-red-700">Dias de Suspensão</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full bg-red-50 border border-red-200 text-red-900 text-sm rounded-xl focus:ring-2 focus:ring-red-500 block p-3 outline-none"
                                                placeholder="Quantos dias?"
                                                value={formData.suspensionDays}
                                                onChange={e => setFormData({ ...formData, suspensionDays: e.target.value })}
                                            />
                                            <p className="text-xs text-red-500">Esta informação será adicionada automaticamente à descrição.</p>
                                        </div>
                                    )}
                                </div>

                                {formData.type !== 'MERITO' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-slate-700">Nível de Gravidade / Impacto</label>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${formData.severityLevel === 1 ? 'bg-green-100 text-green-700' :
                                                formData.severityLevel === 2 ? 'bg-blue-100 text-blue-700' :
                                                    formData.severityLevel === 3 ? 'bg-yellow-100 text-yellow-700' :
                                                        formData.severityLevel === 4 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                Nível {formData.severityLevel}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
                                            value={formData.severityLevel}
                                            onChange={e => setFormData({ ...formData, severityLevel: parseInt(e.target.value) })}
                                        />
                                        <div className="flex justify-between text-xs text-slate-400 font-medium">
                                            <span>Leve (Feedback)</span>
                                            <span>Moderado</span>
                                            <span>Crítico (Demissão)</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                                        Anexar Evidência (Opcional)
                                    </label>
                                    <input
                                        type="file"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Descrição Detalhada</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-4 outline-none min-h-[120px]"
                                        placeholder="Descreva os fatos com detalhes..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="ocorrenciaInfos"
                                className="px-8 py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-300 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Confirmar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ocorrencias;
