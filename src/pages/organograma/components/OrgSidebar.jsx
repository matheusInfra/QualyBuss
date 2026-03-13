import React, { useState } from 'react';
import { DocumentTextIcon, Squares2X2Icon, UserIcon } from '@heroicons/react/24/outline';

const OrgSidebar = ({ unallocatedCollaborators }) => {
  const [tab, setTab] = useState('tools'); // 'tools' | 'users'

  const onDragStart = (event, nodeType, data = {}) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/json', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('tools')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ferramentas
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Colaboradores
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'tools' ? (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Anotações Visuais</p>
            
            <div 
              className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-grab hover:bg-slate-100 hover:border-indigo-300 transition-colors"
              onDragStart={(e) => onDragStart(e, 'textNode', { label: 'Nova Anotação...' })}
              draggable
            >
              <DocumentTextIcon className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Nota de Texto</span>
            </div>

            <div 
              className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-grab hover:bg-slate-100 hover:border-indigo-300 transition-colors"
              onDragStart={(e) => onDragStart(e, 'groupNode', { label: 'Novo Grupo' })}
              draggable
            >
              <Squares2X2Icon className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Agrupador Area</span>
            </div>
            
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Arraste os itens acima para o quadro à direita para montar o design.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase">Não Alocados no Mapa</p>
            
            {unallocatedCollaborators.length > 0 ? (
                unallocatedCollaborators.map(user => (
                    <div 
                        key={user.id}
                        className="flex items-center gap-3 p-2 bg-white border border-slate-200 shadow-sm rounded-lg cursor-grab hover:border-indigo-400 transition-colors"
                        onDragStart={(e) => onDragStart(e, 'custom', { 
                            id: user.id, 
                            label: user.full_name, 
                            role: user.role, 
                            department: user.department 
                        })}
                        draggable
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                             {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" /> : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.role || 'Sem Cargo'}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                    Todos os colaboradores já estão no mapa.
                </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default OrgSidebar;
