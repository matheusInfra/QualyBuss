import React, { useState } from 'react';

const Configuracoes = () => {
    const [activeTab, setActiveTab] = useState('GERAL');

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

                {/* 3. IA CONTENT */}
                {activeTab === 'IA' && (
                    <div className="p-8">
                        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
                            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">QualyBot AI Studio</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Em breve você poderá configurar a personalidade, base de conhecimento e permissões da nossa IA generativa.
                            </p>
                            <div className="mt-8 flex gap-4">
                                <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                    Entrar na Lista de Espera
                                </button>
                                <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
                                    Ler Documentação
                                </button>
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
