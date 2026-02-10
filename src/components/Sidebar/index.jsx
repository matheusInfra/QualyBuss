import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
    const { user, signOut } = useAuth();
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    // Desktop toggle only affects desktop state
    const toggleDesktopSidebar = () => setIsDesktopCollapsed(!isDesktopCollapsed);

    const menuItems = [
        {
            path: '/dashboard', label: 'Dashboard', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            path: '/colaboradores', label: 'Colaboradores', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            path: '/ferias', label: 'Férias e Folgas', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            path: '/movimentacoes', label: 'Movimentações', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            )
        },

        {
            path: '/ausencias', label: 'Gestão de Ausências', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            path: '/auditoria', label: 'Auditoria e Logs', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            path: '/documentacao', label: 'Documentação', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            path: '/ocorrencias', label: 'Ocorrências', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            path: '/importacao', label: 'Importação', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            )
        },
        {
            path: '/compliance', label: 'Conformidade', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            path: '/ponto', label: 'Gestão de Ponto', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-30 md:hidden transition-opacity"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-40 bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out flex flex-col
                md:static md:shadow-none md:translate-x-0
                ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
                ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}
            `}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 h-20 border-b border-slate-700">
                    <div className={`flex items-center gap-3 overflow-hidden ${isDesktopCollapsed ? 'md:hidden' : ''}`}>
                        <img src={logo} alt="Logo" className="w-8 h-8 rounded-md" />
                        <span className="text-white font-bold text-lg whitespace-nowrap">QualyBuss</span>
                    </div>

                    {/* Desktop Toggle */}
                    <button
                        onClick={toggleDesktopSidebar}
                        className={`hidden md:block p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ${isDesktopCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isDesktopCollapsed ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onMobileClose}
                        className="md:hidden p-2 text-slate-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Menu Navigation */}
                <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onMobileClose && onMobileClose()} // Auto close on mobile nav
                            className={({ isActive }) => `
                                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }
                            `}
                        >
                            <div className="flex-shrink-0">
                                {item.icon}
                            </div>
                            <span className={`
                                ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                                ${isDesktopCollapsed ? 'md:w-0 md:opacity-0' : 'md:w-auto md:opacity-100'}
                            `}>
                                {item.label}
                            </span>

                            {/* Tooltip (Desktop Collapsed only) */}
                            {isDesktopCollapsed && (
                                <div className="hidden md:block absolute left-20 bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="px-3 pb-2">
                    <NavLink
                        to="/configuracoes"
                        onClick={() => onMobileClose && onMobileClose()}
                        className={({ isActive }) => `
                            flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                            ${isActive
                                ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }
                        `}
                    >
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className={`
                            ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                            ${isDesktopCollapsed ? 'md:w-0 md:opacity-0' : 'md:w-auto md:opacity-100'}
                        `}>
                            Configurações
                        </span>
                        {/* Tooltip */}
                        {isDesktopCollapsed && (
                            <div className="hidden md:block absolute left-20 bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                Configurações
                            </div>
                        )}
                    </NavLink>
                </div>

                {/* Footer User Info */}
                <div className={`p-4 border-t border-slate-700 bg-slate-800/50`}>
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'md:justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'md:w-0 md:opacity-0' : 'md:w-auto md:opacity-100'}`}>
                            <span className="text-white text-sm font-medium truncate" title={user?.email}>
                                {user?.email?.split('@')[0]}
                            </span>
                            <button
                                onClick={signOut}
                                className="text-xs text-slate-400 hover:text-red-400 text-left transition-colors flex items-center gap-1"
                            >
                                Sair do Sistema
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
