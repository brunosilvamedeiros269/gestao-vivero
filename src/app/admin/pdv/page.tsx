'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingCart, 
  Search, 
  UserPlus, 
  Scan, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Printer, 
  CheckCircle2, 
  X,
  User,
  Ticket,
  ChevronRight,
  Leaf
} from 'lucide-react';
import ScannerQR from '@/components/ScannerQR';

export default function PDVPage() {
  // Estados de Dados
  const [lotes, setLotes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados da Venda
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [descontoGeral, setDescontoGeral] = useState(0);
  
  // Modais e UI
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState<any>(null);
  const [metodoPagamento, setMetodoPagamento] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resLotes, resClientes, resConfig] = await Promise.all([
        supabase.from('lotes_plantio').select('*, especie:especies(nome, foto_url)').gt('quantidade_restante', 0),
        supabase.from('clientes').select('*'),
        supabase.from('configuracoes').select('*').order('created_at', { ascending: false }).limit(1)
      ]);

      setLotes(resLotes.data || []);
      setClientes(resClientes.data || []);
      
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

  // Lógica do Carrinho
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
        desconto: 0, 
        preco_unitario: lote.preco_venda_estimado || 10000 
      }]);
    }
    setBuscaProduto('');
  };

  const removerDoCarrinho = (id: string) => setCarrinho(carrinho.filter(item => item.id !== id));

  const atualizarQuantidade = (id: string, delta: number) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id) {
        const novaQtd = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: novaQtd };
      }
      return item;
    }));
  };

  const calcularSubtotal = () => carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
  const calcularTotal = () => {
    const sub = calcularSubtotal();
    return sub - (sub * (descontoGeral / 100));
  };

  // Finalização
  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0) return alert('Carrinho vazio!');
    if (!metodoPagamento) return alert('Selecione um método de pagamento');

    try {
      const total = calcularTotal();
      const payload = {
        plataforma: 'loja',
        cliente: clienteSelecionado || { nome: 'Consumidor Final' },
        valor_total: total,
        status_pagamento: 'pago',
        status_fulfillment: 'entregue',
        metodo_pagamento: metodoPagamento,
        items: carrinho.map(i => ({
          lote_id: i.id,
          nome: i.especie?.nome,
          quantidade: i.quantidade,
          preco: i.preco_unitario
        }))
      };

      // 1. Criar pedido
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos_venda')
        .insert([payload])
        .select()
        .single();

      if (errorPedido) throw errorPedido;

      // 2. Abater estoque
      for (const item of carrinho) {
        const { error: errorStock } = await supabase.rpc('abater_estoque_lote', {
          lote_id_param: item.id,
          qtd_param: item.quantidade
        });
        if (errorStock) console.error('Erro ao abater estoque do lote:', item.id, errorStock);
      }

      setPedidoFinalizado(pedido);
      setShowCheckout(false);
      setShowReceipt(true);
      setCarrinho([]);
      setClienteSelecionado(null);
      setMetodoPagamento('');
      setDescontoGeral(0);
      carregarDados(); // Recarrega estoques

    } catch (err) {
      alert('Erro ao finalizar venda. Verifique os logs.');
    }
  };

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (loading) return <div className="p-8 animate-pulse text-secondary">Iniciando PDV...</div>;

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      
      {/* Coluna Esquerda: Catálogo e Busca */}
      <div className="flex-1 flex flex-col border-r border-surface-container-highest">
        <header className="p-6 bg-surface-container-lowest border-b border-surface-container-highest flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input 
              type="text" 
              placeholder="Buscar planta, lote ou SKU..." 
              value={buscaProduto}
              onChange={e => setBuscaProduto(e.target.value)}
              className="w-full bg-surface-container-high rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition text-lg"
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-primary text-on-primary p-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition active:scale-95"
          >
            <Scan size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-surface-container-lowest/30">
          {lotes.filter(l => 
            l.especie?.nome.toLowerCase().includes(buscaProduto.toLowerCase()) || 
            l.identificacao_lote.toLowerCase().includes(buscaProduto.toLowerCase())
          ).map(lote => (
            <div 
              key={lote.id} 
              onClick={() => adicionarAoCarrinho(lote)}
              className="bg-white border border-surface-container-highest rounded-3xl p-4 cursor-pointer hover:shadow-xl hover:border-primary/30 transition group overflow-hidden relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-surface-container relative">
                {lote.especie?.foto_url ? (
                  <img src={lote.especie.foto_url} alt={lote.especie.nome} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary"><Leaf size={32} /></div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                  {lote.quantidade_restante} un
                </div>
              </div>
              <h3 className="font-bold text-on-surface line-clamp-1 text-sm">{lote.especie?.nome}</h3>
              <p className="text-[10px] text-secondary font-medium mb-2 uppercase tracking-tighter">Lote: {lote.identificacao_lote}</p>
              <p className="text-primary font-black text-lg">{formatCOP(lote.preco_venda_estimado || 10000)}</p>
              
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                 <div className="bg-primary text-on-primary p-2 rounded-full shadow-lg"><Plus size={24} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna Direita: Carrinho */}
      <div className="w-[450px] bg-white flex flex-col shadow-2xl z-10">
        <header className="p-6 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-xl font-black text-on-surface flex items-center gap-2">
            <ShoppingCart className="text-primary" /> Carrinho
          </h2>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{carrinho.length} itens</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carrinho.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50 space-y-4">
              <ShoppingCart size={64} strokeWidth={1} />
              <p className="font-bold">O carrinho está vazio</p>
            </div>
          ) : (
            carrinho.map(item => (
              <div key={item.id} className="flex gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-surface-container group animate-slide-up">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
                  <img src={item.especie?.foto_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-on-surface truncate">{item.especie?.nome}</h4>
                  <p className="text-[10px] text-secondary mb-2">{formatCOP(item.preco_unitario)} / un</p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-surface-container rounded-lg px-2">
                      <button onClick={() => atualizarQuantidade(item.id, -1)} className="p-1 hover:text-primary transition"><Minus size={14} /></button>
                      <span className="w-8 text-center text-xs font-black">{item.quantidade}</span>
                      <button onClick={() => atualizarQuantidade(item.id, 1)} className="p-1 hover:text-primary transition"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removerDoCarrinho(item.id)} className="text-error opacity-0 group-hover:opacity-100 transition p-1"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-on-surface text-sm">{formatCOP(item.preco_unitario * item.quantidade)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Carrinho */}
        <div className="p-6 bg-surface-container-low border-t border-surface-container-highest space-y-4">
          
          {/* Cliente Quick Selection */}
          <div className="relative">
            {clienteSelecionado ? (
              <div className="bg-primary/10 p-3 rounded-2xl flex items-center justify-between border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-on-primary p-2 rounded-full"><User size={16} /></div>
                  <div>
                    <p className="text-xs font-black text-primary truncate">{clienteSelecionado.nome}</p>
                    <p className="text-[10px] text-secondary">{clienteSelecionado.whatsapp || 'Sem contato'}</p>
                  </div>
                </div>
                <button onClick={() => setClienteSelecionado(null)}><X size={16} className="text-secondary" /></button>
              </div>
            ) : (
              <div className="relative group">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                <input 
                  type="text" 
                  placeholder="Vincular cliente..." 
                  value={buscaCliente}
                  onChange={e => setBuscaCliente(e.target.value)}
                  className="w-full bg-white border border-surface-container rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
                />
                {buscaCliente && (
                  <div className="absolute bottom-full left-0 w-full bg-white shadow-2xl rounded-2xl border border-surface-container p-2 max-h-40 overflow-y-auto mb-2 z-50">
                    {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
                      <div key={c.id} onClick={() => { setClienteSelecionado(c); setBuscaCliente(''); }} className="p-3 hover:bg-primary/10 rounded-xl cursor-pointer transition flex justify-between items-center group">
                        <div>
                          <p className="text-sm font-bold">{c.nome}</p>
                          <p className="text-[10px] text-secondary">{c.whatsapp}</p>
                        </div>
                        <ChevronRight size={16} className="text-secondary group-hover:text-primary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-secondary font-medium">Subtotal</span>
              <span className="font-bold text-on-surface">{formatCOP(calcularSubtotal())}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                <Ticket size={16} /> Desconto (%)
              </div>
              <input 
                type="number" 
                max={config?.desconto_maximo}
                value={descontoGeral}
                onChange={e => setDescontoGeral(Math.min(config?.desconto_maximo, parseFloat(e.target.value) || 0))}
                className="w-16 bg-white border border-surface-container rounded-lg px-2 py-1 text-xs text-right font-black outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-surface-container-highest">
              <span className="text-lg font-black text-on-surface">Total</span>
              <span className="text-2xl font-black text-primary">{formatCOP(calcularTotal())}</span>
            </div>
          </div>

          <button 
            disabled={carrinho.length === 0}
            onClick={() => setShowCheckout(true)}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            Finalizar Compra <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Modal Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-[40px] shadow-2xl p-8 border border-surface-container-highest animate-slide-up">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-on-surface">Método de Pago</h3>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-surface-container rounded-full transition"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {config?.metodos_pagamento.map((metodo: string) => (
                <button 
                  key={metodo}
                  onClick={() => setMetodoPagamento(metodo)}
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition gap-3 ${metodoPagamento === metodo ? 'border-primary bg-primary/5 text-primary' : 'border-surface-container-highest bg-surface hover:bg-surface-container-low'}`}
                >
                  {metodo === 'efectivo' && <Banknote size={32} />}
                  {(metodo === 'nequi' || metodo === 'daviplata') && <Smartphone size={32} />}
                  {metodo === 'tarjeta' && <CreditCard size={32} />}
                  {metodo === 'transfiya' && <Smartphone size={32} className="text-purple-600" />}
                  <span className="font-bold text-sm capitalize">{metodo}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleFinalizarVenda}
              className="w-full py-5 bg-primary text-on-primary rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 hover:bg-primary/90 transition flex items-center justify-center gap-3"
            >
              Confirmar Pago <CheckCircle2 size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Recibo (Simulado) */}
      {showReceipt && pedidoFinalizado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-surface-container-highest animate-slide-up flex flex-col items-center">
            <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl font-black text-on-surface mb-1">¡Venta Exitosa!</h3>
            <p className="text-sm text-secondary mb-6 text-center">O estoque foi atualizado e o pedido registrado.</p>

            {/* Simulação de Recibo Térmico */}
            <div className="w-full bg-surface-container-lowest p-6 rounded-2xl border-2 border-dashed border-surface-container-highest text-[12px] font-mono space-y-4 mb-6">
              <div className="text-center border-b border-surface-container pb-4">
                <p className="font-bold text-sm uppercase">Gstão Vivero - PDV</p>
                <p>Nit: 900.XXX.XXX-X</p>
                <p>{new Date().toLocaleString()}</p>
              </div>
              
              <div className="space-y-2">
                {pedidoFinalizado.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{it.quantidade}x {it.nome}</span>
                    <span>{formatCOP(it.preco * it.quantidade)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-surface-container pt-4 space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL</span>
                  <span>{formatCOP(pedidoFinalizado.valor_total)}</span>
                </div>
                <div className="flex justify-between opacity-70">
                  <span>Pago: {pedidoFinalizado.metodo_pagamento}</span>
                </div>
              </div>

              <div className="text-center pt-4 opacity-50 text-[10px]">
                <p>¡Gracias por su compra!</p>
                <p>Software by Antigravity</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => window.print()} className="flex items-center justify-center gap-2 py-3 bg-surface border border-surface-container-highest rounded-xl font-bold hover:bg-surface-container-low transition">
                <Printer size={18} /> {config?.tipo_impressora === 'termica' ? 'Térmica' : 'A4'}
              </button>
              <button onClick={() => setShowReceipt(false)} className="py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Overlay */}
      {showScanner && (
        <ScannerQR 
          onScan={(code) => {
            const loteEncontrado = lotes.find(l => l.identificacao_lote === code || l.id === code);
            if (loteEncontrado) {
              adicionarAoCarrinho(loteEncontrado);
              setShowScanner(false);
            } else {
              alert('Lote não encontrado: ' + code);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
