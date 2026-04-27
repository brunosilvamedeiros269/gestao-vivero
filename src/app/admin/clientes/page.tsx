'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Save, Trash2, Edit2, X, Briefcase } from 'lucide-react';

export default function ClientesAtacadoAdmin() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nitCnpj, setNitCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [desconto, setDesconto] = useState('0');

  async function loadClientes() {
    const { data } = await supabase.from('clientes_atacado').select('*').order('nome_empresa');
    if (data) setClientes(data);
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
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja apagar o cliente "${nome}"?`)) return;
    await supabase.from('clientes_atacado').delete().eq('id', id);
    loadClientes();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500/20 p-3 rounded-2xl">
          <Briefcase className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">CRM de Atacado (B2B)</h1>
          <p className="text-secondary text-sm">Gerencie grandes contas como paisagistas, garden centers e prefeituras.</p>
        </div>
      </div>

      <form onSubmit={handleSalvar} className="bg-surface-container-low p-6 rounded-3xl border border-surface-container-highest shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
             <label className="block text-sm font-bold text-on-surface mb-1">Nome da Empresa / Órgão</label>
             <input required type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none font-medium" />
          </div>
          <div>
             <label className="block text-sm font-bold text-secondary mb-1">NIT / CNPJ</label>
             <input type="text" value={nitCnpj} onChange={(e) => setNitCnpj(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none" />
          </div>
          <div>
             <label className="block text-sm font-bold text-secondary mb-1">Desconto Padrão (%)</label>
             <input type="number" step="0.1" value={desconto} onChange={(e) => setDesconto(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none" />
          </div>
          
          <div>
             <label className="block text-sm font-bold text-secondary mb-1">Nome do Contato</label>
             <input type="text" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none" />
          </div>
          <div>
             <label className="block text-sm font-bold text-secondary mb-1">Telefone (WhatsApp)</label>
             <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none" />
          </div>
          <div>
             <label className="block text-sm font-bold text-secondary mb-1">E-mail</label>
             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none" />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-surface-container">
          {editingId && (
            <button type="button" onClick={resetForm} className="bg-surface text-secondary font-bold px-4 py-2 rounded-xl hover:bg-surface-container-high transition flex items-center gap-2">
               <X size={20} /> Cancelar
            </button>
          )}
          <button disabled={loading} type="submit" className="bg-primary text-on-primary font-bold px-8 py-2 rounded-xl shadow-md hover:bg-primary/90 transition flex items-center gap-2">
            {editingId ? <Save size={20} /> : <Plus size={20} />}
            {loading ? 'Salvando...' : (editingId ? 'Atualizar Cliente' : 'Cadastrar B2B')}
          </button>
        </div>
      </form>

      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-surface-container-highest">
            <tr>
              <th className="px-6 py-4 text-secondary text-sm font-bold">Empresa</th>
              <th className="px-6 py-4 text-secondary text-sm font-bold">Contato</th>
              <th className="px-6 py-4 text-secondary text-sm font-bold text-center">Desconto</th>
              <th className="px-6 py-4 text-right text-secondary text-sm font-bold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest text-on-surface">
            {clientes.map(c => (
              <tr key={c.id} className="hover:bg-surface-container-low transition">
                <td className="px-6 py-4">
                  <p className="font-black text-on-surface">{c.nome_empresa}</p>
                  <p className="text-xs text-secondary font-mono">{c.nit_cnpj}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium">{c.contato_nome || '-'}</p>
                  <p className="text-xs text-secondary">{c.telefone}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded-lg text-xs">{c.desconto_padrao_percentual}%</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(c)} className="text-secondary hover:text-primary p-2 transition">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.nome_empresa)} className="text-error hover:bg-error-container p-2 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-secondary">Nenhum cliente atacado cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
