'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  DollarSign
} from 'lucide-react';

export default function VendasCentralizadas() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);

  useEffect(() => {
    carregarPedidos();
  }, []);

  async function carregarPedidos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos_venda')
        .select('*, lote:lotes_plantio(id, identificacao_lote, especie:especies(nome))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recebido': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'separado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'empacotado': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'enviado': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'entregue': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat.toLowerCase()) {
      case 'mercadolivre': return <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">ML</span>;
      case 'loja': return <span className="bg-primary text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">Loja</span>;
      case 'facebook': return <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">FB</span>;
      default: return <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{plat.substring(0,2)}</span>;
    }
  };

  const avancarStatus = async (pedido: any) => {
    const flux = ['recebido', 'separado', 'empacotado', 'enviado', 'entregue'];
    const idx = flux.indexOf(pedido.status_fulfillment);
    if (idx < flux.length - 1) {
      const novoStatus = flux[idx + 1];
      try {
        const { error } = await supabase
          .from('pedidos_venda')
          .update({ status_fulfillment: novoStatus })
          .eq('id', pedido.id);
        
        if (error) throw error;
        carregarPedidos();
        if (pedidoSelecionado?.id === pedido.id) {
          setPedidoSelecionado({ ...pedidoSelecionado, status_fulfillment: novoStatus });
        }
      } catch (err) {
        alert('Erro ao atualizar status');
      }
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const matchStatus = filtroStatus === 'todos' || p.status_fulfillment === filtroStatus;
    const matchBusca = p.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) || 
                      p.id_pedido_externo?.includes(busca) ||
                      p.lote?.especie?.nome?.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <ShoppingBag className="text-primary" size={32} /> Central de Vendas
          </h1>
          <p className="text-secondary font-medium">Gestão multicanal e fulfillment de pedidos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition" size={18} />
            <input 
              type="text" 
              placeholder="Buscar pedido, cliente ou planta..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-surface-container-low border border-surface-container-highest text-on-surface rounded-2xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-80 transition"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {['todos', 'recebido', 'separado', 'empacotado', 'enviado', 'entregue'].map(s => (
          <button 
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold border transition whitespace-nowrap ${filtroStatus === s ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-surface text-secondary border-surface-container-highest hover:bg-surface-container-low'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-surface-container animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="bg-surface-container w-20 h-20 rounded-full flex items-center justify-center mx-auto text-secondary">
                <AlertCircle size={40} />
              </div>
              <p className="text-secondary font-bold">Nenhum pedido encontrado com estes filtros.</p>
            </div>
          )}

          {pedidosFiltrados.map(p => (
            <div 
              key={p.id} 
              onClick={() => setPedidoSelecionado(p)}
              className="bg-surface-container-lowest border border-surface-container-highest rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(p.plataforma)}
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">#{p.id_pedido_externo || p.id.substring(0,8)}</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getStatusColor(p.status_fulfillment)}`}>
                  {p.status_fulfillment}
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-bold text-on-surface line-clamp-1">{p.cliente?.nome || 'Cliente não identificado'}</h3>
                <p className="text-xs font-bold text-primary flex items-center gap-1">
                  <Leaf size={12} /> {p.lote?.especie?.nome || 'Lote Misto'} ({p.lote?.identificacao_lote})
                </p>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-surface-container-highest">
                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase">Valor Total</p>
                  <p className="text-xl font-black text-on-surface">{formatCOP(p.valor_total)}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); avancarStatus(p); }}
                  disabled={p.status_fulfillment === 'entregue'}
                  className="bg-surface-container-high p-2.5 rounded-xl text-primary hover:bg-primary hover:text-white transition disabled:opacity-0"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-surface-container-highest animate-slide-up">
            <div className="bg-surface-container-low p-6 border-b border-surface-container-highest flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getPlatformIcon(pedidoSelecionado.plataforma)}
                  <h3 className="text-lg font-bold text-on-surface">Pedido #{pedidoSelecionado.id_pedido_externo || pedidoSelecionado.id.substring(0,8)}</h3>
                </div>
                <p className="text-xs text-secondary font-medium">Realizado em {new Date(pedidoSelecionado.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setPedidoSelecionado(null)} className="p-2 hover:bg-surface-container rounded-full text-secondary transition">
                <AlertCircle className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Cliente Info */}
                <section>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User size={14} /> Dados do Cliente
                  </h4>
                  <div className="bg-surface-container-low p-4 rounded-2xl space-y-2 border border-surface-container-highest">
                    <p className="font-bold text-on-surface">{pedidoSelecionado.cliente?.nome}</p>
                    <p className="text-sm text-secondary">{pedidoSelecionado.cliente?.email}</p>
                    <p className="text-sm text-secondary">{pedidoSelecionado.cliente?.telefone}</p>
                  </div>
                </section>

                {/* Entrega Info */}
                <section>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Endereço de Entrega
                  </h4>
                  <div className="bg-surface-container-low p-4 rounded-2xl text-sm text-secondary leading-relaxed border border-surface-container-highest">
                    <p>{pedidoSelecionado.cliente?.endereco?.address_line}</p>
                    <p>{pedidoSelecionado.cliente?.endereco?.city_name}, {pedidoSelecionado.cliente?.endereco?.state_name}</p>
                    <p>CEP: {pedidoSelecionado.cliente?.endereco?.zip_code}</p>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* Resumo da Venda */}
                <section>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShoppingBag size={14} /> Itens e Pagamento
                  </h4>
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-secondary">Preço Total</span>
                      <span className="text-xl font-black text-primary">{formatCOP(pedidoSelecionado.valor_total)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-primary/10">
                      <span className="text-sm font-medium text-secondary">Status Pagto.</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${pedidoSelecionado.status_pagamento === 'pago' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {pedidoSelecionado.status_pagamento}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Fulfillment Control */}
                <section>
                  <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package size={14} /> Esteira de Fulfillment
                  </h4>
                  <div className="space-y-3">
                    {['recebido', 'separado', 'empacotado', 'enviado', 'entregue'].map((step, i) => {
                      const flux = ['recebido', 'separado', 'empacotado', 'enviado', 'entregue'];
                      const currentIdx = flux.indexOf(pedidoSelecionado.status_fulfillment);
                      const isPast = i < currentIdx;
                      const isCurrent = i === currentIdx;

                      return (
                        <div key={step} className={`flex items-center gap-3 p-3 rounded-xl border transition ${isCurrent ? 'bg-white border-primary shadow-md' : isPast ? 'bg-surface-container-low border-green-200' : 'bg-surface-container-lowest border-surface-container opacity-50'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPast ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-white' : 'bg-surface-container-highest text-secondary'}`}>
                            {isPast ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          </div>
                          <span className={`text-sm font-bold capitalize ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low border-t border-surface-container-highest flex gap-4">
              <button 
                onClick={() => setPedidoSelecionado(null)}
                className="flex-1 py-3 bg-surface text-on-surface border border-surface-container-highest rounded-2xl font-bold hover:bg-surface-container-high transition"
              >
                Fechar
              </button>
              <button 
                onClick={() => avancarStatus(pedidoSelecionado)}
                disabled={pedidoSelecionado.status_fulfillment === 'entregue'}
                className="flex-1 py-3 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition disabled:opacity-0"
              >
                Avançar Etapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Leaf(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}
