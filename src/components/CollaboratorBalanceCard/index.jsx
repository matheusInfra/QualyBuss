import React from 'react';

const CollaboratorBalanceCard = ({ data, onClick }) => {
    const balance = parseFloat(data.current_balance || 0);
    const isPositive = balance >= 0;

    // Cálculo do Período Aquisitivo de Férias (Vesting de 12 meses)
    const admissionDate = data.admission_date ? new Date(data.admission_date) : new Date();
    const currentDate = new Date();
    const monthsWorked = Math.max(0, (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + currentDate.getMonth() - admissionDate.getMonth());

    // Se não tiver data de admissão, assume que já passou 12 meses pro fallback visual nao travar
    const isVacationUnlocked = !data.admission_date || monthsWorked >= 12;
    const vacationProgressPercentage = isVacationUnlocked ? 100 : Math.min((monthsWorked / 12) * 100, 100);
    const vacationDays = data.vacation_days_balance || 0;
    const hasVacationAlert = isVacationUnlocked && vacationDays > 0;

    // Saldo de Folgas Extras (Comerciário, Bonificações)
    const extraDays = parseFloat(data.extra_days_balance || 0);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-24 h-24 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            <img
                                src={data.avatar_url || `https://ui-avatars.com/api/?name=${data.full_name}&background=random`}
                                alt={data.full_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 truncate text-base">{data.full_name}</h3>
                            <p className="text-[11px] text-slate-500 truncate">{data.role}</p>
                        </div>
                    </div>
                    {hasVacationAlert && (
                        <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm border border-amber-200 animate-pulse">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Férias Disp.
                        </div>
                    )}
                </div>

                {/* Pilares 1 e 2: Saldos Dinâmicos/Curtos */}
                <div className="mt-auto grid grid-cols-2 gap-2 mb-2">
                    {/* Bank of Hours */}
                    <div className="bg-slate-50 flex-1 rounded-xl p-3 border border-slate-200 shadow-sm relative overflow-hidden group-hover:border-emerald-200 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Banco de Horas</p>
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className={`text-xl font-extrabold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {balance > 0 ? '+' : ''}{balance} <span className="text-xs font-medium text-slate-400">h</span>
                        </div>
                    </div>

                    {/* Folgas Extras */}
                    <div className="bg-purple-50 flex-1 rounded-xl p-3 border border-purple-100 shadow-sm relative overflow-hidden group-hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wide">Folgas Extras</p>
                            <svg className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                        </div>
                        <div className={`text-xl font-extrabold ${extraDays > 0 ? 'text-purple-700' : 'text-purple-300'}`}>
                            {extraDays} <span className="text-xs font-medium opacity-70">dias</span>
                        </div>
                    </div>
                </div>

                {/* Pilar 3: Período Aquisitivo de Férias */}
                <div className={`rounded-xl p-3 border ${isVacationUnlocked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-100 border-slate-200 border-dashed opacity-80'}`}>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isVacationUnlocked ? 'text-blue-700' : 'text-slate-500'}`}>
                                {isVacationUnlocked ? (
                                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> Saldo de Férias</>
                                ) : (
                                    <><svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> Em Período Aquisitivo</>
                                )}
                            </p>
                        </div>
                        <div className={`text-base font-extrabold flex items-baseline gap-1 ${isVacationUnlocked ? 'text-blue-800' : 'text-slate-600'}`}>
                            {vacationDays} <span className="text-[10px] font-medium opacity-70">{isVacationUnlocked ? 'dias disp.' : 'dias'}</span>
                        </div>
                    </div>
                    {/* Progress Bar Lock */}
                    <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden flex">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${isVacationUnlocked ? 'bg-blue-500 w-full' : 'bg-slate-400'}`}
                            style={{ width: `${vacationProgressPercentage}%` }}
                        />
                    </div>
                    {!isVacationUnlocked && (
                        <p className="text-[9px] text-slate-400 mt-1.5 text-right font-medium">{monthsWorked}/12 meses da concessão</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollaboratorBalanceCard;
