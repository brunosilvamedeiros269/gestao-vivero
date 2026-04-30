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
  Leaf,
  Filter,
  UserCheck
} from 'lucide-react';
import ScannerQR from '@/components/ScannerQR';

// Cores do Design System "Botanical POS"
const COLORS = {
  primary: '#064E3B', // Deep Emerald
  secondary: '#059669', // Emerald
  accent: '#84A98C', // Sage
  background: '#F9FAFB',
  glass: 'rgba(255, 255, 255, 0.7)',
};

export default function PDVPage() {
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
  const [buscaCliente, setBuscaCliente] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [descontoGeral, setDescontoGeral] = useState(0);
  
  // Modais e UI
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState<any>(null);
  const [metodoPagamento, setMetodoPagamento] = useState('');

  // Novo Cliente Form
  const [novoCliente, setNovoCliente] = useState({ nome: '', whatsapp: '', email: '' });

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

  // Lógica de Carrinho
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

  const calcularSubtotal = () => carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);
  const calcularTotal = () => {
    const sub = calcularSubtotal();
    return sub - (sub * (descontoGeral / 100));
  };

  const handleCriarCliente = async () => {
    if (!novoCliente.nome) return;
    try {
      const { data, error } = await supabase.from('clientes').insert([novoCliente]).select().single();
      if (error) throw error;
      
      setClientes([data, ...clientes]);
      setClienteSelecionado(data);
      setShowNovoCliente(false);
      setNovoCliente({ nome: '', whatsapp: '', email: '' });
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      alert('Erro ao cadastrar cliente. Verifique a conexão.');
    }
  };

  const aplicarMascaraTelefone = (valor: string) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Formato Colômbia: +57 3XX XXX XXXX
    if (numeros.length <= 2) return `+57 ${numeros}`;
    if (numeros.length <= 5) return `+57 ${numeros.slice(0, 3)} ${numeros.slice(3)}`;
    if (numeros.length <= 8) return `+57 ${numeros.slice(0, 3)} ${numeros.slice(3, 6)} ${numeros.slice(6)}`;
    return `+57 ${numeros.slice(0, 3)} ${numeros.slice(3, 6)} ${numeros.slice(6, 10)}`;
  };

  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0) return;
    if (!metodoPagamento) return;

    try {
      const total = calcularTotal();
      const payload = {
        plataforma: 'pdv_loja',
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

      // 1. Criar o Pedido
      const { data: pedido, error: errorPedido } = await supabase.from('pedidos_venda').insert([payload]).select().single();
      if (errorPedido) {
        console.error('Erro Pedido:', errorPedido);
        throw errorPedido;
      }

      // 2. Criar os Itens e Abater Estoque
      for (const item of carrinho) {
        await supabase.from('itens_pedido').insert([{
          pedido_id: pedido.id,
          lote_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario
        }]);

        const { error: errorRPC } = await supabase.rpc('abater_estoque_lote', { 
          lote_id_param: item.id, 
          qtd_param: item.quantidade 
        });
        if (errorRPC) console.error('Erro RPC Abate:', errorRPC);
      }

      setPedidoFinalizado({
        ...pedido,
        itens: carrinho // Guardar itens para o recibo
      });
      setShowCheckout(false);
      setShowReceipt(true);
      setCarrinho([]);
      setClienteSelecionado(null);
      setMetodoPagamento('');
      setDescontoGeral(0);
      carregarDados();
    } catch (err: any) {
      console.error('Erro completo na venda:', err);
      alert('Erro ao processar venda: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden font-sans text-[#191C1D]">
      
      {/* Esquerda: Catálogo */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-6 space-y-4 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#064E3B] transition" size={20} />
              <input 
                type="text" 
                placeholder="Buscar plantas por nome ou lote..." 
                value={buscaProduto}
                onChange={e => setBuscaProduto(e.target.value)}
                className="w-full bg-gray-100 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#064E3B]/10 transition text-lg font-medium"
              />
            </div>
            <button 
              onClick={() => setShowScanner(true)}
              className="bg-[#064E3B] text-white p-4 rounded-2xl shadow-lg shadow-[#064E3B]/20 hover:scale-105 active:scale-95 transition"
            >
              <Scan size={24} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categorias.map(cat => (
              <button 
                key={cat.nome}
                onClick={() => setFiltroCategoria(cat.nome)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${filtroCategoria === cat.nome ? 'bg-[#064E3B] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#064E3B]/30'}`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start">
          {lotes.filter(l => 
            (filtroCategoria === 'Todas' || l.categoria?.nome === filtroCategoria) &&
            (l.especie?.nome.toLowerCase().includes(buscaProduto.toLowerCase()) || l.identificacao_lote.toLowerCase().includes(buscaProduto.toLowerCase()))
          ).map(lote => (
            <div 
              key={lote.id} 
              onClick={() => adicionarAoCarrinho(lote)}
              className="bg-white rounded-[2.5rem] p-4 border border-gray-100 hover:border-[#064E3B] hover:shadow-[0_20px_50px_rgba(6,78,59,0.1)] transition-all duration-500 group cursor-pointer active:scale-95 flex flex-col"
            >
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden mb-4 relative bg-gray-50 shadow-inner">
                {lote.especie?.url_foto_comercial || lote.especie?.url_foto ? (
                  <img 
                    src={lote.especie?.url_foto_comercial || lote.especie?.url_foto} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out" 
                    alt={lote.especie?.nome}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"><Leaf size={60} strokeWidth={1} /></div>
                )}
                
                <div className="absolute top-3 left-3 bg-[#064E3B] text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg">
                  {lote.quantidade_restante} EM ESTOQUE
                </div>

                {lote.especie?.url_foto_comercial && (
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm">
                    <CheckCircle2 size={14} className="text-[#059669]" />
                  </div>
                )}
              </div>
              
              <div className="px-1 flex-1 flex flex-col">
                <div className="mb-1">
                  <p className="text-[10px] text-[#84A98C] font-black uppercase tracking-widest">{lote.especie?.categorias_ia || 'Planta'}</p>
                  <h3 className="font-black text-lg text-gray-800 leading-tight group-hover:text-[#064E3B] transition-colors">{lote.especie?.nome}</h3>
                </div>
                
                <p className="text-[10px] text-gray-400 font-bold mb-4">LOTE: {lote.identificacao_lote}</p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold leading-none mb-1">PREÇO</span>
                    <span className="text-[#064E3B] font-black text-2xl tracking-tighter">{formatCOP(lote.preco_venda_estimado || 10000)}</span>
                  </div>
                  <div className="bg-[#064E3B] text-white p-3 rounded-2xl shadow-lg shadow-[#064E3B]/20 transform group-hover:rotate-12 transition-all">
                    <Plus size={20} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direita: Carrinho (Glassmorphism) */}
      <div className="w-[450px] flex flex-col bg-white/70 backdrop-blur-2xl border-l border-gray-200 shadow-2xl relative">
        
        {/* Header Cliente */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <ShoppingCart size={24} className="text-[#064E3B]" /> Carrinho
            </h2>
            <button 
              onClick={() => setShowNovoCliente(true)}
              className="text-[#064E3B] flex items-center gap-1 text-xs font-bold hover:underline"
            >
              <UserPlus size={14} /> Novo Cliente
            </button>
          </div>

          <div className="relative group">
            {clienteSelecionado ? (
              <div className="bg-[#064E3B] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-[#064E3B]/20">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full"><UserCheck size={18} /></div>
                  <div>
                    <p className="text-sm font-black truncate">{clienteSelecionado.nome}</p>
                    <p className="text-[10px] opacity-70">{clienteSelecionado.whatsapp}</p>
                  </div>
                </div>
                <button onClick={() => setClienteSelecionado(null)}><X size={18} /></button>
              </div>
            ) : (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Vincular cliente existente..." 
                  value={buscaCliente}
                  onChange={e => setBuscaCliente(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#064E3B] transition shadow-sm"
                />
                {buscaCliente && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-2xl border border-gray-100 mt-2 p-2 max-h-48 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2">
                    {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
                      <div key={c.id} onClick={() => { setClienteSelecionado(c); setBuscaCliente(''); }} className="p-3 hover:bg-[#064E3B]/5 rounded-xl cursor-pointer transition flex justify-between items-center group">
                        <div>
                          <p className="text-sm font-bold">{c.nome}</p>
                          <p className="text-[10px] text-gray-400">{c.whatsapp}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#064E3B] transition" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {carrinho.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
              <div className="bg-gray-100 p-8 rounded-full"><ShoppingCart size={48} strokeWidth={1} /></div>
              <p className="font-bold text-sm">O carrinho está pronto para sua venda</p>
            </div>
          ) : (
            carrinho.map(item => (
              <div key={item.id} className="bg-white/50 border border-white p-3 rounded-2xl shadow-sm flex gap-3 animate-in slide-in-from-right-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.especie?.foto_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-sm truncate pr-2">{item.especie?.nome}</h4>
                    <button onClick={() => setCarrinho(carrinho.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 transition"><X size={14} /></button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button onClick={() => setCarrinho(carrinho.map(i => i.id === item.id ? {...i, quantidade: Math.max(1, i.quantidade-1)} : i))} className="p-1 hover:text-[#064E3B]"><Minus size={12} /></button>
                      <span className="w-6 text-center text-xs font-black">{item.quantidade}</span>
                      <button onClick={() => setCarrinho(carrinho.map(i => i.id === item.id ? {...i, quantidade: i.quantidade+1} : i))} className="p-1 hover:text-[#064E3B]"><Plus size={12} /></button>
                    </div>
                    <span className="font-black text-sm">{formatCOP(item.preco_unitario * item.quantidade)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Fixo */}
        <div className="p-6 bg-white border-t border-gray-200 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
              <span>Subtotal</span>
              <span className="text-gray-800">{formatCOP(calcularSubtotal())}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-[#84A98C]">
                <Ticket size={14} /> DESCONTO (%)
              </div>
              <input 
                type="number" 
                max={config?.desconto_maximo}
                value={descontoGeral}
                onChange={e => setDescontoGeral(Math.min(config?.desconto_maximo, parseFloat(e.target.value) || 0))}
                className="w-14 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs text-right font-black outline-none focus:border-[#064E3B]"
              />
            </div>
            <div className="pt-2 flex justify-between items-end">
              <span className="text-sm font-bold text-gray-500 mb-1">TOTAL FINAL</span>
              <span className="text-4xl font-black text-[#064E3B] tracking-tight">{formatCOP(calcularTotal())}</span>
            </div>
          </div>

          <button 
            disabled={carrinho.length === 0}
            onClick={() => setShowCheckout(true)}
            className="w-full py-5 bg-[#064E3B] text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-[#064E3B]/30 hover:bg-[#003527] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            FINALIZAR VENDA <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Modais */}
      {showNovoCliente && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#064E3B]/20 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[#064E3B]">Novo Cliente</h3>
              <button onClick={() => setShowNovoCliente(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome Completo</label>
                <input type="text" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-[#064E3B]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="+57 300 000 0000"
                    value={novoCliente.whatsapp} 
                    onChange={e => {
                      const val = e.target.value.replace('+57 ', '');
                      const masked = aplicarMascaraTelefone(val);
                      setNovoCliente({...novoCliente, whatsapp: masked});
                    }} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-[#064E3B] font-bold" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email</label>
                  <input type="email" value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-[#064E3B]" />
                </div>
              </div>
              <button onClick={handleCriarCliente} className="w-full py-4 bg-[#064E3B] text-white rounded-2xl font-black shadow-lg shadow-[#064E3B]/20 mt-4">CADASTRAR E VINCULAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#F9FAFB] w-full max-w-lg rounded-[3rem] shadow-2xl p-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-[#191C1D]">Método de Pago</h3>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {config?.metodos_pagamento.map((metodo: string) => (
                <button 
                  key={metodo}
                  onClick={() => setMetodoPagamento(metodo)}
                  className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all gap-4 ${metodoPagamento === metodo ? 'border-[#064E3B] bg-[#064E3B]/5 text-[#064E3B] scale-105' : 'border-gray-100 bg-white hover:border-gray-200 text-gray-500'}`}
                >
                  {metodo === 'efectivo' && <Banknote size={40} />}
                  {(metodo === 'nequi' || metodo === 'daviplata' || metodo === 'transfiya') && <Smartphone size={40} />}
                  {metodo === 'tarjeta' && <CreditCard size={40} />}
                  <span className="font-black text-xs uppercase tracking-widest">{metodo}</span>
                </button>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl mb-8 border border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-400">TOTAL A COBRAR</span>
              <span className="text-3xl font-black text-[#064E3B]">{formatCOP(calcularTotal())}</span>
            </div>

            <button 
              onClick={handleFinalizarVenda}
              disabled={!metodoPagamento}
              className="w-full py-6 bg-[#064E3B] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-[#064E3B]/40 hover:bg-[#003527] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              CONFIRMAR E FINALIZAR <CheckCircle2 size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && pedidoFinalizado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#064E3B]/90 backdrop-blur-2xl p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95">
             <div className="bg-[#059669]/10 text-[#059669] p-6 rounded-full mb-6">
                <CheckCircle2 size={64} />
             </div>
             <h2 className="text-2xl font-black text-[#064E3B] mb-2">¡Venta Exitosa!</h2>
             <p className="text-gray-400 text-sm font-bold mb-8">Pedido #{pedidoFinalizado.id.slice(0,8)}</p>

             <button 
               onClick={() => setTimeout(() => window.print(), 100)}
               className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black flex items-center justify-center gap-3 mb-3 hover:bg-gray-200 transition"
             >
               <Printer size={20} /> IMPRIMIR RECIBO
             </button>
             <button 
               onClick={() => setShowReceipt(false)}
               className="w-full py-4 bg-[#064E3B] text-white rounded-2xl font-black shadow-xl shadow-[#064E3B]/20 hover:scale-[1.02] transition"
             >
               NOVA VENDA
             </button>
          </div>
        </div>
      )}

      {/* Scanner */}
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

      {/* Estilos de Impressão */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt, #print-receipt * {
            visibility: visible;
          }
          #print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm; /* Largura padrão de impressora térmica */
            padding: 5mm;
            background: white;
            color: black;
            font-family: 'Courier New', Courier, monospace;
          }
          @page {
            margin: 0;
          }
        }
      `}</style>

      {/* Estrutura do Recibo para Impressão */}
      {pedidoFinalizado && (
        <div id="print-receipt" className="hidden print:block text-black">
          <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
            <h1 className="text-lg font-black uppercase">{config?.nome_viveiro || 'VIVERO COLOMBIA'}</h1>
            <p className="text-[10px]">Punto de Venta Directo</p>
            <p className="text-[10px] mt-1">{new Date().toLocaleString('es-CO')}</p>
          </div>

          <div className="text-[10px] mb-4">
            <p><strong>PEDIDO:</strong> #{pedidoFinalizado.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>CLIENTE:</strong> {pedidoFinalizado.cliente?.nome || 'Consumidor Final'}</p>
            <p><strong>PAGO EN:</strong> {pedidoFinalizado.metodo_pagamento?.toUpperCase()}</p>
          </div>

          <table className="w-full text-[10px] mb-4">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1">ITEM</th>
                <th className="text-center py-1">QTD</th>
                <th className="text-right py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {pedidoFinalizado.itens?.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 border-dotted">
                  <td className="py-1">{item.especie?.nome || 'Planta'}</td>
                  <td className="text-center py-1">{item.quantidade}</td>
                  <td className="text-right py-1">{formatCOP(item.preco_unitario * item.quantidade)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
            <div className="flex justify-between text-xs font-black">
              <span>TOTAL</span>
              <span>{formatCOP(pedidoFinalizado.valor_total)}</span>
            </div>
          </div>

          <div className="text-center mt-8 pt-4 border-t border-dotted border-gray-300">
            <p className="text-[9px] italic">¡Gracias por su compra!</p>
            <p className="text-[8px] mt-1">Visítenos pronto</p>
          </div>
        </div>
      )}

    </div>
  );
}
