import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Cog6ToothIcon,
    CpuChipIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    TrashIcon,
    CloudArrowUpIcon,
    BuildingOfficeIcon,
    UsersIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const Configuracoes = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('IA'); // Aba padrão inicial

    // Estados Gerais
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Estados da IA
    const [aiSettings, setAiSettings] = useState({
        system_instruction: '',
        knowledge_file_path: null
    });
    const [selectedFile, setSelectedFile] = useState(null);

    // Carregar configurações ao iniciar
    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            // Carrega configurações da IA
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
            // Não exibimos erro visual no load para não assustar o usuário se for o primeiro acesso
        } finally {
            setIsLoading(false);
        }
    };

    // --- LÓGICA DA ABA IA ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Validação simples de tamanho (ex: 10MB)
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

            // 1. Upload do Arquivo (se houver novo)
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                // Nome único para evitar cache/conflito
                const fileName = `${user.id}_regras_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('ai-knowledge')
                    .upload(fileName, selectedFile);

                if (uploadError) throw uploadError;
                finalFilePath = fileName;
            }

            // 2. Salvar no Banco (CORREÇÃO: Usando UPSERT em vez de Select + Insert/Update)
            // Isso corrige o erro 400 (select id inexistente) e 409 (conflict)
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
            // Tratamento de erro mais amigável
            const msg = error.message || 'Erro ao salvar alterações. Tente novamente.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const TABS = [
        { id: 'EMPRESAS', label: 'Empresas', icon: BuildingOfficeIcon, desc: 'Cadastro de Lojas e Filiais', color: 'blue' },
        { id: 'USUARIOS', label: 'Usuários', icon: UsersIcon, desc: 'Acesso e Permissões', color: 'purple' },
        { id: 'IA', label: 'Inteligência Artificial', icon: CpuChipIcon, desc: 'Configuração do Assistente', color: 'indigo' },
        { id: 'GERAL', label: 'Configurações Gerais', icon: AdjustmentsHorizontalIcon, desc: 'Sistema e Aparência', color: 'slate' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4 font-sans">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Centro de Controle</h1>
                <p className="text-slate-500 mt-1">Gerencie todos os aspectos do sistema QualyBuss.</p>
            </div>

            {/* Abas de Navegação (Cards) */}
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

                {/* Feedback Geral Flutuante (se houver) */}
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
                        <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Empresas & Filiais</h2>
                                <p className="text-slate-500">Gerencie os dados cadastrais das lojas.</p>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                + Nova Filial
                            </button>
                        </div>
                        {/* Exemplo de Lista */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-2xl">🏬</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-lg">Matriz - São Paulo</h4>
                                    <p className="text-sm text-slate-500 mb-2">CNPJ: 12.345.678/0001-90</p>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Ativa</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CONTEÚDO: USUARIOS */}
                {activeTab === 'USUARIOS' && (
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h2>
                                <p className="text-slate-500">Controle de acesso e logins.</p>
                            </div>
                            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                                + Novo Usuário
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 rounded-l-xl">Usuário</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Nível</th>
                                        <th className="px-6 py-4 rounded-r-xl">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">Admin Master</td>
                                        <td className="px-6 py-4 text-slate-500">{user?.email}</td>
                                        <td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold">Administrador</span></td>
                                        <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Online</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. CONTEÚDO: IA (ATUALIZADO E COMPLETO) */}
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* COLUNA ESQUERDA: Upload e Regras */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                                        Base de Conhecimento (Regras/CLT)
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Anexe o regulamento interno ou convenção coletiva (PDF/TXT). A IA usará este arquivo como verdade absoluta.
                                    </p>

                                    {/* Área de Upload */}
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
                                                    <p className="text-xs text-blue-400">Pronto para enviar</p>
                                                </>
                                            ) : (
                                                <>
                                                    <CloudArrowUpIcon className="w-10 h-10 text-slate-400 mb-2" />
                                                    <p className="font-medium text-slate-600 text-sm">Clique ou arraste um arquivo</p>
                                                    <p className="text-xs text-slate-400">PDF ou Texto (Max 10MB)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arquivo Ativo (Já salvo) */}
                                    {aiSettings.knowledge_file_path && !selectedFile && (
                                        <div className="mt-3 flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-green-100 rounded text-green-600">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-500 uppercase">Arquivo Ativo</p>
                                                    <p className="text-sm font-medium text-slate-800 truncate" title={aiSettings.knowledge_file_path}>
                                                        {aiSettings.knowledge_file_path.split('/').pop()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remover arquivo"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUNA DIREITA: Prompt do Sistema */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Instruções de Personalidade
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Defina o comportamento da IA. Ex: "Você é um especialista em RH. Responda formalmente."
                                    </p>
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
                                className={`
                                    px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 
                                    hover:bg-indigo-700 transition-all flex items-center gap-2
                                    ${isSaving ? 'opacity-70 cursor-wait' : ''}
                                `}
                            >
                                {isSaving ? (
                                    <>
                                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* 4. CONTEÚDO: GERAL */}
                {activeTab === 'GERAL' && (
                    <div className="p-8 space-y-8">
                        <h2 className="text-2xl font-bold text-slate-800 pb-4 border-b border-slate-100">Preferências Globais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-700">Aparência</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <button className="p-4 rounded-xl border-2 border-slate-900 bg-slate-800 text-white text-xs font-bold text-center">Escuro</button>
                                    <button className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 text-xs font-bold text-center ring-1 ring-blue-500">Claro</button>
                                    <button className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold text-center">Sistema</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-700">Idioma</h3>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none">
                                    <option>Português (Brasil)</option>
                                    <option>English</option>
                                    <option>Español</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Configuracoes;