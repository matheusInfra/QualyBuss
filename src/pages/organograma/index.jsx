import React, { useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { InformationCircleIcon, BriefcaseIcon, ClockIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon, ArrowPathIcon, CloudArrowUpIcon, TrashIcon, EnvelopeIcon, MapPinIcon, CalendarDaysIcon, IdentificationIcon, ChevronUpIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

import { collaboratorService } from '../../services/collaboratorService';
import { organogramService } from '../../services/organogramService';
import { getLayoutedElements } from '../../utils/payroll/DagLayout';
import { useNotification } from '../../contexts/NotificationContext';

import OrgSidebar from './components/OrgSidebar';
import { TextNode, GroupNode } from './components/CanvasNodes';

const CustomNode = ({ data }) => {
  const isExpanded = data.isExpanded || false;

  const calcAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const bd = new Date(birthDate);
      let age = today.getFullYear() - bd.getFullYear();
      const m = today.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
      return age;
  };

  const age = calcAge(data.birthDate);

  return (
    <div className={`shadow-lg rounded-xl bg-white border border-slate-200 min-w-[240px] transition-all duration-300 ease-in-out cursor-pointer relative group ${isExpanded ? 'min-w-[320px]' : ''}`}>
      
      {/* Exclusão do Canvas/Workflow */}
      <button 
         onClick={(e) => { e.stopPropagation(); data.onRemove && data.onRemove(data.id); }}
         className="absolute -top-2 -left-2 bg-white text-rose-500 border border-rose-200 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:scale-110 z-10"
         title="Remover do Mapa"
      >
          <TrashIcon className="w-4 h-4" />
      </button>

      {/* Indicadores de RH (Badges Visuais) */}
      <div className="absolute -top-3 -right-2 flex gap-1">
         {data.isVacation && (
            <div title="Em Férias" className="bg-orange-100 text-orange-600 border border-orange-200 p-1.5 rounded-full shadow-sm"><BriefcaseIcon className="w-3.5 h-3.5" /></div>
         )}
         {data.isAbsent && (
            <div title="Falta/Atestado" className="bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-full shadow-sm"><ClockIcon className="w-3.5 h-3.5" /></div>
         )}
      </div>

      {/* Header Compacto */}
      <div className="px-5 py-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full w-10 h-10 bg-indigo-50 border border-indigo-100 flex items-center justify-center text-base font-bold text-indigo-700 uppercase flex-shrink-0">
            {data.label ? data.label.charAt(0) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-slate-800 line-clamp-1" title={data.label}>{data.label}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{data.role || 'Sem Cargo Definido'}</div>
            
            <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">{data.department || 'GERAL'}</span>
                
                {data.teamSize > 0 && (
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Equipe: {data.teamSize}</span>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mini-Perfil Expansível */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-5 py-3 space-y-2 animate-fade-in bg-slate-50/50 rounded-b-xl">
            {data.email && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="truncate" title={data.email}>{data.email}</span>
                </div>
            )}
            {(data.city || data.state) && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPinIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{[data.city, data.state].filter(Boolean).join(', ')}</span>
                </div>
            )}
            {data.admissionDate && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CalendarDaysIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>Admissão: {new Date(data.admissionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
            )}
            {age && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <IdentificationIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{age} anos{data.contractType ? ` · ${data.contractType}` : ''}</span>
                </div>
            )}

            {/* Botão para Fechar  */}
            <button onClick={(e) => { e.stopPropagation(); data.onCollapse?.(data.id); }} className="w-full flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 pt-1 transition-colors">
                <ChevronUpIcon className="w-3 h-3" /> Recolher
            </button>
        </div>
      )}
      
      {/* Tooltip on Hover */}
      {!isExpanded && (
        <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center pointer-events-none">
            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1">
               <InformationCircleIcon className="w-3 h-3 text-indigo-300" />
               Duplo clique para ver mais
            </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
  textNode: TextNode,
  groupNode: GroupNode
};

function OrganogramaCanvas() {
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  // Custom Flow States -> useNodesState e useEdgesState estavam causando loop, e nós retiramos eles temporariamente
  // Voltando a sintaxe certa
  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState([]);

  // Fullscreen Mode
  const fullscreenRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  useEffect(() => {
      const handler = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handler);
      return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
      if (!document.fullscreenElement) {
          fullscreenRef.current?.requestFullscreen?.();
      } else {
          document.exitFullscreen?.();
      }
  }, []);

  // Drawer Controls removidos - duplo clique expande o card inline agora

  const handleRemoveNode = useCallback((id) => {
     setFlowNodes((nds) => nds.filter((n) => n.id !== id));
  }, [setFlowNodes]);

  const handleNodeDoubleClick = useCallback((event, node) => {
      // Toggle do mini-perfil expansível diretamente no data do node
      if (node.type === 'custom') {
          setFlowNodes((nds) => nds.map((n) => {
              if (n.id === node.id) {
                  return { ...n, data: { ...n.data, isExpanded: !n.data.isExpanded } };
              }
              return n;
          }));
      }
  }, [setFlowNodes]);

  // Load Context
  const { data: collabData = [], isLoading: isLoadingCollabs } = useQuery({
    queryKey: ['org_collaborators'],
    queryFn: () => organogramService.getCollaboratorNodes()
  });

  const { data: annotationData = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['org_annotations'],
    queryFn: () => organogramService.getAnnotations()
  });

  const { data: customEdgesData = [], isLoading: isLoadingEdges } = useQuery({
    queryKey: ['org_edges'],
    queryFn: () => organogramService.getCustomEdges()
  });

  const isLoading = isLoadingCollabs || isLoadingNotes || isLoadingEdges;

  // Re-build Graph whenever data from backend changes
  useEffect(() => {
    if (collabData.length > 0) {
      // Create user nodes (using XY from backend if exists)
      const userNodes = collabData
        .filter(c => c.org_pos_x !== null || c.manager_id != null || collabData.find(sub => sub.manager_id === c.id)) // Apenas mostra se tiver pos salvo OR tiver chefia setada (ou for o lider maior)
        .map(c => {
           // Calcular se o cara tem subordinados dinamicamente
           const directReports = collabData.filter(sub => sub.manager_id === c.id).length;
           
           return {
            id: c.id,
            type: 'custom',
            zIndex: 2,
            data: { 
                id: c.id,
                label: c.full_name, 
                role: c.role, 
                department: c.department,
                teamSize: directReports,
                email: c.corporate_email,
                city: c.address_city,
                state: c.address_state,
                birthDate: c.birth_date,
                admissionDate: c.admission_date,
                contractType: c.contract_type,
                // Simulando contexto inteligente de RH ate conectarmos a rotina verdadeira:
                isVacation: c.full_name.includes('Férias') || false, 
                isAbsent: Math.random() > 0.9, // 10% chance pra ver o icone em açao nos testes visuais
                onRemove: handleRemoveNode,
                onCollapse: (id) => setFlowNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isExpanded: false } } : n)),
            },
            position: { x: c.org_pos_x || 0, y: c.org_pos_y || 0 }, 
           };
        });

      // Create geometry annotations
      const noteNodes = annotationData.map(a => {
        let textConfig = { label: a.content };
        
        try { // Backward com JSON armazenado no content se houver cor e alinhamento
           if (a.content.startsWith('{')) {
               const parsed = JSON.parse(a.content);
               textConfig = { ...parsed };
           }
        } catch(e) {
            console.warn('Old string notation found for label, falling back natively.', e.message);
        }

        return {
            id: a.id,
            type: a.type,
            zIndex: a.type === 'groupNode' ? -1 : 1,
            data: { ...textConfig, color: a.color, onRemove: handleRemoveNode }, 
            position: { x: a.pos_x, y: a.pos_y },
            style: { width: a.width, height: a.height }
        };
      });

      // Mix them all
      const mixedNodes = [...noteNodes, ...userNodes];

      // Draw lines between managers and subs
      const managerEdges = collabData
        .filter(c => c.manager_id && mixedNodes.some(mn => mn.id === c.id)) // Only if the edge node is presented
        .map(c => ({
          id: `e${c.manager_id}-${c.id}`,
          source: c.manager_id,
          target: c.id,
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        }));

      // Load Free-form styling edges
      const loadedCustomEdges = customEdgesData.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 }
      }));

      const allEdges = [...managerEdges, ...loadedCustomEdges];

      // Se a MAIORIA dos colaboradores visíveis nunca teve posição salva (org_pos_x é null), forçamos autolayout
      const visibleCollabIds = userNodes.map(n => n.id);
      const unsavedCount = collabData.filter(c => visibleCollabIds.includes(c.id) && c.org_pos_x === null && c.org_pos_y === null).length;
      const needsLayout = unsavedCount > 2;

      if (needsLayout) {
          const layouted = getLayoutedElements(mixedNodes, allEdges, 'TB');
          setFlowNodes([...layouted.nodes]);
          setFlowEdges([...layouted.edges]);
      } else {
          setFlowNodes(mixedNodes);
          setFlowEdges(allEdges);
      }
    }
  }, [collabData, annotationData, customEdgesData, setFlowNodes, setFlowEdges, handleRemoveNode]);

  // Handle Drag & Drop connections
  const updateManagerMutation = useMutation({
    mutationFn: async ({ targetId, managerId }) => {
      // In this logic, source = manager, target = employee
      return collaboratorService.update(targetId, { manager_id: managerId });
    },
    onSuccess: () => {
      notify.success("Organograma atualizado!");
      queryClient.invalidateQueries(['org_collaborators']);
    },
    onError: () => {
      notify.error("Erro ao vincular colaboradores.");
    }
  });

  // Drag handlers
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const metadataStr = event.dataTransfer.getData('application/json');
      const dataPayload = metadataStr ? JSON.parse(metadataStr) : { label: 'Novo Item' };

      // Calculate position
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Special ID handling if it's an existing unallocated user vs brand new shapes
      let newId;
      if (type === 'custom') {
          newId = dataPayload.id; // UUID of collaborator
      } else {
          newId = crypto.randomUUID(); // Valid real UUID ready to be upserted
      }

      const newNode = {
        id: newId,
        type,
        position,
        zIndex: type === 'custom' ? 2 : (type === 'groupNode' ? -1 : 1),
        data: { ...dataPayload, onRemove: handleRemoveNode },
      };

      setFlowNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setFlowNodes, handleRemoveNode]
  );

  const onConnect = useCallback((params) => {
    // Lookup basico dos nodes na state list atual
    const sourceNode = flowNodes.find(n => n.id === params.source);
    const targetNode = flowNodes.find(n => n.id === params.target);

    if (sourceNode?.type === 'custom' && targetNode?.type === 'custom') {
        // Ligação Organizacional Chefe -> Sub
        setFlowEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds));
        updateManagerMutation.mutate({ managerId: params.source, targetId: params.target });
    } else {
        // Ligação Visual / Diagrama / Flow
        setFlowEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: false, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds));
    }
  }, [setFlowEdges, updateManagerMutation, flowNodes]);
  
  const saveLayoutMutation = useMutation({
      mutationFn: async () => {
          // Identify changes based on CURRENT 'nodes' array
          const colUpdates = [];
          const noteUpserts = [];
          
          flowNodes.forEach(n => {
              if (n.type === 'custom') {
                  colUpdates.push({
                      id: n.id,
                      org_pos_x: Math.round(n.position.x),
                      org_pos_y: Math.round(n.position.y)
                  });
              } else {
                  // Salvando PostIts. Se existirem propriedades formatadas em data, gravamos um pseudo-JSON no content para as fontes/alinhamentos não se perderem.
                  const payloadStr = JSON.stringify({
                      label: n.data?.label || '',
                      textAlign: n.data?.textAlign || 'text-left'
                  });

                  noteUpserts.push({
                      id: n.id,
                      type: n.type,
                      content: payloadStr,
                      color: n.data?.color || null,
                      pos_x: Math.round(n.position.x),
                      pos_y: Math.round(n.position.y),
                      width: n.style?.width || n.width || (n.type === 'groupNode' ? 300 : 200),
                      height: n.style?.height || n.height || (n.type === 'groupNode' ? 200 : 100),
                  });
              }
          });

          // Extrair edges que sao puramente visuais (excluir as autogeradas 'eChefia-Sub')
          const customEdgesToSave = flowEdges
              .filter(e => !e.id.startsWith('e') || e.id.includes('reactflow__'))
              .map(e => ({
                  id: e.id,
                  source: e.source,
                  target: e.target
              }));

          return organogramService.saveLayout(colUpdates, noteUpserts, customEdgesToSave);
      },
      onSuccess: () => {
          notify.success("Layout Arquitetural Salvo!");
          queryClient.invalidateQueries(['org_collaborators']);
          queryClient.invalidateQueries(['org_annotations']);
          queryClient.invalidateQueries(['org_edges']);
      },
      onError: () => notify.error("Falha ao gravar estado do Board.")
  });

  const autoLayout = () => {
    const layouted = getLayoutedElements(flowNodes, flowEdges, 'TB');
    setFlowNodes([...layouted.nodes]);
    setFlowEdges([...layouted.edges]);
  };

  const handleSave = () => saveLayoutMutation.mutate();

  const unallocatedCollaborators = collabData.filter(
      c => !c.manager_id && !flowNodes.some(n => n.id === c.id)
  );

  return (
    <div ref={fullscreenRef} className={`flex flex-col bg-slate-50/50 animate-fade-in relative ${isFullscreen ? 'h-screen p-2' : 'h-[calc(100vh-2rem)] p-6 space-y-4'}`}>
      {/* Header - compacto em fullscreen */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isFullscreen ? 'pb-2' : ''}`}>
        {!isFullscreen && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Design de Hierarquia</h1>
          <p className="text-sm text-slate-500">Arraste os nós para mapear seu org ou use a varinha auto-center.</p>
        </div>
        )}
        
        <div className={`flex gap-2 relative ${isFullscreen ? 'ml-auto' : ''}`}>
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar colaborador..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48"
          />
          <button onClick={autoLayout} className="px-3 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg text-sm shadow-sm hover:bg-slate-300 transition flex items-center gap-2" title="Auto-Layout">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={saveLayoutMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm shadow hover:bg-indigo-700 transition flex items-center gap-2">
            <CloudArrowUpIcon className="w-5 h-5" />
            {saveLayoutMutation.isPending ? 'Salvando...' : 'Salvar Mapa'}
          </button>
          <button onClick={toggleFullscreen} className="px-3 py-2 bg-slate-800 text-white font-medium rounded-lg text-sm shadow hover:bg-slate-900 transition flex items-center gap-2" title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}>
            {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden relative">
          {!isFullscreen && <OrgSidebar unallocatedCollaborators={unallocatedCollaborators} />}

         {isLoading ? (
            <div className="flex-1 flex items-center justify-center font-bold text-slate-400 border border-slate-200 bg-white shadow-sm rounded-xl">Carregando mapa...</div>
        ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner relative overflow-hidden" ref={reactFlowWrapper}>
                <ReactFlow
                   nodes={flowNodes}
                   edges={flowEdges}
                   nodeTypes={nodeTypes}
                   onNodesChange={onFlowNodesChange}
                   onEdgesChange={onFlowEdgesChange}
                   onNodeDoubleClick={handleNodeDoubleClick}
                   onConnect={onConnect}
                   onDrop={onDrop}
                   onDragOver={onDragOver}
                   fitView
                   attributionPosition="bottom-right"
                >
                   <MiniMap 
                     nodeStrokeColor={() => '#cbd5e1'}
                     nodeColor={() => '#eef2ff'}
                   />
                   <Controls />
                   <Background color="#cbd5e1" gap={16} />
                </ReactFlow>
            </div>
        )}
      </div>
    </div>
  );
}

export default function OrganogramaWrapper() {
    return (
        <ReactFlowProvider>
            <OrganogramaCanvas />
        </ReactFlowProvider>
    );
}
