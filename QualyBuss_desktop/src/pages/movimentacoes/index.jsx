import React from 'react';

const Movimentacoes = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
            <div className="bg-slate-100 p-6 rounded-full mb-6">
                <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Movimentações</h1>
            <p className="text-slate-500 max-w-md">
                Este módulo está em construção. Em breve você poderá gerenciar transfers, promoções e alterações de cargo por aqui.
            </p>
        </div>
    );
};

export default Movimentacoes;
