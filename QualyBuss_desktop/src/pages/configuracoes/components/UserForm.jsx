
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import {
    UserCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const UserForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        full_name: '',
        role: 'USER',
        department: '',
        active: true,
        email: '',
        password: ''
    });

    // Password Reset State
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [resetData, setResetData] = useState({ password: '', confirmPassword: '' });

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name || '',
                role: initialData.role || 'USER',
                department: initialData.department || '',
                active: initialData.active ?? true,
                email: initialData.email || '', // Email might be passed if we join tables later
                password: ''
            });
        } else {
            // Reset for new user
            setFormData({
                full_name: '',
                role: 'USER',
                department: '',
                active: true,
                email: '',
                password: ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleResetChange = (e) => {
        setResetData({ ...resetData, [e.target.name]: e.target.value });
    };

    const handlePasswordReset = async () => {
        if (resetData.password !== resetData.confirmPassword) {
            setFeedback({ type: 'error', message: 'As senhas não coincidem.' });
            return;
        }
        if (resetData.password.length < 6) {
            setFeedback({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            setFeedback({
                type: 'error',
                message: 'Chave de Administrador (SERVICE_ROLE_KEY) não configurada. Não é possível resetar a senha por aqui.'
            });
            return;
        }

        setLoading(true);
        try {
            // Import Supabase Client dynamically
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            // Create Admin Client
            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { persistSession: false }
            });

            const { error } = await adminClient.auth.admin.updateUserById(
                initialData.id,
                { password: resetData.password }
            );

            if (error) throw error;

            setFeedback({ type: 'success', message: 'Senha redefinida com sucesso!' });
            setShowPasswordReset(false);
            setResetData({ password: '', confirmPassword: '' });

        } catch (error) {
            console.error('Reset error:', error);
            setFeedback({ type: 'error', message: 'Erro ao redefinir senha: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', message: '' });

        try {
            if (initialData?.id) {
                // Update Existing Profile
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        department: formData.department,
                        active: formData.active
                    })
                    .eq('id', initialData.id);

                if (error) throw error;
                setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
                if (onSuccess) onSuccess();

            } else {
                // CREATE NEW USER
                if (!formData.email || !formData.password) {
                    throw new Error('Email e Senha são obrigatórios para novos usuários.');
                }

                // 1. Create a secondary client to avoid logging out the current admin
                // This is crucial because supabase.auth.signUp() signs in the user by default
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                const { createClient } = await import('@supabase/supabase-js');

                const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
                    auth: {
                        persistSession: false, // Don't save session to localStorage
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                });

                // 2. Sign Up User
                const { data: authData, error: authError } = await tempClient.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.full_name, // Optional metadata
                        }
                    }
                });

                if (authError) throw authError;

                if (authData?.user) {
                    // 3. Create Profile Linked to Auth ID
                    // Note: If you have a Trigger on auth.users -> public.profiles, this might be redundant or conflict.
                    // Assuming we must manually create/update the profile or at least set the custom fields.
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: authData.user.id, // Link to Auth UID
                            email: formData.email, // If you have an email column in profiles
                            full_name: formData.full_name,
                            role: formData.role,
                            department: formData.department,
                            active: formData.active,
                            updated_at: new Date()
                        });

                    if (profileError) {
                        // Optional: Rollback auth user creation if profile fails? 
                        // Hard to do from client without admin rights. 
                        console.error('Profile creation error:', profileError);
                        throw new Error('Usuário criado, mas erro ao salvar perfil: ' + profileError.message);
                    }

                    setFeedback({ type: 'success', message: 'Usuário criado com sucesso!' });
                    setFormData({ ...formData, email: '', password: '', full_name: '' }); // Reset sensitive fields
                    if (onSuccess) onSuccess();
                }
            }

        } catch (error) {
            console.error('Save error:', error);
            setFeedback({ type: 'error', message: 'Erro ao salvar: ' + (error.message || 'Erro desconhecido') });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all";
    const labelClass = "block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in p-1">

            {/* Feedback Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {feedback.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                    {feedback.message}
                </div>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <UserCircleIcon className="w-6 h-6 text-purple-600" />
                    Dados do Usuário
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className={labelClass}>Nome Completo</label>
                        <input
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className={inputClass}
                            required
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    {!initialData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 p-4 rounded-xl border border-slate-200">
                            <div>
                                <label className={labelClass}>Email de Acesso</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required={!initialData}
                                    placeholder="usuario@empresa.com"
                                    autoComplete="new-email"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Senha Provisória</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required={!initialData}
                                    placeholder="********"
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Mínimo 6 caracteres</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Departamento</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="">Selecione...</option>
                                <option value="RH">Recursos Humanos</option>
                                <option value="FINANCEIRO">Financeiro</option>
                                <option value="OPERACIONAL">Operacional</option>
                                <option value="TI">Tecnologia (TI)</option>
                                <option value="DIRETORIA">Diretoria</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Nível de Acesso (Role)</label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={`${inputClass} pl-10`}
                                >
                                    <option value="USER">Usuário Padrão</option>
                                    <option value="MANAGER">Gerente</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="VIEWER">Visualizador</option>
                                </select>
                                <ShieldCheckIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`
                                w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out
                                ${formData.active ? 'bg-green-500' : 'bg-slate-300'}
                            `}>
                                <div className={`
                                    bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out
                                    ${formData.active ? 'translate-x-6' : ''}
                                `}></div>
                            </div>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                className="hidden"
                            />
                            <span className="font-bold text-slate-700 group-hover:text-purple-600 transition-colors">
                                {formData.active ? 'Usuário Ativo' : 'Usuário Inativo / Bloqueado'}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* PASSWORD RESET SECTION (Only for existing users) */}
            {initialData && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                            Segurança e Acesso
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowPasswordReset(!showPasswordReset)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 border-b border-dashed border-indigo-300"
                        >
                            {showPasswordReset ? 'Cancelar Redefinição' : 'Redefinir Senha'}
                        </button>
                    </div>

                    {showPasswordReset && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 animate-fade-in space-y-4">
                            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                                <strong>Atenção Admin:</strong> Esta ação alterará a senha do usuário imediatamente.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Nova Senha</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={resetData.password}
                                        onChange={handleResetChange}
                                        className={inputClass}
                                        placeholder="Nova Senha"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Confirmar Senha</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={resetData.confirmPassword}
                                        onChange={handleResetChange}
                                        className={inputClass}
                                        placeholder="Repita a Senha"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    disabled={loading}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
                                >
                                    {loading ? 'Atualizando...' : 'Confirmar Nova Senha'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* BUTTON BAR */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border-2 border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2"
                >
                    {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
