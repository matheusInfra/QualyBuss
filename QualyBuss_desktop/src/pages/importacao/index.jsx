import React, { useState, useEffect, useRef } from 'react';
import { collaboratorService } from '../../services/collaboratorService';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../context/NotificationContext';
// Import PDF.js worker
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure worker locally
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const Importacao = () => {
    const { notify } = useNotification();
    const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Processing
    const [file, setFile] = useState(null);
    const [collaborators, setCollaborators] = useState([]);
    const [scannedPages, setScannedPages] = useState([]); // { pageIndex, text, match: { id, name, cbo }, status: 'pending'|'success'|'error' }
    const [isScanning, setIsScanning] = useState(false);
    const [uploadingProgress, setUploadingProgress] = useState(0);

    const fileInputRef = useRef(null);

    // Load Collaborators on Mount
    useEffect(() => {
        loadCollaborators();
    }, []);

    const loadCollaborators = async () => {
        try {
            const data = await collaboratorService.getAll();
            setCollaborators(data || []);
        } catch (error) {
            console.error("Failed to load collaborators", error);
        }
    };

    // --- Step 1: File Handling ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setFile(file);
            scanPDF(file);
        } else {
            notify.error('Erro', 'Por favor, envie um arquivo PDF.');
        }
    };

    // --- Step 2: Scanning Logic ---
    const scanPDF = async (pdfFile) => {
        setIsScanning(true);
        setStep(2);
        setScannedPages([]);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const totalPages = pdf.numPages;
            const newScannedPages = [];

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const textItems = textContent.items.map(item => item.str).join(' ');

                // Matching Logic
                const matchResult = findCollaboratorMatch(textItems);

                newScannedPages.push({
                    pageIndex: i, // 1-based index for display and splitting
                    textPreview: textItems.substring(0, 100) + '...',
                    match: matchResult.match,
                    matchType: matchResult.type,
                    details: matchResult.details,
                    status: matchResult.match
                        ? (matchResult.type === 'divergence' ? 'warning' : 'ready')
                        : 'unmatched'
                });
            }

            setScannedPages(newScannedPages);
            notify.success('Scan Concluído', `${newScannedPages.filter(p => p.match).length} colaboradores identificados.`);

        } catch (error) {
            console.error(error);
            notify.error('Erro no Scan', 'Falha ao ler o PDF.');
            setStep(1);
        } finally {
            setIsScanning(false);
        }
    };

    const findCollaboratorMatch = (text) => {
        const cleanText = text.toLowerCase().replace(/\s+/g, ' ');

        let nameMatch = null;
        let cboMatch = null;

        // 1. Check Name
        for (const collab of collaborators) {
            if (collab.full_name && cleanText.includes(collab.full_name.toLowerCase())) {
                nameMatch = collab;
                break;
            }
        }

        // 2. Check CBO
        for (const collab of collaborators) {
            if (collab.cbo && collab.cbo.length >= 4 && cleanText.includes(collab.cbo)) {
                cboMatch = collab;
                break;
            }
        }

        // 3. Analyze Results
        if (nameMatch && cboMatch) {
            if (nameMatch.id === cboMatch.id) {
                return { type: 'perfect', match: nameMatch, details: 'Nome e CBO confirmados.' };
            } else {
                return {
                    type: 'divergence',
                    match: nameMatch,
                    details: `Divergência: Nome (${nameMatch.full_name}) vs CBO (${cboMatch.cbo}) de ${cboMatch.full_name}.`
                };
            }
        } else if (nameMatch) {
            // Name found, CBO not found in text
            return {
                type: 'name_only',
                match: nameMatch,
                details: 'Aviso: Identificado por Nome (CBO não localizado).'
            };
        } else if (cboMatch) {
            return {
                type: 'cbo_only',
                match: cboMatch,
                details: `Aviso: Identificado por CBO (${cboMatch.cbo}). Nome não localizado.`
            };
        }

        return { type: 'none', match: null, details: 'Nenhum dado de identificação encontrado.' };
    };

    // --- Step 3: Processing & Upload ---
    const handleProcessImport = async () => {
        const pagesToProcess = scannedPages.filter(p => p.match && (p.status === 'ready' || p.status === 'warning'));
        if (pagesToProcess.length === 0) return;

        setStep(3);
        setUploadingProgress(0);

        try {
            // Load original PDF again for splitting
            const arrayBuffer = await file.arrayBuffer();
            const srcDoc = await PDFDocument.load(arrayBuffer);

            let processedCount = 0;

            for (const pageData of pagesToProcess) {
                try {
                    // Create new PDF for this page
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(srcDoc, [pageData.pageIndex - 1]); // pdf-lib is 0-indexed
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();

                    // Create File object
                    const individualFile = new File([pdfBytes], `Holerite_${pageData.match.full_name}_${Date.now()}.pdf`, { type: 'application/pdf' });

                    // Upload
                    await documentService.uploadDocument(individualFile, pageData.match.id, 'Holerite');

                    // Update local status
                    setScannedPages(prev => prev.map(p =>
                        p.pageIndex === pageData.pageIndex ? { ...p, status: 'success' } : p
                    ));

                } catch (err) {
                    console.error(`Error processing page ${pageData.pageIndex}`, err);
                    setScannedPages(prev => prev.map(p =>
                        p.pageIndex === pageData.pageIndex ? { ...p, status: 'error' } : p
                    ));
                }

                processedCount++;
                setUploadingProgress(Math.round((processedCount / pagesToProcess.length) * 100));
            }

            notify.success('Importação Finalizada', 'Documentos distribuídos com sucesso.');

        } catch (error) {
            console.error('Critical import error', error);
            notify.error('Erro Fatal', 'Falha no processo de importação.');
        }
    };

    const handleReset = () => {
        setFile(null);
        setScannedPages([]);
        setStep(1);
    };

    // --- Renders ---

    // 1. Upload View
    if (step === 1) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-extrabold text-slate-800">Importação de holerites</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Envie um único arquivo PDF contendo múltiplos holerites. O sistema irá ler, identificar cada colaborador e separar os arquivos automaticamente.
                    </p>
                </div>

                <div
                    className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition-all group shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Clique para selecionar o PDF</h3>
                    <p className="text-slate-400">Suporta arquivos PDF de até 50MB</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                    />
                </div>
            </div>
        );
    }

    // 2. Review / Processing View
    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up space-y-6">
            {/* Header Steps */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl">
                        PDF
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{file?.name}</h2>
                        <p className="text-sm text-slate-500">
                            {isScanning ? 'Lendo páginas...' : `${scannedPages.length} páginas encontradas`}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {step === 2 && !isScanning && (
                        <>
                            <button
                                onClick={handleReset}
                                className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleProcessImport}
                                disabled={scannedPages.filter(p => p.match).length === 0}
                                className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Processar e Enviar
                            </button>
                        </>
                    )}
                    {step === 3 && (
                        <div className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg flex items-center gap-3">
                            {uploadingProgress < 100 ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                    Processando: {uploadingProgress}%
                                </>
                            ) : (
                                <span className="text-green-600 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Concluído
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Pré-visualização da Importação</h3>
                    <div className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {scannedPages.filter(p => p.match).length} identificados de {scannedPages.length}
                    </div>
                </div>

                {isScanning ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-500 font-medium">Analisando conteúdo do PDF...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {scannedPages.map((page) => (
                            <div key={page.pageIndex} className="p-4 flex items-center gap-6 hover:bg-slate-50 transition-colors">

                                {/* Page Number */}
                                <div className="w-16 flex flex-col items-center justify-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
                                    <span className="text-xl font-bold text-slate-800">{page.pageIndex}</span>
                                </div>

                                {/* Status Icon */}
                                <div className="w-10 flex justify-center">
                                    {page.status === 'success' && <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    {page.status === 'error' && <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    {page.status === 'ready' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                                    {page.status === 'warning' && <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                    {page.status === 'unmatched' && <div className="w-3 h-3 bg-slate-300 rounded-full"></div>}
                                </div>

                                {/* Content Info */}
                                <div className="flex-1">
                                    {page.match ? (
                                        <div>
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                {page.match.full_name}
                                                {page.matchType === 'divergence' && (
                                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                        Divergência
                                                    </span>
                                                )}
                                                {page.matchType !== 'perfect' && page.matchType !== 'divergence' && (
                                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                        Parcial
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-slate-500">{page.match.role} • {page.details}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="font-bold text-slate-400 italic">Não identificado</h4>
                                            <p className="text-xs text-slate-400">O sistema não encontrou correspondência de nome ou CBO nesta página.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Text Preview (debug/audit) */}
                                <div className="w-64 text-xs text-slate-400 truncate font-mono bg-slate-50 p-2 rounded border border-slate-100 hidden md:block" title={page.textPreview}>
                                    {page.textPreview}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

export default Importacao;
