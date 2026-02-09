import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { termsService } from '../../services/termsService';
import { useAuth } from '../../contexts/AuthContext';

const TermsAcceptanceModal = ({ open, onSuccess }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const handleAccept = async () => {
        setLoading(true);
        setError('');
        try {
            await termsService.acceptTerms();
            onSuccess();
        } catch (err) {
            console.error(err);
            if (err.message.includes('Permissão')) {
                setError('Para aceitar os termos, é necessário permitir a geolocalização como prova de conformidade.');
            } else {
                setError('Erro ao salvar aceite. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-indigo-600 p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold">Atualização de Termos</h2>
                    <p className="text-indigo-100 text-sm mt-1">Para continuar, precisamos que você aceite os novos termos.</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="h-48 overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600 space-y-3 mb-6">
                        <p className="font-bold text-slate-800">1. Aceite de Geolocalização</p>
                        <p>Ao aceitar estes termos, você concorda que o sistema colete sua localização (latitude/longitude) no momento do aceite como prova de auditoria e segurança.</p>
                        <p className="font-bold text-slate-800">2. Responsabilidade</p>
                        <p>Você é responsável por todas as ações realizadas com suas credenciais.</p>
                        <p className="font-bold text-slate-800">3. Confidencialidade</p>
                        <p>As informações acessadas neste sistema são confidenciais e propriedade da empresa.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white transform active:scale-[0.98]'}`}
                    >
                        {loading ? 'Validando Localização...' : 'Li e Aceito os Termos'}
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full mt-4 py-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                    >
                        Sair e aceitar depois
                    </button>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">IP: {window.location.hostname} • Ver: {termsService.TERMS_VERSION || '1.0'}</p>
                </div>
            </div>
        </div>
    );
};

export default TermsAcceptanceModal;
