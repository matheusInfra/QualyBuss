import React, { useState, useEffect } from 'react';
import { absenceService } from '../../services/absenceService';
import { useNotification } from '../../context/NotificationContext';
import CollaboratorBalanceCard from '../../components/CollaboratorBalanceCard'; // New component
import AbsenceDrawer from '../../components/AbsenceDrawer'; // New component

const Ausencias = () => {
    const { notify } = useNotification();
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollaborator, setSelectedCollaborator] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 30;

    // Initial Load
    useEffect(() => {
        loadData();
    }, [searchTerm, currentPage]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data, count } = await absenceService.getCollaboratorsWithBalance({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                searchTerm
            });
            setCollaborators(data || []);
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao carregar dados de ausências.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCardClick = (collab) => {
        setSelectedCollaborator(collab);
        setIsDrawerOpen(true);
    };

    const handleDrawerClose = (shouldReload = false) => {
        setIsDrawerOpen(false);
        setSelectedCollaborator(null);
        if (shouldReload) {
            loadData();
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Gestão de Ausências</h1>
                    <p className="text-slate-500 mt-1">Controle de banco de horas, faltas e abonos.</p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou cargo..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : collaborators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {collaborators.map(collab => (
                        <CollaboratorBalanceCard
                            key={collab.collaborator_id}
                            data={collab}
                            onClick={() => handleCardClick(collab)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Nenhum colaborador encontrado.</p>
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && collaborators.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                    <p className="text-sm text-slate-500">
                        Página <span className="font-bold text-slate-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}

            {/* Drawer */}
            {selectedCollaborator && (
                <AbsenceDrawer
                    isOpen={isDrawerOpen}
                    onClose={handleDrawerClose}
                    collaborator={selectedCollaborator}
                    notify={notify}
                />
            )}
        </div>
    );
};

export default Ausencias;
