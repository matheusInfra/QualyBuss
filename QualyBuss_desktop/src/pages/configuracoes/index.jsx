import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CompanyForm from './components/CompanyForm';
import UserForm from './components/UserForm';
import GeneralSettingsForm from './components/GeneralSettingsForm';
import {
    CpuChipIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    TrashIcon,
    CloudArrowUpIcon,
    BuildingOfficeIcon,
    UsersIcon,
    AdjustmentsHorizontalIcon,
    PencilSquareIcon,
    PlusIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

const Configuracoes = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('IA');

    // Estados Gerais
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Estados IA
    const [aiSettings, setAiSettings] = useState({
        system_instruction: '',
        knowledge_file_path: null
    });
    const [selectedFile, setSelectedFile] = useState(null);

    // Estados Empresas
    const [viewModeCompany, setViewModeCompany] = useState('LIST'); // LIST | FORM
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);

    // Estados Usuários
    const [viewModeUser, setViewModeUser] = useState('LIST'); // LIST | FORM
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);

    // Carregar configurações ao iniciar e ao mudar aba
    useEffect(() => {
        if (user) {
            if (activeTab === 'IA') loadSettings();
            if (activeTab === 'EMPRESAS') loadCompanies();
            if (activeTab === 'USUARIOS') loadProfiles();
        }
    }, [user, activeTab]);

    // --- CARREGAMENTO DE DADOS ---

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('ai_settings')
                .select('system_instruction, knowledge_file_path')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setAiSettings({
                    system_instruction: data.system_instruction || '',
                    knowledge_file_path: data.knowledge_file_path || null
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            setFeedback({ type: 'error', message: 'Erro ao carregar IA: ' + error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const loadCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('is_headquarters', { ascending: false });
            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
        }
    };

    const loadProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });
            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
        }
    };

    // --- LÓGICA DA ABA IA ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                setFeedback({ type: 'error', message: 'O arquivo deve ter no máximo 10MB.' });
                return;
            }
            setSelectedFile(file);
            setFeedback({ type: '', message: '' });
        }
    };

    const handleRemoveFile = async () => {
        if (!window.confirm("Deseja remover o documento de regras atual?")) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('ai_settings')
                .update({ knowledge_file_path: null })
                .eq('user_id', user.id);

            if (error) throw error;

            setAiSettings(prev => ({ ...prev, knowledge_file_path: null }));
            setFeedback({ type: 'success', message: 'Documento removido com sucesso.' });
            setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Erro ao remover arquivo.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAiSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback({ type: '', message: '' });

        try {
            let finalFilePath = aiSettings.knowledge_file_path;

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${user.id}_regras_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('ai-knowledge')
                    .upload(fileName, selectedFile);

                if (uploadError) throw uploadError;
                finalFilePath = fileName;
            }

            const payload = {
                user_id: user.id,
                system_instruction: aiSettings.system_instruction,
                knowledge_file_path: finalFilePath,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('ai_settings')
                .upsert(payload, { onConflict: 'user_id' });

            if (error) throw error;

            setAiSettings(prev => ({ ...prev, knowledge_file_path: finalFilePath }));
            setSelectedFile(null);
            setFeedback({ type: 'success', message: 'Configurações salvas com sucesso!' });
            setTimeout(() => setFeedback({ type: '', message: '' }), 3000);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            const msg = error.message || 'Erro ao salvar alterações. Tente novamente.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    // --- NAVEGAÇÃO INTERNA ---
    const TABS = [
        { id: 'EMPRESAS', label: 'Empresas', icon: BuildingOfficeIcon, desc: 'Cadastro de Lojas e Filiais', color: 'blue' },
        { id: 'USUARIOS', label: 'Usuários', icon: UsersIcon, desc: 'Acesso e Permissões', color: 'purple' },
        { id: 'IA', label: 'Inteligência Artificial', icon: CpuChipIcon, desc: 'Configuração do Assistente', color: 'indigo' },
        { id: 'GERAL', label: 'Configurações Gerais', icon: AdjustmentsHorizontalIcon, desc: 'Sistema e Aparência', color: 'slate' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4 font-sans pb-24">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Centro de Controle</h1>
                <p className="text-slate-500 mt-1">Gerencie todos os aspectos do sistema QualyBuss.</p>
            </div>

            {/* Abas de Navegação */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden
                            ${activeTab === tab.id
                                ? `border-${tab.color}-500 bg-${tab.color}-50 ring-2 ring-${tab.color}-200 shadow-lg transform scale-[1.02]`
                                : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
                            }
                        `}
                    >
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                            ${activeTab === tab.id ? `bg-${tab.color}-500 text-white` : `bg-slate-100 text-slate-400 group-hover:bg-${tab.color}-100 group-hover:text-${tab.color}-600`}
                        `}>
                            <tab.icon className="w-6 h-6" />
                        </div>
                        <h3 className={`font-bold text-lg mb-1 ${activeTab === tab.id ? `text-${tab.color}-900` : 'text-slate-700'}`}>{tab.label}</h3>
                        <p className="text-xs text-slate-400 font-medium">{tab.desc}</p>
                    </button>
                ))}
            </div>

            {/* Área de Conteúdo */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 min-h-[500px] overflow-hidden animate-fade-in-up relative">

                {/* Feedback Geral Flutuante */}
                {feedback.message && (
                    <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold animate-slide-in ${feedback.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {feedback.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : null}
                        {feedback.message}
                    </div>
                )}

                {/* 1. CONTEÚDO: EMPRESAS */}
                {activeTab === 'EMPRESAS' && (
                    <div className="p-8 space-y-8">
                        {viewModeCompany === 'LIST' ? (
                            <>
                                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Empresas & Filiais</h2>
                                        <p className="text-slate-500">Gerencie os dados cadastrais das lojas.</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedCompany(null); setViewModeCompany('FORM'); }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                                    >
                                        <PlusIcon className="w-5 h-5" /> Nova Filial
                                    </button>
                                </div>

                                {companies.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                        <p>Nenhuma empresa cadastrada.</p>
                                        <p className="text-sm">Clique em "Nova Filial" para começar.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {companies.map(comp => (
                                            <div key={comp.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-4 hover:border-blue-200 transition-colors group relative">
                                                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                                                    🏬
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <h4 className="font-bold text-slate-800 text-lg truncate pr-8">{comp.trade_name || comp.legal_name}</h4>
                                                        <button
                                                            onClick={() => { setSelectedCompany(comp); setViewModeCompany('FORM'); }}
                                                            className="text-slate-400 hover:text-blue-600 absolute top-6 right-6"
                                                        >
                                                            <PencilSquareIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mb-2">CNPJ: {comp.cnpj}</p>
                                                    <div className="flex gap-2">
                                                        {comp.is_headquarters && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">Matriz</span>
                                                        )}
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${comp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                                                            {comp.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                                        📍 {comp.city} - {comp.state}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            // FORM MODE
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <button onClick={() => setViewModeCompany('LIST')} className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-1">
                                        ← Voltar para Lista
                                    </button>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                                    {selectedCompany ? `Editar: ${selectedCompany.trade_name || 'Empresa'}` : 'Nova Filial'}
                                </h2>
                                <CompanyForm
                                    initialData={selectedCompany}
                                    onSuccess={() => { loadCompanies(); setViewModeCompany('LIST'); }}
                                    onCancel={() => setViewModeCompany('LIST')}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CONTEÚDO: USUARIOS */}
                {activeTab === 'USUARIOS' && (
                    <div className="p-8 space-y-8">
                        {viewModeUser === 'LIST' ? (
                            <>
                                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h2>
                                        <p className="text-slate-500">Controle de acesso e logins.</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedProfile(null); setViewModeUser('FORM'); }}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2"
                                    >
                                        <PlusIcon className="w-5 h-5" /> Novo Usuário
                                    </button>
                                </div>

                                {profiles.length === 0 ? (
                                    <p className="text-center text-slate-400 py-10">Nenhum perfil encontrado.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-4 rounded-l-xl">Usuário</th>
                                                    <th className="px-6 py-4">Departamento</th>
                                                    <th className="px-6 py-4">Nível</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 rounded-r-xl">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {profiles.map(profile => (
                                                    <tr key={profile.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4 flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                                                {profile.avatar_url ? (
                                                                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserCircleIcon className="w-full h-full text-slate-400 p-1" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-700">{profile.full_name || 'Sem Nome'}</p>
                                                                <p className="text-xs text-slate-400">{profile.email || 'Email indisponível'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 font-medium">{profile.department || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold 
                                                                ${profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}
                                                            `}>
                                                                {profile.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold
                                                                ${profile.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                                                            `}>
                                                                {profile.active ? 'Ativo' : 'Inativo'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => { setSelectedProfile(profile); setViewModeUser('FORM'); }}
                                                                className="text-slate-400 hover:text-purple-600 font-bold text-xs border border-slate-200 px-3 py-1 rounded-lg hover:bg-white hover:border-purple-200 transition-all"
                                                            >
                                                                Editar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            // FORM MODE USER
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <button onClick={() => setViewModeUser('LIST')} className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-1">
                                        ← Voltar para Lista
                                    </button>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                                    {selectedProfile ? `Editar Usuário: ${selectedProfile.full_name}` : 'Novo Usuário'}
                                </h2>
                                <UserForm
                                    initialData={selectedProfile}
                                    onSuccess={() => { loadProfiles(); setViewModeUser('LIST'); }}
                                    onCancel={() => setViewModeUser('LIST')}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 3. CONTEÚDO: IA */}
                {activeTab === 'IA' && (
                    <form onSubmit={handleSaveAiSettings} className="p-8 space-y-8">
                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800">QualyBot AI Studio</h2>
                            <p className="text-slate-500">Personalize a inteligência e as regras do seu assistente.</p>
                        </div>
                        {/* Status do Modelo */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                                    <CpuChipIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-900 text-lg">Gemini 2.5 Flash-Lite</h3>
                                    <p className="text-sm text-indigo-700 flex items-center gap-2">
                                        <span className="flex w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Google Search & Leitura de Documentos Ativos
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:block text-xs font-medium text-indigo-400 bg-white/50 px-3 py-1 rounded-full">
                                Versão: v1beta (Estável)
                            </div>
                        </div>
                        {/* Prompt e Upload IA (Mantido Igual) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* ... Componentes de Upload e TextArea mantidos ... */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                                        Base de Conhecimento (Regras/CLT)
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Anexe o regulamento interno ou convenção coletiva (PDF/TXT).
                                    </p>
                                    <div className={`
                                        border-2 border-dashed rounded-xl p-6 transition-all text-center relative
                                        ${selectedFile ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-blue-400'}
                                    `}>
                                        <input
                                            type="file"
                                            accept=".pdf,.txt,.md"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center pointer-events-none">
                                            {selectedFile ? (
                                                <>
                                                    <DocumentTextIcon className="w-10 h-10 text-blue-500 mb-2" />
                                                    <p className="font-bold text-blue-700 text-sm truncate max-w-xs">{selectedFile.name}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <CloudArrowUpIcon className="w-10 h-10 text-slate-400 mb-2" />
                                                    <p className="font-medium text-slate-600 text-sm">Clique ou arraste um arquivo</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {aiSettings.knowledge_file_path && !selectedFile && (
                                        <div className="mt-3 flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-green-100 rounded text-green-600"><CheckCircleIcon className="w-5 h-5" /></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate" title={aiSettings.knowledge_file_path}>
                                                        {aiSettings.knowledge_file_path.split('/').pop()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={handleRemoveFile} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Instruções de Personalidade</label>
                                    <textarea
                                        value={aiSettings.system_instruction}
                                        onChange={(e) => setAiSettings({ ...aiSettings, system_instruction: e.target.value })}
                                        className="w-full h-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none text-slate-700 text-sm leading-relaxed"
                                        placeholder="Digite aqui as instruções..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                {isSaving ? <><ArrowPathIcon className="w-5 h-5 animate-spin" /> Salvando...</> : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                )}

                {/* 4. CONTEÚDO: GERAL */}
                {activeTab === 'GERAL' && (
                    <div className="p-8">
                        <GeneralSettingsForm />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Configuracoes;
