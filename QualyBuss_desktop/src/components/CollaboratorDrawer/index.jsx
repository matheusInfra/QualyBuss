import React, { useState, useEffect, useRef } from 'react';
import { cepService } from '../../services/cepService';
import { collaboratorService } from '../../services/collaboratorService';
import { useNotification } from '../../context/NotificationContext';
import { validators } from '../../utils/validators';

import { bankService } from '../../services/bankService';

const CollaboratorDrawer = ({ isOpen, onClose, onSave, collaborator, isSaving }) => {
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('pessoal');
    const [formData, setFormData] = useState({
        active: true,
        full_name: '',
        cpf: '',
        rg: '',
        birth_date: '',
        gender: '',
        marital_status: '',
        address_street: '',
        address_number: '',
        address_city: '',
        address_state: '',
        address_zip_code: '',
        role: '',
        cbo: '',
        department: '',
        admission_date: '',
        corporate_email: '',
        pis: '',
        contract_type: 'CLT',
        work_regime: 'Presencial',
        salary: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        pix_key: ''
    });
    const [errors, setErrors] = useState({});
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [bankList, setBankList] = useState([]);

    // --- Style Constants (Matching Document Module) ---
    const LABEL_CLASS = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1";
    const INPUT_CLASS = (hasError) => `w-full px-3 py-2.5 bg-white border ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} text-slate-900 text-sm rounded-lg focus:ring-2 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400`;
    const ERROR_MSG_CLASS = "text-xs text-red-500 mt-1 ml-1 font-medium animate-fade-in";

    // --------------------------------------------------

    const validateForm = async () => {
        const newErrors = {};

        // Validar CPF
        if (formData.cpf && !validators.cpf(formData.cpf)) {
            newErrors.cpf = "CPF inválido.";
        } else if (formData.cpf) {
            // Check duplicidade apenas se CPF for válido
            const isDuplicate = await collaboratorService.checkDuplicate(formData.cpf, collaborator?.id);
            if (isDuplicate) {
                newErrors.cpf = "CPF já cadastrado para outro colaborador.";
            }
        }

        // RG (Opcional, mas se preenchido valida tamanho)
        if (formData.rg && !validators.rg(formData.rg)) {
            newErrors.rg = "RG parece incompleto.";
        }

        // CBO
        if (formData.cbo && !validators.cbo(formData.cbo)) {
            newErrors.cbo = "CBO deve ter 6 dígitos.";
        }

        // PIS (Opcional por enquanto)
        if (formData.pis && !validators.pis(formData.pis)) {
            newErrors.pis = "PIS inválido.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCepBlur = async (e) => {
        const cep = e.target.value?.replace(/\D/g, '');
        if (cep?.length === 8) {
            setIsLoadingCep(true);
            try {
                const address = await cepService.searchCep(cep);
                setFormData(prev => ({
                    ...prev,
                    address_street: address.address_street,
                    address_city: address.address_city,
                    address_state: address.address_state,
                    // address_zip_code: address.address_zip_code
                }));
                notify.success('Endereço Encontrado', 'Dados preenchidos automaticamente.');
            } catch (error) {
                console.error("CEP Error", error);
                notify.error('Erro no CEP', error.message || 'Falha ao buscar endereço.');
            } finally {
                setIsLoadingCep(false);
            }
        }
    };

    // Load full data when drawer opens for editing
    useEffect(() => {
        if (isOpen) {
            setAvatarFile(null);
            setErrors({}); // Limpa erros
            setActiveTab('pessoal');

            if (collaborator) {
                // Modo Edição: Buscar dados completos para garantir que tenhamos CPF, RG, etc.
                const loadFullDetails = async () => {
                    setIsLoadingDetails(true);
                    try {
                        const fullData = await collaboratorService.getById(collaborator.id);
                        if (fullData) {
                            setFormData(fullData);
                            setPreviewUrl(fullData.avatar_url || null);
                        } else {
                            // Fallback se falhar (não deveria acontecer)
                            setFormData(collaborator);
                            setPreviewUrl(collaborator.avatar_url || null);
                        }
                    } catch (err) {
                        console.error("Erro ao carregar detalhes", err);
                        notify.error("Erro", "Não foi possível carregar os detalhes completos.");
                        setFormData(collaborator); // Use partial data as fallback
                    } finally {
                        setIsLoadingDetails(false);
                    }
                };
                loadFullDetails();
            } else {
                // Modo Novo
                setFormData({
                    active: true,
                    full_name: '', cpf: '', rg: '', birth_date: '', gender: '', marital_status: '',
                    address_street: '', address_number: '', address_city: '', address_state: '', address_zip_code: '',
                    role: '', cbo: '', department: '', admission_date: '', corporate_email: '', pis: '',
                    contract_type: 'CLT', work_regime: 'Presencial', salary: '',
                    bank_name: '', bank_agency: '', bank_account: '', pix_key: ''
                });
                setPreviewUrl(null);
                setIsLoadingDetails(false);
            }

            // Load Banks
            bankService.getBanks().then(setBankList);
        }
    }, [isOpen, collaborator]); // collaborator aqui é o objeto parcial vindo da lista

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpa erro do campo ao digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleTriggerFile = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate
        const isValid = await validateForm();
        if (!isValid) {
            notify.error("Atenção", "Verifique os campos com erro.");
            return;
        }

        // Vacation Logic for New Hires
        let finalData = { ...formData };
        if (!collaborator && formData.isNewHire) {
            const admission = formData.admission_date ? new Date(formData.admission_date) : new Date();
            const vestingEnd = new Date(admission);
            vestingEnd.setFullYear(vestingEnd.getFullYear() + 1);

            finalData.vacation_balance = 30;
            finalData.vacation_vesting_end = vestingEnd.toISOString().split('T')[0];
        } else if (!collaborator) {
            // If not new hire (legacy), balance starts at 0
            finalData.vacation_balance = 0;
            finalData.vacation_vesting_end = null;
        }
        // Remove auxiliary field before sending
        delete finalData.isNewHire;

        onSave(finalData, avatarFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-2xl transform transition ease-in-out duration-500 sm:duration-700 bg-slate-50 shadow-2xl flex flex-col h-full animate-slide-in-right">

                    {/* Header */}
                    <div className="px-8 py-6 bg-white border-b border-slate-200 flex items-center justify-between z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                                {collaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {collaborator ? 'Gerencie as informações do perfil selecionado.' : 'Preencha os dados abaixo para cadastrar um novo membro.'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
                            <span className="sr-only">Fechar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form Container */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

                        {/* Tabs */}
                        <div className="bg-white border-b border-slate-200 px-8 sticky top-0 z-10 shadow-sm">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {['pessoal', 'profissional', 'contratual', 'historico'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                            whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors
                                            ${activeTab === tab
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                                        `}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 relative">
                            {isLoadingDetails && (
                                <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm font-medium text-slate-600">Carregando dados...</p>
                                    </div>
                                </div>
                            )}

                            <div className="max-w-3xl mx-auto space-y-8">

                                {/* Tab: PESSOAL */}
                                {activeTab === 'pessoal' && (
                                    <div className="animate-fade-in space-y-6">

                                        {/* Avatar Card */}
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
                                            <div className="relative group cursor-pointer" onClick={handleTriggerFile}>
                                                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden hover:border-blue-500 transition-colors">
                                                    {previewUrl ? (
                                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Foto de Perfil</h3>
                                                <p className="text-sm text-slate-500 mb-3">Recomendado: 400x400px (JPG/PNG)</p>
                                                <button type="button" onClick={handleTriggerFile} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">Alterar foto</button>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                            </div>
                                        </div>

                                        {/* Section: Identificação */}
                                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                Dados Pessoais
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className={LABEL_CLASS}>Nome Completo <span className="text-red-500">*</span></label>
                                                    <input name="full_name" value={formData.full_name || ''} onChange={handleChange} className={INPUT_CLASS(!!errors.full_name)} placeholder="Ex: Maria da Silva" required />
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>CPF</label>
                                                    <input name="cpf" value={formData.cpf || ''} onChange={handleChange} className={INPUT_CLASS(!!errors.cpf)} placeholder="000.000.000-00" />
                                                    {errors.cpf && <p className={ERROR_MSG_CLASS}>{errors.cpf}</p>}
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>RG</label>
                                                    <input name="rg" value={formData.rg || ''} onChange={handleChange} className={INPUT_CLASS(!!errors.rg)} placeholder="00.000.000-0" />
                                                    {errors.rg && <p className={ERROR_MSG_CLASS}>{errors.rg}</p>}
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Data de Nascimento</label>
                                                    <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} className={INPUT_CLASS()} />
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Gênero</label>
                                                    <select name="gender" value={formData.gender || ''} onChange={handleChange} className={INPUT_CLASS()}>
                                                        <option value="">Selecione...</option>
                                                        <option value="Masculino">Masculino</option>
                                                        <option value="Feminino">Feminino</option>
                                                        <option value="Outro">Outro</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Section: Endereço */}
                                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                Endereço
                                            </h3>
                                            <div className="grid grid-cols-6 gap-6">
                                                <div className="col-span-6 md:col-span-2 relative">
                                                    <label className={LABEL_CLASS}>CEP</label>
                                                    <div className="relative">
                                                        <input
                                                            name="address_zip_code"
                                                            value={formData.address_zip_code || ''}
                                                            onChange={handleChange}
                                                            onBlur={handleCepBlur}
                                                            className={`${INPUT_CLASS()} pr-10`}
                                                            placeholder="00000-000"
                                                            maxLength={9}
                                                        />
                                                        {isLoadingCep && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-6 md:col-span-4">
                                                    <label className={LABEL_CLASS}>Rua</label>
                                                    <input name="address_street" value={formData.address_street || ''} onChange={handleChange} className={`${INPUT_CLASS()} bg-slate-50 text-slate-500`} readOnly placeholder="Preenchimento automático" />
                                                </div>
                                                <div className="col-span-6 md:col-span-2">
                                                    <label className={LABEL_CLASS}>Número</label>
                                                    <input name="address_number" value={formData.address_number || ''} onChange={handleChange} className={INPUT_CLASS()} placeholder="123" />
                                                </div>
                                                <div className="col-span-6 md:col-span-2">
                                                    <label className={LABEL_CLASS}>Cidade</label>
                                                    <input name="address_city" value={formData.address_city || ''} onChange={handleChange} className={`${INPUT_CLASS()} bg-slate-50 text-slate-500`} readOnly />
                                                </div>
                                                <div className="col-span-6 md:col-span-2">
                                                    <label className={LABEL_CLASS}>Estado</label>
                                                    <input name="address_state" value={formData.address_state || ''} onChange={handleChange} className={`${INPUT_CLASS()} bg-slate-50 text-slate-500`} readOnly placeholder="UF" maxLength={2} />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Tab: PROFISSIONAL */}
                                {activeTab === 'profissional' && (
                                    <div className="animate-fade-in space-y-6">
                                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                Dados Corporativos
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className={LABEL_CLASS}>Email Corporativo</label>
                                                    <input type="email" name="corporate_email" value={formData.corporate_email || ''} onChange={handleChange} className={INPUT_CLASS()} placeholder="joao@empresa.com" />
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Departamento</label>
                                                    <input name="department" value={formData.department || ''} onChange={handleChange} className={INPUT_CLASS()} placeholder="Ex: Engenharia" />
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Cargo <span className="text-red-500">*</span></label>
                                                    <input name="role" value={formData.role || ''} onChange={handleChange} className={INPUT_CLASS()} required placeholder="Ex: Senior Developer" />
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Data de Admissão</label>
                                                    <input type="date" name="admission_date" value={formData.admission_date || ''} onChange={handleChange} className={INPUT_CLASS()} />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                Registros
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={LABEL_CLASS}>CBO</label>
                                                    <input name="cbo" value={formData.cbo || ''} onChange={handleChange} className={INPUT_CLASS(!!errors.cbo)} />
                                                    {errors.cbo && <p className={ERROR_MSG_CLASS}>{errors.cbo}</p>}
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>PIS/PASEP</label>
                                                    <input name="pis" value={formData.pis || ''} onChange={handleChange} className={INPUT_CLASS(!!errors.pis)} />
                                                    {errors.pis && <p className={ERROR_MSG_CLASS}>{errors.pis}</p>}
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Tab: CONTRATUAL */}
                                {activeTab === 'contratual' && (
                                    <div className="animate-fade-in space-y-6">
                                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                Condições
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={LABEL_CLASS}>Tipo de Contrato</label>
                                                    <select name="contract_type" value={formData.contract_type || ''} onChange={handleChange} className={INPUT_CLASS()}>
                                                        <option value="CLT">CLT</option>
                                                        <option value="PJ">PJ</option>
                                                        <option value="Estágio">Estágio</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Regime</label>
                                                    <select name="work_regime" value={formData.work_regime || ''} onChange={handleChange} className={INPUT_CLASS()}>
                                                        <option value="Presencial">Presencial</option>
                                                        <option value="Híbrido">Híbrido</option>
                                                        <option value="Remoto">Remoto</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className={LABEL_CLASS}>Salário Base</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium">R$</div>
                                                            <input type="number" name="salary" value={formData.salary || ''} onChange={handleChange} className={`${INPUT_CLASS()} pl-10 font-medium`} placeholder="0,00" />
                                                        </div>
                                                    </div>

                                                    {!collaborator && (
                                                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex flex-col justify-center">
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <div className="relative flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.isNewHire || false}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, isNewHire: e.target.checked }))}
                                                                        className="w-5 h-5 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm font-bold text-slate-700">Recém-Contratado?</span>
                                                                    <p className="text-[10px] text-slate-500 leading-tight">
                                                                        Atribui 30 dias de férias com carência de 1 ano.
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        Dados Bancários (Para Pagamentos)
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className={LABEL_CLASS}>Banco</label>
                                                            <div className="relative group">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                    </svg>
                                                                </div>
                                                                <input
                                                                    name="bank_name"
                                                                    value={formData.bank_name || ''}
                                                                    onChange={handleChange}
                                                                    placeholder="Busque por nome ou código..."
                                                                    className={`${INPUT_CLASS()} pl-9`}
                                                                    autoComplete="off"
                                                                />
                                                                {/* Dropdown Suggestions */}
                                                                {/* Only show if text inside input is not an exact match to an existing full name (optional logic, but typically we want to see options while typing) */}
                                                                {formData.bank_name && bankList.length > 0 && (
                                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto hidden group-focus-within:block hover:block">
                                                                        {bankList
                                                                            .filter(b => b.fullName.toLowerCase().includes((formData.bank_name || '').toLowerCase()))
                                                                            .slice(0, 50) // Limit results
                                                                            .map(bank => (
                                                                                <div
                                                                                    key={bank.code}
                                                                                    onClick={() => handleChange({ target: { name: 'bank_name', value: bank.fullName } })}
                                                                                    className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 border-b border-slate-100 last:border-0 flex items-center justify-between cursor-pointer"
                                                                                >
                                                                                    <span className="truncate mr-2">{bank.name}</span>
                                                                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{bank.code}</span>
                                                                                </div>
                                                                            ))}
                                                                        {bankList.filter(b => b.fullName.toLowerCase().includes((formData.bank_name || '').toLowerCase())).length === 0 && (
                                                                            <div className="px-4 py-3 text-xs text-slate-400 text-center">Nenhum banco encontrado.</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className={LABEL_CLASS}>Chave PIX</label>
                                                            <input name="pix_key" value={formData.pix_key || ''} onChange={handleChange} className={INPUT_CLASS()} placeholder="CPF, Email ou Aleatória" />
                                                        </div>
                                                        <div>
                                                            <label className={LABEL_CLASS}>Agência</label>
                                                            <input name="bank_agency" value={formData.bank_agency || ''} onChange={handleChange} className={INPUT_CLASS()} placeholder="0000" />
                                                        </div>
                                                        <div>
                                                            <label className={LABEL_CLASS}>Conta</label>
                                                            <input name="bank_account" value={formData.bank_account || ''} onChange={handleChange} className={INPUT_CLASS()} placeholder="00000-0" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Active Status Card */}
                                                <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between mt-2">
                                                    <div>
                                                        <h4 className="text-blue-900 font-bold text-sm">Acesso ao Sistema</h4>
                                                        <p className="text-blue-700 text-xs mt-1">Habilite ou desabilite o login deste colaborador.</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={formData.active !== false} onChange={(e) => handleChange({ target: { name: 'active', value: e.target.checked } })} className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Tab: HISTÓRICO */}
                                {activeTab === 'historico' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-24 animate-fade-in opacity-60">
                                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900">Nenhum registro encontrado</h3>
                                        <p className="text-slate-500 text-sm mt-2 max-w-xs">Histórico de alterações de cargo e salários será exibido aqui.</p>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 py-5 bg-white border-t border-slate-200 flex items-center justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-700 font-bold hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 text-sm">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 focus:ring-4 focus:ring-slate-500/30 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                            >
                                {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Salvar Cadastro
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right { animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// --- Subcomponents ---

const HistoryTab = ({ collaboratorId }) => {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!collaboratorId) return;
        const fetchHistory = async () => {
            try {
                // Determine if we need to dynamically import service to avoid circular dependency
                const { occurrenceService } = await import('../../services/occurrenceService');
                const data = await occurrenceService.getAll({ collaboratorId });
                setHistory(data || []);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [collaboratorId]);

    if (loading) return <div className="text-center py-8 text-slate-400">Carregando histórico...</div>;
    if (history.length === 0) return <div className="text-center py-8 text-slate-400 border border-dashed rounded-xl">Nenhum registro encontrado.</div>;

    return (
        <div className="space-y-4 animate-fade-in">
            {history.map(item => (
                <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-4">
                    <div className={`w-1 rounded-full ${item.type === 'SUSPENSAO' ? 'bg-red-500' :
                        item.type === 'MERITO' ? 'bg-green-500' :
                            item.type === 'ADVERTENCIA_ESCRITA' ? 'bg-orange-500' :
                                'bg-blue-400'
                        }`} />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-700 text-sm">{item.title}</h4>
                            <span className="text-[10px] text-slate-400">{new Date(item.date_event).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        <div className="mt-2 flex gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 uppercase">
                                {item.type.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CollaboratorDrawer;
