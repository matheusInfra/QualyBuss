import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <div className="mb-8">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
                        &larr; Voltar para Login
                    </Link>
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Política de Privacidade</h1>
                <p className="text-slate-500 mb-8 text-sm">Última atualização: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-indigo max-w-none text-slate-600 space-y-6">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800">1. Coleta de Dados</h2>
                        <p>
                            Coletamos apenas as informações necessárias para o funcionamento do sistema e cumprimento
                            de obrigações legais e contratuais (LGPD Art. 7).
                        </p>
                        <p className="mt-2">Dados coletados incluem:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Identificação (Nome, Email corporativo).</li>
                            <li>Logs de acesso e auditoria (Endereço IP, Ações no sistema).</li>
                            <li>Dados funcionais necessários para os módulos de RH e Departamento Pessoal.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">2. Uso das Informações</h2>
                        <p>
                            As informações são utilizadas estritamente para:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Autenticação e controle de acesso seguro.</li>
                            <li>Operacionalização dos processos internos da empresa.</li>
                            <li>Auditoria de segurança e conformidade legal.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">3. Compartilhamento de Dados</h2>
                        <p>
                            Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de marketing.
                            O compartilhamento ocorre apenas quando necessário para execução do contrato de trabalho ou obrigação legal.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">4. Segurança</h2>
                        <p>
                            Adotamos medidas técnicas e administrativas robustas para proteger seus dados pessoais
                            contra acessos não autorizados e situações acidentais ou ilícitas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">5. Seus Direitos</h2>
                        <p>
                            Conforme a LGPD, você tem direito a confirmar a existência de tratamento, acessar seus dados,
                            corrigir dados incompletos e revogar consentimento (quando aplicável). Para exercer seus direitos,
                            contate o encarregado de dados (DPO) da sua organização.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} QualyBuss. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
