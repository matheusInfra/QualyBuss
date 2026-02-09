import React from 'react';

const CollaboratorBalanceCard = ({ data, onClick }) => {
    const balance = parseFloat(data.current_balance);
    const isPositive = balance >= 0;

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
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        <img
                            src={data.avatar_url || `https://ui-avatars.com/api/?name=${data.full_name}&background=random`}
                            alt={data.full_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 truncate text-base">{data.full_name}</h3>
                        <p className="text-xs text-slate-500 truncate">{data.role}</p>
                    </div>
                </div>

                {/* Balance Info */}
                <div className="mt-auto bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-wider">Saldo de Dias</p>
                    <div className={`text-2xl font-extrabold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {balance > 0 ? '+' : ''}{balance} <span className="text-sm font-medium text-slate-400">dias</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {isPositive ? 'Saldo Positivo' : 'Saldo Devedor'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollaboratorBalanceCard;
