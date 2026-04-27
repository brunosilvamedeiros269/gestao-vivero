'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Plus, Save, Trash2, Edit2, X, Leaf, LayoutGrid } from 'lucide-react';

export default function MapaEstufaAdmin() {
  const [setores, setSetores] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [capacidade, setCapacidade] = useState('10');
  const [tipoClima, setTipoClima] = useState('Geral');

  async function carregarTudo() {
    // Carregar Setores
    const { data: S } = await supabase.from('setores_estufa').select('*').order('nome');
    if (S) setSetores(S);

    // Carregar Lotes (para calcular ocupação)
    const { data: L } = await supabase.from('lotes_plantio').select('id, identificacao_lote, quantidade_plantada, setor_id, especie:especies(nome)').neq('status', 'esgotado_vendido').neq('status', 'perda_obito');
    if (L) setLotes(L);
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setCapacidade('10');
    setTipoClima('Geral');
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    setLoading(true);

    const payload = {
      nome,
      capacidade_bancadas: parseInt(capacidade) || 10,
      tipo_clima: tipoClima
    };

    try {
      if (editingId) {
        await supabase.from('setores_estufa').update(payload).eq('id', editingId);
      } else {
        await supabase.from('setores_estufa').insert([payload]);
      }
      resetForm();
      carregarTudo();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sec: any) => {
    setEditingId(sec.id);
    setNome(sec.nome);
    setCapacidade(sec.capacidade_bancadas?.toString() || '10');
    setTipoClima(sec.tipo_clima || 'Geral');
  };

  const handleDelete = async (id: string, n: string) => {
    if (!confirm(`Tem certeza que deseja apagar o setor "${n}"? Os lotes lá dentro ficarão "sem setor".`)) return;
    await supabase.from('setores_estufa').delete().eq('id', id);
    carregarTudo();
  };

  // Drag and Drop (Atribuir lote a um setor)
  const handleDragStart = (e: React.DragEvent, loteId: string) => {
    e.dataTransfer.setData("loteId", loteId);
  };

  const handleDrop = async (e: React.DragEvent, setorId: string | null) => {
    e.preventDefault();
    const loteId = e.dataTransfer.getData("loteId");
    if (!loteId) return;

    try {
      await supabase.from('lotes_plantio').update({ setor_id: setorId }).eq('id', loteId);
      carregarTudo();
    } catch(err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Filtros de Lotes
  const lotesSemSetor = lotes.filter(l => !l.setor_id);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500/20 p-3 rounded-2xl">
          <MapIcon className="text-indigo-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mapeamento Espacial (Estufa)</h1>
          <p className="text-secondary text-sm">Gerencie zonas, crie corredores e arraste as bancadas para organizá-las no espaço físico.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Painel Lateral: Form e Lotes "Sem Teto" */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSalvar} className="bg-surface-container-low p-5 rounded-3xl border border-surface-container-highest shadow-sm">
            <h3 className="font-bold mb-4">{editingId ? 'Editar Setor' : 'Novo Setor'}</h3>
            <div className="space-y-4">
              <div>
                 <label className="block text-sm font-bold text-secondary mb-1">Nome (Ex: Corredor A)</label>
                 <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-3 py-2 outline-none font-medium text-sm" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-secondary mb-1">Capacidade (Bancadas)</label>
                 <input type="number" min="1" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-3 py-2 outline-none text-sm" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-secondary mb-1">Microclima</label>
                 <select value={tipoClima} onChange={(e) => setTipoClima(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-3 py-2 outline-none text-sm">
                   <option value="Geral">Geral (Estufa Comum)</option>
                   <option value="Berçário Quente">Berçário Quente (Sementeira)</option>
                   <option value="Sombreado 50%">Sombreado 50%</option>
                   <option value="Sombreado 80%">Sombreado 80%</option>
                 </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-surface text-secondary px-3 py-2 rounded-xl transition">
                   <X size={16} />
                </button>
              )}
              <button disabled={loading} type="submit" className="flex-1 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition flex justify-center items-center gap-2">
                {editingId ? 'Atualizar' : 'Criar Setor'}
              </button>
            </div>
          </form>

          {/* Lotes Desabrigados */}
          <div 
            className="bg-surface-container-lowest p-5 rounded-3xl border-2 border-dashed border-surface-container shadow-sm min-h-[300px]"
            onDrop={(e) => handleDrop(e, null)}
            onDragOver={handleDragOver}
          >
             <h3 className="font-bold text-sm text-secondary uppercase mb-3 flex items-center gap-2"><LayoutGrid size={16}/> Lotes Não Alocados</h3>
             <p className="text-xs text-secondary/70 mb-4">Arraste para os setores ao lado.</p>

             <div className="space-y-2">
               {lotesSemSetor.map(l => (
                 <div 
                   key={l.id} 
                   draggable 
                   onDragStart={(e) => handleDragStart(e, l.id)}
                   className="bg-surface p-3 rounded-xl border border-surface-container cursor-grab active:cursor-grabbing hover:border-indigo-500 transition shadow-sm"
                 >
                   <div className="flex items-center justify-between">
                     <span className="font-bold text-sm text-on-surface truncate">{l.especie?.nome}</span>
                     <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-md font-mono">{l.identificacao_lote}</span>
                   </div>
                   <p className="text-xs text-secondary mt-1 flex items-center gap-1"><Leaf size={12}/> {l.quantidade_plantada} vivas</p>
                 </div>
               ))}
               {lotesSemSetor.length === 0 && (
                 <div className="text-center text-xs text-secondary italic py-6">Nenhum lote órfão.</div>
               )}
             </div>
          </div>
        </div>

        {/* Mapa / Setores */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {setores.map(sec => {
            const lotesDoSetor = lotes.filter(l => l.setor_id === sec.id);
            const taxaOcupacao = Math.min((lotesDoSetor.length / (sec.capacidade_bancadas || 1)) * 100, 100);
            
            return (
              <div 
                key={sec.id} 
                onDrop={(e) => handleDrop(e, sec.id)}
                onDragOver={handleDragOver}
                className="bg-surface-container-low border border-surface-container-highest rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="p-4 bg-surface-container border-b border-surface-container-highest">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black text-lg text-on-surface">{sec.nome}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(sec)} className="text-secondary hover:text-indigo-600"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(sec.id, sec.nome)} className="text-secondary hover:text-error"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-secondary">
                    <span>Clima: {sec.tipo_clima}</span>
                    <span className="font-bold">{lotesDoSetor.length} / {sec.capacidade_bancadas} bancadas</span>
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="w-full bg-surface-container-highest h-2 rounded-full mt-3 overflow-hidden">
                     <div 
                       className={`h-full ${taxaOcupacao > 90 ? 'bg-error' : taxaOcupacao > 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                       style={{width: `${taxaOcupacao}%`}}
                     ></div>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-lowest min-h-[150px] grid grid-cols-2 gap-2">
                  {lotesDoSetor.map(l => (
                    <div 
                      key={l.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, l.id)}
                      className="bg-surface p-2.5 rounded-xl border border-surface-container cursor-grab active:cursor-grabbing hover:shadow-md transition group"
                    >
                      <p className="font-bold text-xs text-on-surface truncate" title={l.especie?.nome}>{l.especie?.nome}</p>
                      <p className="text-[10px] text-secondary font-mono mt-0.5">{l.identificacao_lote}</p>
                    </div>
                  ))}
                  {lotesDoSetor.length === 0 && (
                    <div className="col-span-2 text-center text-xs text-secondary italic py-8">
                      Arraste lotes para este setor.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {setores.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-12 text-center text-secondary border-2 border-dashed border-surface-container rounded-3xl">
              Nenhum setor criado. Crie "Corredor A" no menu lateral.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
