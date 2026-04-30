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
  const [plantasVenda, setPlantasVenda] = useState<any[]>([]);
  const [tab, setTab] = useState<'insumos' | 'venda'>('insumos');
  const [moeda, setMoeda] = useState('COP');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: configData } = await supabase.from('configuracoes').select('*').limit(1);
    if (configData && configData.length > 0) setMoeda(configData[0].moeda_padrao || 'COP');

    const [resInsumos, resPlantas] = await Promise.all([
      supabase.from('compras_insumos').select('*, fornecedores(nome_fantasia), categorias_insumo(nome)').order('data_compra', { ascending: false }),
      supabase.from('lotes_plantio').select('*, especie:especies(*)').gt('quantidade_restante', 0).order('updated_at', { ascending: false })
    ]);
    
    if (resInsumos.data) setInsumos(resInsumos.data);
    if (resPlantas.data) setPlantasVenda(resPlantas.data);
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
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 pt-4 pb-0 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 hover:bg-surface-container rounded-full transition">
              <ArrowLeft size={24} className="text-secondary" />
            </button>
            <div>
              <h1 className="text-lg font-black text-on-surface leading-tight">Inventário Central</h1>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Gestão Multicanal de Estoque</p>
            </div>
          </div>
          <Link href={tab === 'insumos' ? "/admin/compras/nova" : "/admin/pdv"} className="p-3 bg-[#064E3B] text-white rounded-2xl shadow-lg active:scale-95 transition flex items-center gap-2">
            <Plus size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Adicionar</span>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-8 px-2">
          <button 
            onClick={() => setTab('insumos')}
            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${tab === 'insumos' ? 'border-[#064E3B] text-[#064E3B]' : 'border-transparent text-gray-400'}`}
          >
            Suprimentos & Insumos
          </button>
          <button 
            onClick={() => setTab('venda')}
            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${tab === 'venda' ? 'border-[#064E3B] text-[#064E3B]' : 'border-transparent text-gray-400'}`}
          >
            Plantas (Venda PDV)
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        
        {/* Sumário Rápido */}
        <section className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          <div className="min-w-[160px] bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Total no Inventário</span>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-black text-[#064E3B]">{tab === 'insumos' ? insumos.length : plantasVenda.length}</div>
              <span className="text-[10px] font-bold text-gray-400 mb-1">UNIDADES</span>
            </div>
          </div>
          
          {tab === 'insumos' ? Object.entries(saldoPorCategoria).map(([categoria, saldo]) => (
            <div key={categoria} className="min-w-[150px] bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate mr-1">{categoria}</span>
                {getIconForCategoria(categoria)}
              </div>
              <div className="text-2xl font-black text-on-surface">{(saldo as number).toLocaleString()}</div>
            </div>
          )) : (
            <div className="min-w-[160px] bg-[#064E3B]/5 p-5 rounded-[2.5rem] border border-[#064E3B]/10 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-black text-[#064E3B] uppercase tracking-widest mb-4">Valor Estimado</span>
              <div className="text-xl font-black text-[#064E3B]">
                {formatadorMoeda.format(plantasVenda.reduce((acc, curr) => acc + (Number(curr.preco_venda_estimado || 0) * Number(curr.quantidade_restante || 0)), 0))}
              </div>
            </div>
          )}
        </section>

        {/* Lista de Itens */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {tab === 'insumos' ? 'Itens de Produção' : 'Catálogo de Venda'}
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <button className="text-[#064E3B] text-[10px] font-bold uppercase tracking-widest">Filtrar</button>
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 text-center text-secondary animate-pulse font-bold">Sincronizando inventário...</div>
          ) : tab === 'insumos' ? (
            <div className="space-y-3">
              {insumos.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-[#064E3B]/30 transition group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-50 p-4 rounded-3xl group-hover:bg-[#064E3B]/5 transition">
                        {getIconForCategoria(item.categorias_insumo?.nome || '')}
                      </div>
                      <div>
                        <h3 className="font-black text-on-surface text-base leading-tight">{item.nome_item}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {item.categorias_insumo?.nome} • {item.fornecedores?.nome_fantasia}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#064E3B]">{item.quantidade_restante}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase">{item.unidade_medida}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold">{new Date(item.data_compra).toLocaleDateString('es-CO')}</span>
                    </div>
                    <div className="text-[11px] font-black text-on-surface">
                       Custo: <span className="text-[#064E3B]">{formatadorMoeda.format(item.custo_unitario)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {plantasVenda.map((lote) => (
                <div key={lote.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-[#064E3B]/30 transition group flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center">
                        {lote.especie?.url_foto ? (
                          <img src={lote.especie.url_foto} alt={lote.identificacao_lote} className="w-full h-full object-cover" />
                        ) : (
                          <Leaf className="text-gray-300 w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-on-surface text-base leading-tight">{lote.identificacao_lote}</h3>
                        <p className="text-[10px] font-bold text-[#064E3B] uppercase tracking-widest mt-1">
                          {lote.especie?.nome}
                        </p>
                        <div className={`mt-2 inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${lote.status === 'ponto_de_venda' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {lote.status === 'ponto_de_venda' ? 'No PDV' : 'Em Estoque'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#064E3B]">{lote.quantidade_restante}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase">Plantas</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 pt-4 border-t border-gray-50">
                    <div className="text-[11px] font-bold text-gray-400">
                      Preço sugerido: <span className="text-on-surface font-black">{formatadorMoeda.format(lote.preco_venda_estimado || 0)}</span>
                    </div>
                    <Link href={`/admin/lotes/${lote.id}`} className="p-2 hover:bg-gray-100 rounded-xl transition">
                       <ChevronRight size={18} className="text-gray-300" />
                    </Link>
                  </div>
                </div>
              ))}
              {plantasVenda.length === 0 && (
                <div className="bg-gray-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-100">
                   <Package className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                   <p className="text-sm font-bold text-gray-400">Nenhuma planta disponível para venda.</p>
                </div>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
