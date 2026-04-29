'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Filter, Plus, Truck, Leaf, Beaker, ArrowLeft, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EstoqueAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [moeda, setMoeda] = useState('BRL');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: configData } = await supabase.from('configuracoes').select('*').limit(1);
    if (configData && configData.length > 0) setMoeda(configData[0].moeda_padrao || 'BRL');

    const { data } = await supabase
      .from('compras_insumos')
      .select(`
        *,
        fornecedores(nome_fantasia),
        categorias_insumo(nome)
      `)
      .order('data_compra', { ascending: false });
    
    if (data) setInsumos(data);
    setLoading(false);
  }

  const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda,
    minimumFractionDigits: 0
  });

  const totalInsumos = insumos?.length || 0;
  
  const saldoPorCategoria: Record<string, number> = insumos?.reduce((acc: Record<string, number>, curr: any) => {
    const cat = curr.categorias_insumo?.nome || 'Outros';
    acc[cat] = (acc[cat] || 0) + (Number(curr.quantidade_restante) || 0);
    return acc;
  }, {}) || {};

  const getIconForCategoria = (catName: string) => {
    if (catName.toLowerCase().includes('semente')) return <Leaf className="w-5 h-5 text-primary" />;
    if (catName.toLowerCase().includes('fungicida') || catName.toLowerCase().includes('controle')) return <Beaker className="w-5 h-5 text-tertiary" />;
    return <Package className="w-5 h-5 text-secondary" />;
  }

  return (
    <div className="bg-background min-h-screen text-on-surface pb-20">
      {/* Header App Style */}
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-surface-container rounded-full transition">
            <ArrowLeft size={24} className="text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-black text-on-surface leading-tight">Compras</h1>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Estoque e Suprimentos</p>
          </div>
        </div>
        <Link href="/admin/compras/nova" className="p-3 bg-primary text-on-primary rounded-2xl shadow-lg active:scale-95 transition">
          <Plus size={20} />
        </Link>
      </header>

      <main className="px-6 py-6 space-y-6">
        
        {/* Sumário Rápido (Horizontal Scroll em Mobile) */}
        <section className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          <div className="min-w-[140px] bg-surface-container-low p-4 rounded-3xl border border-surface-container shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-black text-secondary uppercase tracking-widest mb-2">Total Itens</span>
            <div className="text-2xl font-black text-primary">{totalInsumos}</div>
          </div>
          
          {Object.entries(saldoPorCategoria).map(([categoria, saldo]) => (
            <div key={categoria} className="min-w-[140px] bg-surface-container-lowest p-4 rounded-3xl border border-surface-container shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start opacity-70 mb-2">
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest truncate mr-1">{categoria}</span>
                {getIconForCategoria(categoria)}
              </div>
              <div className="text-2xl font-black text-on-surface">{(saldo as number).toLocaleString()}</div>
            </div>
          ))}
        </section>

        {/* Lista de Insumos - Mobile Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-secondary uppercase tracking-widest">Itens em Estoque</h2>
            <button className="text-primary text-[10px] font-bold uppercase tracking-widest">Filtrar</button>
          </div>
          
          {loading ? (
            <div className="py-20 text-center text-secondary animate-pulse">Carregando estoque...</div>
          ) : insumos && insumos.length > 0 ? (
            <div className="space-y-3">
              {insumos.map((item) => (
                <div key={item.id} className="bg-surface-container-lowest p-5 rounded-[2rem] border border-surface-container shadow-sm hover:border-primary/30 transition flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-surface-container p-3 rounded-2xl">
                        {getIconForCategoria(item.categorias_insumo?.nome || '')}
                      </div>
                      <div>
                        <h3 className="font-black text-on-surface leading-tight">{item.nome_item}</h3>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{item.categorias_insumo?.nome} • {item.fornecedores?.nome_fantasia}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-primary">{item.quantidade_restante}</div>
                      <div className="text-[9px] font-black text-secondary uppercase">{item.unidade_medida}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-surface-container">
                    <div className="flex items-center gap-2 text-secondary">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold">{new Date(item.data_compra).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant justify-end">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="text-[10px] font-black">{formatadorMoeda.format(item.custo_unitario)} <span className="text-secondary font-normal">/{item.unidade_medida}</span></span>
                    </div>
                  </div>

                  {item.capacidade_substrato_vazao > 0 && (
                    <div className="bg-primary/5 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Capacidade por Unidade</span>
                      <span className="text-xs font-black text-primary">{item.capacidade_substrato_vazao} L/Kg</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-[2rem] p-12 text-center border-2 border-dashed border-surface-container">
              <Package className="w-12 h-12 mx-auto text-surface-container-highest mb-4" />
              <p className="text-sm font-bold text-secondary">Nenhum insumo em estoque.</p>
              <Link href="/admin/compras/nova" className="text-primary text-xs font-black uppercase mt-4 inline-block underline underline-offset-4">Adicionar agora</Link>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
