'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Scan, ShoppingCart, Plus, Minus, Trash2, X, ArrowLeft, 
  User, CheckCircle2, CreditCard, Banknote, Smartphone, ChevronRight
} from 'lucide-react';

interface PDVAppProps {
  onBack: () => void;
}

export default function PDVApp({ onBack }: PDVAppProps) {
  // Estados de Dados
  const [lotes, setLotes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados da Venda
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  
  // UI
  const [showCheckout, setShowCheckout] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resLotes, resClientes, resConfig, resCats] = await Promise.all([
        supabase.from('lotes_plantio').select('*, especie:especies(*)').gt('quantidade_restante', 0),
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('configuracoes').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('categorias_insumo').select('nome')
      ]);

      setLotes(resLotes.data || []);
      setClientes(resClientes.data || []);
      setCategorias([{ nome: 'Todas' }, ...(resCats.data || [])]);
      
      const configData = resConfig.data?.[0]?.api_keys || {};
      setConfig({
        tipo_impressora: configData.pdv_tipo_impressora || 'normal',
        desconto_maximo: parseFloat(configData.pdv_desconto_maximo) || 10,
        metodos_pagamento: configData.pdv_metodos_pagamento || ['efectivo', 'nequi', 'daviplata']
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  const adicionarAoCarrinho = (lote: any) => {
    const existe = carrinho.find(item => item.id === lote.id);
    if (existe) {
      setCarrinho(carrinho.map(item => 
        item.id === lote.id ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { 
        ...lote, 
        quantidade: 1, 
        preco_unitario: lote.preco_venda_estimado || 10000 
      }]);
    }
  };

  const calcularTotal = () => carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0 || !metodoPagamento) return;
    try {
      const total = calcularTotal();
      const payload = {
        plataforma: 'pdv_app',
        cliente: clienteSelecionado || { nome: 'Consumidor Final' },
        valor_total: total,
        status_pagamento: 'pago',
        status_fulfillment: 'entregue',
        metodo_pagamento: metodoPagamento,
        items_json: carrinho.map(i => ({
          lote_id: i.id,
          nome: i.especie?.nome,
          quantidade: i.quantidade,
          preco: i.preco_unitario
        }))
      };

      const { data: pedido, error: errorPedido } = await supabase.from('pedidos_venda').insert([payload]).select().single();
      if (errorPedido) throw errorPedido;

      for (const item of carrinho) {
        await supabase.from('itens_pedido').insert([{
          pedido_id: pedido.id,
          lote_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario
        }]);

        await supabase.rpc('abater_estoque_lote', { 
          lote_id_param: item.id, 
          qtd_param: item.quantidade 
        });
      }

      setShowCheckout(false);
      setCarrinho([]);
      setMetodoPagamento('');
      carregarDados();
      alert('Venda finalizada com sucesso!');
    } catch (err: any) {
      alert('Erro ao processar venda: ' + err.message);
    }
  };

  const lotesFiltrados = lotes.filter(l => {
    const searchMatch = l.especie?.nome?.toLowerCase().includes(buscaProduto.toLowerCase()) || 
                       l.codigo_lote?.toLowerCase().includes(buscaProduto.toLowerCase());
    const catMatch = filtroCategoria === 'Todas' || l.especie?.categoria === filtroCategoria;
    return searchMatch && catMatch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-secondary font-medium animate-pulse">Carregando catálogo...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest animate-in fade-in duration-500">
      {/* Header do PDV */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-surface-container">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Vendas Diretas</h2>
          <p className="text-xs text-secondary font-medium uppercase tracking-widest">Nursery POS</p>
        </div>
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full text-sm font-bold border border-surface-container">
            <User size={16} />
            {clienteSelecionado ? clienteSelecionado.nome : 'Consumidor Final'}
          </button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="px-6 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50" size={20} />
          <input 
            type="text" 
            placeholder="Buscar plantas..." 
            value={buscaProduto}
            onChange={e => setBuscaProduto(e.target.value)}
            className="w-full bg-surface-container-low rounded-[2rem] pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition text-lg font-medium"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categorias.map(cat => (
            <button 
              key={cat.nome}
              onClick={() => setFiltroCategoria(cat.nome)}
              className={`px-6 py-2 rounded-full whitespace-nowrap text-xs font-black uppercase tracking-widest transition ${filtroCategoria === cat.nome ? 'bg-primary text-white' : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'}`}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {lotesFiltrados.map(lote => (
            <div key={lote.id} className="group bg-surface-container-lowest rounded-[2.5rem] border border-surface-container overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
              <div className="aspect-square relative">
                <img 
                  src={lote.especie?.url_foto_comercial || 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=500'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  alt={lote.especie?.nome}
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                  {lote.quantidade_restante} UN
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm line-clamp-1">{lote.especie?.nome}</h3>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-primary font-black">{formatCOP(lote.preco_venda_estimado || 10000)}</p>
                  <button 
                    onClick={() => adicionarAoCarrinho(lote)}
                    className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition shadow-lg shadow-primary/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Carrinho Flutuante */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-50">
          <button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-[#064E3B] text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition group overflow-hidden relative"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShoppingCart size={24} />
              </div>
              <div className="text-left">
                <p className="font-black text-lg">{carrinho.reduce((acc, i) => acc + i.quantidade, 0)} Itens</p>
                <p className="text-xs opacity-70 uppercase font-bold tracking-widest">Toque para conferir</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-2xl font-black">{formatCOP(calcularTotal())}</p>
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-32 bg-white/5 skew-x-12 translate-x-16"></div>
          </button>
        </div>
      )}

      {/* Checkout Sheet (Modal) */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in slide-in-from-bottom duration-300">
          <div className="w-full bg-white rounded-t-[3rem] max-h-[90vh] flex flex-col">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-primary">Finalizar Venda</h3>
                <button onClick={() => setShowCheckout(false)} className="p-2 bg-surface-container rounded-full"><X /></button>
              </div>

              {/* Itens */}
              <div className="space-y-4 max-h-48 overflow-y-auto no-scrollbar">
                {carrinho.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white">
                        <img src={item.especie?.url_foto_comercial} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold">{item.especie?.nome}</p>
                        <p className="text-xs text-secondary">{formatCOP(item.preco_unitario)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setCarrinho(carrinho.filter(i => i.id !== item.id))} className="p-1 text-red-500"><Trash2 size={18} /></button>
                      <span className="font-black w-6 text-center">{item.quantidade}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Métodos de Pagamento */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-secondary">Forma de Pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {config?.metodos_pagamento?.map((metodo: string) => (
                    <button 
                      key={metodo}
                      onClick={() => setMetodoPagamento(metodo)}
                      className={`p-4 rounded-3xl border-2 transition flex flex-col items-center gap-2 ${metodoPagamento === metodo ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary/50'}`}
                    >
                      {metodo === 'efectivo' && <Banknote size={24} />}
                      {metodo === 'nequi' && <Smartphone size={24} />}
                      {metodo === 'daviplata' && <CreditCard size={24} />}
                      <span className="text-[10px] font-black uppercase">{metodo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão Final */}
              <button 
                onClick={handleFinalizarVenda}
                disabled={!metodoPagamento}
                className={`w-full py-6 rounded-full font-black text-xl transition flex items-center justify-center gap-3 ${metodoPagamento ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-surface-container text-secondary cursor-not-allowed'}`}
              >
                Confirmar {formatCOP(calcularTotal())}
                <CheckCircle2 size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
