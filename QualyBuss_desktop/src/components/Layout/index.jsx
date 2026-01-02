import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import AIChatWidget from '../AIChatWidget';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900 overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 overflow-y-auto w-full h-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent p-6">
                    <Outlet />
                </div>
                <AIChatWidget />
            </main>
        </div>
    );
};

export default Layout;
