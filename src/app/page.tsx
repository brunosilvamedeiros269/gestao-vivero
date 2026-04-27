'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Leaf, Droplets, Sprout, ShieldAlert, Camera, Sparkles, ArrowRight, Camera as CameraIcon, Plus, LayoutGrid, PackageOpen, Skull, ThermometerSun, QrCode, ArrowLeft, Users, Flower2, AlertTriangle, X } from 'lucide-react';
import { RegistrarUsoInsumo } from '@/components/RegistrarUsoInsumo';
import ScannerQR from '@/components/ScannerQR';
import NotificationBell from '@/components/NotificationBell';

export default function TelaProdutorApp() {
  const [lotes, setLotes] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [vasos, setVasos] = useState<any[]>([]);
  const [substratos, setSubstratos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'bercario' | 'prontas'>('bercario');
  const [isScanning, setIsScanning] = useState(false);
  const [loteAtivoId, setLoteAtivoId] = useState<any>(null);
  
  // sheetView: 'menu' | 'foto' | 'baixa_parcial' | 'adicionar_mudas' | 'novo_lote'
  const [sheetView, setSheetView] = useState<string>('menu');

  // Form: Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoObs, setFotoObs] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form: Morte Parcial
  const [morteQtd, setMorteQtd] = useState('');

  // Form: Novo Lote
  const [novoLoteIdf, setNovoLoteIdf] = useState('');
  const [novoLoteEspecie, setNovoLoteEspecie] = useState('');

  // Form: Adicionar Mudas (BOM - Receita)
  const [addMudasQtd, setAddMudasQtd] = useState('');
  const [addMudasVaso, setAddMudasVaso] = useState('');
  const [addMudasSubstrato, setAddMudasSubstrato] = useState('');

  // Form: Tarefa Diária com Minutos
  const [tarefaAtual, setTarefaAtual] = useState('');
  const [minutosTrabalhados, setMinutosTrabalhados] = useState('15');
  const [valorHoraConfig, setValorHoraConfig] = useState(0);

  // Perfis
  const [userRole, setUserRole] = useState<'admin' | 'funcionario'>('funcionario');

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setLoading(true);
    // 1. Lotes
    const { data: L } = await supabase
      .from('lotes_plantio')
      .select('*, especie:especies(nome), diario:lote_diario_tarefas(id, tipo_tarefa, data_execucao, observacao, foto_url, analise_ia)')
      .neq('status', 'esgotado_vendido')
      .neq('status', 'perda_obito')
      .order('data_plantio', { ascending: false });
    if (L) setLotes(L);

    // 2. Espécies para form
    const { data: E } = await supabase.from('especies').select('id, nome').order('nome');
    if (E) setEspecies(E);

    // 3. Vasos (Itens com volume_vazao detectado)
    const { data: V } = await supabase.from('compras_insumos').select('*').gt('capacidade_substrato_vazao', 0).gt('quantidade_restante', 0);
    if (V) setVasos(V);

    // 4. Substratos (Itens de Terra com Estoque)
    const { data: S } = await supabase.from('compras_insumos').select('*').in('unidade_medida', ['L', 'Kg', 'Litros', 'g']).gt('quantidade_restante', 0).lte('capacidade_substrato_vazao', 0);
    if (S) setSubstratos(S);

    // 5. Configuração Valor Hora
    const { data: config } = await supabase.from('configuracoes').select('valor_hora_trabalho').limit(1).single();
    if (config) setValorHoraConfig(config.valor_hora_trabalho || 0);

    setLoading(false);
  }

  const lotesBercario = lotes.filter(l => l.status === 'germinando' || l.status === 'em_crescimento');
  const lotesProntos = lotes.filter(l => l.status === 'ponto_de_venda');

  // ============== QR CODE SCANNER ==============
  const handleScanQR = (decodedText: string) => {
    setIsScanning(false);
    
    // Procura o lote escaneado
    const loteEncontrado = [...lotesBercario, ...lotesProntos].find(l => l.id === decodedText);
    
    if (loteEncontrado) {
      setAbaAtiva(loteEncontrado.status === 'ponto_de_venda' ? 'prontas' : 'bercario');
      setLoteAtivoId(loteEncontrado);
      setSheetView('menu');
    } else {
      alert('Lote não encontrado ou já vendido/morto.');
    }
  };

  // ============== SYSTEM ACTIONS ==============

  const handleCriarLote = async (e: any) => {
    e.preventDefault();
    if (!novoLoteIdf || !novoLoteEspecie) return;

    try {
      const { error } = await supabase.from('lotes_plantio').insert({
        identificacao_lote: novoLoteIdf,
        especie_id: novoLoteEspecie,
        quantidade_plantada: 0, // Criando Vazio
        status: 'germinando',
        data_plantio: new Date().toISOString().split('T')[0] // Garante que a data não seja nula
      });
      if (error) throw error;
      alert("Placa do Lote criada com sucesso!");
      setSheetView('menu');
      setLoteAtivoId(null);
      setNovoLoteEspecie('');
      setNovoLoteIdf('');
      carregarTudo();
    } catch (e:any) {
      alert("Erro: " + e.message);
    }
  };

  const handleAdicionarMudas = async (e: any) => {
    e.preventDefault();
    if (!addMudasQtd || !loteAtivoId) return;

    const qtdNum = parseInt(addMudasQtd);

    try {
      // Se selecionou Vaso Mágico
      let logMsgs = `Plantado ${qtdNum} plantas no lote.`;
      if (addMudasVaso && addMudasSubstrato) {
        const vaso = vasos.find(v => v.id === addMudasVaso);
        const consumoTerra = qtdNum * parseFloat(vaso.capacidade_substrato_vazao);

        // 1. Debita o Vaso
        await supabase.from('lote_uso_insumos').insert({
          lote_plantio_id: loteAtivoId.id,
          compra_insumo_id: addMudasVaso,
          quantidade_usada: qtdNum
        });

        // 2. Debita o Substrato
        await supabase.from('lote_uso_insumos').insert({
          lote_plantio_id: loteAtivoId.id,
          compra_insumo_id: addMudasSubstrato,
          quantidade_usada: consumoTerra
        });

        logMsgs = `Foram consumidos ${qtdNum} Vasos e ${consumoTerra} (un) de Substrato do estoque automaticamente!`;
      }

      // Soma a planta viva ao Lote
      await supabase.from('lotes_plantio').update({
        quantidade_plantada: (loteAtivoId.quantidade_plantada || 0) + qtdNum
      }).eq('id', loteAtivoId.id);

      alert(logMsgs);
      setSheetView('menu');
      setLoteAtivoId(null);
      setAddMudasQtd('');
      setAddMudasVaso('');
      carregarTudo();
    } catch (e:any) {
      alert("Erro ao adicionar mudas: " + e.message);
    }
  };

  // ============== LAUDOS E IA ==============
  const handleFotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!loteAtivoId || !fotoFile) return;
    setUploading(true);

    try {
      const fileExt = fotoFile.name.split('.').pop();
      const fileName = `${loteAtivoId.id}_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('laudos').upload(filePath, fotoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('laudos').getPublicUrl(filePath);

      await supabase.from('lote_diario_tarefas').insert({
        lote_plantio_id: loteAtivoId.id,
        tipo_tarefa: 'Laudo',
        observacao: fotoObs,
        foto_url: publicUrl
      });

      alert('Laudo salvo com sucesso!');
      setSheetView('menu');
      setFotoFile(null);
      setFotoObs('');
      carregarTudo();
    } catch (e: any) {
      alert("Erro ao enviar foto: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const [analisandoId, setAnalisandoId] = useState<string | null>(null);

  const handleAnalisarIA = async (diarioItem: any) => {
    setAnalisandoId(diarioItem.id);
    try {
      const res = await fetch('/api/ai/analisar-planta', {
        method: 'POST',
        body: JSON.stringify({
          fotoUrl: diarioItem.foto_url,
          especie: loteAtivoId.especie?.nome || 'Planta',
          diasPlantio: calcDias(loteAtivoId.data_plantio)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Salva no banco
      await supabase.from('lote_diario_tarefas').update({
        analise_ia: data.analise
      }).eq('id', diarioItem.id);

      alert('Análise da IA concluída!');
      carregarTudo();
    } catch (e: any) {
      alert("Erro da IA: " + e.message);
    } finally {
      setAnalisandoId(null);
    }
  };

  // Funções Antigas (Diario, Obito, etc) 
  const prepararTarefaDiaria = (tarefa: string) => {
    setTarefaAtual(tarefa);
    setMinutosTrabalhados('15');
    setSheetView('tarefa_diaria');
  };

  const handleConfirmarTarefa = async (e: any) => {
    e.preventDefault();
    if(!loteAtivoId) return;
    try { 
      const min = parseInt(minutosTrabalhados) || 0;
      const custoDessaTarefa = (valorHoraConfig / 60) * min;

      await supabase.from('lote_diario_tarefas').insert({ 
        lote_plantio_id: loteAtivoId.id, 
        tipo_tarefa: tarefaAtual,
        minutos_trabalhados: min
      }); 

      // Incrementa custo acumulado da planta
      if (custoDessaTarefa > 0) {
         await supabase.from('lotes_plantio').update({
           custo_acumulado: (loteAtivoId.custo_acumulado || 0) + custoDessaTarefa
         }).eq('id', loteAtivoId.id);
      }

      alert(`${tarefaAtual} registrada com ${min}min!`);
      setSheetView('menu');
      carregarTudo(); 
    } catch(e:any){
      alert("Erro ao salvar tarefa: " + e.message);
    }
  };

  const handleDeclararPronto = async () => {
    if(!loteAtivoId) return;
    await supabase.from('lotes_plantio').update({ status: 'ponto_de_venda' }).eq('id', loteAtivoId.id);
    setLoteAtivoId(null); carregarTudo();
  };

  const handleBaixaParcialSubmit = async (e: any) => {
    e.preventDefault();
    if(!loteAtivoId || !morteQtd) return;
    const mortosInseridos = parseInt(morteQtd);
    if(mortosInseridos > loteAtivoId.quantidade_plantada) return alert("Mortes maiores que estoque vivo!");
    const novasVivas = loteAtivoId.quantidade_plantada - mortosInseridos;
    const novoMortos = (loteAtivoId.quantidade_morta || 0) + mortosInseridos;
    await supabase.from('lotes_plantio').update({ quantidade_plantada: novasVivas, quantidade_morta: novoMortos }).eq('id', loteAtivoId.id);
    alert(`Óbitos registrados. Custos transferidos às ${novasVivas} sobreviventes!`);
    setLoteAtivoId(null); setMorteQtd(''); carregarTudo();
  };

  const handleObitoTotal = async () => {
     if(!confirm('Deseja dar baixa total em todo este lote?')) return;
     await supabase.from('lotes_plantio').update({ status: 'perda_obito' }).eq('id', loteAtivoId.id);
     setLoteAtivoId(null); carregarTudo();
  }

  const calcDias = (dataPlantio: string) => Math.ceil((new Date().getTime() - new Date(dataPlantio).getTime()) / (1000*3600*24));

  const tarefaFeitaHoje = (diario: any[] | undefined, tipo: string) => {
    if (!diario) return false;
    const isToday = (date: Date) => { const today = new Date(); return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(); };
    return diario.some(d => d.tipo_tarefa === tipo && isToday(new Date(d.data_execucao)));
  };

  const getIconTarefa = (tipo: string, size=14) => {
    switch (tipo) {
      case 'Rega': return <Droplets size={size} className="text-blue-500" />;
      case 'Poda': return <Leaf size={size} className="text-green-500" />;
      case 'Abono': return <Sprout size={size} className="text-amber-600" />;
      case 'Abono_Adubo': return <Sprout size={size} className="text-amber-600" />;
      case 'Defensivo': return <ShieldAlert size={size} className="text-error" />;
      case 'Laudo': return <Camera size={size} className="text-purple-500" />;
      default: return null;
    }
  };

  // Volumetria Aux
  const vasoPendente = addMudasVaso ? vasos.find(v => v.id === addMudasVaso) : null;
  const volNecessario = vasoPendente && addMudasQtd ? parseFloat(vasoPendente.capacidade_substrato_vazao) * parseInt(addMudasQtd) : 0;

  return (
    <main className="min-h-screen bg-background pb-24 relative">
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <select 
            value={userRole} 
            onChange={(e) => setUserRole(e.target.value as any)}
            className="bg-primary/10 border-none text-primary text-[10px] font-bold rounded-full px-3 py-1 outline-none"
          >
            <option value="funcionario">Perfil: Operário</option>
            <option value="admin">Perfil: Gestor</option>
          </select>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface leading-none">Agro App</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell role={userRole} />
          <div className="flex gap-2 text-xs font-bold text-secondary">
            <span className="bg-surface-container px-2 py-1 rounded-full flex items-center gap-1"><ThermometerSun size={12}/> 24°C</span>
          </div>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="flex bg-surface-container-high rounded-full p-1">
          <button onClick={() => setAbaAtiva('bercario')} className={`flex-1 py-3 text-sm font-bold rounded-full transition ${abaAtiva === 'bercario' ? 'bg-primary text-on-primary shadow' : 'text-secondary hover:bg-surface-container-highest'}`}>
            🌱 Berçário
          </button>
          <button onClick={() => setAbaAtiva('prontas')} className={`flex-1 py-3 text-sm font-bold rounded-full transition ${abaAtiva === 'prontas' ? 'bg-amber-500 text-black shadow' : 'text-secondary hover:bg-surface-container-highest'}`}>
            🌻 Prontas
          </button>
        </div>
      </div>

      {/* Listagem */}
      <div className="px-6 space-y-4">
        {loading && <p className="text-center text-sm mt-10">Montando bancadas...</p>}
        {(!loading && abaAtiva === 'bercario') && lotesBercario.map(l => {
          const totalInicial = (l.quantidade_plantada || 0) + (l.quantidade_morta || 0);
          const taxaSobrevivencia = totalInicial > 0 ? Math.round((l.quantidade_plantada / totalInicial) * 100) : 100;
          
          // Cálculo simples de conformidade de rega (exemplo: espera-se rega a cada 2 dias)
          const regasRealizadas = l.diario?.filter((t: any) => t.tipo_tarefa === 'Rega').length || 0;
          const diasVida = calcDias(l.data_plantio);
          const regasEsperadas = Math.max(1, Math.floor(diasVida / 2));
          const conformidadeRega = Math.min(100, Math.round((regasRealizadas / regasEsperadas) * 100));

          return (
            <div key={l.id} onClick={() => { setLoteAtivoId(l); setSheetView('menu'); }} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container shadow-sm active:scale-95 transition cursor-pointer group hover:border-primary/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-on-surface leading-tight group-hover:text-primary transition-colors">{l.especie?.nome || 'Desconhecido'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-secondary font-bold tracking-widest uppercase bg-surface-container px-2 py-0.5 rounded-md">LOTE: {l.identificacao_lote}</span>
                  </div>
                </div>
                <div className="bg-surface-container-high text-on-surface px-3 py-1.5 rounded-2xl text-xs font-black text-center shadow-sm min-w-[50px]">
                  {diasVida}<br/><span className="text-[8px] font-bold text-secondary uppercase tracking-tighter">Dias</span>
                </div>
              </div>

              {l.quantidade_plantada === 0 ? (
                <div className="bg-amber-500/10 text-amber-500 font-bold text-[11px] p-4 rounded-2xl border border-amber-500/20 flex items-center gap-3 mt-2">
                  <div className="bg-amber-500 text-white p-1.5 rounded-full shadow-lg shadow-amber-500/20 animate-pulse"><AlertTriangle size={14}/></div>
                  Bancada Vazia - Toque para Plantar
                </div>
              ) : (
                <div className="space-y-4">
                  {/* KPIs Rápidos */}
                  <div className="flex items-center gap-4 bg-surface-container-low/50 p-3 rounded-2xl">
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-[10px] font-bold text-secondary uppercase flex items-center gap-1"><Leaf size={10} className="text-primary"/> Sobrevivência</span>
                         <span className={`text-[10px] font-black ${taxaSobrevivencia > 85 ? 'text-primary' : taxaSobrevivencia > 60 ? 'text-amber-600' : 'text-error'}`}>{taxaSobrevivencia}%</span>
                       </div>
                       <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full transition-all duration-500 ${taxaSobrevivencia > 85 ? 'bg-primary' : taxaSobrevivencia > 60 ? 'bg-amber-500' : 'bg-error'}`} style={{ width: `${taxaSobrevivencia}%` }}></div>
                       </div>
                    </div>
                    <div className="w-[1px] h-8 bg-surface-container-highest"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-secondary uppercase mb-0.5">Rega</span>
                      <div className="flex items-center gap-1">
                        <Droplets size={12} className={conformidadeRega > 80 ? 'text-blue-500' : 'text-amber-500'} />
                        <span className="text-sm font-black text-on-surface">{conformidadeRega}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de Atividades de Hoje */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-3">
                      {l.diario && l.diario.length > 0 ? (
                        <>
                          <div className={`transition-all duration-300 ${tarefaFeitaHoje(l.diario, 'Rega') ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'opacity-20 grayscale'}`}>
                            {getIconTarefa('Rega', 18)}
                          </div>
                          <div className={`transition-all duration-300 ${tarefaFeitaHoje(l.diario, 'Poda') ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(22,163,74,0.5)]' : 'opacity-20 grayscale'}`}>
                            {getIconTarefa('Poda', 18)}
                          </div>
                          <div className={`transition-all duration-300 ${tarefaFeitaHoje(l.diario, 'Abono') || tarefaFeitaHoje(l.diario, 'Abono_Adubo') ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]' : 'opacity-20 grayscale'}`}>
                            {getIconTarefa('Abono', 18)}
                          </div>
                        </>
                      ) : (
                        <div className="flex gap-3 opacity-20 grayscale">
                          {getIconTarefa('Rega', 18)}
                          {getIconTarefa('Poda', 18)}
                          {getIconTarefa('Abono', 18)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-secondary font-black tracking-tight uppercase">{l.quantidade_plantada} vivas</span>
                      <div className="w-7 h-7 bg-surface-container-high rounded-full flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {(!loading && abaAtiva === 'prontas') && lotesProntos.map(l => (
          <div key={l.id} onClick={() => { setLoteAtivoId(l); setSheetView('menu'); }} className="bg-surface-container-lowest p-5 rounded-3xl border-2 border-amber-500/20 shadow-sm active:scale-95 transition cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-start justify-end p-2"><Flower2 size={20} className="text-amber-500" /></div>
            <div>
               <h3 className="text-xl font-extrabold text-on-surface leading-tight">{l.especie?.nome || 'Desconhecido'}</h3>
               <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg mr-2">PRONTO</span>
               <span className="text-xs text-secondary font-medium tracking-wide">{l.identificacao_lote}</span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-container text-sm">
              <span className="text-secondary font-medium">{l.quantidade_plantada} vivas restando</span>
              <ArrowRight size={18} className="text-amber-500" />
            </div>
          </div>
        ))}
      </div>

      {/* FABs */}
      <div className="fixed bottom-6 left-6 z-40">
        <button 
          onClick={() => setIsScanning(true)}
          className="w-16 h-16 bg-surface-container-highest text-on-surface rounded-full shadow-2xl border border-surface-container flex justify-center items-center hover:scale-105 transition"
        >
          <QrCode size={28} />
        </button>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => { setLoteAtivoId(true); setSheetView('novo_lote'); }}
          className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl flex justify-center items-center hover:scale-105 active:bg-primary-container active:text-on-primary-container transition"
        >
          <Plus size={32} />
        </button>
      </div>

      {isScanning && (
        <ScannerQR 
          onScan={handleScanQR} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      {/* DRAWERS / MODAIS */}
      {loteAtivoId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity" onClick={(e) => { if(e.target===e.currentTarget) setLoteAtivoId(null); }}>
          <div className="bg-surface w-full max-w-md rounded-t-[2.5rem] p-6 pb-8 shadow-2xl animate-slide-up relative max-h-[95vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4"></div>
            
            {/* Fechar Padrão */}
            <div className="absolute top-6 right-6">
              <button onClick={() => setLoteAtivoId(null)} className="p-2 bg-surface-container rounded-full text-secondary"><X size={20}/></button>
            </div>

            {/* ==== VIEW: NOVO LOTE VAZIO ==== */}
            {sheetView === 'novo_lote' && (
              <form onSubmit={handleCriarLote} className="space-y-5 mt-2">
                <h2 className="text-2xl font-black text-on-surface mb-2">Criar Placa de Bancada</h2>
                <p className="text-xs text-secondary mb-4 leading-relaxed">Gere identificadores organizacionais e depois "bip" as mudas atrelando sementes e terras para dentro desta estufa física.</p>
                
                <div>
                   <label className="text-sm font-bold text-secondary mb-1 block">Espécie a ser abrigada</label>
                   <select required value={novoLoteEspecie} onChange={e=>setNovoLoteEspecie(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-4 outline-none font-bold">
                     <option value="">Selecione...</option>
                     {especies.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-sm font-bold text-secondary mb-1 block">Nome / Tag Física do Lote</label>
                   <input required value={novoLoteIdf} onChange={e=>setNovoLoteIdf(e.target.value)} placeholder="Ex: MESA-A1-TOMATE" className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-4 outline-none font-bold uppercase" />
                </div>
                
                <button type="submit" className="w-full bg-primary text-on-primary py-4 mt-6 rounded-xl font-bold text-lg shadow-md hover:scale-[1.01] transition">Criar Bancada (Vazia)</button>
              </form>
            )}

            {/* ==== VIEW: MENU PRINCIPAL DE LOTE EXISTENTE ==== */}
            {sheetView === 'menu' && typeof loteAtivoId === 'object' && (
              <>
                <div className="mb-6 pr-10">
                  <h2 className="text-2xl font-black text-on-surface leading-tight">{loteAtivoId.especie?.nome}</h2>
                  <p className="text-sm text-secondary font-medium mt-1 uppercase tracking-widest">{loteAtivoId.quantidade_plantada} Mudas Vivas ({loteAtivoId.identificacao_lote})</p>
                </div>

                <div className="space-y-6">
                  {/* Bloco Diário Rápido */}
                  <div>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={()=>prepararTarefaDiaria('Rega')} className="flex flex-col items-center bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl active:bg-blue-500/20 transition"><Droplets size={24} className="text-blue-500 mb-1" /> <span className="text-[10px] font-bold text-blue-500">Rega</span></button>
                      <button onClick={()=>prepararTarefaDiaria('Poda')} className="flex flex-col items-center bg-green-500/10 border border-green-500/20 p-3 rounded-2xl active:bg-green-500/20 transition"><Leaf size={24} className="text-green-500 mb-1" /> <span className="text-[10px] font-bold text-green-500">Poda</span></button>
                      <button onClick={()=>prepararTarefaDiaria('Abono')} className="flex flex-col items-center bg-amber-600/10 border border-amber-600/20 p-3 rounded-2xl active:bg-amber-600/20 transition"><Sprout size={24} className="text-amber-600 mb-1" /> <span className="text-[10px] font-bold text-amber-600">Abono</span></button>
                      <button onClick={()=>prepararTarefaDiaria('Defensivo')} className="flex flex-col items-center bg-error/10 border border-error/20 p-3 rounded-2xl active:bg-error/20 transition"><ShieldAlert size={24} className="text-error mb-1" /> <span className="text-[10px] font-bold text-error">Veneno</span></button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-surface-container">
                    
                    {/* Botão Magico Receita BOM */}
                    <button onClick={() => setSheetView('adicionar_mudas')} className="w-full flex items-center justify-between bg-primary text-on-primary p-4 rounded-2xl active:scale-[0.98] transition">
                      <div className="flex items-center gap-3">
                        <PackageOpen size={20}/>
                        <div className="text-left"><p className="font-bold">Plantar Mudas/Vasos</p><p className="text-[10px]">Alimenta estoque vivo consumindo materiais</p></div>
                      </div>
                      <Plus size={20} className="bg-on-primary text-primary rounded-full p-1" />
                    </button>
                    
                    <RegistrarUsoInsumo loteId={loteAtivoId.id} />

                    <button onClick={() => setSheetView('foto')} className="w-full flex items-center gap-4 bg-surface-container-high p-4 rounded-2xl text-left transition"><div className="p-3 bg-surface text-on-surface rounded-xl shadow-sm"><Camera size={20}/></div><div><p className="font-bold text-on-surface">Capturar Laudo</p></div></button>

                    {(abaAtiva === 'bercario') && (
                      <button onClick={handleDeclararPronto} className="w-full flex items-center gap-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-left"><div className="p-3 bg-amber-500 text-black rounded-xl shadow-sm"><Sparkles size={20}/></div><div><p className="font-bold text-amber-500">Floresceu (Declarar Pronto)</p></div></button>
                    )}

                    <button onClick={() => setSheetView('historico')} className="w-full flex items-center gap-4 bg-surface-container-high p-4 rounded-2xl text-left transition"><div className="p-3 bg-surface text-on-surface rounded-xl shadow-sm"><Leaf size={20}/></div><div><p className="font-bold text-on-surface">Histórico do Lote</p></div></button>

                    <button onClick={() => setSheetView('baixa_parcial')} className="w-full flex items-center justify-between bg-error/5 border border-error/20 p-4 rounded-2xl text-left group">
                        <div className="flex items-center gap-3"><AlertTriangle size={18} className="text-error"/><span className="font-bold text-error">Declarar Morte/Perda</span></div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ==== VIEW: ADICIONAR MUDAS (AUTO-RECEITA) ==== */}
            {sheetView === 'adicionar_mudas' && (
              <form onSubmit={handleAdicionarMudas} className="space-y-5 animate-slide-up mt-2">
                <button type="button" onClick={() => setSheetView('menu')} className="text-sm font-bold text-primary mb-1 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar</button>
                <div className="mb-4">
                  <h3 className="text-xl font-black text-on-surface">Plantar no Berçário</h3>
                  <p className="text-xs text-secondary mt-1">Multiplique suas plantas. Associe um Vaso abaixo para o sistema baixar a Terra automaticamente!</p>
                </div>

                <div>
                   <label className="text-sm font-bold text-secondary mb-1 block">Quantas novas germinações (Vivas)?</label>
                   <input required type="number" min="1" value={addMudasQtd} onChange={e=>setAddMudasQtd(e.target.value)} placeholder="Ex: 100" className="w-full bg-surface-container-lowest border border-surface-container text-on-surface rounded-xl p-4 outline-none text-2xl font-bold" />
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-highest space-y-4">
                  <div>
                     <label className="text-xs font-bold text-secondary mb-1 block uppercase">Vaso Utilizado (Matera)</label>
                     <select value={addMudasVaso} onChange={e=>setAddMudasVaso(e.target.value)} className="w-full bg-surface border border-surface-container text-on-surface rounded-lg px-3 py-2 outline-none font-medium text-sm">
                       <option value="">(Nenhum, plantio direto)</option>
                       {vasos.map(v => <option key={v.id} value={v.id}>{v.nome_item} | {v.capacidade_substrato_vazao}L cap. | {v.quantidade_restante} em estoque</option>)}
                     </select>
                  </div>
                  {addMudasVaso && (
                    <div className="animate-slide-up border-t border-surface-container pt-3">
                       <label className="text-xs font-bold text-primary mb-1 block uppercase">Terra / Substrato Requerido</label>
                       <p className="text-xs font-medium text-on-surface mb-2">Pela regra do vaso, usaremos exatos <span className="bg-primary text-on-primary px-1.5 py-0.5 rounded-md font-black">{volNecessario} L</span> de Terra das prateleiras!</p>
                       <select required={!!addMudasVaso} value={addMudasSubstrato} onChange={e=>setAddMudasSubstrato(e.target.value)} className="w-full bg-surface border border-primary/40 text-on-surface rounded-lg px-3 py-2 outline-none font-medium text-sm">
                         <option value="">Selecione o tambor de Terra...</option>
                         {substratos.map(s => <option key={s.id} value={s.id}>{s.nome_item} ({s.quantidade_restante}L dísponível)</option>)}
                       </select>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={addMudasVaso && !addMudasSubstrato} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-md disabled:opacity-50 mt-4">
                  Plantar e Baixar Estoque
                </button>
              </form>
            )}

            {/* ==== VIEW: TAREFA DIARIA ==== */}
            {sheetView === 'tarefa_diaria' && (
              <form onSubmit={handleConfirmarTarefa} className="space-y-4 animate-slide-up mt-2">
                 <button type="button" onClick={() => setSheetView('menu')} className="text-sm font-bold text-primary mb-1 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar</button>
                 <div className="mb-4">
                   <h3 className="text-xl font-black text-on-surface">Registrar {tarefaAtual}</h3>
                   <p className="text-xs text-secondary mt-1">Informe o tempo gasto na operação para rastreio de custo de mão de obra do lote.</p>
                 </div>

                 <div className="space-y-4 bg-surface-container-low p-5 rounded-3xl border border-surface-container-highest">
                   <div>
                     <label className="text-sm font-bold text-secondary mb-2 block uppercase tracking-wider">Tempo Gasto (Minutos)</label>
                     <input type="number" min="1" required value={minutosTrabalhados} onChange={e=>setMinutosTrabalhados(e.target.value)} className="w-full bg-surface-container-lowest border border-surface-container text-on-surface rounded-xl px-4 py-4 outline-none font-bold text-2xl text-center shadow-inner" />
                   </div>
                   
                   {valorHoraConfig > 0 && (
                     <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mt-4 text-center">
                       <p className="text-[10px] text-orange-600 font-bold mb-1 uppercase tracking-widest">Custo Operacional (Mão de Obra)</p>
                       <p className="text-xl text-orange-700 font-black">+ {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((valorHoraConfig / 60) * (parseInt(minutosTrabalhados) || 0))}</p>
                     </div>
                   )}
                 </div>
                 
                 <button type="submit" className="w-full bg-primary text-on-primary py-4 mt-4 rounded-xl font-bold text-lg shadow-md hover:scale-[1.01] transition flex items-center justify-center gap-2">
                   Confirmar Operação
                 </button>
              </form>
            )}

            {/* VIEW FOTO / LAUDO */}
            {sheetView === 'foto' && (
              <form onSubmit={handleFotoUpload} className="space-y-4 animate-slide-up">
                <button type="button" onClick={() => setSheetView('menu')} className="text-sm font-bold text-primary mb-2 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar</button>
                
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/50 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-primary cursor-pointer">
                  <Camera size={32} className="mb-2 opacity-50"/>
                  <span className="font-bold">{fotoFile ? fotoFile.name : 'Toque para Abrir Câmera'}</span>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
                </div>

                <div>
                   <label className="text-sm font-bold text-secondary mb-1 block">Laudo/Comentário (opcional)</label>
                   <textarea rows={3} value={fotoObs} onChange={e=>setFotoObs(e.target.value)} placeholder="Folhas com manchas brancas..." className="w-full bg-surface-container-lowest border border-surface-container text-on-surface rounded-xl p-4 outline-none resize-none"></textarea>
                </div>
                
                <button type="submit" disabled={!fotoFile || uploading} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold disabled:opacity-50 shadow-md">
                  {uploading ? 'Salvando imagem...' : 'Salvar no Prontuário'}
                </button>
              </form>
            )}

            {/* VIEW BAIXA PARCIAL (MORTALIDADE) */}
            {sheetView === 'baixa_parcial' && (
              <form onSubmit={handleBaixaParcialSubmit} className="space-y-4 animate-slide-up">
                <button type="button" onClick={() => setSheetView('menu')} className="text-sm font-bold text-secondary mb-2 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Cancelar</button>
                
                <div className="bg-error/10 p-4 rounded-2xl">
                  <h3 className="text-error font-bold text-base mb-0.5 flex items-center gap-2"><Skull size={18}/> Relatório de Quebra</h3>
                  <p className="text-error/80 text-[10px] leading-tight">Custo transferido matematicamente para as sobreviventes.</p>
                </div>

                <div>
                   <label className="text-xs font-bold text-on-surface mb-1 flex items-center justify-between">Qtd Morta <span className="text-secondary text-[10px]">Sobra: {loteAtivoId.quantidade_plantada}</span></label>
                   <input required type="number" min="1" max={loteAtivoId.quantidade_plantada} value={morteQtd} onChange={e=>setMorteQtd(e.target.value)} placeholder="Ex: 5" className="w-full bg-surface-container-lowest border border-surface-container text-on-surface rounded-xl p-3 outline-none text-xl font-bold" />
                </div>
                
                <div className="pt-2">
                  <button type="submit" className="w-full bg-[#ba1a1a] text-white py-4 rounded-xl font-bold shadow-md hover:opacity-90 transition text-lg flex items-center justify-center gap-2">
                    <Skull size={20} /> Abater Plantas
                  </button>
                  <button type="button" onClick={handleObitoTotal} className="w-full mt-2 text-error font-bold text-xs py-2 hover:underline">
                    Declarar Perda Total?
                  </button>
                </div>
              </form>
            )}
            {/* VIEW HISTORICO */}
            {sheetView === 'historico' && loteAtivoId && (
              <div className="space-y-4 animate-slide-up">
                <button type="button" onClick={() => setSheetView('menu')} className="text-sm font-bold text-primary mb-2 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar</button>
                <div className="mb-4">
                  <h3 className="text-xl font-black text-on-surface">Histórico de Operações</h3>
                  <p className="text-xs text-secondary mt-1 tracking-wide">LOTE: {loteAtivoId.identificacao_lote}</p>
                </div>
                
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-container-highest before:to-transparent">
                  {loteAtivoId.diario && loteAtivoId.diario.length > 0 ? (
                    [...loteAtivoId.diario].sort((a,b) => new Date(b.data_execucao).getTime() - new Date(a.data_execucao).getTime()).map(d => (
                      <div key={d.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high text-secondary shadow shrink-0 z-10">
                           {getIconTarefa(d.tipo_tarefa, 16)}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-on-surface text-sm uppercase tracking-wider">{d.tipo_tarefa.replace('_', ' ')}</div>
                            <div className="text-xs font-medium text-secondary">{new Date(d.data_execucao).toLocaleDateString('pt-BR')} {new Date(d.data_execucao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                          {d.foto_url && (
                            <div className="mt-3 mb-2 rounded-xl overflow-hidden border border-surface-container relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={d.foto_url} alt="Laudo" className="w-full h-32 object-cover" />
                              
                              {!d.analise_ia && (
                                <button 
                                  onClick={() => handleAnalisarIA(d)}
                                  disabled={analisandoId === d.id}
                                  className="absolute bottom-2 right-2 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1 hover:bg-purple-700 transition"
                                >
                                  <Bot size={14}/> {analisandoId === d.id ? 'Analisando...' : 'Pedir Laudo IA'}
                                </button>
                              )}
                            </div>
                          )}
                          {d.observacao && <p className="text-sm text-secondary mt-2">{d.observacao}</p>}
                          
                          {d.analise_ia && (
                             <div className="mt-3 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                               <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-xs"><Bot size={14}/> Agrônomo Virtual IA</div>
                               <div className="space-y-1 text-xs">
                                 <p><span className="font-bold">Desenvolvimento:</span> {d.analise_ia.desvio_desenvolvimento}</p>
                                 <p><span className="font-bold">Saúde:</span> <span className={d.analise_ia.estado_saude.includes('Saudável') ? 'text-green-600 font-bold' : 'text-error font-bold'}>{d.analise_ia.estado_saude}</span></p>
                                 {d.analise_ia.doenca_detectada && d.analise_ia.doenca_detectada !== 'Nenhuma' && <p><span className="font-bold">Doença:</span> <span className="text-error">{d.analise_ia.doenca_detectada}</span></p>}
                                 <p className="mt-2 text-purple-700 font-medium bg-purple-500/10 p-2 rounded-lg">💡 Ação sugerida: {d.analise_ia.acao_sugerida}</p>
                               </div>
                             </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-secondary py-10 relative z-10">Nenhuma tarefa realizada.</p>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </main>
  );
}
