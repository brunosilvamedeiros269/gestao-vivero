'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Users, Plus, Save, Trash2, Edit2, X, Briefcase, ArrowLeft, Search, Phone, Mail, Building2, BadgePercent } from 'lucide-react';

export default function ClientesAtacadoAdmin() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form Fields
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nitCnpj, setNitCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [desconto, setDesconto] = useState('0');

  async function loadClientes() {
    setLoading(true);
    const { data } = await supabase.from('clientes_atacado').select('*').order('nome_empresa');
    if (data) setClientes(data);
    setLoading(false);
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNomeEmpresa('');
    setNitCnpj('');
    setContatoNome('');
    setTelefone('');
    setEmail('');
    setEndereco('');
    setDesconto('0');
    setShowForm(false);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEmpresa) return;
    setLoading(true);

    const payload = {
      nome_empresa: nomeEmpresa,
      nit_cnpj: nitCnpj,
      contato_nome: contatoNome,
      telefone: telefone,
      email: email,
      endereco: endereco,
      desconto_padrao_percentual: parseFloat(desconto) || 0
    };

    try {
      if (editingId) {
        await supabase.from('clientes_atacado').update(payload).eq('id', editingId);
      } else {
        await supabase.from('clientes_atacado').insert([payload]);
      }
      resetForm();
      loadClientes();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cli: any) => {
    setEditingId(cli.id);
    setNomeEmpresa(cli.nome_empresa);
    setNitCnpj(cli.nit_cnpj || '');
    setContatoNome(cli.contato_nome || '');
    setTelefone(cli.telefone || '');
    setEmail(cli.email || '');
    setEndereco(cli.endereco || '');
    setDesconto(cli.desconto_padrao_percentual?.toString() || '0');
    setShowForm(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja apagar o cliente "${nome}"?`)) return;
    await supabase.from('clientes_atacado').delete().eq('id', id);
    loadClientes();
  };

  const filteredClientes = clientes.filter(c => 
    c.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contato_nome && c.contato_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.nit_cnpj && c.nit_cnpj.includes(searchTerm))
  );

  return (
    <div className="bg-background min-h-screen text-on-surface pb-24">
      {/* Header App Style */}
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => showForm ? resetForm() : router.push('/')} className="p-2 hover:bg-surface-container rounded-full transition active:scale-95">
            <ArrowLeft size={24} className="text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-black text-on-surface leading-tight">Clientes B2B</h1>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{showForm ? (editingId ? 'Editar Cliente' : 'Novo Cliente') : 'Carteira de Atacado'}</p>
          </div>
        </div>
      </header>

      {showForm ? (
        <main className="px-6 py-8 animate-in slide-in-from-right-8 fade-in duration-300">
          <form onSubmit={handleSalvar} className="space-y-6">
            
            {/* Seção Empresa */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-surface-container shadow-sm space-y-5">
              <div className="flex items-center gap-3 mb-2 border-b border-surface-container-highest pb-4">
                 <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                   <Building2 size={24} />
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-on-surface">Dados da Empresa</h2>
                   <p className="text-[10px] text-secondary font-medium">Informações corporativas e CNPJ</p>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Razão Social / Nome Fantasia</label>
                 <input required type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Garden Center SP" className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" />
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">NIT / CNPJ</label>
                 <input type="text" value={nitCnpj} onChange={(e) => setNitCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" />
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1"><BadgePercent size={14}/> Desconto Padrão (%)</label>
                 <div className="relative">
                   <input type="number" step="0.1" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="0.0" className="w-full bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-2xl pl-5 pr-12 py-4 outline-none focus:border-blue-500 font-black shadow-sm transition-all text-xl" />
                   <span className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-lg">%</span>
                 </div>
                 <p className="text-[10px] text-secondary px-2">Será aplicado automaticamente nos pedidos deste cliente.</p>
              </div>
            </div>

            {/* Seção Contato */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-surface-container shadow-sm space-y-5">
              <div className="flex items-center gap-3 mb-2 border-b border-surface-container-highest pb-4">
                 <div className="p-3 bg-surface-container-highest text-on-surface rounded-2xl">
                   <Users size={24} />
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-on-surface">Pessoa de Contato</h2>
                   <p className="text-[10px] text-secondary font-medium">Comprador ou representante</p>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Nome do Contato</label>
                 <input type="text" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} placeholder="Ex: Carlos" className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" />
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
                 <div className="relative">
                   <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 90000-0000" className="w-full bg-white border-2 border-surface-container rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" />
                   <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">E-mail Corporativo</label>
                 <div className="relative">
                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@empresa.com" className="w-full bg-white border-2 border-surface-container rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-primary font-bold shadow-sm transition-all text-base" />
                   <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                 </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-50">
              <button disabled={loading} type="submit" className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm">
                {loading ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    {editingId ? <Save size={20} /> : <Plus size={20} />}
                    <span>{editingId ? 'Atualizar Cliente' : 'Cadastrar B2B'}</span>
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
               placeholder="Buscar cliente (nome ou CNPJ)..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-surface-container-lowest border-2 border-surface-container rounded-3xl pl-12 pr-6 py-4 font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all"
             />
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary" size={20} />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-32 bg-surface-container rounded-3xl animate-pulse"></div>)}
              </div>
            ) : filteredClientes.length > 0 ? (
              filteredClientes.map(c => (
                <div key={c.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container shadow-sm active:scale-95 transition-transform relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/80 group-hover:bg-blue-500 transition-colors"></div>
                  
                  <div className="pl-2 flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-lg text-on-surface leading-tight">{c.nome_empresa}</h3>
                      {c.nit_cnpj && <p className="text-xs font-mono text-secondary tracking-widest mt-0.5">{c.nit_cnpj}</p>}
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-xl text-xs font-black shadow-sm flex items-center gap-1">
                      <BadgePercent size={14}/> {c.desconto_padrao_percentual}%
                    </div>
                  </div>

                  {c.contato_nome && (
                     <div className="pl-2 flex items-center gap-2 text-secondary mb-4 bg-surface-container p-2 rounded-xl">
                       <div className="p-1.5 bg-surface-container-highest rounded-lg"><Users size={14}/></div>
                       <div>
                         <p className="text-[10px] uppercase font-bold tracking-wider leading-none">Representante</p>
                         <p className="text-sm font-medium text-on-surface leading-none mt-1">{c.contato_nome}</p>
                       </div>
                     </div>
                  )}

                  <div className="pl-2 flex items-center justify-between border-t border-surface-container pt-4">
                    <div className="flex gap-2">
                       {c.telefone && (
                         <a href={`tel:${c.telefone}`} className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition" onClick={(e) => e.stopPropagation()}>
                           <Phone size={18} />
                         </a>
                       )}
                       {c.email && (
                         <a href={`mailto:${c.email}`} className="p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition" onClick={(e) => e.stopPropagation()}>
                           <Mail size={18} />
                         </a>
                       )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="p-2 text-secondary hover:bg-surface-container rounded-xl transition">
                         <Edit2 size={20} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.nome_empresa); }} className="p-2 text-error/80 hover:bg-error/10 hover:text-error rounded-xl transition">
                         <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-surface-container-low rounded-[2rem] border border-surface-container border-dashed">
                <Briefcase size={48} className="mx-auto text-surface-container-highest mb-4" />
                <p className="text-secondary font-bold">Nenhum cliente atacado cadastrado.</p>
                <p className="text-xs text-secondary/70 mt-1">Toque no botão abaixo para adicionar novos clientes corporativos.</p>
              </div>
            )}
          </div>

          <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setShowForm(true)}
              className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/40 flex justify-center items-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={32} />
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
