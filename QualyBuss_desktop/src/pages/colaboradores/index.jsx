import React, { useState, useEffect } from 'react';
import CollaboratorCard from '../../components/CollaboratorCard';
import CollaboratorDrawer from '../../components/CollaboratorDrawer';
import { collaboratorService } from '../../services/collaboratorService';
import { useCollaborators, useCollaboratorMutations } from '../../hooks/useCollaborators';
import { useNotification } from '../../context/NotificationContext';

const Colaboradores = () => {
    const { notify } = useNotification();

    // State definitions restored
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('active');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

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
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Novo
                    </button>
                </div>
            </div>

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
                    ))}
                </div>
            ) : (
                <>
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
                            {collaborators.map(collab => (
                                <CollaboratorCard
                                    key={collab.id}
                                    data={collab}
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
                        </div>
                    )}
                </>
            )}

            {/* Drawer Form */}
            <CollaboratorDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                collaborator={selectedCollab}
                onSave={handleSave}
                isSaving={isSaving}
            />

        </div>
    );
};

export default Colaboradores;
