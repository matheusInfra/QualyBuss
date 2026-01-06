import React from 'react';

const Configuracoes = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Configurações do Sistema</h1>
                <p className="text-slate-500 mt-1">Personalize sua experiência no QualyBuss.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-60 grayscale cursor-not-allowed relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 font-bold text-slate-500">
                        Em Breve
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Aparência</h3>
                    </div>
                    <p className="text-slate-500 text-sm">Alterne entre temas claro/escuro e cores de destaque.</p>
                </div>

                {/* Account Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-60 grayscale cursor-not-allowed relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 font-bold text-slate-500">
                        Em Breve
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Minha Conta</h3>
                    </div>
                    <p className="text-slate-500 text-sm">Gerencie sua senha, avatar e dados pessoais.</p>
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
