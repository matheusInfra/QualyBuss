import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import AIChatWidget from '../AIChatWidget';
<<<<<<< HEAD
import TermsAcceptanceModal from '../../pages/legal/TermsAcceptanceModal';
import { termsService } from '../../services/termsService';
import logo from '../../assets/logo.svg'; // Ensure logo is imported for mobile header
import { useEffect } from 'react';

const Layout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    useEffect(() => {
        checkTerms();
    }, []);

    const checkTerms = async () => {
        try {
            const hasAccepted = await termsService.checkStatus();
            if (!hasAccepted) {
                setShowTermsModal(true);
            }
        } catch (error) {
            console.error('Failed to check terms:', error);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900 overflow-hidden">
            {/* Modal de Aceite Obrigatório */}
            <TermsAcceptanceModal
                open={showTermsModal}
                onSuccess={() => setShowTermsModal(false)}
            />
=======
import logo from '../../assets/logo.svg'; // Ensure logo is imported for mobile header

const Layout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900 overflow-hidden">
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f

            {/* Sidebar (Desktop & Mobile) */}
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            <main className="flex-1 relative overflow-hidden flex flex-col w-full">

                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="w-8 h-8 rounded-md" />
                        <span className="font-bold text-lg text-slate-800">QualyBuss</span>
                    </div>
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent p-4 md:p-6 pb-24 md:pb-6 relative">
                    <Outlet />
                </div>

                <AIChatWidget />
            </main>
        </div>
    );
};

export default Layout;
