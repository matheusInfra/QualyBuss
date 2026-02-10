import React, { useState, useEffect, useRef } from 'react';
import { collaboratorService } from '../../services/collaboratorService';
import { documentService } from '../../services/documentService';
import { useNotification } from '../../contexts/NotificationContext';
// Import PDF.js worker
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure worker via CDN to ensure correct version loading and avoid bundle issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const Importacao = () => {
    const { notify } = useNotification();
    const [step, setStep] = useState(1); // 1: Config/Upload, 2: Review, 3: Processing

    // Config State
    const [importType, setImportType] = useState('Holerite'); // Holerite, Folha de Ponto, Comprovante Bancário
    const [refMonth, setRefMonth] = useState(new Date().getMonth() + 1);
    const [refYear, setRefYear] = useState(new Date().getFullYear());

    const [file, setFile] = useState(null);
    const [collaborators, setCollaborators] = useState([]);
    const [scannedPages, setScannedPages] = useState([]);
    // scannedPages structure: 
    // { pageIndex, textPreview, match: CollabObj|null, matchType, details, status, manualMatchId: id|null }

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
            let arrayBuffer = await pdfFile.arrayBuffer();

            // Standardize loading options
            const loadingOptions = {
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
            };

            let pdf;

            try {
                // Try 1: Direct Load
                const loadingTask = pdfjsLib.getDocument({ ...loadingOptions, data: arrayBuffer });
                pdf = await loadingTask.promise;
            } catch (loadError) {
                console.warn("PDF.js direct load failed. Attempting sanitation via pdf-lib...", loadError);

                // Try 2: Sanitize with pdf-lib (Rebuilds XRef table)
                try {
                    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                    const cleanBytes = await pdfDoc.save();
                    arrayBuffer = cleanBytes.buffer; // Update buffer

                    const retryTask = pdfjsLib.getDocument({ ...loadingOptions, data: arrayBuffer });
                    pdf = await retryTask.promise;
                    notify.success("Recuperação", "Arquivo corrompido foi reparado automaticamente.");
                } catch (sanitizeError) {
                    console.error("Sanitization failed", sanitizeError);
                    throw new Error("O arquivo PDF está corrompido e não pôde ser reparado.");
                }
            }

            const totalPages = pdf.numPages;
            const newScannedPages = [];

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const textItems = textContent.items.map(item => item.str).join(' ');

                // Matching Logic based on Type
                const matchResult = findCollaboratorMatch(textItems, importType);

                // Anomaly Detection (Category Mismatch)
                const anomaly = validateCategoryAnomaly(textItems, importType);

                let status = 'unmatched';
                let details = matchResult.details;

                if (matchResult.match) {
                    if (matchResult.type === 'divergence') status = 'warning';
                    else status = 'ready';
                }

                // Overwrite with anomaly warning if detected
                if (anomaly) {
                    status = 'warning';
                    details = `⚠️ Alerta: ${anomaly}`;
                }

                newScannedPages.push({
                    pageIndex: i, // 1-based
                    textPreview: textItems.substring(0, 100) + '...',
                    match: matchResult.match,
                    matchType: matchResult.type,
                    details: details,
                    status: status,
                    manualMatchId: matchResult.match ? matchResult.match.id : '' // Pre-fill if matched
                });
            }

            setScannedPages(newScannedPages);
            notify.success('Scan Concluído', `${newScannedPages.filter(p => p.match).length} identificados automaticamente.`);

        } catch (error) {
            console.error(error);
            notify.error('Erro no Scan', 'Falha ao ler o PDF.');
            setStep(1);
        } finally {
            setIsScanning(false);
        }
    };

    const validateCategoryAnomaly = (text, type) => {
        const cleanText = text.toLowerCase();

        // Define forbidden keywords for each category
        const rules = {
            'Holerite': {
                forbidden: ['comprovante de transferência', 'ted', 'doc', 'chave pix', 'agência', 'conta corrente'],
                required: ['holerite', 'demonstrativo', 'vencimentos', 'salário', 'líquido']
            },
            'Comprovante Bancário': {
                forbidden: ['demonstrativo de pagamento', 'folha de ponto', 'horas normais', 'salário base'],
                required: ['comprovante', 'transferência', 'banco', 'agência']
            },
            'Folha de Ponto': {
                forbidden: ['comprovante', 'transferência', 'líquido a receber'],
                required: ['entrada', 'saída', 'período', 'ocorrência']
            }
        };

        const rule = rules[type];
        if (!rule) return null;

        // Check Forbidden
        const foundForbidden = rule.forbidden.find(keyword => cleanText.includes(keyword));
        if (foundForbidden) {
            return `Parece ser outro documento (Encontrado: "${foundForbidden}").`;
        }

        // Check Warning if *none* of required are found (weaker check, maybe just a warning)
        // const foundRequired = rule.required.some(keyword => cleanText.includes(keyword));
        // if (!foundRequired) {
        //    return "Parece não corresponder à categoria selecionada.";
        // }

        return null;
    };



    const findCollaboratorMatch = (text, type) => {
        const cleanText = text.toLowerCase().replace(/\s+/g, ' ');

        // Strategies
        if (type === 'Folha de Ponto') {
            // Strategy: CPF (High Confidence) -> Name (Medium)
            // CPF Pattern: 000.000.000-00
            const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2})/;
            const cpfMatch = text.match(cpfRegex);

            if (cpfMatch) {
                const foundCpf = cpfMatch[0];
                const collab = collaborators.find(c => c.cpf === foundCpf);
                if (collab) return { type: 'perfect', match: collab, details: `CPF: ${foundCpf}` };
            }
        }

        if (type === 'Comprovante Bancário') {
            // Strategy: Bank Account (High) -> Name (Medium)
            // Regex for Agency/Account might be tricky depending on format, but let's try basic patterns
            // "Agência: 8569", "Conta: 12345-6"
            // We search for the NUMBERS present in the collaborator record within the text

            for (const collab of collaborators) {
                // Skip if no bank info
                if (!collab.bank_agency || !collab.bank_account) continue;

                const agency = collab.bank_agency.replace(/\D/g, ''); // just numbers
                const account = collab.bank_account.replace(/\D/g, '');

                // Simple check: is the precise agency AND account number in the text?
                // This is risky if numbers are short, but agency usually 4 digits, account 5+.
                if (agency.length >= 4 && account.length >= 4) {
                    if (cleanText.includes(agency) && cleanText.includes(account)) {
                        return { type: 'perfect', match: collab, details: `Banco: Ag:${collab.bank_agency} Cc:${collab.bank_account}` };
                    }
                }
            }
        }

        // Default / Fallback Strategy: Name Match
        // Used for Holerite AND as fallback for others
        let nameMatch = null;
        let cboMatch = null;

        // 1. Check Name
        for (const collab of collaborators) {
            if (collab.full_name && cleanText.includes(collab.full_name.toLowerCase())) {
                nameMatch = collab;
                break;
            }
        }

        // 2. Check CBO (Only relevant for Holerite usually, but good secondary check)
        if (type === 'Holerite') {
            for (const collab of collaborators) {
                if (collab.cbo && collab.cbo.length >= 4 && cleanText.includes(collab.cbo)) {
                    cboMatch = collab;
                    break;
                }
            }
        }

        // Analysis
        if (nameMatch && cboMatch) {
            if (nameMatch.id === cboMatch.id) {
                return { type: 'perfect', match: nameMatch, details: 'Nome + CBO confirmados.' };
            } else {
                return { type: 'divergence', match: nameMatch, details: `Divergência: Nome vs CBO.` };
            }
        } else if (nameMatch) {
            return { type: 'name_only', match: nameMatch, details: 'Identificado por Nome.' };
        } else if (cboMatch && type === 'Holerite') {
            return { type: 'cbo_only', match: cboMatch, details: `Identificado por CBO (${cboMatch.cbo}).` };
        }

        return { type: 'none', match: null, details: 'Não identificado.' };
    };

    // --- Manual Linking Logic ---
    const handleManualLink = (pageIndex, collabId) => {
        const collab = collaborators.find(c => c.id === collabId);
        setScannedPages(prev => prev.map(p => {
            if (p.pageIndex === pageIndex) {
                return {
                    ...p,
                    manualMatchId: collabId,
                    match: collab || null, // Update match obj for display
                    status: collab ? 'ready' : 'unmatched', // Update status
                    matchType: collab ? 'manual' : 'none',
                    details: collab ? 'Vinculação Manual' : 'Não identificado'
                };
            }
            return p;
        }));
    };

    // --- Step 3: Processing & Upload ---
    const handleProcessImport = async () => {
        // Filter pages that have a match (auto or manual)
        const pagesToProcess = scannedPages.filter(p => p.match && p.status !== 'error');

        if (pagesToProcess.length === 0) {
            notify.error("Nada a importar", "Nenhuma página vinculada a colaboradores.");
            return;
        }

        setStep(3);
        setUploadingProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const srcDoc = await PDFDocument.load(arrayBuffer);

            let processedCount = 0;

            for (const pageData of pagesToProcess) {
                try {
                    // Create new PDF
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(srcDoc, [pageData.pageIndex - 1]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();

                    // Filename construction
                    const monthName = new Date(0, refMonth - 1).toLocaleString('pt-BR', { month: 'long' });
                    const fileName = `${importType}_${monthName}_${refYear}_${pageData.match.full_name}.pdf`;
                    const individualFile = new File([pdfBytes], fileName, { type: 'application/pdf' });

                    // Usage options for metadata
                    const options = {
                        month: refMonth,
                        year: refYear
                    };

                    await documentService.uploadDocument(
                        individualFile,
                        pageData.match.id,
                        importType, // Category 
                        null,
                        options
                    );

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

    // --- Render ---

    // 1. Config & Upload View
    if (step === 1) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-extrabold text-slate-800">Assistente de Importação</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Digitalize e distribua documentos em lote automaticamente usando inteligência de reconhecimento.
                    </p>
                </div>

                {/* Configuration Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Documento</label>
                        <select
                            value={importType}
                            onChange={(e) => setImportType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                        >
                            <option value="Holerite">Holerite</option>
                            <option value="Folha de Ponto">Folha de Ponto</option>
                            <option value="Comprovante Bancário">Comprovante Bancário</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mês de Referência</label>
                        <select
                            value={refMonth}
                            onChange={(e) => setRefMonth(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ano de Referência</label>
                        <input
                            type="number"
                            value={refYear}
                            onChange={(e) => setRefYear(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition-all group shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Upload de {importType}
                    </h3>
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
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                        PDF
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-800 truncate">{file?.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{importType}</span>
                            <span>•</span>
                            <span>{refMonth}/{refYear}</span>
                            <span>•</span>
                            <span>{scannedPages.length} pgs</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end">
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
                                // disabled if no matches at all, but now user can match manually, so maybe just check if any are matched/ready
                                disabled={scannedPages.every(p => !p.match)}
                                className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Processar
                            </button>
                        </>
                    )}
                    {step === 3 && (
                        <div className="w-full md:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg flex items-center justify-center gap-3">
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
                    <h3 className="font-bold text-slate-700">Revisão de Vínculos</h3>
                    <div className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {scannedPages.filter(p => p.match).length} de {scannedPages.length} vinculados
                    </div>
                </div>

                {isScanning ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-500 font-medium">Analisando documentos via OCR...</p>
                        <p className="text-xs text-slate-400">Procurando CPF, Contas e Nomes...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {scannedPages.map((page) => (
                            <div key={page.pageIndex} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors">

                                {/* Page Number */}
                                <div className="flex items-center gap-4 md:w-24 shrink-0">
                                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600">
                                        {page.pageIndex}
                                    </div>

                                    {/* Status Icon */}
                                    <div>
                                        {page.status === 'success' && <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        {page.status === 'error' && <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        {(page.status === 'ready' || page.status === 'warning') && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                                        {page.status === 'unmatched' && <div className="w-3 h-3 bg-slate-300 rounded-full"></div>}
                                    </div>
                                </div>

                                {/* Content Info & Selection */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Link Selection */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Colaborador Vinculado
                                        </label>
                                        <select
                                            value={page.manualMatchId || ''}
                                            onChange={(e) => handleManualLink(page.pageIndex, e.target.value)}
                                            disabled={step === 3}
                                            className={`w-full text-sm border rounded-lg px-2 py-2 outline-none transition-colors ${page.match
                                                ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold'
                                                : 'bg-white border-slate-300 text-slate-500'
                                                } focus:ring-2 focus:ring-blue-500`}
                                        >
                                            <option value="">-- Não Identificado --</option>
                                            {collaborators.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.full_name} {c.cpf ? `(${c.cpf})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Detalhes da Identificação
                                        </label>
                                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 h-[38px] flex items-center">
                                            {page.matchType === 'manual' && <span className="font-bold text-blue-600 mr-2">MANUAL</span>}
                                            {page.matchType === 'perfect' && <span className="font-bold text-green-600 mr-2">AUTO</span>}
                                            <span className="truncate" title={page.details}>{page.details}</span>
                                        </div>
                                    </div>
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
