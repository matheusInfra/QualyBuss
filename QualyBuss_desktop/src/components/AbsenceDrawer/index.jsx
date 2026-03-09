import React, { useState, useEffect } from 'react';
import { absenceService } from '../../services/absenceService';

const AbsenceDrawer = ({ isOpen, onClose, collaborator, notify }) => {
    const [mode, setMode] = useState('CREDIT'); // 'CREDIT' or 'DEBIT'
    const [targetBank, setTargetBank] = useState('HOURS'); // 'HOURS' or 'VACATION'
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');

    // Derived State
    const currentBalance = targetBank === 'HOURS'
        ? parseFloat(collaborator.current_balance || 0)
        : targetBank === 'VACATION'
            ? parseFloat(collaborator.vacation_days_balance || 0)
            : parseFloat(collaborator.extra_days_balance || 0);

    const adjustment = parseFloat(amount || 0);
    const newBalance = mode === 'CREDIT'
        ? currentBalance + adjustment
        : currentBalance - adjustment;

    // Cálculo do Período Aquisitivo de Férias (Vesting de 12 meses)
    const admissionDate = collaborator?.admission_date ? new Date(collaborator.admission_date) : new Date();
    const currentDate = new Date();
    const monthsWorked = Math.max(0, (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + currentDate.getMonth() - admissionDate.getMonth());
    const isVacationUnlocked = !collaborator?.admission_date || monthsWorked >= 12;
    const isFormBlocked = targetBank === 'VACATION' && !isVacationUnlocked;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isOpen && collaborator?.collaborator_id) {
            loadHistory();
        }
    }, [isOpen, collaborator]);

    const loadHistory = async () => {
        if (!collaborator?.collaborator_id) return;
        try {
            const data = await absenceService.getHistory(collaborator.collaborator_id);
            setHistory(data || []);
        } catch (error) {
            console.error('Failed to load history', error);
        }
    };

    const handleSubmit = async () => {
        if (!amount || !category || !date) {
            notify.error('Atenção', 'Preencha todos os campos obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        try {
            await absenceService.addTransaction({
                collaboratorId: collaborator.collaborator_id,
                type: mode,
                quantity: parseFloat(amount),
                category: targetBank === 'VACATION'
                    ? `[FÉRIAS] ${category}`
                    : targetBank === 'EXTRAS'
                        ? `[EXTRAS] ${category}`
                        : category,
                reason,
                date
            });
            notify.success('Sucesso', 'Lançamento realizado com sucesso!');
            onClose(true); // Signal to refresh parent
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao realizar lançamento.');
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => onClose(false)}
            />

            {/* Sidebar Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Ajuste de Saldo</h2>
                        <p className="text-sm text-slate-500">{collaborator?.full_name}</p>
                    </div>
                    <button onClick={() => onClose(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    <div className="flex gap-2 border-b border-slate-200 pb-2">
                        <button
                            onClick={() => { setTargetBank('HOURS'); setCategory(''); }}
                            className={`flex-1 pb-2 text-[11px] font-bold border-b-2 transition-all ${targetBank === 'HOURS' ? 'border-emerald-500 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Banco de Horas
                        </button>
                        <button
                            onClick={() => { setTargetBank('EXTRAS'); setCategory(''); }}
                            className={`flex-1 pb-2 text-[11px] font-bold border-b-2 transition-all ${targetBank === 'EXTRAS' ? 'border-purple-500 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Folgas Extras
                        </button>
                        <button
                            onClick={() => { setTargetBank('VACATION'); setCategory(''); }}
                            className={`flex-1 pb-2 text-[11px] font-bold border-b-2 transition-all ${targetBank === 'VACATION' ? 'border-blue-500 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Férias
                        </button>
                    </div>

                    {isFormBlocked ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm mt-4">
                            <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Período Aquisitivo Incompleto</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Este colaborador possui apenas <strong className="text-slate-700">{monthsWorked} {monthsWorked === 1 ? 'mês' : 'meses'}</strong> de empresa.<br />
                                    A concessão ou gozo de férias só será permitida quando ele completar 12 meses de admissão.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Mode Switcher */}
                            <div className="bg-slate-100 p-1 rounded-xl flex mt-4">
                                <button
                                    onClick={() => setMode('CREDIT')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'CREDIT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Crédito (+)
                                </button>
                                <button
                                    onClick={() => setMode('DEBIT')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'DEBIT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                    Débito (-)
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Lançamento</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {targetBank === 'VACATION' ? (
                                            <>
                                                {mode === 'CREDIT' ? (
                                                    <>
                                                        <option value="Ajuste Proporcional (+)">Ajuste Proporcional de Férias</option>
                                                        <option value="Concessão de Férias">Concessão de Férias</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Gozo de Férias">Gozo de Férias / Usar dias</option>
                                                        <option value="Ajuste (-)">Ajuste de Saldo/Perda</option>
                                                    </>
                                                )}
                                            </>
                                        ) : targetBank === 'EXTRAS' ? (
                                            <>
                                                {mode === 'CREDIT' ? (
                                                    <>
                                                        <option value="Premiação/Bônus">Premiação / Bônus</option>
                                                        <option value="Dia do Comerciário">Dia do Comerciário</option>
                                                        <option value="Doação de Sangue">Doação de Sangue</option>
                                                        <option value="Outros Extras">Outros (Adição)</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Gozo de Folga Extra">Gozo de Folga Extra</option>
                                                        <option value="Ajuste Retirada">Ajuste / Retirada</option>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {mode === 'CREDIT' ? (
                                                    <>
                                                        <option value="Banco de Horas">Banco de Horas</option>
                                                        <option value="Trabalho Feriado">Trabalho em Feriado</option>
                                                        <option value="Abono">Abono Extra / Atestado retroativo</option>
                                                        <option value="Outros">Outros</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Uso de Banco">Uso de Banco de Horas</option>
                                                        <option value="Falta Injustificada">Falta Injustificada</option>
                                                        <option value="Atraso">Atraso</option>
                                                        <option value="Férias Pendentes">Justificar Ausência (Férias)</option>
                                                        <option value="Atestado">Atestado Médico</option>
                                                        <option value="Outros">Outros</option>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            {targetBank === 'HOURS' ? 'Qtd. Horas' : 'Qtd. Dias'}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.0"
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Efetiva</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo (Opcional)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows="3"
                                        placeholder="Descreva o motivo do ajuste..."
                                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Saldo Atual ({targetBank === 'VACATION' ? 'Férias' : targetBank === 'EXTRAS' ? 'F. Extras' : 'B. de Horas'})</span>
                                    <span className="font-medium text-slate-800">{currentBalance} {targetBank === 'HOURS' ? 'h' : 'd'}</span>
                                </div>
                                <div className={`flex justify-between items-center text-sm ${mode === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    <span>Ajuste ({mode === 'CREDIT' ? '+' : '-'})</span>
                                    <span className="font-bold">{mode === 'CREDIT' ? '+' : '-'}{adjustment || 0} {targetBank === 'HOURS' ? 'h' : 'd'}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Novo Saldo Previsto</span>
                                    <span className={`font-extrabold text-lg ${newBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                        {newBalance.toFixed(1)} {targetBank === 'HOURS' ? 'horas' : 'dias'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Section */}
                    {history.length > 0 && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Histórico Recente</h3>
                            <div className="space-y-3">
                                {history.slice(0, 10).map(item => {
                                    const isVacation = item.category.includes('[FÉRIAS]');
                                    const isExtras = item.category.includes('[EXTRAS]');
                                    const isHours = !isVacation && !isExtras;
                                    const cleanCategory = item.category.replace('[FÉRIAS] ', '').replace('[EXTRAS] ', '');

                                    return (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg text-sm relative overflow-hidden">
                                            {isVacation && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                            {isExtras && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
                                            <div className="flex flex-col pl-2">
                                                <span className="font-bold text-slate-700">{cleanCategory}</span>
                                                <span className="text-xs text-slate-400">{new Date(item.effective_date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className={`font-bold ${item.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.type === 'CREDIT' ? '+' : '-'}{item.quantity} {isHours ? 'h' : 'd'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => onClose(false)}
                            disabled={isSubmitting}
                            className="w-full py-3 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isFormBlocked}
                            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${mode === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>Confirmar {mode === 'CREDIT' ? 'Crédito' : 'Débito'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AbsenceDrawer;
