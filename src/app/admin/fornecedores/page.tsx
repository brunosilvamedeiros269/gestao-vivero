'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Truck, Plus, Save, Phone, Star, Edit2, X, Trash2 } from 'lucide-react';

export default function FornecedoresAdmin() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    nome_fantasia: '',
    contato_telefone: '',
    nota_qualidade: 5
  });

  async function loadFornecedores() {
    const { data } = await supabase.from('fornecedores').select('*').order('created_at', { ascending: false });
    if (data) setFornecedores(data);
  }

  useEffect(() => {
    loadFornecedores();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'contato_telefone') {
      let v = value.replace(/\D/g, '');
      // Remove o 57 inicial se o usuário digitar por costume
      if (v.startsWith('57') && v.length > 2) v = v.substring(2);
      
      let formatted = '';
      if (v.length > 0) {
        if (v.length <= 3) formatted = `+57 ${v}`;
        else if (v.length <= 6) formatted = `+57 ${v.slice(0,3)} ${v.slice(3)}`;
        else formatted = `+57 ${v.slice(0,3)} ${v.slice(3,6)} ${v.slice(6,10)}`;
      }
      setForm(prev => ({ ...prev, contato_telefone: formatted }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_fantasia) return;
    setLoading(true);

    try {
      const payload = { 
        nome_fantasia: form.nome_fantasia,
        contato_telefone: form.contato_telefone,
        nota_qualidade: parseInt(form.nota_qualidade.toString())
      };

      if (editingId) {
        const { error } = await supabase.from('fornecedores').update(payload).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from('fornecedores').insert([payload]);
        if (error) throw error;
      }
      
      setForm({ nome_fantasia: '', contato_telefone: '', nota_qualidade: 5 });
      loadFornecedores();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setForm({
      nome_fantasia: f.nome_fantasia,
      contato_telefone: f.contato_telefone || '',
      nota_qualidade: f.nota_qualidade || 5
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ nome_fantasia: '', contato_telefone: '', nota_qualidade: 5 });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-container p-3 rounded-2xl">
          <Truck className="text-on-primary-container w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface">Gestão de Fornecedores</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="md:col-span-1">
          <form onSubmit={handleSalvar} className="bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest space-y-5 sticky top-8 text-on-surface">
            <h2 className="font-bold border-b border-surface-container-highest pb-2 mb-4 text-on-surface">
              {editingId ? 'Editar Fornecedor' : 'Adicionar Empresa'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nome/Marca</label>
              <input 
                required 
                type="text" name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} 
                placeholder="Ex: AgroSemillas" 
                className="w-full bg-surface text-on-surface placeholder:text-secondary border border-surface-container-highest rounded-xl px-4 py-2 outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Contato/Telefone (Celular)</label>
              <div className="relative">
                <input 
                  type="text" name="contato_telefone" value={form.contato_telefone} onChange={handleChange} 
                  placeholder="+57 320 000 0000" 
                  className="w-full bg-surface text-on-surface placeholder:text-secondary border border-surface-container-highest rounded-xl pl-10 pr-4 py-2 outline-none" 
                />
                <Phone size={16} className="absolute left-4 top-3 text-secondary" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nota Manual Base (Outros Insumos)</label>
              <select 
                name="nota_qualidade" value={form.nota_qualidade} onChange={handleChange} 
                className="w-full bg-surface text-on-surface border border-surface-container-highest rounded-xl px-4 py-2 outline-none"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Estrelas</option>)}
              </select>
              <p className="text-[10px] text-secondary mt-1 leading-tight">Painel de Mudas atualizará as notas de fornecedores de sementes via IA baseado no sucesso de germinação no futuro.</p>
            </div>

            <div className="flex gap-2 w-full mt-2">
              {editingId && (
                <button type="button" onClick={cancelEdit} className="bg-surface-container-highest text-on-surface font-medium px-4 py-3 rounded-xl hover:bg-surface-container-highest transition flex items-center gap-2">
                  <X size={20} />
                </button>
              )}
              <button disabled={loading} type="submit" className="flex-1 bg-primary text-on-primary font-medium px-6 py-3 rounded-xl shadow hover:bg-primary-container hover:text-on-primary-container transition flex items-center justify-center gap-2">
                {editingId ? <Save size={20} /> : <Plus size={20} />}
                {loading ? 'Salvando...' : (editingId ? 'Atualizar Fornecedor' : 'Registar Fornecedor')}
              </button>
            </div>
          </form>
        </div>

        {/* Tabela de Listagem */}
        <div className="md:col-span-2">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest overflow-hidden">
             <div className="px-6 py-4 border-b border-surface-container-highest bg-surface-container-low/50">
                <h3 className="font-bold text-on-surface">Meus Parceiros Cadastrados</h3>
             </div>
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-surface-container-highest">
                <tr>
                  <th className="px-6 py-4 text-secondary text-sm">Empresa</th>
                  <th className="px-6 py-4 text-secondary text-sm">Contato</th>
                  <th className="px-6 py-4 text-center text-secondary text-sm">Qualidade</th>
                  <th className="px-6 py-4 text-right text-secondary text-sm">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest">
                {fornecedores.length > 0 ? fornecedores.map(f => (
                  <tr key={f.id} className="hover:bg-surface-container-low transition">
                    <td className="px-6 py-4 font-bold text-on-surface">{f.nome_fantasia}</td>
                    <td className="px-6 py-4 text-secondary text-sm">{f.contato_telefone || 'Sem contato'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={16} className={i < f.nota_qualidade ? 'fill-amber-500 text-amber-500' : 'text-surface-container-highest'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleEdit(f)} className="text-secondary hover:bg-surface-container-highest p-2 rounded-lg transition" title="Editar">
                         <Edit2 size={18} />
                       </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-secondary leading-relaxed">
                      Nenhum fornecedor registrado ainda.<br/>Use o formulário ao lado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
