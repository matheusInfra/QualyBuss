import React, { useState } from 'react';
<<<<<<< HEAD
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
=======
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase'; // Importação do cliente
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
import logo from '../../assets/logo.svg';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

<<<<<<< HEAD
=======
  // Função para atualizar o estado conforme o usuário digita
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
<<<<<<< HEAD
=======
      // Chamada ao Supabase para autenticação
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
<<<<<<< HEAD
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('E-mail ou senha incorretos.');
=======
        // Tratamento de erros específicos para melhor UX
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('E-mail ou senha incorretos. Verifique seus dados.');
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
        } else if (error.message.includes('Network')) {
          setErrorMsg('Erro de conexão. Verifique sua internet.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

<<<<<<< HEAD
      navigate('/dashboard');

    } catch (error) {
      setErrorMsg('Ocorreu um erro inesperado.');
      console.error(error);
=======
      // Se o login for bem-sucedido
      console.log("Login realizado com sucesso:", data.user.email);
      navigate('/dashboard');

    } catch (error) {
      setErrorMsg('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      console.error('Erro crítico no login:', error);
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')",
          filter: "brightness(0.6)"
        }}
      />

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 mx-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white/90 p-3 rounded-2xl shadow-lg w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <img src={logo} alt="QualyBuss Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Bem-vindo</h1>
          <p className="text-slate-200 text-sm font-light">Acesse seu painel corporativo</p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/80 backdrop-blur-sm border border-red-400 text-white rounded-xl text-sm text-center shadow-lg">
=======
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-10">
          <img src={logo} alt="Logo da Empresa" className="h-50 w-50 mx-auto mb-4 border-radius-2xl" />
          
          <p className="text-slate-500 mt-2">Acesse sua conta para gerenciar em tempo real</p>
        </div>

        {/* Exibição de mensagens de erro dinâmicas */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center animate-pulse">
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            {errorMsg}
          </div>
        )}

<<<<<<< HEAD
        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 ml-1">E-mail Corporativo</label>
=======
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
<<<<<<< HEAD
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/20"
              placeholder="seu@qualybi.com"
=======
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
              placeholder="exemplo@qualybuss.com"
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            />
          </div>

          <div>
<<<<<<< HEAD
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">Senha</label>
              <Link to="/forgot-password" className="text-xs text-blue-200 hover:text-white transition-colors hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
=======
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
<<<<<<< HEAD
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/20"
=======
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
<<<<<<< HEAD
            className={`w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold tracking-wide shadow-lg shadow-blue-900/100 transform transition-all active:scale-[0.98] mt-4 flex items-center justify-center ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Entrar'
=======
            className={`w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Autenticando...
              </>
            ) : (
              'Entrar no Sistema'
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            )}
          </button>
        </form>
      </div>
<<<<<<< HEAD

      {/* Footer */}
      <div className="absolute bottom-4 w-full text-center space-y-2">
        <div className="flex justify-center gap-4 text-xs text-blue-200/60 font-medium">
          <Link to="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-white transition-colors">Política de Privacidade</Link>
        </div>
        <p className="text-white/40 text-xs font-light">© 2026 QualyBuss. Todos os direitos reservados.</p>
      </div>
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
    </div>
  );
};

export default Login;