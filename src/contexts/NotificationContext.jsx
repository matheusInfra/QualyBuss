import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type, title, message, duration = 4000 }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const notify = {
        success: (title, message) => addToast({ type: 'success', title, message }),
        error: (title, message) => addToast({ type: 'error', title, message }),
        info: (title, message) => addToast({ type: 'info', title, message }),
        warning: (title, message) => addToast({ type: 'warning', title, message }),
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            min-w-[300px] max-w-sm p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 animate-slide-in-right flex items-start gap-3 bg-white
                            ${toast.type === 'success' ? 'border-green-500' : ''}
                            ${toast.type === 'error' ? 'border-red-500' : ''}
                            ${toast.type === 'info' ? 'border-blue-500' : ''}
                            ${toast.type === 'warning' ? 'border-yellow-500' : ''}
                        `}
                    >
                        <div className={`
                            mt-0.5
                            ${toast.type === 'success' ? 'text-green-500' : ''}
                            ${toast.type === 'error' ? 'text-red-500' : ''}
                            ${toast.type === 'info' ? 'text-blue-500' : ''}
                            ${toast.type === 'warning' ? 'text-yellow-500' : ''}
                        `}>
                            {toast.type === 'success' && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {toast.type === 'error' && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {toast.type === 'info' && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {toast.type === 'warning' && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm">{toast.title}</h4>
                            <p className="text-slate-600 text-xs mt-1">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
            `}</style>
        </NotificationContext.Provider>
    );
};
