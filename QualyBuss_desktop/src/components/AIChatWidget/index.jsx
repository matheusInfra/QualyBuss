import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessageToAI } from '../../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'; // Using heroicons if available, assuming standard setup or I'll use SVGs if not

// Mock History Data
const MOCK_HISTORY = [
    { id: 1, title: 'Ajuda com Relatórios', date: 'Hoje', preview: 'Como exporto o PDF...' },
    { id: 2, title: 'Cadastro de Funcionário', date: 'Ontem', preview: 'Onde fica a opção...' },
    { id: 3, title: 'Erro no Login', date: 'Semana passada', preview: 'Não consigo acessar...' },
    { id: 4, title: 'Configuração de Permissões', date: 'Semana passada', preview: 'Como dar admin...' },
];

const AIChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // Controls the "Large" mode

    // Active conversation state
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Olá! Sou seu assistente virtual. Como posso ajudar com o QualyBuss hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Sidebar state
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState(MOCK_HISTORY);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isExpanded]);

    // Handle initial open triggers expansion
    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setIsExpanded(true); // Default to expanded when opening
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const responseText = await sendMessageToAI(input);
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: responseText
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: 'Erro ao conectar. Tente novamente mais tarde.'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`
                            bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col origin-bottom-right
                            ${isExpanded ? 'fixed bottom-24 right-6 w-[90vw] h-[80vh] max-w-5xl max-h-[800px]' : 'mb-4 w-96 h-[500px]'}
                        `}
                    >
                        <div className="flex h-full">

                            {/* SIDEBAR (Only visible in Expanded Mode) */}
                            {isExpanded && (
                                <div className="hidden md:flex flex-col w-80 bg-slate-50 border-r border-slate-200">
                                    {/* Sidebar Header */}
                                    <div className="p-4 border-b border-slate-200">
                                        <button
                                            onClick={() => setMessages([{ id: Date.now(), type: 'bot', text: 'Nova conversa iniciada. Como posso ajudar?' }])}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-medium text-sm"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                            Nova Conversa
                                        </button>
                                    </div>

                                    {/* Search */}
                                    <div className="px-4 py-3">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input
                                                type="text"
                                                placeholder="Buscar conversas..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* History List */}
                                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                                        <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recentes</p>
                                        {filteredHistory.map(item => (
                                            <button
                                                key={item.id}
                                                className="w-full text-left p-3 rounded-lg hover:bg-slate-200/50 transition-colors group"
                                            >
                                                <h4 className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate">{item.title}</h4>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">{item.preview}</p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* User Profile / Settings (Bottom Sidebar) */}
                                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {user?.email?.substring(0, 2).toUpperCase() || 'US'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-slate-700 truncate">{user?.email || 'Usuário'}</p>
                                                <p className="text-xs text-slate-500">Plano Pro</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MAIN CHAT AREA */}
                            <div className="flex-1 flex flex-col bg-white">

                                {/* Header */}
                                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Assistente IA</h3>
                                            <p className="text-xs text-green-500 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                Disponível
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Expand/Collapse Toggle (if needed in future, currently x closes) */}
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Fechar Chat"
                                        >
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`
                                                flex flex-col max-w-[85%] sm:max-w-[75%]
                                                ${msg.type === 'user' ? 'items-end' : 'items-start'}
                                            `}>
                                                <div className={`
                                                    p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm
                                                    ${msg.type === 'user'
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}
                                                `}>
                                                    {msg.text}
                                                </div>
                                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Footer */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                            placeholder="Digite sua mensagem..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm scrollbar-hide"
                                            rows="1"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm mb-0.5"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-px -translate-y-px" />
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-slate-400 text-center mt-3">
                                        IA pode cometer erros. Verifique informações importantes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button (Floating) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        onClick={toggleChat}
                        whileHover={{ scale: 1.1 }}
                        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all"
                    >
                        <ChatBubbleLeftRightIcon className="w-7 h-7" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIChatWidget;
