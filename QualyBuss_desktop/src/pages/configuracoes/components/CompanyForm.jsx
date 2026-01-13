
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import {
    BuildingOfficeIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const CompanyForm = ({ onSuccess, onCancel, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingCNPJ, setFetchingCNPJ] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        cnpj: '',
        legal_name: '',
        trade_name: '',
        opening_date: '',
        cep: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: '',
        email: '',
        phone: '',
        is_headquarters: false,
        status: 'ACTIVE'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Função para buscar CNPJ
    const fetchCNPJ = async () => {
        const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
        if (cleanCNPJ.length !== 14) {
            setFeedback({ type: 'error', message: 'CNPJ inválido. Digite 14 números.' });
            return;
        }

        setFetchingCNPJ(true);
        setFeedback({ type: '', message: '' });

        try {
            // Usando BrasilAPI (gratuita e pública)
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);

            if (!response.ok) throw new Error('CNPJ não encontrado na Receita Federal.');

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                legal_name: data.razao_social || '',
                trade_name: data.nome_fantasia || data.razao_social || '',
                opening_date: data.data_inicio_atividade || '',
                cep: data.cep || '',
                address: `${data.logradouro} ${data.tipo_logradouro}`.trim(),
                number: data.numero || '',
                neighborhood: data.bairro || '',
                city: data.municipio || '',
                state: data.uf || '',
                complement: data.complemento || '',
                email: data.email || '',
                phone: data.ddd_telefone_1 || ''
            }));

            setFeedback({ type: 'success', message: 'Dados encontrados com sucesso!' });
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Erro ao buscar CNPJ: ' + error.message });
        } finally {
            setFetchingCNPJ(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', message: '' });

        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from('companies')
                    .update(formData)
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('companies')
                    .insert([formData]);
                if (error) throw error;
            }

            setFeedback({ type: 'success', message: 'Empresa salva com sucesso!' });
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Save error:', error);
            setFeedback({ type: 'error', message: 'Erro ao salvar: ' + (error.message || 'Erro desconhecido') });
        } finally {
            setLoading(false);
        }
    };

    // Helper para input classes
    const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 uppercase";
    const labelClass = "block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide";

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in p-1">

            {/* Feedback Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {feedback.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                    {feedback.message}
                </div>
            )}

            {/* SEÇÃO 1: DADOS PRINCIPAIS */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                    Dados da Empresa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CNPJ com Busca */}
                    <div className="md:col-span-1">
                        <label className={labelClass}>CNPJ (Apenas Números)</label>
                        <div className="flex gap-2">
                            <input
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                placeholder="00000000000191"
                                className={inputClass}
                                maxLength={14}
                                required
                            />
                            <button
                                type="button"
                                onClick={fetchCNPJ}
                                disabled={fetchingCNPJ || !formData.cnpj}
                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                title="Buscar na Receita Federal"
                            >
                                {fetchingCNPJ ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <MagnifyingGlassIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <label className={labelClass}>Razão Social</label>
                        <input name="legal_name" value={formData.legal_name} onChange={handleChange} className={inputClass} required />
                    </div>

                    <div className="md:col-span-1">
                        <label className={labelClass}>Nome Fantasia</label>
                        <input name="trade_name" value={formData.trade_name} onChange={handleChange} className={inputClass} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                    <div>
                        <label className={labelClass}>Data Abertura</label>
                        <input type="date" name="opening_date" value={formData.opening_date} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Email Corporativo</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass.replace('uppercase', '')} />
                    </div>
                    <div>
                        <label className={labelClass}>Telefone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_headquarters"
                                checked={formData.is_headquarters}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <span className="font-bold text-slate-700">É Matriz?</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 2: ENDEREÇO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Endereço / Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-1">
                        <label className={labelClass}>CEP</label>
                        <input name="cep" value={formData.cep} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="md:col-span-3">
                        <label className={labelClass}>Logradouro</label>
                        <input name="address" value={formData.address} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="md:col-span-1">
                        <label className={labelClass}>Número</label>
                        <input name="number" value={formData.number} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="md:col-span-1">
                        <label className={labelClass}>Complemento</label>
                        <input name="complement" value={formData.complement} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Bairro</label>
                        <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="md:col-span-3">
                        <label className={labelClass}>Cidade</label>
                        <input name="city" value={formData.city} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="md:col-span-1">
                        <label className={labelClass}>UF</label>
                        <input name="state" value={formData.state} onChange={handleChange} className={inputClass} maxLength={2} />
                    </div>
                </div>
            </div>

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
                    className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                >
                    {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                    {loading ? 'Salvando...' : 'Salvar Empresa'}
                </button>
            </div>

        </form>
    );
};

export default CompanyForm;
