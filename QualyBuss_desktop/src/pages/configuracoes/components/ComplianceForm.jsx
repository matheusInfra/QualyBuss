import React, { useState, useEffect } from 'react';
import { complianceService } from '../../../services/complianceService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ShieldCheckIcon, PencilSquareIcon, TrashIcon, ExclamationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

const ComplianceForm = () => {
    const { notify } = useNotification();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [category, setCategory] = useState('');
    const [isMandatory, setIsMandatory] = useState(true);
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('UNIQUE');
    const [closingDay, setClosingDay] = useState('');

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        try {
            const data = await complianceService.getRules();
            setRules(data);
        } catch {
            notify.error('Erro', 'Falha ao carregar regras de compliance.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                category,
                is_mandatory: isMandatory,
                description,
                frequency,
                closing_day: frequency === 'MONTHLY' ? (parseInt(closingDay) || null) : null
            };
            if (isEditing) {
                await complianceService.update(currentId, payload);
                notify.success('Sucesso', 'Regra atualizada com sucesso!');
            } else {
                await complianceService.create(payload);
                notify.success('Sucesso', 'Categoria criada com sucesso!');
            }
            resetForm();
            loadRules();
        } catch (error) {
            notify.error('Erro de Validação', error.message);
        }
    };

    const handleEdit = (rule) => {
        setIsEditing(true);
        setCurrentId(rule.id);
        setCategory(rule.category);
        setIsMandatory(rule.is_mandatory);
        setDescription(rule.description || '');
        setFrequency(rule.frequency || 'UNIQUE');
        setClosingDay(rule.closing_day || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (rule) => {
        if (!window.confirm(`Tem certeza que deseja excluir a categoria "${rule.category}"? Isso pode impactar documentos vinculados a ela.`)) return;
        try {
            await complianceService.delete(rule.id);
            notify.success('Excluído', 'Categoria removida.');
            loadRules();
        } catch (error) {
            notify.error('Erro', error.message);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setCategory('');
        setIsMandatory(true);
        setDescription('');
        setFrequency('UNIQUE');
        setClosingDay('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-emerald-100/50 rounded-xl text-emerald-600">
                    <ShieldCheckIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Regras de Compliance</h2>
                    <p className="text-sm text-slate-500 mt-1">Defina quais categorias de documentos são aceitas e se são obrigatórias para o cálculo de integridade do RH.</p>
                </div>
            </div>

            {/* FORMULÁRIO */}
            <form onSubmit={handleSave} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">{isEditing ? 'Editar Regra' : 'Nova Categoria'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Nome da Categoria <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ex: Exame Admissional (ASO)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Descrição / Instrução <span className="text-slate-400 font-normal">(Opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o que este documento comprova"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Frequência da Exigência <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                        >
                            <option value="UNIQUE">Documento Estático / Único (Ex: RG, Contrato)</option>
                            <option value="MONTHLY">Recorrente / Mensal (Ex: Holerite, Ponto)</option>
                        </select>
                    </div>

                    {frequency === 'MONTHLY' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Dia do Fechamento <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-500">Todo dia</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    required
                                    value={closingDay}
                                    onChange={(e) => setClosingDay(e.target.value)}
                                    placeholder="Ex: 25"
                                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center"
                                />
                                <span className="text-xs text-slate-400 leading-tight">o sistema cobrará o arquivo gerado da competência.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center mb-6">
                    <input
                        type="checkbox"
                        id="isMandatory"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="isMandatory" className="ml-2 text-sm font-semibold text-slate-700">
                        Obrigatório para Compliance
                    </label>
                    <span className="ml-2 text-[10px] text-slate-400 uppercase tracking-wide font-medium bg-slate-200 px-2 py-0.5 rounded-full">
                        Se não tiver, o colaborador fica irregular no Dashboard
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {isEditing ? <PencilSquareIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                        {isEditing ? 'Salvar Alterações' : 'Adicionar Regra'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            {/* LISTAGEM */}
            <div className="bg-white border border-slate-200 flex flex-col rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-700">Tipos de Documentos Permitidos no Sistema</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400 animate-pulse">Carregando lista...</div>
                ) : rules.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <ExclamationCircleIcon className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                        <p>Nenhuma categoria de documento cadastrada ainda.</p>
                        <p className="text-xs">O módulo de Documentos está bloqueado até que você defina o que pode ser enviado.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {rules.map((rule) => (
                            <li key={rule.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800">{rule.category}</h4>
                                        {rule.is_mandatory ? (
                                            <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ring-1 ring-red-100/50">
                                                Obrigatório
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
                                                Opcional
                                            </span>
                                        )}
                                        {rule.frequency === 'MONTHLY' && (
                                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ring-1 ring-indigo-100/50">
                                                Mensal (Dia {rule.closing_day})
                                            </span>
                                        )}
                                    </div>
                                    {rule.description && <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>}
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(rule)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ComplianceForm;
