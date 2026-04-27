'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Leaf, DollarSign, AlertCircle, ShoppingBag, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [lotes1, setLotes1] = useState<any[]>([]); // Crescimento
  const [lotes2, setLotes2] = useState<any[]>([]); // Prontos para Venda
  
  const [estoqueValor, setEstoqueValor] = useState(0);
  const [custoEnterrado, setCustoEnterrado] = useState(0);
  const [vendaProjetada, setVendaProjetada] = useState(0);
  const [insumosCriticos, setInsumosCriticos] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Financeiro Estoque
      const { data: insumos } = await supabase.from('compras_insumos').select('quantidade_restante, quantidade_comprada, custo_total');
      let valorParado = 0;
      let alertasCard = 0;
      if (insumos) {
        insumos.forEach(i => {
          const c_unit = i.quantidade_comprada > 0 ? (Number(i.custo_total) / Number(i.quantidade_comprada)) : 0;
          valorParado += Number(i.quantidade_restante) * c_unit;
          if (Number(i.quantidade_restante) <= 5) alertasCard++; // Simples threshold genérico
        });
      }
      setEstoqueValor(valorParado);
      setInsumosCriticos(alertasCard);

      // 2. Lotes e Pipeline
      const { data: lotes } = await supabase.from('lotes_plantio')
        .select('*, especie:especies(nome)')
        .order('data_plantio', { ascending: false });

      if (lotes) {
        let custoAbsorvido = 0;
        let vProjetada = 0;
        const f1: any[] = [];
        const f2: any[] = [];

        lotes.forEach(L => {
          // Lotes não finais/perdidos
          if (L.status !== 'esgotado_vendido' && L.status !== 'perda_obito') {
             custoAbsorvido += Number(L.custo_acumulado || 0);
             vProjetada += Number(L.preco_venda_estimado || 0);
          }

          if (L.status === 'germinando' || L.status === 'em_crescimento') {
            f1.push(L);
          } else if (L.status === 'ponto_de_venda') {
            f2.push(L);
          }
        });

        setCustoEnterrado(custoAbsorvido);
        setVendaProjetada(vProjetada);
        setLotes1(f1);
        setLotes2(f2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const getDiasParaFloracao = (lote: any) => {
    if (!lote.data_floracao_estimada) return '?';
    const hj = new Date().getTime();
    const flor = new Date(lote.data_floracao_estimada).getTime();
    const diff = Math.ceil((flor - hj) / (1000 * 3600 * 24));
    return diff > 0 ? `Faltam ${diff} dias` : 'No ponto!';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Painel de Negócios</h1>
          <p className="text-secondary mt-1">Resumo gerencial e esteira comercial da estufa.</p>
        </div>
        <button onClick={carregarDados} className="text-sm bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-xl text-on-surface transition">
          Atualizar Dados
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse h-32 bg-surface-container rounded-2xl"></div>
      ) : (
        <>
          {/* Top Cards (Financeiro) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest">
              <div className="flex items-center gap-3 text-secondary mb-2">
                <Leaf size={20} className="text-primary" /> 
                <h3 className="font-medium text-sm">Capital em Estoque</h3>
              </div>
              <p className="text-3xl font-bold text-on-surface">{formatCOP(estoqueValor)}</p>
              <p className="text-xs text-secondary mt-2 border-t border-surface-container-highest pt-2">Insumos não consumidos</p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest">
              <div className="flex items-center gap-3 text-secondary mb-2">
                <AlertCircle size={20} className="text-error" /> 
                <h3 className="font-medium text-sm">Alerta de Insumos</h3>
              </div>
              <p className="text-3xl font-bold text-on-surface">{insumosCriticos} <span className="text-lg">críticos</span></p>
              <p className="text-xs text-secondary mt-2 border-t border-surface-container-highest pt-2">Estoque menor que 5</p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest">
              <div className="flex items-center gap-3 text-secondary mb-2">
                <ShoppingBag size={20} className="text-amber-500" /> 
                <h3 className="font-medium text-sm">Custo Absorvido (Campo)</h3>
              </div>
              <p className="text-3xl font-bold text-on-surface">{formatCOP(custoEnterrado)}</p>
              <p className="text-xs text-secondary mt-2 border-t border-surface-container-highest pt-2">Dinheiro vivo dentro das plantas</p>
            </div>

            <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-3 text-primary mb-2">
                <DollarSign size={20} /> 
                <h3 className="font-medium text-sm">Receita Bruta Potencial</h3>
              </div>
              <p className="text-3xl font-bold text-primary">{formatCOP(vendaProjetada)}</p>
              <p className="text-xs text-primary/70 mt-2 border-t border-primary/10 pt-2">Se vender lotes pelo preço base</p>
            </div>
          </div>

          {/* Pipeline Kanban */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-on-surface">Esteira Comercial</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Coluna 1: Fase de Crescimento */}
              <div className="bg-surface-container-lowest border border-surface-container rounded-3xl p-6 flex flex-col h-[600px]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-container-highest">
                  <div className="p-3 bg-surface-container-highest rounded-xl text-secondary">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">🌱 Fase 1: Crescimento</h3>
                    <p className="text-sm text-secondary">Lotes em desenvolvimento biológico</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {lotes1.length === 0 && <p className="text-secondary text-sm text-center">Nenhum lote aqui.</p>}
                  {lotes1.map(l => (
                    <div key={l.id} className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-highest hover:border-primary/30 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-on-surface">{l.especie?.nome || 'Desconhecida'}</h4>
                        <span className="text-xs bg-surface-container py-1 px-2 rounded-lg font-medium">#{l.id.substring(0,6)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-secondary mb-3">
                        <span>Plantio: {new Date(l.data_plantio).toLocaleDateString()}</span>
                        <span>{getDiasParaFloracao(l)}</span>
                      </div>
                      <div className="pt-3 border-t border-surface-container flex justify-between items-center">
                        <span className="text-xs font-medium text-secondary">Custo Rateado:</span>
                        <span className="text-sm font-bold text-amber-500">{formatCOP(l.custo_acumulado)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna 2: Prontas para Venda */}
              <div className="bg-surface-container-lowest border-2 border-primary/20 rounded-3xl p-6 flex flex-col h-[600px] shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/10">
                  <div className="p-3 bg-primary text-on-primary rounded-xl shadow-sm">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">🌻 Fase 2: Ponto de Venda</h3>
                    <p className="text-sm text-secondary">Estoque vivo pronto para mercado</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {lotes2.length === 0 && <p className="text-secondary text-sm text-center">Nenhum lote pronto para venda agora.</p>}
                  {lotes2.map(l => {
                    const ints = l.integracoes || {};
                    return (
                    <div key={l.id} className="bg-surface border border-primary/20 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
                      {/* Faixa decorativa */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                      
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg text-primary">{l.especie?.nome || 'Desconhecida'}</h4>
                        <span className="text-xs bg-primary/10 text-primary py-1 px-2 rounded-lg font-bold">{l.quantidade_plantada} Mudas</span>
                      </div>
                      
                      {/* Finanças do Produto Final */}
                      <div className="bg-surface-container-lowest rounded-xl p-3 mt-3 mb-4 grid grid-cols-2 gap-2 border border-surface-container-highest">
                        <div>
                          <p className="text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">Custo Total</p>
                          <p className="font-medium text-error">{formatCOP(l.custo_acumulado)}</p>
                        </div>
                        <div className="border-l border-surface-container pl-2">
                          <p className="text-[10px] uppercase text-secondary font-bold tracking-wider mb-1">Preço Venda (Alvo)</p>
                          <p className="font-bold text-primary">{formatCOP(l.preco_venda_estimado)}</p>
                        </div>
                      </div>

                      {/* Canais de Venda (Badges) */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                           <span title="MercadoLivre" className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${ints.mercadolivre ? 'bg-yellow-300 text-black shadow' : 'bg-surface-container-highest text-secondary opacity-50 grayscale'}`}>ML</span>
                           <span title="OLX" className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${ints.olx ? 'bg-purple-600 text-white shadow' : 'bg-surface-container-highest text-secondary opacity-50 grayscale'}`}>OLX</span>
                        </div>
                        <Link href={`/admin/lotes/${l.id}`} className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/70 transition">
                          Gerenciar <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
