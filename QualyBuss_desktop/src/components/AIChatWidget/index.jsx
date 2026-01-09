import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessageToAI } from '../../services/aiService';
import { chatService } from '../../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    PaperClipIcon,
    DocumentIcon,
    SparklesIcon,
    LightBulbIcon,
    ClockIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const AIChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Session state
    const [sessionId, setSessionId] = useState(null); // Current DB session ID
    const [messages, setMessages] = useState([]); // Array of {id, role, text}
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Sidebar/History state
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null); // For confirmation modal

    const messagesEndRef = useRef(null);

    // Initial Load: Fetch History
    useEffect(() => {
        if (isOpen && user) {
            loadHistory();
        }
    }, [isOpen, user]);

    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const sessions = await chatService.getSessions();
            setHistory(sessions);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isExpanded]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setIsExpanded(true);
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([]); // Clear messages to show Welcome Screen
        setInput('');
    };

    const loadSession = async (existingSessionId) => {
        try {
            const msgs = await chatService.getMessages(existingSessionId);
            const formattedMsgs = msgs.map(m => ({
                id: m.id,
                type: m.role,
                text: m.content
            }));
            setMessages(formattedMsgs);
            setSessionId(existingSessionId);
            // On mobile, maybe auto-close sidebar here?
        } catch (error) {
            console.error("Error loading session:", error);
        }
    };

    const handleDeleteSession = async (e, id) => {
        e.stopPropagation(); // Prevent loading the session when clicking delete
        setSessionToDelete(id);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;
        try {
            await chatService.deleteSession(sessionToDelete);

            // Update UI
            setHistory(prev => prev.filter(s => s.id !== sessionToDelete));

            // If deleting current session, clear it
            if (sessionId === sessionToDelete) {
                startNewChat();
            }
        } catch (error) {
            console.error("Error deleting session:", error);
        } finally {
            setSessionToDelete(null);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSend = async (e, overrideInput = null) => {
        e?.preventDefault();
        const textToSend = overrideInput || input;

        if (!textToSend.trim() && !selectedFile) return;

        let finalContent = textToSend;
        if (selectedFile) {
            finalContent = `[Arquivo: ${selectedFile.name}] ${textToSend}`;
        }

        // Optimistic Update
        const tempUserMsg = { id: Date.now(), type: 'user', text: finalContent };
        setMessages(prev => [...prev, tempUserMsg]);
        setInput('');
        setSelectedFile(null);
        setIsTyping(true);

        try {
            let currentSessionId = sessionId;

            // 1. Create Session if not exists
            if (!currentSessionId) {
                // Generate a title from the first few words
                const title = finalContent.slice(0, 30) + (finalContent.length > 30 ? '...' : '');
                const session = await chatService.createSession(title, user.id);
                currentSessionId = session.id;
                setSessionId(currentSessionId);
                // Refresh history to show new session
                loadHistory();
            }

            // 2. Save User Message
            await chatService.saveMessage(currentSessionId, 'user', finalContent);

            // 3. Call AI
            const responseText = await sendMessageToAI(finalContent);

            // 4. Save Bot Message
            await chatService.saveMessage(currentSessionId, 'bot', responseText);

            // 5. Update UI
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: responseText
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat error:", error);
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
        (item.title || 'Nova Conversa').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Welcome Screen Component
    const WelcomeScreen = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <SparklesIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">QualyBuss AI</h2>
            <p className="text-slate-500 max-w-md mb-8">
                Estou aqui para ajudar você a gerenciar sua infraestrutura, responder dúvidas técnicas ou analisar relatórios.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                <button
                    onClick={() => handleSend(null, "Como cadastro um novo usuário?")}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left flex items-start gap-3 group"
                >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <PlusIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-700 text-sm">Novo Usuário</h4>
                        <p className="text-xs text-slate-400 mt-1">Como cadastro um funcionário?</p>
                    </div>
                </button>

                <button
                    onClick={() => handleSend(null, "Verifique o status do sistema")}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left flex items-start gap-3 group"
                >
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <LightBulbIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-700 text-sm">Status do Sistema</h4>
                        <p className="text-xs text-slate-400 mt-1">Tudo está funcionando?</p>
                    </div>
                </button>
            </div>
        </div>
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

                            {/* SIDEBAR */}
                            {isExpanded && (
                                <div className="hidden md:flex flex-col w-80 bg-slate-50 border-r border-slate-200">
                                    <div className="p-4 border-b border-slate-200">
                                        <button
                                            onClick={startNewChat}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-medium text-sm"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                            Nova Conversa
                                        </button>
                                    </div>

                                    <div className="px-4 py-3">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input
                                                type="text"
                                                placeholder="Buscar..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                                        {isLoadingHistory ? (
                                            <div className="p-4 text-center text-xs text-slate-400">Carregando...</div>
                                        ) : filteredHistory.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                                    <ClockIcon className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">Sem histórico</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recentes</p>
                                                {filteredHistory.map(item => (
                                                    <div key={item.id} className="relative group">
                                                        <button
                                                            onClick={() => loadSession(item.id)}
                                                            className={`w-full text-left p-3 rounded-lg hover:bg-slate-200/50 transition-colors pr-8 ${sessionId === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                                                        >
                                                            <h4 className={`text-sm font-medium truncate ${sessionId === item.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                                {item.title || 'Conversa sem título'}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                                {new Date(item.updated_at).toLocaleDateString()}
                                                            </p>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteSession(e, item.id)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                            title="Excluir conversa"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white">
                                                {user?.email?.substring(0, 2).toUpperCase() || 'US'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-slate-700 truncate">{user?.email || 'Usuário'}</p>
                                                <p className="text-[10px] text-green-600 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                    Online
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MAIN CHAT AREA */}
                            <div className="flex-1 flex flex-col bg-white relative">

                                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/90 backdrop-blur-sm flex-shrink-0 z-10 sticky top-0">
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
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Fechar Chat"
                                        >
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Content: Welcome OR Messages */}
                                {messages.length === 0 ? (
                                    <WelcomeScreen />
                                ) : (
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
                                                        {/* Just a simple time placeholder or real timestamp could go here */}
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
                                )}

                                {/* Input Footer */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    {selectedFile && (
                                        <div className="mb-2 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs w-fit">
                                            <DocumentIcon className="w-4 h-4" />
                                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                            <button onClick={() => setSelectedFile(null)} className="hover:text-blue-900">
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mb-0.5"
                                            title="Anexar arquivo"
                                        >
                                            <PaperClipIcon className="w-5 h-5" />
                                        </button>

                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                            placeholder="Digite sua mensagem munha joia..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm scrollbar-hide"
                                            rows="1"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() && !selectedFile}
                                            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm mb-0.5"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-px -translate-y-px" />
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-slate-400 text-center mt-3">
                                        IA pode cometer erros. Verifique informações importantes.
                                    </p>
                                </div>

                                {/* Confirmation Modal */}
                                <AnimatePresence>
                                    {sessionToDelete && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, y: 10 }}
                                                animate={{ scale: 1, y: 0 }}
                                                exit={{ scale: 0.9, y: 10 }}
                                                className="bg-white p-6 rounded-2xl shadow-xl w-72 text-center"
                                            >
                                                <TrashIcon className="w-10 h-10 text-red-100 bg-red-50 p-2 rounded-full mx-auto mb-3 text-red-500" />
                                                <h3 className="font-bold text-slate-800 mb-1">Apagar conversa?</h3>
                                                <p className="text-xs text-slate-500 mb-5">Esta ação não pode ser desfeita.</p>
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => setSessionToDelete(null)}
                                                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-xl"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={confirmDelete}
                                                        className="px-4 py-2 bg-red-600 text-white font-bold text-sm hover:bg-red-700 rounded-xl shadow-lg shadow-red-200"
                                                    >
                                                        Apagar
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
