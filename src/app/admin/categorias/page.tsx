'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag, Plus, Save, Trash2, Edit2, X } from 'lucide-react';

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [nomeNovaCat, setNomeNovaCat] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadCategorias() {
    const { data } = await supabase.from('categorias_insumo').select('id, nome').order('nome');
    if (data) setCategorias(data);
  }

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovaCat) return;
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase.from('categorias_insumo').update({ nome: nomeNovaCat }).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from('categorias_insumo').insert([{ nome: nomeNovaCat }]);
        if (error) throw error;
      }
      setNomeNovaCat('');
      loadCategorias();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, nome: string) => {
    setEditingId(id);
    setNomeNovaCat(nome);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNomeNovaCat('');
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja apagar a categoria "${nome}"? Isso pode dar erro se ela já estiver sendo usada em compras.`)) return;
    try {
      const { error } = await supabase.from('categorias_insumo').delete().eq('id', id);
      if (error) throw error;
      loadCategorias();
    } catch (err: any) {
      alert(`Erro ao deletar: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-container p-3 rounded-2xl">
          <Tag className="text-on-primary-container w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Gestão de Categorias de Insumo</h1>
      </div>

      <form onSubmit={handleSalvar} className="bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary mb-1">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </label>
          <input 
            required 
            type="text" 
            value={nomeNovaCat} 
            onChange={(e) => setNomeNovaCat(e.target.value)} 
            placeholder="Ex: Macetas Plásticas, Adubo Líquido" 
            className="w-full bg-surface border border-surface-container-highest text-on-surface placeholder:text-secondary rounded-xl px-4 py-2 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button type="button" onClick={cancelEdit} className="bg-surface-container-highest text-on-surface font-medium px-4 py-2 rounded-xl hover:bg-surface-container-highest transition flex items-center gap-2">
               <X size={20} /> Cancelar
            </button>
          )}
          <button disabled={loading} type="submit" className="bg-primary text-on-primary font-medium px-6 py-2 rounded-xl shadow hover:bg-primary-container hover:text-on-primary-container transition flex items-center gap-2">
            {editingId ? <Save size={20} /> : <Plus size={20} />}
            {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Adicionar')}
          </button>
        </div>
      </form>

      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-surface-container-highest">
            <tr>
              <th className="px-6 py-4 text-secondary text-sm">Nome da Categoria</th>
              <th className="px-6 py-4 text-right text-secondary text-sm">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest text-on-surface">
            {categorias.length > 0 ? categorias.map(c => (
              <tr key={c.id} className="hover:bg-surface-container-low transition">
                <td className="px-6 py-4 font-medium">{c.nome}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(c.id, c.nome)} className="text-secondary hover:bg-surface-container-highest p-2 rounded-lg transition" title="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.nome)} className="text-error hover:bg-error-container p-2 rounded-lg transition" title="Deletar">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-secondary">Nenhuma categoria registrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
