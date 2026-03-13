import React, { useState, useEffect } from 'react';
import { departmentService } from '../../../services/departmentService';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const DepartmentForm = () => {
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [currentDept, setCurrentDept] = useState({ id: null, name: '', active: true });

    // Feedback local
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const loadDepartments = async () => {
        setIsLoading(true);
        try {
            // Retornar tb inativos pra gestão do admin
            const data = await departmentService.getDepartments({ all: true });
            setDepartments(data);
        } catch {
            setFeedback({ type: 'error', message: 'Erro ao carregar lista de departamentos.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentDept({ id: null, name: '', active: true });
        setFeedback({ type: '', message: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback({ type: '', message: '' });

        try {
            if (currentDept.id) {
                await departmentService.update(currentDept.id, {
                    name: currentDept.name,
                    active: currentDept.active
                });
                setFeedback({ type: 'success', message: 'Departamento atualizado.' });
            } else {
                await departmentService.create(currentDept.name);
                setFeedback({ type: 'success', message: 'Setor criado com sucesso.' });
            }
            loadDepartments();
            setTimeout(resetForm, 2000); // Fecha o form após 2s ou aguarda nova ação
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir permanentemente o setor "${name}"? \nSe ele possuir colaboradores vinculados, ocorrerão erros!`)) return;

        try {
            await departmentService.delete(id);
            setFeedback({ type: 'success', message: 'Setor excluído.' });
            loadDepartments();
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        }
    };

    if (isLoading && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p>Carregando organograma oficial...</p>
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

            {/* List ou Form Mode */}
            {!isEditing ? (
                <>
                    <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Departamentos e Setores</h2>
                            <p className="text-slate-500">Listagem oficial de áreas da empresa para cadastro estrito.</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" /> Adicionar Oficial
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {departments.map((dept) => (
                            <div key={dept.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-4 hover:border-indigo-300 transition-colors group relative overflow-hidden">
                                {dept.active ? (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                ) : (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                                )}
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <BuildingOfficeIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-extrabold text-slate-800 tracking-tight truncate pr-8">{dept.name}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${dept.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {dept.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setCurrentDept(dept); setIsEditing(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg">
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(dept.id, dept.name)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {departments.length === 0 && !isLoading && (
                            <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                <BuildingOfficeIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>Nenhum departamento oficial cadastrado na base de dados.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="max-w-2xl bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800">
                            {currentDept.id ? 'Editar Departamento' : 'Novo Departamento Oficial'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                            &times; Cancelar
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                Nome da Área / Setor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={currentDept.name}
                                onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
                                placeholder="Ex: Financeiro, Recursos Humanos, Engenharia"
                                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-800"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">Este nome aparecerá para escolha no cadastro rígido do Colaborador.</p>
                        </div>

                        {currentDept.id && (
                            <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="deptStatus"
                                    checked={currentDept.active}
                                    onChange={(e) => setCurrentDept({ ...currentDept, active: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <div>
                                    <label htmlFor="deptStatus" className="font-bold text-slate-700 cursor-pointer">Setor Ativo (Operante)</label>
                                    <p className="text-xs text-slate-500">Desmarque se o setor não for mais aceito em novos cadastros.</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : (currentDept.id ? 'Atualizar Direitos' : 'Criar Setor Oficial')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default DepartmentForm;
