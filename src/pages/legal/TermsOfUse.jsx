import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfUse = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <div className="mb-8">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
                        &larr; Voltar para Login
                    </Link>
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Termos de Uso</h1>
                <p className="text-slate-500 mb-8 text-sm">Última atualização: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-indigo max-w-none text-slate-600 space-y-6">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800">1. Introdução</h2>
                        <p>
                            Bem-vindo ao QualyBuss. Ao acessar ou usar nosso sistema, você concorda em cumprir estes Termos de Uso.
                            Se você não concordar com alguma parte destes termos, não poderá acessar o serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">2. Uso do Sistema</h2>
                        <p>
                            O QualyBuss é uma plataforma corporativa destinada ao gerenciamento interno.
                            O acesso é restrito a colaboradores autorizados e o uso deve estar em conformidade com as políticas internas da empresa.
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Você é responsável por manter a confidencialidade de suas credenciais.</li>
                            <li>Todo acesso é monitorado e registrado para fins de auditoria e segurança.</li>
                            <li>O uso indevido para fins ilícitos é estritamente proibido.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">3. Propriedade Intelectual</h2>
                        <p>
                            O sistema, suas funcionalidades, design e código-fonte são de propriedade exclusiva da QualyBuss
                            e estão protegidos por leis de direitos autorais e propriedade intelectual.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">4. Limitação de Responsabilidade</h2>
                        <p>
                            O sistema é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros,
                            embora envidemos os melhores esforços para manter a estabilidade e segurança.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800">5. Alterações</h2>
                        <p>
                            Reservamo-nos o direito de modificar estes termos a qualquer momento.
                            O uso contínuo do sistema após tais alterações constitui aceitação dos novos termos.
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

export default TermsOfUse;
