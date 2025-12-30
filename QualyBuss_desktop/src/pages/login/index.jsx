import React from 'react';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header da Tela */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">
            Qualy<span className="text-blue-600">Buss</span>
          </h1>
          <p className="text-slate-500 mt-2">Acesse sua conta para gerenciar a frota</p>
        </div>

        {/* Formulário */}
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="exemplo@qualybuss.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-slate-600">
              <input type="checkbox" className="mr-2 rounded border-slate-300 text-blue-600" />
              Lembrar de mim
            </label>
            <a href="#" className="text-blue-600 hover:underline font-medium">Esqueceu a senha?</a>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transform active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
          >
            Entrar no Sistema
          </button>
        </form>

        {/* Footer do Card */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Ainda não tem acesso? <a href="#" className="text-blue-600 font-bold hover:underline">Contate o administrador</a>
        </p>
      </div>
    </div>
  );
};

export default Login;