import React, { useState, useEffect, useRef } from 'react';
import { collaboratorService } from '../../services/collaboratorService';
import { documentService } from '../../services/documentService';
import CollaboratorCard from '../../components/CollaboratorCard';
import { useNotification } from '../../context/NotificationContext';
import JSZip from 'jszip';

const Documentacao = () => {
    const { notify } = useNotification();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'manager'
    const [collaborators, setCollaborators] = useState([]);
    const [selectedCollaborator, setSelectedCollaborator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Loading ---
    useEffect(() => {
        loadCollaborators();
    }, []);

    const loadCollaborators = async () => {
        setLoading(true);
        try {
            const data = await collaboratorService.getAll();
            setCollaborators(data || []);
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao carregar colaboradores.');
        } finally {
            setLoading(false);
        }
    };

    // --- Navigation Handlers ---
    const handleSelectCollaborator = (collab) => {
        setSelectedCollaborator(collab);
        setViewMode('manager');
    };

    const handleBackToList = () => {
        setSelectedCollaborator(null);
        setViewMode('list');
    };

    // --- Filter Logic ---
    const filteredCollaborators = collaborators.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Render ---
    if (viewMode === 'manager' && selectedCollaborator) {
        return (
            <DocumentManager
                collaborator={selectedCollaborator}
                onBack={handleBackToList}
                notify={notify}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Documentação</h1>
                    <p className="text-slate-500 mt-1">Gerencie arquivos e documentos dos colaboradores.</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg className="w-5 h-5" fill="none" rx="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Collaborators Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredCollaborators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCollaborators.map(collab => (
                        <div key={collab.id} onClick={() => handleSelectCollaborator(collab)}>
                            <CollaboratorCard data={collab} onClick={() => { }} /> {/* Pass empty click to handle it on wrapper */}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Nenhum colaborador encontrado.</p>
                </div>
            )}
        </div>
    );
};

