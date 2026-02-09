import React, { useState, useEffect } from 'react';
import { absenceService } from '../../services/absenceService';

const AbsenceDrawer = ({ isOpen, onClose, collaborator, notify }) => {
    const [mode, setMode] = useState('CREDIT'); // 'CREDIT' or 'DEBIT'
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');

    // Derived State
    const currentBalance = parseFloat(collaborator.current_balance || 0);
    const adjustment = parseFloat(amount || 0);
    const newBalance = mode === 'CREDIT'
        ? currentBalance + adjustment
        : currentBalance - adjustment;

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
                category,
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

                    {/* Mode Switcher */}
                    <div className="bg-slate-100 p-1 rounded-xl flex">
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
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Selecione...</option>
                                {mode === 'CREDIT' ? (
                                    <>
                                        <option value="Banco de Horas">Banco de Horas</option>
                                        <option value="Trabalho Feriado">Trabalho em Feriado</option>
                                        <option value="Abono">Abono Extra</option>
                                        <option value="Outros">Outros</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Uso de Banco">Uso de Banco de Horas</option>
                                        <option value="Falta Injustificada">Falta Injustificada</option>
                                        <option value="Atraso">Atraso</option>
                                        <option value="Outros">Outros</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd. Dias</label>
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
                            <span className="text-slate-500">Saldo Atual</span>
                            <span className="font-medium text-slate-800">{currentBalance} Dias</span>
                        </div>
                        <div className={`flex justify-between items-center text-sm ${mode === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                            <span>Ajuste ({mode === 'CREDIT' ? '+' : '-'})</span>
                            <span className="font-bold">{mode === 'CREDIT' ? '+' : '-'}{adjustment || 0} Dias</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-800">Novo Saldo</span>
                            <span className={`font-extrabold text-lg ${newBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                {newBalance.toFixed(1)} Dias
                            </span>
                        </div>
                    </div>

                    {/* History Section */}
                    {history.length > 0 && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Histórico Recente</h3>
                            <div className="space-y-3">
                                {history.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{item.category}</span>
                                            <span className="text-xs text-slate-400">{new Date(item.effective_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className={`font-bold ${item.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {item.type === 'CREDIT' ? '+' : '-'}{item.quantity}
                                        </div>
                                    </div>
                                ))}
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
                            disabled={isSubmitting}
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
