import React, { useState, useEffect } from 'react';
import { roleService } from '../../../services/roleService';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';

const RoleForm = () => {
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState({ id: null, name: '', active: true });

    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            const data = await roleService.getRoles({ all: true });
            setRoles(data);
        } catch (error) {
            setFeedback({ type: 'error', message: 'Erro ao carregar lista de cargos.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentRole({ id: null, name: '', active: true });
        setFeedback({ type: '', message: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback({ type: '', message: '' });

        try {
            if (currentRole.id) {
                await roleService.update(currentRole.id, {
                    name: currentRole.name,
                    active: currentRole.active
                });
                setFeedback({ type: 'success', message: 'Cargo atualizado.' });
            } else {
                await roleService.create(currentRole.name);
                setFeedback({ type: 'success', message: 'Cargo criado com sucesso.' });
            }
            loadRoles();
            setTimeout(resetForm, 2000); // Fecha o form após 2s
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir permanentemente o cargo "${name}"? \nSe ele possuir colaboradores vinculados, ocorrerão erros!`)) return;

        try {
            await roleService.delete(id);
            setFeedback({ type: 'success', message: 'Cargo excluído.' });
            loadRoles();
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        }
    };

    if (isLoading && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p>Carregando cargos oficiais...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {feedback.message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex gap-2 ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {!isEditing ? (
                <>
                    <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Cargos Profissionais</h2>
                            <p className="text-slate-500">Listagem oficial de nomenclaturas para cadastro estrito.</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" /> Adicionar Oficial
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {roles.map((role) => (
                            <div key={role.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-4 hover:border-amber-300 transition-colors group relative overflow-hidden">
                                {role.active ? (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                ) : (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                                )}
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                    <BriefcaseIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-extrabold text-slate-800 tracking-tight truncate pr-8">{role.name}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${role.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {role.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setCurrentRole(role); setIsEditing(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 rounded-lg">
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(role.id, role.name)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {roles.length === 0 && !isLoading && (
                            <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                <BriefcaseIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>Nenhum cargo oficial cadastrado na base de dados.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="max-w-2xl bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800">
                            {currentRole.id ? 'Editar Cargo' : 'Novo Cargo Oficial'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                            &times; Cancelar
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                Nomenclatura do Cargo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={currentRole.name}
                                onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                                placeholder="Ex: Desenvolvedor Senior, Auxiliar Administrativo"
                                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">Este nome aparecerá de forma fechada no cadastro do Colaborador.</p>
                        </div>

                        {currentRole.id && (
                            <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="roleStatus"
                                    checked={currentRole.active}
                                    onChange={(e) => setCurrentRole({ ...currentRole, active: e.target.checked })}
                                    className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                                />
                                <div>
                                    <label htmlFor="roleStatus" className="font-bold text-slate-700 cursor-pointer">Cargo Ativo (Operante)</label>
                                    <p className="text-xs text-slate-500">Desmarque se a nomenclatura foi descontinuada no organograma.</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : (currentRole.id ? 'Atualizar Cargo' : 'Criar Cargo Oficial')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RoleForm;