// --- Sub-Component: Document Manager ---
const DocumentManager = ({ collaborator, onBack, notify }) => {
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [category, setCategory] = useState('Outros');

    // Filters State
    const [filterCategory, setFilterCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Selection State
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    const fileInputRef = useRef(null);

    // Initial Load
    useEffect(() => {
        loadDocuments();
    }, [collaborator.id]);

    const loadDocuments = async () => {
        try {
            const docs = await documentService.getByCollaboratorId(collaborator.id);
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDocs(false);
        }
    };

    // --- Validation Logic ---
    const validateFile = (file) => {
        const ALLOWED_TYPES = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ];
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB

        if (!ALLOWED_TYPES.includes(file.type)) {
            notify.error('Arquivo Inválido', 'Apenas PDF, Word, JPG e PNG são permitidos.');
            return false;
        }
        if (file.size > MAX_SIZE) {
            notify.error('Arquivo muito grande', 'O limite é de 10MB.');
            return false;
        }
        return true;
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!validateFile(file)) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        try {
            await documentService.uploadDocument(file, collaborator.id, category);
            notify.success('Sucesso', 'Documento enviado com sucesso!');
            await loadDocuments(); // Reload list
        } catch (error) {
            console.error(error);
            notify.error('Erro', 'Falha ao enviar documento.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Excluir "${doc.name}"?`)) return;
        try {
            await documentService.deleteDocument(doc.id, doc.url);
            notify.success('Removido', 'Documento excluído.');
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
            setSelectedDocs(prev => prev.filter(id => id !== doc.id));
        } catch (error) {
            notify.error('Erro', 'Falha ao excluir documento.');
        }
    };

    // --- Selection Logic ---
    const toggleSelect = (docId) => {
        setSelectedDocs(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedDocs.length === filteredDocuments.length) {
            setSelectedDocs([]);
        } else {
            setSelectedDocs(filteredDocuments.map(d => d.id));
        }
    };

    // --- Export Logic ---
    const handleBulkExport = async () => {
        if (selectedDocs.length === 0) return;
        setIsExporting(true);

        try {
            const zip = new JSZip();
            const folder = zip.folder(`Documentos_${collaborator.full_name.replace(/\s+/g, '_')}`);

            const docsToExport = documents.filter(d => selectedDocs.includes(d.id));

            // Download files and add to zip
            const promises = docsToExport.map(async (doc) => {
                try {
                    const response = await fetch(doc.url);
                    const blob = await response.blob();
                    folder.file(doc.name, blob);
                } catch (err) {
                    console.error(`Failed to download ${doc.name}`, err);
                }
            });

            await Promise.all(promises);

            const content = await zip.generateAsync({ type: "blob" });

            // Trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `Documentos_${collaborator.full_name.replace(/\s+/g, '_')}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            notify.success('Exportação', 'Download do lote iniciado!');

        } catch (error) {
            console.error('Export error', error);
            notify.error('Erro', 'Falha ao exportar documentos.');
        } finally {
            setIsExporting(false);
        }
    };

    // --- Filter Logic ---
    const filteredDocuments = documents.filter(doc => {
        let match = true;
        if (filterCategory && doc.category !== filterCategory) match = false;

        if (startDate) {
            const docDate = new Date(doc.created_at);
            const [y, m, d] = startDate.split('-').map(Number);
            const start = new Date(y, m - 1, d); // Local midnight
            if (docDate < start) match = false;
        }

        if (endDate) {
            const docDate = new Date(doc.created_at);
            const [y, m, d] = endDate.split('-').map(Number);
            const end = new Date(y, m - 1, d);
            end.setHours(23, 59, 59, 999); // Local end of day
            if (docDate > end) match = false;
        }

        return match;
    });

    // Helpers
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        <img src={collaborator.avatar_url || `https://ui-avatars.com/api/?name=${collaborator.full_name}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{collaborator.full_name}</h1>
                        <p className="text-slate-500 text-sm">Gerenciamento de Documentos • {collaborator.role}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* UPload Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Novo Documento</h3>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Outros">Selecione...</option>
                                <option value="Contrato">Contrato</option>
                                <option value="Documentos Pessoais">Documentos Pessoais</option>
                                <option value="Holerite">Holerite</option>
                                <option value="Currículo">Currículo</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <h4 className="font-medium text-slate-700">Clique para enviar</h4>
                            <p className="text-xs text-slate-400 mt-1">PDF, Imagens ou DOCX (Max 10MB)</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleUpload}
                                className="hidden"
                                disabled={uploading}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                        </div>
                        {uploading && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium animate-pulse justify-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                Enviando arquivo...
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-4 text-center">
                            Arquivos protegidos e monitorados. Proibido envio de scripts ou executáveis.
                        </p>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Filters & Actions Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end justify-between">
                        <div className="flex gap-2 flex-wrap">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Filtrar Categoria</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="block w-32 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Todas</option>
                                    <option value="Contrato">Contrato</option>
                                    <option value="Documentos Pessoais">Doc. Pessoais</option>
                                    <option value="Holerite">Holerite</option>
                                    <option value="Currículo">Currículo</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">De</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-32 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Até</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-32 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex items-center gap-2">
                            {(filterCategory || startDate || endDate) && (
                                <button
                                    onClick={() => { setFilterCategory(''); setStartDate(''); setEndDate(''); }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                                >
                                    Limpar Filtros
                                </button>
                            )}

                            {selectedDocs.length > 0 && (
                                <button
                                    onClick={handleBulkExport}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium shadow"
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Exportando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Baixar ({selectedDocs.length})
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    checked={filteredDocuments.length > 0 && selectedDocs.length === filteredDocuments.length}
                                    onChange={toggleSelectAll}
                                />
                                <h3 className="font-bold text-lg text-slate-800">
                                    Arquivos ({filteredDocuments.length})
                                </h3>
                            </div>
                        </div>

                        {loadingDocs ? (
                            <div className="p-8 text-center text-slate-400">Carregando...</div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="p-12 flex flex-col items-center text-center text-slate-400">
                                <p>Nenhum documento encontrado com os filtros atuais.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredDocuments.map(doc => (
                                    <div key={doc.id} className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group ${selectedDocs.includes(doc.id) ? 'bg-blue-50/50' : ''}`}>

                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            checked={selectedDocs.includes(doc.id)}
                                            onChange={() => toggleSelect(doc.id)}
                                        />

                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-800 truncate" title={doc.name}>{doc.name}</h4>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">{doc.category}</span>
                                                <span>{formatBytes(doc.size_bytes)}</span>
                                                <span>•</span>
                                                <span>{formatDate(doc.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Documentacao;
