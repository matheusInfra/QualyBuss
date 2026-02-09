import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            console.log("Tentando enviar e-mail de recuperação para:", email); // DEBUG

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`, // Optional: if you have a specific reset page
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Link de redefinição enviado! Verifique seu e-mail (inclusive spam).'
            });
            setEmail(''); // Clear input

        } catch (error) {
            console.error(error);
            setMessage({
                type: 'error',
                text: 'Erro ao enviar e-mail. Tente novamente ou contate o suporte.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
            {/* Same Background as Login for Consistency */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')",
                    filter: "brightness(0.6)"
                }}
            />

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 mx-4 animate-in zoom-in-95 duration-500">

                <div className="text-center mb-6">
                    <div className="bg-white/90 p-2 rounded-xl shadow-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h2>
                    <p className="text-slate-200 text-sm font-light leading-relaxed">
                        Informe seu e-mail corporativo para receber as instruções de redefinição.
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 p-3 rounded-xl text-sm text-center border shadow-lg ${message.type === 'success'
                        ? 'bg-green-500/80 border-green-400 text-white'
                        : 'bg-red-500/80 border-red-400 text-white'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 ml-1">E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/20"
                            placeholder="seu@email.com"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold tracking-wide shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center ${loading ? 'opacity-80' : ''}`}
                        >
                            {loading ? 'Enviando...' : 'Enviar Link'}
                        </button>

                        <Link
                            to="/"
                            className="block w-full text-center py-3 rounded-xl text-slate-200 hover:bg-white/10 transition-colors font-medium text-sm"
                        >
                            Voltar para o Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
