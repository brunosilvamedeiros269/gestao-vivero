'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Leaf, Droplets, Sprout, ShieldAlert, Camera, Sparkles, ArrowRight, Camera as CameraIcon, Plus, LayoutGrid, PackageOpen, Skull, ThermometerSun, QrCode, ArrowLeft, Users, Flower2, AlertTriangle, X, Bot,
  DollarSign, ShoppingBag, AlertCircle, TrendingUp, Settings, Briefcase, Truck
} from 'lucide-react';
import Link from 'next/link';
import { RegistrarUsoInsumo } from '@/components/RegistrarUsoInsumo';
import ScannerQR from '@/components/ScannerQR';
import NotificationBell from '@/components/NotificationBell';
import { criarPlantasDoLote, registrarEventoEmMassa } from '@/app/actions/plantas';
import QRCode from 'react-qr-code';

export default function TelaProdutorApp() {
  const [lotes, setLotes] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [vasos, setVasos] = useState<any[]>([]);
  const [substratos, setSubstratos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'bercario' | 'prontas' | 'admin'>('bercario');
  const [isScanning, setIsScanning] = useState(false);
  const [loteAtivoId, setLoteAtivoId] = useState<any>(null);

  // Dashboard Admin States
  const [estoqueValor, setEstoqueValor] = useState(0);
  const [custoEnterrado, setCustoEnterrado] = useState(0);
  const [vendaProjetada, setVendaProjetada] = useState(0);
  const [insumosCriticos, setInsumosCriticos] = useState(0);
  
  // sheetView: 'menu' | 'foto' | 'baixa_parcial' | 'adicionar_mudas' | 'novo_lote'
  const [sheetView, setSheetView] = useState<string>('menu');

  // Plantas Individuais
  const [plantasDoLote, setPlantasDoLote] = useState<any[]>([]);
  const [plantaAtiva, setPlantaAtiva] = useState<any>(null);

  const [historicoDaPlanta, setHistoricoDaPlanta] = useState<any[]>([]);

  const carregarPlantasDoLote = async (loteId: string) => {
    setPlantasDoLote([]);
    const { data } = await supabase.from('plantas').select('*').eq('lote_plantio_id', loteId).order('identificador_individual');
    if (data) setPlantasDoLote(data);
  };

  const carregarHistoricoDaPlanta = async (plantaId: string) => {
    const { data } = await supabase
      .from('lote_diario_tarefas')
      .select('*')
      .eq('planta_id', plantaId)
      .order('data_execucao', { ascending: false });
    if (data) setHistoricoDaPlanta(data);
  };

  // Form: Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoObs, setFotoObs] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pedirIAImediato, setPedirIAImediato] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form: Morte Parcial
  const [morteQtd, setMorteQtd] = useState('');

  // Form: Novo Lote
  const [novoLoteIdf, setNovoLoteIdf] = useState('');
  const [novoLoteEspecie, setNovoLoteEspecie] = useState('');
  const [isIndividual, setIsIndividual] = useState(false);

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

  useEffect(() => {
    if (loteAtivoId && typeof loteAtivoId === 'object') {
      carregarPlantasDoLote(loteAtivoId.id);
    }
  }, [loteAtivoId?.id]);

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

    // 2. Espécies para form (Apenas as que possuem sementes em estoque)
    const { data: sementesEstoque } = await supabase
      .from('compras_insumos')
      .select('especie_id')
      .not('especie_id', 'is', null)
      .gt('quantidade_restante', 0);
      
    const especiesComSemente = new Set(sementesEstoque?.map(s => s.especie_id) || []);

    const { data: E } = await supabase.from('especies').select('id, nome').order('nome');
    if (E) {
      setEspecies(E.filter(e => especiesComSemente.has(e.id)));
    }

    // 3. Vasos (Itens com volume_vazao detectado)
    const { data: V } = await supabase.from('compras_insumos').select('*').gt('capacidade_substrato_vazao', 0).gt('quantidade_restante', 0);
    if (V) setVasos(V);

    // 4. Substratos (Itens de Terra com Estoque)
    const { data: S } = await supabase.from('compras_insumos').select('*').in('unidade_medida', ['L', 'Kg', 'Litros', 'g']).gt('quantidade_restante', 0).lte('capacidade_substrato_vazao', 0);
    if (S) setSubstratos(S);

    // 5. Configuração Valor Hora
    const { data: config } = await supabase.from('configuracoes').select('valor_hora_trabalho').limit(1).single();
    if (config) setValorHoraConfig(config.valor_hora_trabalho || 0);

    // Sincroniza lote ativo se houver
    if (loteAtivoId && typeof loteAtivoId === 'object' && L) {
       const atualizado = L.find((l: any) => l.id === loteAtivoId.id);
       if (atualizado) setLoteAtivoId(atualizado);
    }

    if (L) {
      processarAlertasAutomaticos(L, V || [], S || []);

      // Cálculo Admin
      let valorParado = 0;
      let alertasCard = 0;
      const todosInsumos = [...(V || []), ...(S || [])];
      todosInsumos.forEach(i => {
        const c_unit = i.quantidade_comprada > 0 ? (Number(i.custo_total) / Number(i.quantidade_comprada)) : 0;
        valorParado += Number(i.quantidade_restante) * c_unit;
        if (Number(i.quantidade_restante) <= 5) alertasCard++;
      });
      setEstoqueValor(valorParado);
      setInsumosCriticos(alertasCard);

      let custoAbsorvido = 0;
      let vProjetada = 0;
      L.forEach((lote: any) => {
        if (lote.status !== 'esgotado_vendido' && lote.status !== 'perda_obito') {
           custoAbsorvido += Number(lote.custo_acumulado || 0);
           vProjetada += Number(lote.preco_venda_estimado || 0);
        }
      });
      setCustoEnterrado(custoAbsorvido);
      setVendaProjetada(vProjetada);
    }

    setLoading(false);
  }

  const criarNotificacaoSeNaoExiste = async (titulo: string, mensagem: string, tipo: string, targetRole: string | null) => {
    const { data } = await supabase.from('sistema_notificacoes')
      .select('id')
      .eq('titulo', titulo)
      .eq('lida', false)
      .limit(1);
    
    if (data && data.length > 0) return;

    await supabase.from('sistema_notificacoes').insert({
      titulo, mensagem, tipo, target_role: targetRole
    });
  };

  const processarAlertasAutomaticos = async (lotesList: any[], vasosList: any[], subsList: any[]) => {
    for (const l of lotesList) {
      const totalInicial = (l.quantidade_plantada || 0) + (l.quantidade_morta || 0);
      const taxaSobrevivencia = totalInicial > 0 ? (l.quantidade_plantada / totalInicial) * 100 : 100;
      
      // 1. Alerta de Mortalidade
      if (taxaSobrevivencia < 70 && l.quantidade_plantada > 0) {
        await criarNotificacaoSeNaoExiste(
          `Mortalidade Alta: ${l.especie?.nome}`,
          `O lote ${l.identificacao_lote} está com apenas ${taxaSobrevivencia.toFixed(0)}% de sobrevivência.`,
          'merma',
          'admin'
        );
      }

      // 2. Alerta de Rega
      const regasRealizadas = l.diario?.filter((t: any) => t.tipo_tarefa === 'Rega').length || 0;
      const diasVida = calcDias(l.data_plantio);
      const regasEsperadas = Math.max(1, Math.floor(diasVida / 2));
      const conformidadeRega = (regasRealizadas / regasEsperadas) * 100;
      
      if (conformidadeRega < 50 && diasVida > 2) {
        await criarNotificacaoSeNaoExiste(
          `Rega Atrasada: ${l.identificacao_lote}`,
          `A conformidade de rega caiu para ${conformidadeRega.toFixed(0)}%. Verifique a umidade do solo!`,
          'operacional',
          null
        );
      }

      // 3. Alerta IA (Saúde/Doença)
      const alertaIA = l.diario?.find((t: any) => 
        t.analise_ia && 
        (t.analise_ia.estado_saude?.toLowerCase().includes('estressada') || 
         (t.analise_ia.doenca_detectada && t.analise_ia.doenca_detectada !== 'Nenhuma'))
      );
      if (alertaIA) {
        await criarNotificacaoSeNaoExiste(
          `Problema de Saúde: ${l.identificacao_lote}`,
          `A IA detectou plantas doentes ou estressadas neste lote. Veja o laudo técnico.`,
          'merma',
          'admin'
        );
      }
    }

    // 4. Alerta de Estoque
    for (const i of [...vasosList, ...subsList]) {
      if (i.quantidade_restante < 10) {
        await criarNotificacaoSeNaoExiste(
          `Estoque Baixo: ${i.nome_item}`,
          `Restam apenas ${i.quantidade_restante} unidades no estoque. Reposição necessária.`,
          'estoque',
          'admin'
        );
      }
    }
  };

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
      carregarPlantasDoLote(loteEncontrado.id);
    } else {
      alert('Lote não encontrado ou já vendido/morto.');
    }
  };

  // ============== SYSTEM ACTIONS ==============

  const handleCriarLote = async (e: any) => {
    e.preventDefault();
    if (!novoLoteIdf || !novoLoteEspecie) return;

    try {
      const selectedEspecie = especies.find(e => e.id === novoLoteEspecie);
      const prefixoEspecie = selectedEspecie ? selectedEspecie.nome.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PLT';
      const hashCurto = Math.random().toString(36).substring(2, 6).toUpperCase();
      const skuGerado = `${prefixoEspecie}-${novoLoteIdf.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${hashCurto}`;

      const { data: nLote, error } = await supabase.from('lotes_plantio').insert({
        identificacao_lote: novoLoteIdf,
        especie_id: novoLoteEspecie,
        quantidade_plantada: isIndividual ? 1 : 0,
        status: isIndividual ? 'em_crescimento' : 'germinando',
        data_plantio: new Date().toISOString().split('T')[0],
        tipo_gestao: isIndividual ? 'individual' : 'lote',
        sku: skuGerado
      }).select().single();
      
      if (error) throw error;

      if (isIndividual && nLote) {
         await criarPlantasDoLote(nLote.id, 1, nLote.identificacao_lote);
      }
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

      // GERAÇÃO DAS N PLANTAS INDIVIDUAIS
      const baseIdf = loteAtivoId.identificacao_lote;
      await criarPlantasDoLote(loteAtivoId.id, qtdNum, baseIdf, loteAtivoId.quantidade_plantada || 0);

      alert(logMsgs + `\n${qtdNum} registros individuais de plantas gerados com sucesso!`);
      setSheetView('menu');
      setLoteAtivoId(null);
      setAddMudasQtd('');
      setAddMudasVaso('');
      carregarTudo();
    } catch (e:any) {
      alert("Erro ao adicionar mudas: " + e.message);
    }
  };
  
  // Função para comprimir e redimensionar imagens antes do upload
  const redimensionarImagem = (file: File, maxWidth = 1600): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width *= maxWidth / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  // ============== LAUDOS E IA ==============
  const handleFotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!loteAtivoId || !fotoFile) return;
    setUploading(true);

    try {
      const compressedBlob = await redimensionarImagem(fotoFile);
      const fileExt = 'jpg'; // Forçamos jpg por causa da compressão canvas
      const fileName = `${loteAtivoId.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('fotos_evolutivas').upload(filePath, compressedBlob, {
        contentType: 'image/jpeg'
      });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('fotos_evolutivas').getPublicUrl(filePath);

      const isIndividual = sheetView === 'foto_planta' && plantaAtiva;

      const { data: diarioInserted, error: diarioError } = await supabase.from('lote_diario_tarefas').insert({
        lote_plantio_id: loteAtivoId.id,
        planta_id: isIndividual ? plantaAtiva.id : null,
        tipo_tarefa: 'Laudo',
        observacao: fotoObs,
        foto_url: publicUrl
      }).select().single();

      if (diarioError) throw diarioError;

      // Se o usuário pedir análise imediata por IA
      if (pedirIAImediato && diarioInserted) {
        await handleAnalisarIA(diarioInserted);
      }

      alert('Laudo salvo com sucesso!');
      if (isIndividual) carregarHistoricoDaPlanta(plantaAtiva.id);
      setSheetView(isIndividual ? 'planta_detalhe' : 'menu');
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

  // Overlay de Carregamento IA
  const LoadingOverlayIA = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-purple-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center max-w-[80%] animate-in zoom-in-95 duration-500">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
          <div className="relative bg-purple-600 p-6 rounded-full shadow-lg">
            <Bot size={40} className="text-white"/>
          </div>
        </div>
        <h3 className="text-xl font-black text-purple-900 mb-2 uppercase tracking-tight">IA Processando...</h3>
        <p className="text-sm text-purple-700 font-medium leading-tight">Nosso agrônomo virtual está analisando as cores e texturas da planta para gerar o laudo técnico.</p>
        <div className="mt-6 flex gap-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );

  const handleAnalisarIA = async (diarioItem: any) => {
    setAnalisandoId(diarioItem.id);
    try {
      const res = await fetch('/api/ai/analisar-planta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fotoUrl: diarioItem.foto_url,
          especie: loteAtivoId.especie?.nome || 'Planta',
          diasPlantio: calcDias(loteAtivoId.data_plantio)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Salva no banco
      const { error: updateError } = await supabase.from('lote_diario_tarefas').update({
        analise_ia: data.analise
      }).eq('id', diarioItem.id);

      if (updateError) {
        console.error("Erro no Update Supabase:", updateError);
        throw new Error("Não foi possível salvar o laudo no banco: " + updateError.message);
      }

      await carregarTudo();
      if (plantaAtiva) {
        await carregarHistoricoDaPlanta(plantaAtiva.id);
      }
    } catch (e: any) {
      console.error("Erro completo handleAnalisarIA:", e);
      alert("Erro da IA: " + e.message);
    } finally {
      setAnalisandoId(null);
    }
  };

  const handleTarefaIndividual = async (tarefa: 'Abono' | 'Veneno') => {
    if (!plantaAtiva || !loteAtivoId) return;
    setUploading(true);
    try {
      const { error } = await supabase.from('lote_diario_tarefas').insert({
        lote_plantio_id: loteAtivoId.id,
        planta_id: plantaAtiva.id,
        tipo_tarefa: tarefa === 'Abono' ? 'Abono' : 'Defensivo',
        observacao: `${tarefa} aplicado individualmente.`,
        data_execucao: new Date().toISOString()
      });
      if (error) throw error;
      await carregarHistoricoDaPlanta(plantaAtiva.id);
      alert(`${tarefa} registrado com sucesso!`);
    } catch (e: any) {
      alert("Erro ao registrar tarefa: " + e.message);
    } finally {
      setUploading(false);
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

      // Replicar o evento individualmente para todas as plantas do lote
      if (['Rega', 'Poda', 'Abono', 'Defensivo'].includes(tarefaAtual)) {
        await registrarEventoEmMassa(
          loteAtivoId.id, 
          tarefaAtual === 'Defensivo' ? 'Veneno' : (tarefaAtual as any)
        );
      }

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
        <div className="flex bg-surface-container-high rounded-full p-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setAbaAtiva('bercario')} className={`flex-1 py-3 px-4 whitespace-nowrap text-[10px] font-black uppercase tracking-widest rounded-full transition ${abaAtiva === 'bercario' ? 'bg-primary text-on-primary shadow' : 'text-secondary hover:bg-surface-container-highest'}`}>
            🌱 Berçário
          </button>
          <button onClick={() => setAbaAtiva('prontas')} className={`flex-1 py-3 px-4 whitespace-nowrap text-[10px] font-black uppercase tracking-widest rounded-full transition ${abaAtiva === 'prontas' ? 'bg-amber-500 text-black shadow' : 'text-secondary hover:bg-surface-container-highest'}`}>
            🌻 Prontas
          </button>
          <Link href="/admin/pdv" className="flex-1 py-3 px-4 whitespace-nowrap text-[10px] font-black uppercase tracking-widest rounded-full transition text-center text-secondary hover:bg-surface-container-highest flex items-center justify-center gap-1">
            🛒 Vendas
          </Link>
          {userRole === 'admin' && (
            <button onClick={() => setAbaAtiva('admin')} className={`flex-1 py-3 px-4 whitespace-nowrap text-[10px] font-black uppercase tracking-widest rounded-full transition ${abaAtiva === 'admin' ? 'bg-on-surface text-surface shadow' : 'text-secondary hover:bg-surface-container-highest'}`}>
              📊 Gestão
            </button>
          )}
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
            <div key={l.id} onClick={() => { setLoteAtivoId(l); setSheetView('menu'); carregarPlantasDoLote(l.id); }} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container shadow-sm active:scale-95 transition cursor-pointer group hover:border-primary/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-on-surface leading-tight group-hover:text-primary transition-colors">{l.especie?.nome || 'Desconhecido'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-secondary font-bold tracking-widest uppercase bg-surface-container px-2 py-0.5 rounded-md">LOTE: {l.identificacao_lote}</span>
                  </div>
                </div>
                <div className="bg-surface-container-high text-on-surface px-3 py-1.5 rounded-2xl text-xs font-black text-center shadow-sm min-w-[50px] relative">
                  {l.tipo_gestao === 'individual' && (
                    <div className="absolute -top-2 -left-2 bg-amber-500 text-white p-1 rounded-full shadow-lg">
                      <Sparkles size={10} />
                    </div>
                  )}
                  {diasVida}<br/><span className="text-[8px] font-bold text-secondary uppercase tracking-tighter">Dias</span>
                </div>
              </div>

              {l.tipo_gestao === 'individual' && (
                <div className="mb-4 flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-xl border border-primary/20">
                  <Flower2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest italic">Edição Especial / Única</span>
                </div>
              )}

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
          <div key={l.id} onClick={() => { setLoteAtivoId(l); setSheetView('menu'); carregarPlantasDoLote(l.id); }} className="bg-surface-container-lowest p-5 rounded-3xl border-2 border-amber-500/20 shadow-sm active:scale-95 transition cursor-pointer relative overflow-hidden">
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

        {(!loading && abaAtiva === 'admin') && (
          <div className="space-y-6 pb-10">
            {/* Dashboard Financeiro Rápido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-4 rounded-3xl border border-surface-container shadow-sm">
                <p className="text-[10px] font-bold text-secondary uppercase mb-1">Capital Estoque</p>
                <p className="text-lg font-black text-on-surface">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estoqueValor)}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-3xl border border-surface-container shadow-sm">
                <p className="text-[10px] font-bold text-secondary uppercase mb-1">Custo em Campo</p>
                <p className="text-lg font-black text-error">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoEnterrado)}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-3xl border border-primary/20 shadow-sm col-span-2">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Venda Projetada</p>
                <p className="text-2xl font-black text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendaProjetada)}</p>
              </div>
            </div>

            {/* Atalhos de Gestão */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-secondary uppercase tracking-widest px-1">Ferramentas de Gestão</h4>
              
              <Link href="/admin/pdv" className="flex items-center justify-between p-5 bg-[#064E3B] text-white rounded-[2rem] shadow-xl shadow-[#064E3B]/20 hover:scale-[1.02] active:scale-[0.98] transition group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <p className="font-bold">PDV - Ponto de Venda</p>
                    <p className="text-xs opacity-80">Realizar vendas e emitir comprovantes.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="opacity-50" />
              </Link>

              <Link href="/admin/compras" className="flex items-center justify-between p-5 bg-surface-container-lowest border border-surface-container rounded-3xl hover:border-primary transition group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Gestão de Compras</p>
                    <p className="text-xs text-secondary">Registrar insumos, adubos e ferramentas.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-surface-container-highest" />
              </Link>

              <Link href="/admin/fornecedores" className="flex items-center justify-between p-5 bg-surface-container-lowest border border-surface-container rounded-3xl hover:border-primary transition group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition">
                    <Truck size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Gestão de Fornecedores</p>
                    <p className="text-xs text-secondary">Parceiros, sementes e insumos.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-surface-container-highest" />
              </Link>

              <Link href="/admin/clientes" className="flex items-center justify-between p-5 bg-surface-container-lowest border border-surface-container rounded-3xl hover:border-primary transition group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Clientes B2B</p>
                    <p className="text-xs text-secondary">Carteira de atacado e paisagistas.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-surface-container-highest" />
              </Link>

              <Link href="/admin/especies" className="flex items-center justify-between p-5 bg-surface-container-lowest border border-surface-container rounded-3xl hover:border-primary transition group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition">
                    <Leaf size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Gestão de Espécies</p>
                    <p className="text-xs text-secondary">Catálogo de plantas e tempos de cultivo.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-surface-container-highest" />
              </Link>

              <button 
                onClick={() => { setLoteAtivoId(true); setSheetView('configuracoes'); }}
                className="w-full flex items-center justify-between p-5 bg-surface-container-lowest border border-surface-container rounded-3xl hover:border-primary transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl group-hover:bg-slate-500 group-hover:text-white transition">
                    <Settings size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Configurações</p>
                    <p className="text-xs text-secondary">Ajustar parâmetros do sistema.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-surface-container-highest" />
              </button>
            </div>

            {/* Insumos Críticos */}
            {insumosCriticos > 0 && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-3xl flex items-center gap-4">
                <div className="p-2 bg-error text-white rounded-full">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-error">Atenção ao Estoque</p>
                  <p className="text-xs text-error/80">Existem {insumosCriticos} itens com estoque crítico. Providencie a compra.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FABs */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-4">
        <Link 
          href="/admin/pdv"
          className="w-16 h-16 bg-[#064E3B] text-white rounded-full shadow-2xl flex justify-center items-center hover:scale-110 active:scale-95 transition-all"
        >
          <ShoppingCart size={28} />
        </Link>
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
                   <input required value={novoLoteIdf} onChange={e=>setNovoLoteIdf(e.target.value)} placeholder={isIndividual ? "Ex: ORQUIDEA-AZUL-01" : "Ex: MESA-A1-TOMATE"} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-4 outline-none font-bold uppercase" />
                </div>

                <div className="flex items-center gap-3 p-5 bg-amber-50 border-2 border-amber-200 rounded-3xl shadow-sm">
                   <input 
                     type="checkbox" 
                     id="isIndividual" 
                     checked={isIndividual} 
                     onChange={e => setIsIndividual(e.target.checked)}
                     className="w-6 h-6 accent-amber-600 rounded-lg"
                   />
                   <label htmlFor="isIndividual" className="flex-1 cursor-pointer select-none">
                     <span className="block text-sm font-black text-amber-900 uppercase tracking-tight">Planta Individual (VIP)</span>
                     <span className="block text-[10px] text-amber-700 leading-tight">Ideal para coleções ou plantas únicas que não são lotes de produção.</span>
                   </label>
                </div>
                
                <button type="submit" className="w-full bg-primary text-on-primary py-4 mt-6 rounded-xl font-bold text-lg shadow-md hover:scale-[1.01] transition">Criar Bancada (Vazia)</button>
              </form>
            )}

            {/* ==== VIEW: MENU PRINCIPAL DE LOTE EXISTENTE ==== */}
            {sheetView === 'menu' && typeof loteAtivoId === 'object' && (
              <>
                <div className="mb-4 pr-10">
                  <h2 className="text-2xl font-black text-on-surface leading-tight">{loteAtivoId.especie?.nome}</h2>
                  <p className="text-sm text-secondary font-medium mt-1 uppercase tracking-widest">{loteAtivoId.quantidade_plantada} Mudas Vivas ({loteAtivoId.identificacao_lote})</p>
                  {/* Resumo da Última Análise IA se houver */}
                  {loteAtivoId.diario?.find((d: any) => d.analise_ia) && (
                    <div className="mt-3 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                      <p className="text-[10px] font-black text-purple-700 uppercase flex items-center gap-1 mb-1"><Bot size={12}/> Último Diagnóstico IA</p>
                      <p className="text-xs text-purple-900 font-bold">
                        {loteAtivoId.diario.find((d: any) => d.analise_ia).analise_ia.estado_saude}
                      </p>
                    </div>
                  )}

                </div>

                {/* Sub-Aba Lote / Plantas */}
                <div className="flex bg-surface-container-high rounded-lg p-1 mb-6">
                  <button onClick={() => setSheetView('menu')} className="flex-1 py-2 text-xs font-bold rounded-lg transition bg-primary text-on-primary shadow">
                    Visão Geral
                  </button>
                  <button onClick={() => { setSheetView('plantas_lista'); carregarPlantasDoLote(loteAtivoId.id); }} className="flex-1 py-2 text-xs font-bold rounded-lg transition text-secondary hover:bg-surface-container-highest">
                    Plantas Individuais
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Bloco Diário Rápido */}
                  <div>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={()=>prepararTarefaDiaria('Rega')} className="flex flex-col items-center bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl active:bg-blue-500/20 transition"><Droplets size={24} className="text-blue-500 mb-1" /> <span className="text-[10px] font-bold text-blue-500">Rega (Lote)</span></button>
                      <button onClick={()=>prepararTarefaDiaria('Poda')} className="flex flex-col items-center bg-green-500/10 border border-green-500/20 p-3 rounded-2xl active:bg-green-500/20 transition"><Leaf size={24} className="text-green-500 mb-1" /> <span className="text-[10px] font-bold text-green-500">Poda (Lote)</span></button>
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

                    <button onClick={() => setSheetView('foto')} className="w-full flex items-center gap-4 bg-surface-container-high p-4 rounded-2xl text-left transition"><div className="p-3 bg-surface text-on-surface rounded-xl shadow-sm"><Camera size={20}/></div><div><p className="font-bold text-on-surface">Capturar Laudo (Geral)</p></div></button>

                    {loteAtivoId && (loteAtivoId.status === 'germinando' || loteAtivoId.status === 'em_crescimento') && (
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

            {/* ==== VIEW: LISTA DE PLANTAS INDIVIDUAIS ==== */}
            {sheetView === 'plantas_lista' && typeof loteAtivoId === 'object' && (
              <div className="space-y-4 animate-slide-up">
                <div className="mb-4 pr-10">
                  <h2 className="text-2xl font-black text-on-surface leading-tight">{loteAtivoId.especie?.nome}</h2>
                  <p className="text-sm text-secondary font-medium mt-1 uppercase tracking-widest">{loteAtivoId.quantidade_plantada} Mudas Vivas ({loteAtivoId.identificacao_lote})</p>
                </div>

                {/* Sub-Aba Lote / Plantas */}
                <div className="flex bg-surface-container-high rounded-lg p-1 mb-4">
                  <button onClick={() => setSheetView('menu')} className="flex-1 py-2 text-xs font-bold rounded-lg transition text-secondary hover:bg-surface-container-highest">
                    Visão Geral
                  </button>
                  <button onClick={() => setSheetView('plantas_lista')} className="flex-1 py-2 text-xs font-bold rounded-lg transition bg-primary text-on-primary shadow">
                    Plantas Individuais
                  </button>
                  <button onClick={() => carregarPlantasDoLote(loteAtivoId.id)} className="p-2 text-secondary hover:text-primary transition">
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {plantasDoLote.length < loteAtivoId.quantidade_plantada && (
                    <div className="text-center py-6 bg-amber-50 rounded-2xl border border-dashed border-amber-300 px-6 mb-4">
                      <p className="text-sm font-bold text-amber-900 mb-1">Catalogação Pendente</p>
                      <p className="text-[10px] text-amber-700 mb-4">Este lote tem {loteAtivoId.quantidade_plantada} plantas, mas apenas {plantasDoLote.length} estão catalogadas.</p>
                      <button 
                        onClick={async () => {
                          setLoading(true);
                          const faltantes = loteAtivoId.quantidade_plantada - plantasDoLote.length;
                          await criarPlantasDoLote(loteAtivoId.id, faltantes, loteAtivoId.identificacao_lote, plantasDoLote.length);
                          await carregarPlantasDoLote(loteAtivoId.id);
                          setLoading(false);
                          alert(`${faltantes} novas plantas catalogadas!`);
                        }}
                        className="bg-amber-600 text-white text-[10px] font-bold py-2 px-4 rounded-lg shadow-sm hover:scale-105 transition"
                      >
                        Catalogar {loteAtivoId.quantidade_plantada - plantasDoLote.length} Faltantes
                      </button>
                    </div>
                  )}
                  {plantasDoLote.map((planta: any) => (
                    <div key={planta.id} onClick={() => { setPlantaAtiva(planta); setSheetView('planta_detalhe'); carregarHistoricoDaPlanta(planta.id); }} className="flex justify-between items-center p-4 bg-surface-container-lowest border border-surface-container rounded-xl cursor-pointer hover:border-primary/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                           <Leaf size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">{planta.identificador_individual}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${planta.status === 'Semente' ? 'text-secondary' : planta.status === 'Germinada' ? 'text-primary' : 'text-amber-500'}`}>{planta.status} • {planta.saude}</p>
                        </div>
                      </div>
                      <div>
                        <QrCode size={20} className="text-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==== VIEW: DETALHES DE UMA PLANTA INDIVIDUAL ==== */}
            {sheetView === 'planta_detalhe' && plantaAtiva && (
              <div className="space-y-4 animate-slide-up">
                <button type="button" onClick={() => setSheetView('plantas_lista')} className="text-sm font-bold text-primary mb-2 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar à Lista</button>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-on-surface leading-tight">{plantaAtiva.identificador_individual}</h2>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border 
                      ${plantaAtiva.status === 'Semente' ? 'bg-surface-container-high text-secondary border-surface-container-highest' : 
                        plantaAtiva.status === 'Germinada' ? 'bg-primary/10 text-primary border-primary/20' : 
                        plantaAtiva.status === 'Morta' ? 'bg-error/10 text-error border-error/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                      {plantaAtiva.status}
                    </span>
                  </div>
                  <div onClick={() => setSheetView('imprimir_qr')} className="bg-surface-container-lowest border border-surface-container p-2 rounded-xl text-center cursor-pointer hover:border-primary/50 transition">
                    <QrCode size={32} className="mx-auto text-on-surface"/>
                    <span className="text-[8px] font-bold text-secondary uppercase mt-1">Imprimir QR</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Resumo do Último Laudo IA (Destaque) */}
                  {historicoDaPlanta.find(h => h.analise_ia) && (
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-5 rounded-[2rem] text-white shadow-lg shadow-purple-200 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Bot size={20} className="text-white"/>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Parecer Técnico IA</p>
                            <h3 className="text-lg font-bold leading-tight">Diagnóstico de Saúde</h3>
                          </div>
                        </div>
                        <Sparkles size={20} className="opacity-50 animate-pulse"/>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-black uppercase opacity-60 mb-1 text-white">Estado Atual</p>
                          <p className="text-sm font-bold truncate">{historicoDaPlanta.find(h => h.analise_ia).analise_ia.estado_saude}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-black uppercase opacity-60 mb-1 text-white">Desenvolvimento</p>
                          <p className="text-sm font-bold truncate">{historicoDaPlanta.find(h => h.analise_ia).analise_ia.desvio_desenvolvimento}</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl text-purple-900 shadow-inner">
                        <p className="text-[10px] font-black uppercase text-purple-400 mb-1">Ação Recomendada</p>
                        <p className="text-xs font-medium leading-relaxed italic">
                          "{historicoDaPlanta.find(h => h.analise_ia).analise_ia.acao_sugerida}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline/Diário Individual */}
                  <div className="bg-surface-container-low p-5 rounded-[2rem] border border-surface-container">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm text-on-surface flex items-center gap-2"><CameraIcon size={18}/> Evolução Visual</h3>
                    </div>
                    <button onClick={() => setSheetView('foto_planta')} className="w-full py-3 bg-primary/10 text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/20 transition mb-4">
                      <Camera size={16}/> Tirar Foto Individual (IA)
                    </button>
                    
                    <div className="space-y-3">
                      {historicoDaPlanta.length === 0 ? (
                        <p className="text-[10px] text-secondary italic text-center py-4">Nenhum laudo ou foto para esta planta.</p>
                      ) : (
                        historicoDaPlanta.map((item: any) => (
                          <div key={item.id} className="bg-surface-container-lowest border border-surface-container p-4 rounded-3xl shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${
                                  item.tipo_tarefa === 'Abono' ? 'bg-amber-100 text-amber-700' : 
                                  item.tipo_tarefa === 'Defensivo' ? 'bg-red-100 text-red-700' : 
                                  item.tipo_tarefa === 'Laudo' ? 'bg-purple-100 text-purple-700' : 'bg-surface-container-high text-secondary'
                                }`}>
                                  {getIconTarefa(item.tipo_tarefa, 18)}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{item.tipo_tarefa?.replace('_', ' ')}</p>
                                  <p className="text-xs font-bold text-on-surface">{new Date(item.data_execucao).toLocaleDateString('pt-BR')} {new Date(item.data_execucao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                              </div>
                              {item.analise_ia && <Sparkles size={14} className="text-purple-500 animate-pulse" />}
                            </div>
                            
                            {item.foto_url && (
                              <div className="relative rounded-2xl overflow-hidden mb-3 border border-surface-container shadow-inner">
                                <img src={item.foto_url} alt="Evolução" className="w-full h-40 object-cover" />
                                {!item.analise_ia && item.tipo_tarefa === 'Laudo' && (
                                  <button 
                                    onClick={() => handleAnalisarIA(item)}
                                    disabled={analisandoId === item.id}
                                    className="absolute bottom-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1 hover:bg-purple-700 transition"
                                  >
                                    <Bot size={14}/> {analisandoId === item.id ? 'Analisando...' : 'Pedir Laudo IA'}
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {item.observacao && (
                              <div className="bg-surface-container-low/50 p-3 rounded-2xl mb-2">
                                <p className="text-xs text-on-surface leading-relaxed">{item.observacao}</p>
                              </div>
                            )}
                            
                            {item.analise_ia && (
                              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3 text-purple-700 font-black text-[10px] uppercase tracking-tighter"><Bot size={16}/> Resultado da Análise IA</div>
                                <div className="space-y-2 text-[12px] leading-snug">
                                  {item.analise_ia.desvio_desenvolvimento && (
                                    <div className="flex justify-between border-b border-purple-100 pb-1">
                                      <span className="text-purple-400 font-bold uppercase text-[9px]">Desenvolvimento</span>
                                      <span className="font-bold text-purple-900 text-right">{item.analise_ia.desvio_desenvolvimento}</span>
                                    </div>
                                  )}
                                  {item.analise_ia.estado_saude && (
                                    <div className="flex justify-between border-b border-purple-100 pb-1">
                                      <span className="text-purple-400 font-bold uppercase text-[9px]">Saúde</span>
                                      <span className={`font-bold ${item.analise_ia.estado_saude.includes('Saudável') ? 'text-green-600' : 'text-error'} text-right`}>{item.analise_ia.estado_saude}</span>
                                    </div>
                                  )}
                                  {item.analise_ia.doenca_detectada && item.analise_ia.doenca_detectada !== 'Nenhuma' && (
                                    <div className="flex justify-between border-b border-purple-100 pb-1">
                                      <span className="text-purple-400 font-bold uppercase text-[9px]">Doença</span>
                                      <span className="font-bold text-error text-right">{item.analise_ia.doenca_detectada}</span>
                                    </div>
                                  )}
                                  {item.analise_ia.acao_sugerida && (
                                    <div className="mt-3 text-purple-900 font-medium bg-white p-3 rounded-xl border border-purple-100 shadow-inner italic">
                                      💡 {item.analise_ia.acao_sugerida}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ações Individuais */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleTarefaIndividual('Abono')} disabled={uploading} className="p-4 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold flex flex-col items-center gap-2 shadow-sm active:scale-95 transition disabled:opacity-50">
                      <Sprout size={24}/>
                      <span className="text-[10px] uppercase tracking-tighter">Adicionar Abono</span>
                    </button>
                    <button onClick={() => handleTarefaIndividual('Veneno')} disabled={uploading} className="p-4 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-700 font-bold flex flex-col items-center gap-2 shadow-sm active:scale-95 transition disabled:opacity-50">
                      <ShieldAlert size={24}/>
                      <span className="text-[10px] uppercase tracking-tighter">Aplicar Veneno</span>
                    </button>
                  </div>

                  <div className="pt-2 space-y-3">
                    {plantaAtiva.status === 'Semente' && (
                      <button onClick={async () => {
                        await supabase.from('plantas').update({ status: 'Germinada', data_germinacao: new Date().toISOString() }).eq('id', plantaAtiva.id);
                        setPlantaAtiva({...plantaAtiva, status: 'Germinada'});
                        carregarPlantasDoLote(loteAtivoId.id);
                        alert('Planta marcada como germinada!');
                      }} className="w-full p-4 rounded-2xl bg-primary text-on-primary font-bold flex items-center justify-between shadow-md">
                        <span className="flex items-center gap-2"><Sprout size={18}/> Reportar Germinação</span>
                      </button>
                    )}

                    <button onClick={async () => {
                       if(!confirm('Declarar perda desta planta individual?')) return;
                       await supabase.from('plantas').update({ status: 'Morta' }).eq('id', plantaAtiva.id);
                       await supabase.from('lotes_plantio').update({ 
                          quantidade_plantada: Math.max(0, (loteAtivoId.quantidade_plantada || 1) - 1),
                          quantidade_morta: (loteAtivoId.quantidade_morta || 0) + 1
                       }).eq('id', loteAtivoId.id);
                       alert('Óbito registrado.');
                       setSheetView('plantas_lista');
                       carregarPlantasDoLote(loteAtivoId.id);
                       carregarTudo();
                    }} className="w-full p-4 rounded-2xl bg-error/10 text-error font-bold flex items-center justify-between border border-error/20">
                      <span className="flex items-center gap-2"><Skull size={18}/> Quebra / Mortalidade</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==== VIEW: IMPRESSAO QR ==== */}
            {sheetView === 'imprimir_qr' && plantaAtiva && (
              <div className="space-y-6 animate-slide-up flex flex-col items-center justify-center py-6">
                <button type="button" onClick={() => setSheetView('planta_detalhe')} className="text-sm font-bold text-primary mb-2 flex items-center gap-1 self-start print:hidden"><ArrowRight size={14} className="rotate-180"/> Voltar para Planta</button>
                
                <div id="qr-container" className="bg-white p-8 rounded-3xl border border-surface-container flex flex-col items-center shadow-xl print:shadow-none print:border-none print:p-0">
                  <h2 className="text-3xl font-black text-black mb-1 text-center">{plantaAtiva.identificador_individual}</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Gestão Viveiro - Lote {loteAtivoId?.identificacao_lote}</p>
                  
                  <div className="bg-white p-2 border-4 border-black rounded-xl">
                    <QRCode value={plantaAtiva.id} size={200} />
                  </div>
                  
                  <p className="text-[8px] text-gray-400 mt-4 font-mono">{plantaAtiva.id}</p>
                </div>

                <button onClick={() => {
                  const printContent = document.getElementById('qr-container')?.innerHTML;
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Impressão de QR Code - ${plantaAtiva.identificador_individual}</title>
                            <style>
                              body { 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center; 
                                min-height: 100vh; 
                                margin: 0; 
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                              }
                              .print-container {
                                text-align: center;
                                padding: 20px;
                                border: 1px solid #eee;
                              }
                              h2 { margin-bottom: 5px; font-size: 24px; }
                              p { margin-top: 5px; color: #666; font-size: 12px; }
                              svg { width: 250px !important; height: 250px !important; }
                              @media print {
                                border: none;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="print-container">
                              ${printContent}
                            </div>
                            <script>
                              window.onload = function() {
                                setTimeout(() => {
                                  window.print();
                                  window.close();
                                }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-md hover:scale-[1.02] transition print:hidden flex items-center justify-center gap-2">
                  <QrCode size={20}/> Imprimir Etiqueta
                </button>
                <p className="text-xs text-secondary text-center print:hidden">Dica: Configure sua impressora para não imprimir cabeçalhos/rodapés e ajustar a escala.</p>
              </div>
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

            {/* VIEW FOTO / LAUDO GERAL (LOTE) */}
            {sheetView === 'foto' && (
              <form onSubmit={handleFotoUpload} className="space-y-4 animate-slide-up">
                <button type="button" onClick={() => setSheetView('menu')} className="text-sm font-bold text-primary mb-2 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar</button>
                
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/50 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-primary cursor-pointer">
                  <Camera size={32} className="mb-2 opacity-50"/>
                  <span className="font-bold">{fotoFile ? fotoFile.name : 'Toque para Abrir Câmera'}</span>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
                </div>

                <div className="mb-4 flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-400 rounded-3xl shadow-md animate-pulse">
                   <input 
                     type="checkbox" 
                     id="pedirIA" 
                     checked={pedirIAImediato} 
                     onChange={e => setPedirIAImediato(e.target.checked)}
                     className="w-8 h-8 accent-purple-600 rounded-lg cursor-pointer"
                   />
                   <label htmlFor="pedirIA" className="flex-1 cursor-pointer select-none">
                     <div className="flex items-center gap-2">
                       <Sparkles size={22} className="text-purple-600"/>
                       <span className="text-[14px] font-black text-purple-900 uppercase tracking-tighter">ANÁLISE DE SAÚDE IA</span>
                     </div>
                     <span className="block text-[11px] text-purple-800 font-bold leading-tight">Clique aqui para receber diagnóstico automático.</span>
                   </label>
                 </div>

                 <div>
                    <label className="text-sm font-bold text-secondary mb-1 block">Laudo/Comentário (opcional)</label>
                    <textarea rows={3} value={fotoObs} onChange={e=>setFotoObs(e.target.value)} placeholder="Folhas com manchas brancas..." className="w-full bg-surface-container-lowest border border-surface-container text-on-surface rounded-xl p-4 outline-none resize-none"></textarea>
                 </div>
                 
                 <button type="submit" disabled={!fotoFile || uploading} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold disabled:opacity-50 shadow-md text-lg">
                   {uploading ? 'Processando...' : 'Salvar no Prontuário do Lote'}
                 </button>
              </form>
            )}

            {/* VIEW FOTO / LAUDO INDIVIDUAL (PLANTA) */}
            {sheetView === 'foto_planta' && plantaAtiva && (
              <form onSubmit={handleFotoUpload} className="space-y-4 animate-slide-up">
                <button type="button" onClick={() => setSheetView('planta_detalhe')} className="text-sm font-bold text-primary mb-2 flex items-center gap-1"><ArrowRight size={14} className="rotate-180"/> Voltar para Planta</button>
                <div className="mb-2">
                  <h3 className="text-lg font-black text-on-surface">Capturar Laudo Individual</h3>
                  <p className="text-xs text-secondary mt-1">Planta {plantaAtiva.identificador_individual}</p>
                </div>
                
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/50 bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-primary cursor-pointer">
                  <Camera size={32} className="mb-2 opacity-50"/>
                  <span className="font-bold">{fotoFile ? fotoFile.name : 'Toque para Abrir Câmera'}</span>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
                </div>

                <div className="mb-4 flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-400 rounded-3xl shadow-md animate-pulse">
                   <input 
                     type="checkbox" 
                     id="pedirIAPlanta" 
                     checked={pedirIAImediato} 
                     onChange={e => setPedirIAImediato(e.target.checked)}
                     className="w-8 h-8 accent-purple-600 rounded-lg cursor-pointer"
                   />
                   <label htmlFor="pedirIAPlanta" className="flex-1 cursor-pointer select-none">
                     <div className="flex items-center gap-2">
                       <Sparkles size={22} className="text-purple-600"/>
                       <span className="text-[14px] font-black text-purple-900 uppercase tracking-tighter">ANÁLISE INDIVIDUAL IA</span>
                     </div>
                     <span className="block text-[11px] text-purple-800 font-bold leading-tight">Diagnóstico específico para esta planta.</span>
                   </label>
                 </div>

                 <div>
                    <label className="text-sm font-bold text-secondary mb-1 block">Observação Individual (opcional)</label>
                    <textarea rows={3} value={fotoObs} onChange={e=>setFotoObs(e.target.value)} placeholder="Estado das folhas..." className="w-full bg-surface-container-lowest border border-surface-container text-on-surface rounded-xl p-4 outline-none resize-none"></textarea>
                 </div>
                 
                 <button type="submit" disabled={!fotoFile || uploading} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold disabled:opacity-50 shadow-md text-lg">
                   {uploading ? 'Processando...' : 'Salvar no Histórico da Planta'}
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
                            <div className="font-bold text-on-surface text-sm uppercase tracking-wider">{d.tipo_tarefa ? d.tipo_tarefa.replace('_', ' ') : 'Tarefa'}</div>
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
                                 {d.analise_ia?.desvio_desenvolvimento && <p><span className="font-bold">Desenvolvimento:</span> {d.analise_ia.desvio_desenvolvimento}</p>}
                                 {d.analise_ia?.estado_saude && <p><span className="font-bold">Saúde:</span> <span className={d.analise_ia.estado_saude.includes('Saudável') ? 'text-green-600 font-bold' : 'text-error font-bold'}>{d.analise_ia.estado_saude}</span></p>}
                                 {d.analise_ia?.doenca_detectada && d.analise_ia.doenca_detectada !== 'Nenhuma' && <p><span className="font-bold">Doença:</span> <span className="text-error">{d.analise_ia.doenca_detectada}</span></p>}
                                 {d.analise_ia?.acao_sugerida && <p className="mt-2 text-purple-700 font-medium bg-purple-500/10 p-2 rounded-lg">💡 Ação sugerida: {d.analise_ia.acao_sugerida}</p>}
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
            
            {/* ==== VIEW: CONFIGURACOES ==== */}
            {sheetView === 'configuracoes' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-surface-container rounded-lg text-primary"><Settings size={20}/></div>
                  <h2 className="text-xl font-black text-on-surface">Configurações</h2>
                </div>
                <div className="bg-surface-container-low p-4 rounded-3xl space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Valor da Hora de Trabalho (R$)</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-surface-container-highest p-4 rounded-2xl flex items-center gap-2">
                        <DollarSign size={18} className="text-secondary" />
                        <input 
                          type="number" 
                          value={valorHoraConfig}
                          onChange={(e) => setValorHoraConfig(parseFloat(e.target.value))}
                          className="bg-transparent border-none outline-none font-bold text-on-surface w-full"
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          const { error } = await supabase.from('configuracoes').update({ valor_hora_trabalho: valorHoraConfig }).eq('id', 1); // Assume ID 1
                          if (error) {
                             // Tenta insert se não houver ID 1
                             await supabase.from('configuracoes').upsert({ id: 1, valor_hora_trabalho: valorHoraConfig });
                          }
                          alert('Configurações salvas!');
                        }}
                        className="p-4 bg-primary text-on-primary rounded-2xl shadow-lg"
                      >
                        Salvar
                      </button>
                    </div>
                    <p className="text-[10px] text-secondary mt-2 leading-tight">Este valor é usado para calcular o custo de mão de obra absorvido pelos lotes.</p>
                  </div>
                </div>
                <button onClick={() => setLoteAtivoId(null)} className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-2xl">Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {analisandoId && <LoadingOverlayIA />}
    </main>
  );
}
