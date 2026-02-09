import React, { useState, useRef, Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import * as XLSX from 'xlsx'; // You might need to install this if not available, or use simple CSV parsing
import { sendMessageToAI } from '../../services/aiService';

// Simple CSV Parser fallback if XLSX is not available or for simple CSVs
const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        let obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
    });
    return { headers, data };
};

const CollaboratorImportModal = ({ isOpen, onClose, onImport, onExport }) => {
    const [activeTab, setActiveTab] = useState('import');
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview
    const [fileData, setFileData] = useState(null);
    const [mapping, setMapping] = useState({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);

    // Sistema Fields (Target)
    const SYSTEM_FIELDS = [
        { key: 'full_name', label: 'Nome Completo', required: true },
        { key: 'cpf', label: 'CPF', required: true },
        { key: 'corporate_email', label: 'Email Corporativo', required: true },
        { key: 'role', label: 'Cargo', required: false },
        { key: 'admission_date', label: 'Data Admissão', required: false },
        { key: 'salary', label: 'Salário', required: false }
    ];

    const handleDownloadTemplate = () => {
        const headers = SYSTEM_FIELDS.map(f => f.key).join(',');
        const example = "João da Silva,123.456.789-00,joao@qualybuss.com,Analista,2024-01-01,2500.00";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao_colaboradores.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            const { headers, data } = parseCSV(text); // Simple CSV for now

            setFileData({ headers, data, fileName: file.name });

            // Auto-Map identical columns
            const initialMap = {};
            headers.forEach(h => {
                const match = SYSTEM_FIELDS.find(sf => sf.key === h || sf.label === h);
                if (match) initialMap[h] = match.key;
            });
            setMapping(initialMap);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const handleAIMapping = async () => {
        if (!fileData) return;
        setIsAnalyzing(true);
        try {
            const prompt = `Analise estes cabeçalhos de CSV: [${fileData.headers.join(', ')}]. 
            Mapeie para os seguintes campos do sistema: ${SYSTEM_FIELDS.map(f => f.key).join(', ')}.
            Retorne APENAS um JSON válido no formato {"header_csv": "campo_sistema"}. Se não encontrar correspondência, ignore.`;

            const response = await sendMessageToAI(prompt);
            // Clean AI response (remove markdown if any)
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiMapping = JSON.parse(jsonStr);

            setMapping(prev => ({ ...prev, ...aiMapping }));
        } catch (error) {
            console.error("AI Mapping failed", error);
            alert("Erro ao usar IA. Tente manualmente.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImport = () => {
        // Transform data based on mapping
        const transformedData = fileData.data.map(row => {
            let newRow = {};
            Object.keys(mapping).forEach(csvHeader => {
                const systemKey = mapping[csvHeader];
                if (systemKey) {
                    newRow[systemKey] = row[csvHeader];
                }
            });
            // Defaults
            newRow.active = true;
            newRow.password = 'Mudar123'; // Default password logic
            return newRow;
        });

        onImport(transformedData);
        onClose();
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <DialogTitle as="h3" className="text-lg font-bold text-slate-700">Central de Importação/Exportação</DialogTitle>
                                    <button onClick={onClose} className="text-slate-400 hover:text-red-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-slate-100">
                                    <button
                                        onClick={() => setActiveTab('import')}
                                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'import' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Importar Colaboradores
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('export')}
                                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'export' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Exportar Dados
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-8 min-h-[400px]">
                                    {activeTab === 'import' && (
                                        <div className="space-y-8">
                                            {/* Stepper */}
                                            <div className="flex items-center justify-between px-10 mb-8 relative">
                                                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                                                {[1, 2, 3].map((s) => (
                                                    <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>

                                            {step === 1 && (
                                                <div className="text-center space-y-6 animate-fade-in">
                                                    <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-400 transition-colors bg-slate-50/50">
                                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-slate-700 mb-2">Arraste seu arquivo CSV aqui</h3>
                                                        <p className="text-slate-500 text-sm mb-6">ou clique para selecionar do seu computador</p>
                                                        <button
                                                            onClick={() => fileInputRef.current.click()}
                                                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                                        >
                                                            Selecionar Arquivo
                                                        </button>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept=".csv,.xlsx"
                                                            onChange={handleFileUpload}
                                                        />
                                                    </div>

                                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-3 text-left max-w-lg mx-auto">
                                                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <div>
                                                            <h4 className="font-bold text-amber-800 text-sm">Precisa de ajuda com o formato?</h4>
                                                            <p className="text-xs text-amber-700 mt-1 mb-2">
                                                                Baixe nossa planilha modelo com as colunas corretas para garantir uma importação sem erros.
                                                            </p>
                                                            <button
                                                                onClick={handleDownloadTemplate}
                                                                className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
                                                            >
                                                                Baixar Modelo CSV
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {step === 2 && (
                                                <div className="animate-fade-in text-left">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-800">Mapeamento de Colunas</h3>
                                                            <p className="text-sm text-slate-500">Arquivo: {fileData?.fileName}</p>
                                                        </div>
                                                        <button
                                                            onClick={handleAIMapping}
                                                            disabled={isAnalyzing}
                                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                                                        >
                                                            {isAnalyzing ? (
                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                            )}
                                                            {isAnalyzing ? 'Analisando...' : 'Mapear com IA'}
                                                        </button>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                                        <div className="grid grid-cols-2 bg-slate-100 p-3 text-xs font-bold text-slate-500 uppercase">
                                                            <div>Coluna do Arquivo</div>
                                                            <div>Campo do Sistema</div>
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {fileData?.headers.map((header) => (
                                                                <div key={header} className="grid grid-cols-2 p-3 border-b border-slate-100 items-center hover:bg-white text-sm">
                                                                    <div className="font-medium text-slate-700">{header}</div>
                                                                    <div>
                                                                        <select
                                                                            value={mapping[header] || ''}
                                                                            onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                                                                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                                                                        >
                                                                            <option value="">Ignorar</option>
                                                                            {SYSTEM_FIELDS.map(f => (
                                                                                <option key={f.key} value={f.key}>{f.label} {f.required && '*'}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex justify-end gap-3">
                                                        <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Voltar</button>
                                                        <button
                                                            onClick={() => setStep(3)}
                                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                                                        >
                                                            Continuar para Revisão
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {step === 3 && (
                                                <div className="animate-fade-in">
                                                    <div className="text-center py-8">
                                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-slate-800">Tudo Pronto!</h3>
                                                        <p className="text-slate-500 mt-2">
                                                            Identificamos <strong>{fileData?.data.length}</strong> colaboradores para importação.
                                                        </p>
                                                        <div className="mt-8 flex justify-center gap-4">
                                                            <button onClick={() => setStep(2)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Voltar</button>
                                                            <button
                                                                onClick={handleImport}
                                                                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transform hover:scale-105 transition-all"
                                                            >
                                                                Finalizar Importação
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'export' && (
                                        <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-fade-in">
                                            <p className="text-slate-500 max-w-md text-center">
                                                Exporte seus dados para gerar relatórios externos ou backups.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                                                <button
                                                    onClick={() => onExport('CSV')}
                                                    className="p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
                                                >
                                                    <div className="font-bold text-slate-700 group-hover:text-indigo-700 flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        Exportar CSV
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">Formato padrão compatível com a maioria dos sistemas.</div>
                                                </button>
                                                <button
                                                    onClick={() => onExport('XLSX')}
                                                    className="p-4 border border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group text-left"
                                                >
                                                    <div className="font-bold text-slate-700 group-hover:text-green-700 flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        Exportar Excel
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">Planilha formatada pronta para edição.</div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CollaboratorImportModal;
