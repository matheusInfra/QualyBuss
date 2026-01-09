import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

const Configuracoes = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('GERAL');

    // AI Settings State
    const [systemInstruction, setSystemInstruction] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash'); // Default fallback
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (activeTab === 'IA' && user) {
            loadAISettings();
        }
    }, [activeTab, user]);

    const loadAISettings = async () => {
        setIsLoadingSettings(true);
        try {
            const { data, error } = await supabase
                .from('ai_settings')
                .select('system_instruction, model')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSystemInstruction(data.system_instruction || '');
                setSelectedModel(data.model || 'gemini-1.5-flash');
            } else if (!error && !data) {
                // No settings yet
                setSystemInstruction('');
            }
        } catch (error) {
            console.error("Error loading AI settings:", error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const saveAISettings = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const { error } = await supabase
                .from('ai_settings')
                .upsert({
                    user_id: user.id,
                    system_instruction: systemInstruction,
                    model: selectedModel,
                    updated_at: new Date()
                });

            if (error) throw error;
            setSaveMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error("Error saving AI settings:", error);
            setSaveMessage('Erro ao salvar. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const TABS = [
        { id: 'EMPRESAS', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', desc: 'Cadastro de Lojas e Filiais', color: 'blue' },
        { id: 'USUARIOS', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', desc: 'Acesso e Permissões', color: 'purple' },
        { id: 'IA', label: 'Inteligência Artificial', icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Configuração do Assistente', color: 'indigo' },
        { id: 'GERAL', label: 'Configurações Gerais', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', desc: 'Sistema e Aparência', color: 'slate' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Centro de Controle</h1>
                <p className="text-slate-500 mt-1">Gerencie todos os aspectos do sistema QualyBuss.</p>
            </div>

            {/* Animated Tab Cards */}
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
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                        </div>
                        <h3 className={`font-bold text-lg mb-1 ${activeTab === tab.id ? `text-${tab.color}-900` : 'text-slate-700'}`}>{tab.label}</h3>
                        <p className="text-xs text-slate-400 font-medium">{tab.desc}</p>

                        {/* Active Indicator Pulse */}
                        {activeTab === tab.id && (
                            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-${tab.color}-500 animate-ping`} />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 min-h-[500px] overflow-hidden animate-fade-in-up">

                {/* 1. EMPRESAS CONTENT */}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Example Card */}
                            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-2xl">🏬</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-lg">Matriz - São Paulo</h4>
                                    <p className="text-sm text-slate-500 mb-2">CNPJ: 12.345.678/0001-90</p>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Ativa</span>
                                </div>
                                <button className="text-slate-400 hover:text-blue-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. USUARIOS CONTENT */}
                {activeTab === 'USUARIOS' && (
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Usuários do Sistema</h2>
                                <p className="text-slate-500">Controle de acesso e logins (Vinculado ao Supabase Auth).</p>
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
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 rounded-r-xl">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">Admin Master</td>
                                        <td className="px-6 py-4 text-slate-500">admin@qualybuss.com</td>
                                        <td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold">Administrador</span></td>
                                        <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Online</span></td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <button className="hover:text-blue-600 mr-3">Editar</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. IA CONTENT (UPDATED) */}
                {activeTab === 'IA' && (
                    <div className="p-8 space-y-6">
                        <div className="pb-6 border-b border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800">QualyBot AI Studio</h2>
                            <p className="text-slate-500">Personalize o comportamento e o conhecimento do seu assistente.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column: Form */}
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Modelo de Inteligência</label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Escolha o modelo que melhor se adapta às suas necessidades de velocidade e complexidade.
                                    </p>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        disabled={isLoadingSettings}
                                    >
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido & Padrão)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Mais Inteligente)</option>
                                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                                        {/* User requested specific strings */}
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nativo)</option>
                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Avançado)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Instrução do Sistema (System Prompt)</label>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Defina como a IA deve se comportar. Ex: "Você é um especialista em logística da QualyBuss. Responda de forma técnica e concisa."
                                    </p>
                                    <textarea
                                        value={systemInstruction}
                                        onChange={(e) => setSystemInstruction(e.target.value)}
                                        className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none text-slate-700"
                                        placeholder="Digite aqui as instruções..."
                                        disabled={isLoadingSettings}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="text-sm">
                                        {saveMessage && (
                                            <span className={`font-bold ${saveMessage.includes('Erro') ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {saveMessage}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={saveAISettings}
                                        disabled={isSaving}
                                        className={`
                                            px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 
                                            hover:bg-indigo-700 transition-all flex items-center gap-2
                                            ${isSaving ? 'opacity-70 cursor-wait' : ''}
                                        `}
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Salvando...
                                            </>
                                        ) : (
                                            'Salvar Alterações'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Tips */}
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 h-fit">
                                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Dicas de Configuração
                                </h3>
                                <ul className="space-y-3 text-sm text-indigo-800">
                                    <li className="flex gap-2">
                                        <span className="font-bold text-indigo-500">•</span>
                                        Seja específico sobre o tom de voz (Ex: Formal, Amigável).
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-indigo-500">•</span>
                                        Defina o escopo. Diga o que a IA NÃO deve fazer.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-indigo-500">•</span>
                                        Você pode colar dados importantes da empresa para ela usar como referência.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. GERAL CONTENT */}
                {activeTab === 'GERAL' && (
                    <div className="p-8 space-y-8">
                        <h2 className="text-2xl font-bold text-slate-800 pb-4 border-b border-slate-100">Preferências Globais</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Appearance */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                                    Aparência
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <button className="p-4 rounded-xl border-2 border-slate-900 bg-slate-800 text-white text-xs font-bold text-center">Escuro</button>
                                    <button className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-700 text-xs font-bold text-center ring-1 ring-blue-500">Claro</button>
                                    <button className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold text-center">Sistema</button>
                                </div>
                            </div>

                            {/* Language */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                                    Idioma
                                </h3>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-blue-500">
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
