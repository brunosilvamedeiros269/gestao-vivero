'use client';

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, ShoppingCart, Info, CheckCircle2, History, AlertTriangle, QrCode, Sparkles } from 'lucide-react';
import QRCode from 'react-qr-code';
import Image from 'next/image';

export default function GerenciadorLotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [lote, setLote] = useState<any>(null);
  const [historicoPrecos, setHistoricoPrecos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<any>({});
  const [fotosEvolucao, setFotosEvolucao] = useState<any[]>([]);
  const [analisandoId, setAnalisandoId] = useState<string | null>(null);
  const [analiseIA, setAnaliseIA] = useState<any>(null);

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [plataformaAlvo, setPlataformaAlvo] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Anúncio IA e Atributos ML
  const [tituloAnuncio, setTituloAnuncio] = useState('');
  const [descricaoAnuncio, setDescricaoAnuncio] = useState('');
  const [alturaPlanta, setAlturaPlanta] = useState('');
  const [luzPlanta, setLuzPlanta] = useState('');
  const [garantiaAnuncio, setGarantiaAnuncio] = useState('');
  const [videoAnuncio, setVideoAnuncio] = useState('');
  const [gerandoIA, setGerandoIA] = useState(false);

  // B2B State
  const [modalB2B, setModalB2B] = useState(false);
  const [clienteB2B, setClienteB2B] = useState('');
  const [qtdB2B, setQtdB2B] = useState('');

  // Marketplaces Mapeados (Mapeando quais chaves eles dependem)
  const plataformas = [
    { id: 'mercadolivre', nome: 'Mercado Libre', cor: 'bg-yellow-400 text-black border-yellow-500', reqKey: 'mercadolivre_app_id' },
    { id: 'amazon', nome: 'Amazon', cor: 'bg-slate-800 text-orange-400 border-slate-900', reqKey: 'amazon_seller_id' },
    { id: 'facebook', nome: 'Facebook Market', cor: 'bg-blue-600 text-white border-blue-700', reqKey: 'meta_catalog_id' },
    { id: 'instagram', nome: 'Instagram', cor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-600', reqKey: 'meta_catalog_id' },
    { id: 'tiktok', nome: 'TikTok Shop', cor: 'bg-black text-white border-gray-800', reqKey: 'tiktok_app_key' },
    { id: 'exito', nome: 'Éxito', cor: 'bg-yellow-300 text-black border-yellow-400', reqKey: 'exito_api_key' },
    { id: 'falabella', nome: 'Falabella', cor: 'bg-green-600 text-white border-green-700', reqKey: 'falabella_api_key' }
  ];

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      // 1. Carregar Lote Atual
      const { data: L } = await supabase
        .from('lotes_plantio')
        .select('*, especie:especies(nome, descricao)')
        .eq('id', id)
        .single();
      
      if (L) {
        setLote(L);
        // Preencher o preço no input se já existir, senão deixa vazio pro usuário decidir.
        if (L.preco_venda_estimado) setPrecoVenda(L.preco_venda_estimado.toString());

        // 2. Buscar Histórico de Preços da MESMA ESPÉCIE em outros lotes já vendidos/precificados
        if (L.especie_id) {
           const { data: H } = await supabase
             .from('lotes_plantio')
             .select('id, data_plantio, preco_venda_estimado')
             .eq('especie_id', L.especie_id)
             .not('preco_venda_estimado', 'is', null)
             .neq('id', id)
             .order('data_plantio', { ascending: false })
             .limit(3);
           
           if (H) setHistoricoPrecos(H);
        }
      }

      // 3. Buscar Chaves de API
      const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
      if (config && config.api_keys) {
        setApiKeys(config.api_keys);
      }

      // 4. Buscar Clientes Atacado
      if (cli) setClientes(cli);

      // 5. Buscar Fotos de Evolução (Tarefas diárias que têm foto)
      const { data: fotos } = await supabase
        .from('lote_diario_tarefas')
        .select('*')
        .eq('lote_plantio_id', id)
        .not('foto_url', 'is', null)
        .order('created_at', { ascending: false });
      
      if (fotos) setFotosEvolucao(fotos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const abrirModalPublicacao = (platId: string) => {
    if (platId === 'mercadolivre' && fotosEvolucao.length === 0) {
      alert("É obrigatório ter ao menos uma foto registrada na evolução do lote para publicar no Mercado Livre.");
      return;
    }
    setPlataformaAlvo(platId);
    setTituloAnuncio(`Planta ${lote.especie?.nome} - Lote ${lote.identificacao_lote}`.substring(0, 60));
    setDescricaoAnuncio(`Venda de lote de plantas.\n\nEspécie: ${lote.especie?.nome}\nLote ID: ${lote.identificacao_lote}\nCultivo registrado e monitorado pelo sistema de gestão de viveiros.`);
    setModalAberto(true);
  };

  const handleGerarAnuncioIA = async () => {
    setGerandoIA(true);
    try {
      const res = await fetch('/api/ai/gerar-anuncio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especie: lote.especie?.nome,
          detalhes: `Características: altura ${alturaPlanta}, luz ${luzPlanta}`
        })
      });
      const data = await res.json();
      if(data.titulo_viral) setTituloAnuncio(data.titulo_viral);
      if(data.descricao_comercial) setDescricaoAnuncio(data.descricao_comercial);
    } catch (e) {
      alert("Erro ao gerar com IA.");
    } finally {
      setGerandoIA(false);
    }
  };

  const handlePublicar = async () => {
    if (!precoVenda || parseFloat(precoVenda) <= 0) {
      alert("Por favor, defina um preço de venda válido.");
      return;
    }
    
    setSalvando(true);
    try {
      const ints = lote.integracoes || {};
      
      let idExternoFinal = `MOCK-${Math.floor(Math.random()*10000)}`;

      if (plataformaAlvo === 'mercadolivre') {
        const fotoRealUrl = fotosEvolucao.length > 0 ? fotosEvolucao[0].foto_url : null;
        const res = await fetch('/api/integracoes/mercadolivre/publish', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            lote, 
            preco: parseFloat(precoVenda), 
            plataforma: 'mercadolivre',
            foto_url: fotoRealUrl,
            titulo_editado: tituloAnuncio,
            descricao_editada: descricaoAnuncio,
            garantia: garantiaAnuncio,
            luz: luzPlanta,
            altura: alturaPlanta,
            video_id: videoAnuncio
          }) 
        });
        
        const data = await res.json();

        if (data.needsManualLink || !res.ok) {
          const manualUrl = prompt("Não foi possível conectar automaticamente à API do Mercado Livre (ou faltam permissões).\n\nCrie o anúncio manualmente no ML e cole o link final aqui para salvar no sistema:");
          
          if (!manualUrl) {
            alert("Operação cancelada.");
            setSalvando(false);
            return;
          }

          // Tentar extrair o ID MCO-123456 do link ou salvar o link inteiro
          const match = manualUrl.match(/MCO-?\d+/i);
          idExternoFinal = match ? match[0].replace('-', '') : `MCO-MANUAL-${Math.floor(Math.random()*1000)}`;
        } else {
          // Sucesso na API!
          idExternoFinal = data.id_externo;
        }
      } else {
        // Outras plataformas ainda usam Mock
        await fetch('/api/integracoes/mock', { method: 'POST', body: JSON.stringify({ plataforma: plataformaAlvo }) });
      }
      
      // Atualizar o JSONB de integracoes e salvar o preço (caso tenha mudado)
      ints[plataformaAlvo] = {
        publicado_em: new Date().toISOString(),
        id_externo: idExternoFinal,
        preco: parseFloat(precoVenda)
      };

      await supabase.from('lotes_plantio')
        .update({ 
          integracoes: ints,
          preco_venda_estimado: parseFloat(precoVenda) 
        })
        .eq('id', id);
      
      setModalAberto(false);
      carregarDados(); // Recarrega tela
      alert(`Publicado com sucesso na plataforma: ${plataformaAlvo.toUpperCase()}!`);
    } catch (e: any) {
      alert("Erro ao publicar: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleVendaB2B = async () => {
    if (!clienteB2B || !qtdB2B || !precoVenda) return alert("Preencha todos os campos da venda B2B.");
    const qtdVendida = parseInt(qtdB2B);
    if (qtdVendida > lote.quantidade_plantada) return alert("Quantidade maior que o estoque vivo atual!");

    setSalvando(true);
    try {
      const cli = clientes.find(c => c.id === clienteB2B);
      
      // Se for venda total, muda o status do lote
      const qtdeRestante = lote.quantidade_plantada - qtdVendida;
      const novoStatus = qtdeRestante <= 0 ? 'esgotado_vendido' : lote.status;

      await supabase.from('lotes_plantio')
        .update({ 
          quantidade_plantada: qtdeRestante,
          status: novoStatus,
          preco_venda_estimado: parseFloat(precoVenda)
        })
        .eq('id', id);
      
      alert(`Venda Atacado para ${cli?.nome_empresa} registrada com sucesso! Faturado: ${formatCOP(qtdVendida * parseFloat(precoVenda))}`);
      setModalB2B(false);
      carregarDados();
    } catch(e) {
      alert("Erro na venda B2B.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDeclararPronto = async () => {
    if(!confirm("Declarar este lote como pronto para venda?")) return;
    setSalvando(true);
    try {
      await supabase.from('lotes_plantio')
        .update({ status: 'ponto_de_venda' })
        .eq('id', id);
      alert("Lote declarado como PRONTO PARA VENDA!");
      carregarDados();
    } catch(e) {
      alert("Erro ao atualizar status.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-secondary">Carregando lote...</div>;
  if (!lote) return <div className="p-8 text-center text-error">Lote não encontrado.</div>;

  const intsRealizadas = lote.integracoes || {};

  return (
    <div className="bg-surface min-h-screen text-on-surface pb-20">
      {/* Header */}
      <nav className="border-b border-surface-container-highest px-8 py-4 bg-surface-container-lowest flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container-high rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              Lote de {lote.especie?.nome}
              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${lote.status === 'ponto_de_venda' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                {lote.status === 'ponto_de_venda' ? 'Pronto para Venda' : lote.status.replace('_', ' ')}
              </span>
            </h1>
            <p className="text-xs text-secondary font-mono tracking-widest">REF: {lote.identificacao_lote}</p>
          </div>
        </div>
        
        {lote.status !== 'ponto_de_venda' && lote.status !== 'esgotado_vendido' && lote.status !== 'perda_obito' && (
           <button onClick={handleDeclararPronto} disabled={salvando} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50">
             <CheckCircle2 size={16}/> Declarar Pronto
           </button>
        )}
      </nav>

      <main className="p-8 max-w-5xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1: Dados Financeiros do Lote */}
          <section className="lg:col-span-1 space-y-4">
            <div className="bg-surface-container-lowest border border-surface-container-highest p-6 rounded-2xl shadow-sm">
               <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2"><Info size={16}/> Resumo Financeiro</h2>
               
               <div className="space-y-4">
                 <div>
                   <p className="text-xs text-secondary">Custo Absorvido (Total)</p>
                   <p className="text-2xl font-bold text-error">{formatCOP(lote.custo_acumulado || 0)}</p>
                 </div>
                 <div className="pt-4 border-t border-surface-container">
                   <p className="text-xs text-secondary">Custo Unitário (Por Planta)</p>
                   <p className="text-lg font-medium text-on-surface">{formatCOP((lote.custo_acumulado || 0) / (lote.quantidade_plantada || 1))}</p>
                   <p className="text-[10px] text-secondary mt-1">Baseado em {lote.quantidade_plantada} plantas vivas</p>
                 </div>
               </div>
            </div>

            {/* Identificação e QR Code */}
            <div className="bg-surface-container-lowest border border-surface-container-highest p-6 rounded-2xl shadow-sm text-center">
               <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 flex items-center justify-center gap-2"><QrCode size={16}/> Etiqueta QR da Bancada</h2>
               <div className="bg-white p-4 inline-block rounded-xl mx-auto mb-3 shadow-sm border border-gray-200">
                 <QRCode 
                   value={lote.id} 
                   size={150}
                   level="H"
                   fgColor="#000000"
                   bgColor="#FFFFFF"
                 />
               </div>
               <p className="text-xs text-secondary mb-3 px-2">Fixe esta etiqueta na estufa física. O trabalhador irá escaneá-la pelo App para gerir a planta.</p>
               <button onClick={() => window.print()} className="w-full bg-surface-container-high text-on-surface font-bold py-2 rounded-xl hover:bg-surface-container-highest transition border border-surface-container">
                 Imprimir Etiqueta
               </button>
            </div>

            {/* Inteligência: Histórico de Preços */}
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
               <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2"><History size={16}/> Preços Praticados</h2>
               <p className="text-[11px] text-secondary mb-3 leading-tight">Nas vendas passadas desta mesma planta ({lote.especie?.nome}), os preços de venda fechados foram:</p>
               
               {historicoPrecos.length === 0 ? (
                 <div className="text-sm text-on-surface-variant italic p-3 bg-surface rounded-xl text-center">Nenhum histórico encontrado. É a primeira vez vendendo esta espécie!</div>
               ) : (
                 <ul className="space-y-2">
                   {historicoPrecos.map((hp) => (
                     <li key={hp.id} className="flex justify-between items-center text-sm p-2 bg-surface rounded-lg shadow-sm border border-surface-container">
                       <span className="text-secondary font-mono text-xs">{new Date(hp.data_plantio).toLocaleDateString()}</span>
                       <span className="font-bold text-primary">{formatCOP(hp.preco_venda_estimado)}</span>
                     </li>
                   ))}
                 </ul>
               )}
            </div>
          </section>

          {/* Coluna 2: Marketplaces / Publicação */}
          <section className="lg:col-span-2">
            <div className="bg-surface-container-lowest border border-surface-container-highest p-6 rounded-3xl shadow-sm">
               <div className="mb-6">
                 <h2 className="text-xl font-bold text-on-surface flex items-center gap-2"><ShoppingCart size={24} className="text-primary"/> Canais de Venda (Marketplaces)</h2>
                 <p className="text-sm text-secondary mt-1">Publique o lote diretamente nas plataformas parceiras.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {plataformas.map(plat => {
                   const isPublicado = intsRealizadas[plat.id] !== undefined;
                   const hasKey = !!apiKeys[plat.reqKey];

                   return (
                     <div key={plat.id} className={`p-4 rounded-2xl border ${isPublicado ? 'bg-surface border-surface-container' : 'bg-surface-container-low border-surface-container-highest'} transition flex flex-col justify-between ${!hasKey ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${plat.cor}`}>{plat.nome}</span>
                          {isPublicado && <CheckCircle2 size={18} className="text-green-500" />}
                        </div>
                        
                        {isPublicado ? (
                          <div>
                            <p className="text-xs text-secondary font-medium">Preço Anunciado: <span className="font-bold text-on-surface">{formatCOP(intsRealizadas[plat.id].preco)}</span></p>
                            {intsRealizadas[plat.id].id_externo.startsWith('MOCK') ? (
                              <button 
                                onClick={() => alert('Este é um anúncio de teste (MOCK). A integração real gerará um link válido para a plataforma.')}
                                className="text-xs text-primary font-bold mt-2 inline-block hover:underline text-left"
                              >
                                Ver Anúncio Externo (Teste)
                              </button>
                            ) : (
                              <a 
                                href={
                                  plat.id === 'mercadolivre' ? `https://articulo.mercadolibre.com.co/${intsRealizadas[plat.id].id_externo}` :
                                  plat.id === 'amazon' ? `https://www.amazon.com/dp/${intsRealizadas[plat.id].id_externo}` :
                                  plat.id === 'facebook' ? `https://www.facebook.com/marketplace/item/${intsRealizadas[plat.id].id_externo}` :
                                  plat.id === 'exito' ? `https://www.exito.com/p-${intsRealizadas[plat.id].id_externo}` :
                                  plat.id === 'falabella' ? `https://www.falabella.com.co/falabella-co/product/${intsRealizadas[plat.id].id_externo}` :
                                  '#'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary font-bold mt-2 inline-block hover:underline"
                              >
                                Ver Anúncio Externo
                              </a>
                            )}
                          </div>
                        ) : (
                          <button 
                            onClick={() => hasKey ? abrirModalPublicacao(plat.id) : alert('Preencha a chave de API desta plataforma no menu Configurações primeiro.')}
                            className={`w-full text-sm font-bold py-2.5 rounded-xl transition border shadow-sm flex justify-center items-center gap-2 ${hasKey ? 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-surface-container' : 'bg-surface-container-lowest text-secondary border-surface-container-highest cursor-not-allowed'}`}
                          >
                            {hasKey ? 'Configurar e Publicar' : 'Chave Ausente'}
                          </button>
                        )}
                     </div>
                   );
                 })}
                 
                 {/* Novo Card B2B */}
                 <div className="p-4 rounded-2xl border bg-surface-container-low border-surface-container-highest transition flex flex-col justify-between col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-blue-100 text-blue-800 border-blue-300">Venda Atacado / B2B</span>
                    </div>
                    <p className="text-xs text-secondary mb-4">Negociação direta com Paisagistas e Varejistas, deduzindo do estoque.</p>
                    <button onClick={() => setModalB2B(true)} className="w-full text-sm font-bold py-2.5 rounded-xl transition border shadow-sm flex justify-center items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                       Vender em Massa (B2B)
                    </button>
                 </div>
                 
               </div>
            </div>

            {/* Galeria de Evolução Visual */}
            <div className="bg-surface-container-lowest border border-surface-container-highest p-6 rounded-3xl shadow-sm mt-8">
              <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <History size={24} className="text-primary"/> Evolução Visual e Diagnóstico IA
              </h2>

              {fotosEvolucao.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl border-2 border-dashed border-surface-container">
                  <p className="text-secondary italic">Nenhuma foto registrada para este lote ainda.</p>
                  <p className="text-[10px] text-secondary mt-1">Tire fotos durante as tarefas diárias no App para ver a evolução aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fotosEvolucao.map((foto) => (
                    <div key={foto.id} className="bg-surface rounded-2xl overflow-hidden border border-surface-container shadow-sm group">
                      <div className="relative aspect-video w-full bg-black">
                        <img 
                          src={foto.foto_url} 
                          alt="Evolução" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-mono">
                          {new Date(foto.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">{foto.tarefa_realizada}</p>
                          <p className="text-xs text-on-surface-variant line-clamp-2">{foto.observacoes || 'Sem observações.'}</p>
                        </div>

                        {analiseIA?.taskId === foto.id ? (
                          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 animate-fade-in">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-primary">Diagnóstico IA</span>
                              <span className="text-xs font-black text-primary">{analiseIA.saude}% Saúde</span>
                            </div>
                            <p className="text-[11px] font-medium leading-tight">{analiseIA.diagnostico}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {analiseIA.sinais_alerta?.map((s: string, idx: number) => (
                                <span key={idx} className="bg-error/10 text-error text-[9px] px-1.5 py-0.5 rounded border border-error/20 font-bold">{s}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => analisarComIA(foto.foto_url, foto.id)}
                            disabled={!!analisandoId}
                            className="w-full py-2 bg-surface-container-high hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                          >
                            {analisandoId === foto.id ? (
                              <span className="animate-pulse">Analisando...</span>
                            ) : (
                              <>💡 Analisar Saúde com IA</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modal de Revisão e Publicação */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-surface-container-highest animate-slide-up">
            <div className="bg-surface-container-low p-6 border-b border-surface-container-highest">
              <h3 className="text-lg font-bold text-on-surface">Publicar no <span className="text-primary uppercase">{plataformas.find(p=>p.id === plataformaAlvo)?.nome}</span></h3>
              <p className="text-xs text-secondary mt-1">Revise o valor antes de confirmar o anúncio.</p>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {plataformaAlvo === 'mercadolivre' && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2"><Sparkles size={16}/> Otimização com IA</h4>
                    <button 
                      onClick={handleGerarAnuncioIA} 
                      disabled={gerandoIA}
                      className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {gerandoIA ? 'Gerando...' : 'Gerar Texto Comercial'}
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Título do Anúncio (Max 60 char)</label>
                    <input type="text" maxLength={60} value={tituloAnuncio} onChange={e => setTituloAnuncio(e.target.value)} className="w-full bg-surface border border-surface-container text-on-surface rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Descrição Comercial</label>
                    <textarea rows={4} value={descricaoAnuncio} onChange={e => setDescricaoAnuncio(e.target.value)} className="w-full bg-surface border border-surface-container text-on-surface rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>

                  <div className="pt-2 border-t border-primary/10">
                     <p className="text-xs font-bold text-secondary mb-2">Atributos Opcionais</p>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="block text-[10px] text-secondary">Altura (ex: 30cm)</label>
                         <input type="text" value={alturaPlanta} onChange={e => setAlturaPlanta(e.target.value)} className="w-full bg-surface border border-surface-container text-on-surface rounded-md px-2 py-1 text-xs outline-none focus:border-primary" />
                       </div>
                       <div>
                         <label className="block text-[10px] text-secondary">Luz (ex: Sol Pleno)</label>
                         <input type="text" value={luzPlanta} onChange={e => setLuzPlanta(e.target.value)} className="w-full bg-surface border border-surface-container text-on-surface rounded-md px-2 py-1 text-xs outline-none focus:border-primary" />
                       </div>
                       <div>
                         <label className="block text-[10px] text-secondary">Garantia (ex: 30 días)</label>
                         <input type="text" value={garantiaAnuncio} onChange={e => setGarantiaAnuncio(e.target.value)} className="w-full bg-surface border border-surface-container text-on-surface rounded-md px-2 py-1 text-xs outline-none focus:border-primary" />
                       </div>
                       <div>
                         <label className="block text-[10px] text-secondary">ID Vídeo YouTube</label>
                         <input type="text" value={videoAnuncio} onChange={e => setVideoAnuncio(e.target.value)} placeholder="Ex: dQw4w9WgXcQ" className="w-full bg-surface border border-surface-container text-on-surface rounded-md px-2 py-1 text-xs outline-none focus:border-primary" />
                       </div>
                     </div>
                  </div>
                </div>
              )}
              
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm font-bold text-error flex items-center gap-2"><AlertTriangle size={16}/> Custo Unitário:</span>
                <span className="text-lg font-black text-error">{formatCOP((lote.custo_acumulado || 0) / (lote.quantidade_plantada || 1))}</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-2">Qual preço de Venda Final (COP)?</label>
                <input 
                  type="number" 
                  value={precoVenda} 
                  onChange={(e) => setPrecoVenda(e.target.value)} 
                  placeholder="Ex: 85000"
                  className="w-full bg-surface border-2 border-primary/30 text-on-surface rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-primary"
                />
                <p className="text-[10px] text-secondary mt-2">Este valor será o preço oficial do produto no Marketplace. O sistema memorizará este valor para futuras safras desta mesma planta.</p>
              </div>

            </div>

            <div className="p-4 bg-surface-container-low border-t border-surface-container flex gap-3">
              <button 
                onClick={() => setModalAberto(false)} 
                className="flex-1 px-4 py-3 bg-surface text-on-surface border border-surface-container rounded-xl font-bold hover:bg-surface-container-high transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handlePublicar}
                disabled={salvando}
                className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:bg-primary/90 transition disabled:opacity-50"
              >
                {salvando ? 'Enviando API...' : 'Confirmar e Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal B2B */}
      {modalB2B && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-surface-container-highest animate-slide-up">
            <div className="bg-surface-container-low p-6 border-b border-surface-container-highest">
              <h3 className="text-lg font-bold text-on-surface">Venda Atacado (B2B)</h3>
              <p className="text-xs text-secondary mt-1">Gere a venda para um CNPJ/NIT e abata do estoque do Lote.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">Cliente</label>
                <select value={clienteB2B} onChange={(e) => {
                  setClienteB2B(e.target.value);
                  const cli = clientes.find(c => c.id === e.target.value);
                  // Se o cliente tem desconto padrao e temos um preco estimado, ja calcula a sugestao
                  if (cli && lote.preco_venda_estimado) {
                     const desc = cli.desconto_padrao_percentual || 0;
                     const precoBase = lote.preco_venda_estimado;
                     const novoPreco = precoBase - (precoBase * (desc / 100));
                     setPrecoVenda(novoPreco.toString());
                  }
                }} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none font-medium">
                  <option value="">Selecione o Cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_empresa} (NIT: {c.nit_cnpj})</option>)}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-secondary mb-1">Qtd Plantas (Vivas: {lote.quantidade_plantada})</label>
                  <input type="number" min="1" max={lote.quantidade_plantada} value={qtdB2B} onChange={(e) => setQtdB2B(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-secondary mb-1">Preço Unit. (COP)</label>
                  <input type="number" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>

              {qtdB2B && precoVenda && (
                <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                  <p className="text-xs text-primary font-bold">TOTAL DA NEGOCIAÇÃO B2B</p>
                  <p className="text-2xl font-black text-primary">{formatCOP(parseInt(qtdB2B) * parseFloat(precoVenda))}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-surface-container-low border-t border-surface-container flex gap-3">
              <button onClick={() => setModalB2B(false)} className="flex-1 px-4 py-3 bg-surface text-on-surface border border-surface-container rounded-xl font-bold hover:bg-surface-container-high transition">Cancelar</button>
              <button onClick={handleVendaB2B} disabled={salvando} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-50">Confirmar Venda B2B</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
