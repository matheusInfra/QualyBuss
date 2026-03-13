import React, { useState, useEffect, useRef } from 'react';
import { collaboratorService } from '../../services/collaboratorService';
import { documentService } from '../../services/documentService';
import { complianceService } from '../../services/complianceService';
import { useNotification } from '../../contexts/NotificationContext';
// Import PDF.js worker
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure worker via CDN to ensure correct version loading and avoid bundle issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- COMPONENTE CUSTOMIZADO: Select Pesquisável (Combobox) ---
const SearchableSelect = ({ options, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Encontra o colaborador selecionado para exibir no botão
    const selectedOption = options.find(opt => opt.value === value);

    // Fecha o dropdown se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtra as opções com base no texto digitado
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.includes(searchTerm))
    );

    return (
        <div ref={wrapperRef} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left text-sm border rounded-lg px-3 py-2 outline-none transition-colors flex justify-between items-center
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}
                    ${value ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-white border-slate-300 text-slate-500 hover:border-blue-400'}
                `}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : '-- Selecione ou Digite --'}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Buscar nome ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm px-3 py-1.5 border border-slate-200 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        <div
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 cursor-pointer rounded-md mb-1"
                        >
                            -- Limpar Seleção (Não Identificado) --
                        </div>
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-400 text-center">Nenhum resultado encontrado.</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${value === opt.value ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                >
                                    <div>{opt.label}</div>
                                    {opt.subLabel && <div className={`text-[10px] ${value === opt.value ? 'text-blue-200' : 'text-slate-400'}`}>{opt.subLabel}</div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Importacao = () => {
    const { notify } = useNotification();
    const [step, setStep] = useState(1);

    const [importType, setImportType] = useState('');
    const [rules, setRules] = useState([]);
    const [refMonth, setRefMonth] = useState(new Date().getMonth() + 1);
    const [refYear, setRefYear] = useState(new Date().getFullYear());

    const [file, setFile] = useState(null);
    const [collaborators, setCollaborators] = useState([]);
    const [scannedPages, setScannedPages] = useState([]);
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, MATCHED, UNMATCHED, WARNING

    const [isScanning, setIsScanning] = useState(false);
    const [uploadingProgress, setUploadingProgress] = useState(0);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadCollaborators();
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            const data = await complianceService.getRules();
            setRules(data);
            if (data.length > 0) {
                setImportType(data[0].category);
            }
        } catch (error) {
            console.error("Failed to load rules", error);
        }
    };

    const loadCollaborators = async () => {
        try {
            const data = await collaboratorService.getAll();
            setCollaborators(data || []);
        } catch (error) {
            console.error("Failed to load collaborators", error);
        }
    };

    // --- Utils Inteligentes ---
    const normalizeString = (str) => {
        if (!str) return '';
        // Remove acentos, caracteres especiais e deixa tudo maiúsculo
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').toUpperCase().trim();
    };

    const cleanNumbers = (str) => str ? str.replace(/\D/g, '') : '';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setFile(file);
            scanPDF(file);
        } else {
            notify.error('Erro', 'Por favor, envie um arquivo PDF.');
        }
    };

    const scanPDF = async (pdfFile) => {
        setIsScanning(true);
        setStep(2);
        setScannedPages([]);
        setFilterStatus('ALL');

        try {
            let arrayBuffer = await pdfFile.arrayBuffer();

            const loadingOptions = {
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
            };

            let pdf;

            try {
                const loadingTask = pdfjsLib.getDocument({ ...loadingOptions, data: arrayBuffer });
                pdf = await loadingTask.promise;
            } catch (loadError) {
                console.warn("PDF.js direct load failed. Attempting sanitation...", loadError);
                try {
                    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                    const cleanBytes = await pdfDoc.save();
                    arrayBuffer = cleanBytes.buffer;

                    const retryTask = pdfjsLib.getDocument({ ...loadingOptions, data: arrayBuffer });
                    pdf = await retryTask.promise;
                    notify.success("Recuperação", "Arquivo corrompido foi reparado automaticamente.");
                } catch (sanitizeError) {
                    throw new Error("O arquivo PDF está corrompido e não pôde ser reparado.");
                }
            }

            const totalPages = pdf.numPages;
            const newScannedPages = [];

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const textItems = textContent.items.map(item => item.str).join(' ');

                const matchResult = findCollaboratorMatch(textItems, importType);
                const anomaly = validateCategoryAnomaly(textItems, importType);

                let status = 'unmatched';
                let details = matchResult.details;

                if (matchResult.match) {
                    if (matchResult.type === 'divergence') status = 'warning';
                    else status = 'ready';
                }

                if (anomaly) {
                    status = 'warning';
                    details = `⚠️ Alerta: ${anomaly}`;
                }

                newScannedPages.push({
                    pageIndex: i,
                    // Preview mais inteligente: Limpa espaços em excesso e pega 250 caracteres
                    textPreview: textItems.replace(/\s+/g, ' ').substring(0, 250) + '...',
                    match: matchResult.match,
                    matchType: matchResult.type,
                    details: details,
                    status: status,
                    manualMatchId: matchResult.match ? matchResult.match.id : ''
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
        const rules = {
            'Holerite': { forbidden: ['comprovante de transferência', 'ted', 'doc', 'chave pix'] },
            'Comprovante Bancário': { forbidden: ['demonstrativo de pagamento', 'folha de ponto', 'horas normais'] },
            'Folha de Ponto': { forbidden: ['comprovante', 'transferência', 'líquido a receber'] }
        };

        const rule = rules[type];
        if (!rule) return null;

        const foundForbidden = rule.forbidden.find(keyword => cleanText.includes(keyword));
        if (foundForbidden) return `Parece ser outro documento (Encontrado: "${foundForbidden}").`;

        return null;
    };

    const findCollaboratorMatch = (text, type) => {
        const normText = normalizeString(text);
        
        // 1. ESTRATÉGIA DE CPF (Inteligente e flexível)
        // Busca CPFs com ou sem pontuação
        const cpfRegex = /\b\d{3}[\.]?\d{3}[\.]?\d{3}[-]?\d{2}\b/g;
        const cpfsInText = text.match(cpfRegex);

        if (cpfsInText && cpfsInText.length > 0) {
            for (let foundCpf of cpfsInText) {
                const cleanFound = cleanNumbers(foundCpf);
                const collab = collaborators.find(c => cleanNumbers(c.cpf) === cleanFound);
                if (collab) return { type: 'perfect', match: collab, details: `Identificado por CPF Seguro: ${foundCpf}` };
            }
        }

        // 2. ESTRATÉGIA DE NOME E FUZZY MATCH
        let nameMatch = null;
        let cboMatch = null;

        for (const collab of collaborators) {
            if (!collab.full_name) continue;
            
            const normCollabName = normalizeString(collab.full_name);
            
            // A. Match Exato (Normalizado)
            if (normText.includes(normCollabName)) {
                nameMatch = collab;
                break;
            }

            // B. Match Parcial (Primeiro Nome + Último Nome)
            const nameParts = normCollabName.split(' ');
            if (nameParts.length > 2) {
                const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
                if (normText.includes(firstLast)) {
                    nameMatch = collab;
                    break;
                }
            }
        }

        // 3. ESTRATÉGIA SECUNDÁRIA (CBO para Holerites)
        if (type === 'Holerite') {
            for (const collab of collaborators) {
                if (collab.cbo && collab.cbo.length >= 4 && text.includes(collab.cbo)) {
                    cboMatch = collab;
                    break;
                }
            }
        }

        // Análise de Confiança
        if (nameMatch && cboMatch) {
            if (nameMatch.id === cboMatch.id) return { type: 'perfect', match: nameMatch, details: 'Nome + CBO confirmados.' };
            else return { type: 'divergence', match: nameMatch, details: `Divergência: Nome vs CBO.` };
        } else if (nameMatch) {
            return { type: 'name_only', match: nameMatch, details: 'Identificado pelo Nome (Alta Confiança).' };
        } else if (cboMatch && type === 'Holerite') {
            return { type: 'cbo_only', match: cboMatch, details: `Identificado apenas por CBO (${cboMatch.cbo}).` };
        }

        return { type: 'none', match: null, details: 'Necessária verificação humana.' };
    };

    const handleManualLink = (pageIndex, collabId) => {
        const collab = collaborators.find(c => c.id === collabId);
        setScannedPages(prev => prev.map(p => {
            if (p.pageIndex === pageIndex) {
                return {
                    ...p,
                    manualMatchId: collabId,
                    match: collab || null,
                    status: collab ? 'ready' : 'unmatched',
                    matchType: collab ? 'manual' : 'none',
                    details: collab ? 'Vinculado Manualmente pelo RH' : 'Necessária verificação humana.'
                };
            }
            return p;
        }));
    };

    const handleProcessImport = async () => {
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
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(srcDoc, [pageData.pageIndex - 1]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();

                    const monthName = new Date(0, refMonth - 1).toLocaleString('pt-BR', { month: 'long' });
                    const fileName = `${importType}_${monthName}_${refYear}_${pageData.match.full_name}.pdf`;
                    const individualFile = new File([pdfBytes], fileName, { type: 'application/pdf' });

                    const options = { referencePeriod: `${refYear}-${refMonth.toString().padStart(2, '0')}` };

                    await documentService.uploadDocument(individualFile, pageData.match.id, importType, null, options);

                    setScannedPages(prev => prev.map(p => p.pageIndex === pageData.pageIndex ? { ...p, status: 'success' } : p));
                } catch (err) {
                    console.error(`Error processing page ${pageData.pageIndex}`, err);
                    setScannedPages(prev => prev.map(p => p.pageIndex === pageData.pageIndex ? { ...p, status: 'error' } : p));
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

    // Filtra as páginas para exibição na tabela
    const displayedPages = scannedPages.filter(p => {
        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'MATCHED') return p.match != null;
        if (filterStatus === 'UNMATCHED') return p.match == null;
        if (filterStatus === 'WARNING') return p.status === 'warning';
        return true;
    });

    // 1. Config & Upload View
    if (step === 1) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-extrabold text-slate-800">Assistente de Importação</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Digitalize e distribua documentos em lote. A IA tentará extrair CPFs e Nomes para vincular os arquivos automaticamente.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Documento</label>
                        <select value={importType} onChange={(e) => setImportType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700">
                            {rules.length === 0 ? <option value="">Nenhuma Categoria...</option> : rules.map(rule => <option key={rule.id} value={rule.category}>{rule.category}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mês de Referência</label>
                        <select value={refMonth} onChange={(e) => setRefMonth(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ano de Referência</label>
                        <input type="number" value={refYear} onChange={(e) => setRefYear(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>

                <div onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition-all group shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Upload de {importType}</h3>
                    <p className="text-slate-400">Suporta arquivos PDF de até 50MB</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                </div>
            </div>
        );
    }

    // Preparar opções para o Combobox
    const collabOptions = collaborators.map(c => ({
        value: c.id,
        label: c.full_name,
        subLabel: c.cpf ? `CPF: ${c.cpf}` : 'Sem CPF'
    }));

    // 2. Review / Processing View
    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">PDF</div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-800 truncate">{file?.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{importType}</span>
                            <span>•</span><span>{refMonth}/{refYear}</span><span>•</span><span>{scannedPages.length} pgs</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end">
                    {step === 2 && !isScanning && (
                        <>
                            <button onClick={handleReset} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-sm">Cancelar</button>
                            <button onClick={handleProcessImport} disabled={scannedPages.every(p => !p.match)} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Processar Vínculos
                            </button>
                        </>
                    )}
                    {step === 3 && (
                        <div className="w-full md:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg flex items-center justify-center gap-3">
                            {uploadingProgress < 100 ? (
                                <><div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>Processando: {uploadingProgress}%</>
                            ) : (
                                <span className="text-green-600 flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Concluído</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-slate-700">Revisão de Vínculos OCR</h3>
                    
                    {/* Filtros Rápidos */}
                    {!isScanning && (
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                Todos ({scannedPages.length})
                            </button>
                            <button onClick={() => setFilterStatus('MATCHED')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filterStatus === 'MATCHED' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
                                Prontos ({scannedPages.filter(p => p.match).length})
                            </button>
                            <button onClick={() => setFilterStatus('UNMATCHED')} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filterStatus === 'UNMATCHED' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}>
                                Não Identificados ({scannedPages.filter(p => !p.match).length})
                            </button>
                        </div>
                    )}
                </div>

                {isScanning ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-500 font-medium">Lendo dados do PDF com OCR Avançado...</p>
                        <p className="text-xs text-slate-400">Pode levar alguns segundos dependendo do tamanho do arquivo.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {displayedPages.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-medium">Nenhuma página encontrada para este filtro.</div>
                        ) : (
                            displayedPages.map((page) => (
                                <div key={page.pageIndex} className="p-4 flex flex-col md:flex-row md:items-start gap-4 hover:bg-slate-50 transition-colors">
                                    
                                    <div className="flex items-center gap-4 md:w-24 shrink-0 pt-1">
                                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600">{page.pageIndex}</div>
                                        <div>
                                            {page.status === 'success' && <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                            {page.status === 'error' && <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                            {(page.status === 'ready' || page.status === 'warning') && <div className="w-3 h-3 bg-blue-500 rounded-full" title="Vinculado"></div>}
                                            {page.status === 'unmatched' && <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" title="Pendente"></div>}
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Coluna da Esquerda: Vinculação */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vincular ao Colaborador</label>
                                                <SearchableSelect 
                                                    options={collabOptions}
                                                    value={page.manualMatchId || ''}
                                                    onChange={(val) => handleManualLink(page.pageIndex, val)}
                                                    disabled={step === 3}
                                                />
                                            </div>
                                            <div>
                                                <div className={`text-xs p-2 rounded border flex items-start gap-2 ${page.match ? 'bg-blue-50/50 border-blue-100 text-blue-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                                    {page.matchType === 'manual' && <span className="font-bold px-1.5 bg-blue-200 text-blue-800 rounded">MANUAL</span>}
                                                    {['perfect', 'name_only', 'cbo_only'].includes(page.matchType) && <span className="font-bold px-1.5 bg-green-200 text-green-800 rounded">IA/AUTO</span>}
                                                    <span className="leading-tight">{page.details}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coluna da Direita: Preview do OCR para ajudar o RH */}
                                        <div className="bg-slate-100 rounded-lg p-3 border border-slate-200 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 bg-slate-200 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-bl-lg">
                                                TEXTO EXTRAÍDO DA PÁGINA (OCR)
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-2 font-mono leading-relaxed max-h-20 overflow-hidden relative">
                                                {page.textPreview}
                                                {/* Fade effect no final do texto para não estourar layout */}
                                                <span className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-100 to-transparent"></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default Importacao;