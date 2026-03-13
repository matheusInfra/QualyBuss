import React from 'react';
import { Handle, Position, NodeResizer, NodeToolbar, useReactFlow } from 'reactflow';
import { Bars3BottomLeftIcon, Bars3Icon, Bars3BottomRightIcon, TrashIcon } from '@heroicons/react/24/outline';

// Cores pré-definidas para anotações
const colors = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-slate-100', 'bg-white'];

export const TextNode = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();

  const bgColor = data.color || 'bg-yellow-100';
  const textAlign = data.textAlign || 'text-left';

  const updateData = (newData) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)));
  };

  return (
    <>
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={150} 
        minHeight={80} 
        handleStyle={{ width: 8, height: 8, borderRadius: 4 }} 
        lineStyle={{ borderWidth: 2 }}
      />
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 shadow-md rounded-lg">
           {/* Paleta de Cores */}
           <div className="flex gap-1 border-r border-slate-200 pr-2">
             {colors.map(c => (
               <button 
                 key={c}
                 className={`w-6 h-6 rounded-full ${c} border ${bgColor === c ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-300'} transition-transform hover:scale-110`}
                 onClick={() => updateData({ color: c })}
               />
             ))}
           </div>
           {/* Alinhamento de Texto */}
           <div className="flex gap-1 pl-1">
             <button onClick={() => updateData({ textAlign: 'text-left' })} className={`p-1 rounded ${textAlign === 'text-left' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><Bars3BottomLeftIcon className="w-4 h-4" /></button>
             <button onClick={() => updateData({ textAlign: 'text-center' })} className={`p-1 rounded ${textAlign === 'text-center' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><Bars3Icon className="w-4 h-4" /></button>
             <button onClick={() => updateData({ textAlign: 'text-right' })} className={`p-1 rounded ${textAlign === 'text-right' ? 'bg-slate-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}><Bars3BottomRightIcon className="w-4 h-4" /></button>
           </div>
           <div className="flex gap-1 pl-1 border-l border-slate-200 ml-1">
             <button onClick={() => data.onRemove?.(id)} className="p-1 rounded text-red-500 hover:bg-red-50" title="Apagar Nota"><TrashIcon className="w-4 h-4" /></button>
           </div>
        </div>
      </NodeToolbar>
      <div className={`p-4 w-full h-full shadow-md rounded-lg ${bgColor} border ${selected ? 'border-indigo-400 ring-4 ring-indigo-400/20' : 'border-slate-300'}`}>
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500 border-2 !border-white" />
        <textarea
          className={`w-full h-full bg-transparent border-none outline-none resize-none font-medium text-slate-800 ${textAlign}`}
          defaultValue={data.label}
          placeholder="Escreva sua anotação aqui..."
          onChange={(e) => updateData({ label: e.target.value })}
        />
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-indigo-500 border-2 !border-white" />
      </div>
    </>
  );
};

export const GroupNode = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();

  const updateData = (newData) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)));
  };

  return (
    <>
      <NodeResizer 
        color="#6366f1" 
        isVisible={selected} 
        minWidth={250} 
        minHeight={200}
        handleStyle={{ width: 10, height: 10, borderRadius: 2 }} 
        lineStyle={{ borderWidth: 2 }}
      />
      
      <div 
        className={`w-full h-full border-2 border-dashed rounded-xl bg-slate-50/30 backdrop-blur-sm ${selected ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-300'}`}
        style={{ zIndex: -1 }} 
      >
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 font-bold text-sm text-slate-600 uppercase tracking-widest rounded-br-xl rounded-tl-xl inline-flex items-center border-b border-r border-slate-200 shadow-sm">
             <input 
                type="text" 
                defaultValue={data.label || 'Módulo ou Grupo'} 
                className="bg-transparent border-none outline-none w-auto min-w-[100px] text-slate-700 pointer-events-auto"
                onChange={(e) => updateData({ label: e.target.value })}
             />
             <button 
                onClick={(e) => { e.stopPropagation(); data.onRemove?.(id); }} 
                className="text-red-400 hover:text-red-600 transition ml-2 pointer-events-auto" 
                title="Apagar Grupo"
             >
                <TrashIcon className="w-4 h-4" />
             </button>
          </div>
      </div>
    </>
  );
};
