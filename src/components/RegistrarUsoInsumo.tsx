'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Beaker, Search, X } from 'lucide-react';

export function RegistrarUsoInsumo({ loteId }: { loteId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [insumosEstoque, setInsumosEstoque] = useState<any[]>([]);
  const [loadding, setLoading] = useState(false);
  const router = useRouter();

  // Campos do Form
  const [insumoSelecionado, setInsumoSelecionado] = useState('');
  const [quantidadeUsada, setQuantidadeUsada] = useState('');

  useEffect(() => {
    if (isOpen) {
      async function carregarEstoque() {
        // Buscar apenas insumos que ainda tenham estoque sobrando
        const { data } = await supabase
          .from('compras_insumos')
          .select('id, nome_item, quantidade_restante, unidade_medida, categorias_insumo(nome)')
          .gt('quantidade_restante', 0)
          .order('data_compra', { ascending: false });

        if (data) setInsumosEstoque(data);
      }
      carregarEstoque();
    }
  }, [isOpen]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoSelecionado || !quantidadeUsada) return;
    
    setLoading(true);

    try {
      // O trigger no banco calculará o custo_absorvido e baixará a quantidade_restante da tabela compras_insumos automaticamente!
      const { error } = await supabase.from('lote_uso_insumos').insert({
        lote_plantio_id: loteId,
        compra_insumo_id: insumoSelecionado,
        quantidade_usada: parseFloat(quantidadeUsada)
      });

      if (error) throw error;
      
      alert('Insumo aplicado com sucesso e saldo abatido!');
      setIsOpen(false);
      setInsumoSelecionado('');
      setQuantidadeUsada('');
      router.refresh();
      
    } catch (err: any) {
      alert(`Erro no registro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getUnidadeParaInsumo = () => {
    const insumo = insumosEstoque.find(i => i.id === insumoSelecionado);
    return insumo ? insumo.unidade_medida : '';
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-surface-container-high text-primary flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold hover:bg-surface-container-highest transition mt-4 shadow-sm border border-surface-container-highest"
      >
        <Beaker size={20} />
        Aplicar Insumo / Adubo no Lote
      </button>

      {/* Modal / Bottom Sheet Simulado */}
      {isOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl slide-up-animation">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface">O que aplicou na planta?</h3>
              <button onClick={() => setIsOpen(false)} className="bg-surface-container-high p-2 rounded-full text-secondary"><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Selecione o Item do Estoque</label>
                <select 
                  required 
                  value={insumoSelecionado} 
                  onChange={(e) => setInsumoSelecionado(e.target.value)} 
                  className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none"
                >
                  <option value="" className="text-secondary">Escolha um item...</option>
                  {insumosEstoque.map(i => (
                    <option key={i.id} value={i.id} className="text-on-surface font-medium bg-surface">
                      {i.nome_item} ({i.quantidade_restante} {i.unidade_medida} disp.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Quantidade Utilizada</label>
                <div className="relative">
                  <input 
                    required 
                    disabled={!insumoSelecionado}
                    type="number" 
                    step="0.01" 
                    value={quantidadeUsada} 
                    onChange={(e) => setQuantidadeUsada(e.target.value)} 
                    placeholder="Ex: 5" 
                    className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none disabled:opacity-50 disabled:bg-surface-container-lowest"
                  />
                  {insumoSelecionado && (
                    <span className="absolute right-4 top-3.5 text-secondary font-medium">{getUnidadeParaInsumo()}</span>
                  )}
                </div>
              </div>

              <button disabled={loadding || !insumoSelecionado} type="submit" className="w-full mt-4 bg-primary text-on-primary font-bold px-6 py-4 rounded-xl shadow-md transition disabled:opacity-50">
                {loadding ? 'Aguarde...' : 'Baixar Estoque e Precificar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
