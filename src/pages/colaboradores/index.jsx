<<<<<<< HEAD
import CollaboratorImportModal from '../../components/CollaboratorImportModal';
import { utils, write } from 'xlsx'; // Need to add to package.json if not present, checking availability
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
import React, { useState, useEffect } from 'react';
import CollaboratorCard from '../../components/CollaboratorCard';
import CollaboratorDrawer from '../../components/CollaboratorDrawer';
import { collaboratorService } from '../../services/collaboratorService';
import { useCollaborators, useCollaboratorMutations } from '../../hooks/useCollaborators';
import { useNotification } from '../../context/NotificationContext';

<<<<<<< HEAD
// --- Helper for Export ---
const saveFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
const Colaboradores = () => {
    const { notify } = useNotification();

    // State definitions restored
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('active');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
<<<<<<< HEAD
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // NEW MODAL STATE
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Global loading for import/export
=======
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f

    const ITEMS_PER_PAGE = 30;
    const {
        data: queryData,
        isLoading: loading,
        refetch
    } = useCollaborators({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: filterStatus,
        searchTerm
    });

    const collaborators = queryData?.data || [];
    const totalCount = queryData?.count || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const { createCollaborator, updateCollaborator, toggleStatus } = useCollaboratorMutations();

    // Refetch when filters change is handled automatically by queryKey dependency in hook
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);

    const handleCreateNew = () => {
        setSelectedCollab(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (collab) => {
        setSelectedCollab(collab);
        setIsDrawerOpen(true);
    };

    const handleSave = async (formData, avatarFile) => {
        setIsSaving(true);
        try {
            let dataToSave = { ...formData };
            if (avatarFile) {
                const fileName = `avatar_${Date.now()}_${avatarFile.name.replace(/\s+/g, '-')}`;
                const publicUrl = await collaboratorService.uploadAvatar(avatarFile, fileName);
                dataToSave.avatar_url = publicUrl;
            }

            if (selectedCollab) {
                await updateCollaborator.mutateAsync({ id: selectedCollab.id, data: dataToSave });
                notify.success("Atualizado", "Dados do colaborador atualizados com sucesso!");
            } else {
                await createCollaborator.mutateAsync(dataToSave);
                notify.success("Cadastrado", "Novo colaborador registrado com sucesso!");
            }
            setIsDrawerOpen(false);
        } catch (error) {
            console.error("Error saving collaborator", error);
            notify.error("Erro ao Salvar", "Ocorreu um problema ao salvar os dados.");
        } finally {
            setIsSaving(false);
        }
    };

<<<<<<< HEAD
    // --- IMPORT/EXPORT HANDLERS ---
    // Helper para formatar data
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR');
        } catch (e) { return dateStr; }
    };

    const handleImportData = async (importedData) => {
        setIsLoading(true); // Bloqueia UI durante importação
        try {
            let successCount = 0;
            let errors = [];

            for (const row of importedData) {
                try {
                    // 1. Parser reverso (CSV p/ Objeto) se vier do modelo avançado
                    // Se o objeto já vier estruturado do modal (importação simples), usa direto.
                    // Se vier 'flat', precisaríamos reconstruir. 
                    // Assumindo por enquanto que o Modal entrega um objeto "pronto" ou quase pronto.
                    // Vamos garantir defaults mínimos:

                    const payload = { ...row };

                    // Defaults de Jornada se não existir
                    if (!payload.work_schedule) {
                        payload.work_schedule = { days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], shifts: [{ start: '08:00', end: '18:00' }] };
                        payload.weekly_hours = 44;
                    }
                    // Tratamento de senha default se criar usuário
                    if (payload.corporate_email && !payload.password) {
                        payload.password = 'Mudar123';
                    }

                    await createCollaborator.mutateAsync(payload);
                    successCount++;
                } catch (e) {
                    console.error("Falha ao importar linha", row, e);
                    errors.push(`${row.full_name || 'Desconhecido'}: ${e.message}`);
                }
            }

            if (errors.length > 0) {
                notify.warning("Importação Parcial", `${successCount} sucesso, ${errors.length} erros. Verifique o console.`);
            } else {
                notify.success("Importação Concluída", `${successCount} colaboradores importados.`);
            }

            setIsImportModalOpen(false);
            refetch();
        } catch (err) {
            notify.error("Erro Geral", "Falha crítica na importação.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = async (format) => {
        try {
            const allData = await collaboratorService.getAllRaw();

            // Mapeamento Completo (Flattening)
            const exportData = allData.map(c => {
                const schedule = c.work_schedule || {};
                const shift = schedule.shifts?.[0] || {};
                const lunch = c.lunch_info || {};

                return {
                    'Nome Completo': c.full_name || '',
                    'CPF': c.cpf || '',
                    'RG': c.rg || '',
                    'Data Nascimento': formatDate(c.birth_date),
                    'Sexo': c.gender || '',
                    'Estado Civil': c.marital_status || '',
                    'Email Corporativo': c.corporate_email || '',
                    'Cargo': c.role || '',
                    'Departamento': c.department || '',
                    'CBO': c.cbo || '',
                    'PIS': c.pis || '',
                    'Data Admissão': formatDate(c.admission_date),
                    'Salário': c.salary ? `R$ ${c.salary}` : '',
                    'Status': c.active ? 'Ativo' : 'Inativo',
                    'CEP': c.address_zip_code || '',
                    'Endereço': c.address_street || '',
                    'Número': c.address_number || '',
                    'Cidade': c.address_city || '',
                    'Estado': c.address_state || '',
                    'Dias de Trabalho': (schedule.days || []).join(';'),
                    'Hora Entrada': shift.start || '',
                    'Hora Saída': shift.end || '',
                    'Carga Semanal': c.weekly_hours || '',
                    'Tipo Almoço': lunch.type === 'FIXED' ? 'Fixo' : 'Variável',
                    'Duração Almoço (min)': lunch.duration_minutes || '',
                    'Banco': c.bank_name || '',
                    'Agência': c.bank_agency || '',
                    'Conta': c.bank_account || '',
                    'PIX': c.pix_key || ''
                };
            });

            if (format === 'CSV') {
                const headers = Object.keys(exportData[0]).join(',');
                const rows = exportData.map(row =>
                    Object.values(row).map(value =>
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value // Escape commas
                    ).join(',')
                );

                // BOM para Excel reconhecer acentos UTF-8
                const bom = "\uFEFF";
                const csvContent = bom + headers + "\n" + rows.join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `colaboradores_export_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Exportação Excel (.xlsx) requer biblioteca adicional. Usando CSV por enquanto.");
            }
        } catch (err) {
            console.error(err);
            notify.error("Erro na Exportação", "Falha ao processar dados.");
        }
    };


=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 animate-fade-in-down">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        Quadro de Colaboradores
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gerencie sua equipe, contratos e movimentações em um só lugar.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
<<<<<<< HEAD
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition-all shadow-sm w-full md:w-auto group"
                    >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        Importar / Exportar
                    </button>

                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto"
=======
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
<<<<<<< HEAD
                        Novo Colaborador
=======
                        Novo
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                    </button>
                </div>
            </div>

<<<<<<< HEAD
            {/* Area de Filtros e Busca */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
                {/* Filters (Existing code...) */}
                <div className="flex-1 relative">
                    <svg className="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar por nome, cargo ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-slate-600"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    {/* Status Tabs */}
                    {['active', 'inactive', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${filterStatus === status
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {status === 'active' ? 'Ativos' : status === 'inactive' ? 'Inativos' : 'Todos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>
=======
            {/* Controls Bar: Tabs & Search */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">

                {/* Status Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['active', 'inactive', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                            className={`
                                px-4 py-2 text-sm font-medium rounded-md transition-all
                                ${filterStatus === status
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'}
                            `}
                        >
                            {status === 'active' && 'Ativos'}
                            {status === 'inactive' && 'Inativos'}
                            {status === 'all' && 'Todos'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou cargo..."
                        className="w-full pl-9 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="bg-white h-64 rounded-2xl animate-pulse shadow-sm border border-slate-100"></div>
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                    ))}
                </div>
            ) : (
                <>
<<<<<<< HEAD
                    {collaborators.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
=======
                    {collaborators.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">Nenhum colaborador encontrado</h3>
                            <p className="text-slate-500">Tente ajustar sua busca ou filtro.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                            {collaborators.map(collab => (
                                <CollaboratorCard
                                    key={collab.id}
                                    data={collab}
<<<<<<< HEAD
                                    onClick={() => handleEdit(collab)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Nenhum colaborador encontrado</h3>
                            <p className="text-slate-500">Tente ajustar os filtros ou adicione um novo.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-bold"
                            >
                                Anterior
                            </button>
                            <span className="px-4 py-2 text-slate-500 font-bold items-center flex">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-bold"
                            >
                                Próxima
                            </button>
=======
                                    onClick={handleEdit}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {collaborators.length > 0 && (
                        <div className="flex items-center justify-between mt-8 border-t border-slate-200 pt-6">
                            <p className="text-sm text-slate-500">
                                Página <span className="font-bold text-slate-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Próxima
                                </button>
                            </div>
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
                        </div>
                    )}
                </>
            )}

<<<<<<< HEAD
            {/* Drawer */}
=======
            {/* Drawer Form */}
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
            <CollaboratorDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                collaborator={selectedCollab}
                onSave={handleSave}
<<<<<<< HEAD
                isLoading={isSaving}
            />

            {/* Import Modal */}
            <CollaboratorImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportData}
                onExport={handleExportData}
            />
=======
                isSaving={isSaving}
            />

>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
        </div>
    );
};

export default Colaboradores;
