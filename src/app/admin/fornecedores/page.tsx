'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Truck, Plus, Save, Phone, Star, Edit2, X, Trash2, ArrowLeft, Search, Building2 } from 'lucide-react';

export default function FornecedoresAdmin() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [form, setForm] = useState({
    nome_fantasia: '',
    contato_telefone: '',
    nota_qualidade: 5
  });

  async function loadFornecedores() {
    setLoading(true);
    const { data } = await supabase.from('fornecedores').select('*').order('created_at', { ascending: false });
    if (data) setFornecedores(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFornecedores();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'contato_telefone') {
      let v = value.replace(/\D/g, '');
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
      } else {
        const { error } = await supabase.from('fornecedores').insert([payload]);
        if (error) throw error;
      }
      
      cancelEdit();
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
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ nome_fantasia: '', contato_telefone: '', nota_qualidade: 5 });
    setShowForm(false);
  };

  const filteredFornecedores = fornecedores.filter(f => 
    f.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-background min-h-screen text-on-surface pb-24">
      {/* Header App Style */}
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => showForm ? cancelEdit() : router.push('/')} className="p-2 hover:bg-surface-container rounded-full transition active:scale-95">
            <ArrowLeft size={24} className="text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-black text-on-surface leading-tight">Fornecedores</h1>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{showForm ? (editingId ? 'Editar Parceiro' : 'Novo Parceiro') : 'Lista de Parceiros'}</p>
          </div>
        </div>
      </header>

      {showForm ? (
        <main className="px-6 py-8 animate-in slide-in-from-right-8 fade-in duration-300">
          <form onSubmit={handleSalvar} className="space-y-6">
            
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-surface-container shadow-sm space-y-5">
              <div className="flex items-center gap-3 mb-2 border-b border-surface-container-highest pb-4">
                 <div className="p-3 bg-primary-container text-on-primary-container rounded-2xl">
                   <Building2 size={24} />
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-on-surface">Dados da Empresa</h2>
                   <p className="text-[10px] text-secondary font-medium">Informações de contato e qualidade</p>
                 </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Nome/Marca da Empresa</label>
                <input 
                  required 
                  type="text" name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} 
                  placeholder="Ex: AgroSemillas S.A." 
                  className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Contato (WhatsApp/Celular)</label>
                <div className="relative">
                  <input 
                    type="text" name="contato_telefone" value={form.contato_telefone} onChange={handleChange} 
                    placeholder="+57 320 000 0000" 
                    className="w-full bg-white border-2 border-surface-container rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" 
                  />
                  <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Nota de Qualidade (Base)</label>
                <div className="bg-white border-2 border-surface-container rounded-2xl p-4 flex items-center justify-between">
                   <div className="flex gap-2">
                     {[1,2,3,4,5].map(n => (
                        <button 
                          key={n} 
                          type="button" 
                          onClick={() => setForm({...form, nota_qualidade: n})}
                          className={`p-2 rounded-full transition-transform active:scale-90 ${form.nota_qualidade >= n ? 'text-amber-500 scale-110' : 'text-surface-container-highest scale-100'}`}
                        >
                          <Star size={28} className={form.nota_qualidade >= n ? 'fill-amber-500' : ''} />
                        </button>
                     ))}
                   </div>
                   <span className="text-xl font-black text-primary">{form.nota_qualidade}.0</span>
                </div>
                <p className="text-[10px] text-secondary font-medium px-2 italic">A IA ajustará a nota de fornecedores de semente com base no sucesso real do plantio.</p>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-50">
              <button disabled={loading} type="submit" className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm">
                {loading ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    {editingId ? <Save size={20} /> : <Plus size={20} />}
                    <span>{editingId ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      ) : (
        <main className="px-6 py-6 animate-in slide-in-from-left-8 fade-in duration-300">
          
          <div className="relative mb-6">
             <input 
               type="text" 
               placeholder="Buscar parceiro..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-surface-container-lowest border-2 border-surface-container rounded-3xl pl-12 pr-6 py-4 font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all"
             />
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary" size={20} />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-28 bg-surface-container rounded-3xl animate-pulse"></div>)}
              </div>
            ) : filteredFornecedores.length > 0 ? (
              filteredFornecedores.map((f: any) => (
                <div key={f.id} onClick={() => handleEdit(f)} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container shadow-sm active:scale-95 transition-transform flex flex-col gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80 group-hover:bg-primary transition-colors"></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h3 className="font-bold text-lg text-on-surface mb-1 leading-tight">{f.nome_fantasia}</h3>
                      <div className="flex items-center gap-2 text-secondary">
                        <Phone size={14} />
                        <span className="text-xs font-medium">{f.contato_telefone || 'Sem contato registrado'}</span>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors shrink-0">
                       <Edit2 size={16} />
                    </button>
                  </div>

                  <div className="pl-2 flex items-center justify-between border-t border-surface-container pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-secondary tracking-wider">Qualidade:</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={14} className={i < f.nota_qualidade ? 'fill-amber-500 text-amber-500' : 'text-surface-container-highest'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">{f.nota_qualidade}.0</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-surface-container-low rounded-[2rem] border border-surface-container border-dashed">
                <Truck size={48} className="mx-auto text-surface-container-highest mb-4" />
                <p className="text-secondary font-bold">Nenhum fornecedor encontrado.</p>
                <p className="text-xs text-secondary/70 mt-1">Toque no botão abaixo para adicionar.</p>
              </div>
            )}
          </div>

          <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setShowForm(true)}
              className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl shadow-primary/40 flex justify-center items-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={32} />
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
