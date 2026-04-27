'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import { Flower2, Plus, Save, Trash2, Edit2, Bot, Sparkles, X, Camera } from 'lucide-react';

export default function EspeciesAdmin() {
  const { t } = useLanguage();
  const [especies, setEspecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [condicoesIdeais, setCondicoesIdeais] = useState('');
  const [diasGerminacao, setDiasGerminacao] = useState('');
  const [diasFloracao, setDiasFloracao] = useState('');
  const [nomeCientifico, setNomeCientifico] = useState('');
  const [urlFoto, setUrlFoto] = useState('');
  const [dificuldade, setDificuldade] = useState('');
  const [frequenciaRega, setFrequenciaRega] = useState('');
  const [tipoSolo, setTipoSolo] = useState('');
  const [phSolo, setPhSolo] = useState('');
  const [climaIdeal, setClimaIdeal] = useState('');
  const [categoriasIa, setCategoriasIa] = useState('');
  const [precoSugerido, setPrecoSugerido] = useState('0');
  const [busca, setBusca] = useState('');
  const [filtroCiclo, setFiltroCiclo] = useState('todos');
  const [loadingAI, setLoadingAI] = useState(false);
  const [progressoIA, setProgressoIA] = useState(0);
  const [totalEspeciesIA, setTotalEspeciesIA] = useState(0);

  async function loadEspecies() {
    const { data } = await supabase.from('especies').select('*').order('nome');
    if (data) setEspecies(data);
  }

  useEffect(() => {
    loadEspecies();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    setLoading(true);

    try {
      const payload = {
        nome,
        nome_cientifico: nomeCientifico,
        descricao,
        condicoes_ideais: condicoesIdeais,
        tempo_estimado_germinacao_dias: diasGerminacao ? parseInt(diasGerminacao) : null,
        tempo_estimado_floracao_dias: diasFloracao ? parseInt(diasFloracao) : null,
        url_foto: urlFoto,
        dificuldade,
        frequencia_rega: frequenciaRega,
        tipo_solo: tipoSolo,
        ph_solo: phSolo,
        clima_ideal: climaIdeal,
        categorias_ia: categoriasIa,
        preco_sugerido: parseFloat(precoSugerido) || 0
      };

      if (editingId) {
        await supabase.from('especies').update(payload).eq('id', editingId);
      } else {
        await supabase.from('especies').insert([payload]);
      }
      resetForm();
      loadEspecies();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarComIA = async () => {
    if (!nome) return alert(t('search'));
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/completar-especie', {
        method: 'POST',
        body: JSON.stringify({ especie: nome })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCondicoesIdeais(data.analise.condicoes_ideais);
      setDiasGerminacao(data.analise.dias_germinacao?.toString() || '');
      setDiasFloracao(data.analise.dias_colheita?.toString() || '');
      setNomeCientifico(data.analise.nome_cientifico || '');
      setDescricao(data.analise.descricao || '');
      setDificuldade(data.analise.dificuldade || '');
      setFrequenciaRega(data.analise.frequencia_rega || '');
      setTipoSolo(data.analise.tipo_solo || '');
      setPhSolo(data.analise.ph_solo || '');
      setClimaIdeal(data.analise.clima_ideal || '');
      setCategoriasIa(data.analise.categorias_ia || '');
      setPrecoSugerido(data.analise.preco_sugerido?.toString() || '0');
      
      const termoBusca = data.analise.nome_cientifico || nome;
      buscarNovaFoto(termoBusca);
    } catch (e: any) {
      alert("AI Error: " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const buscarNovaFoto = async (termo?: string) => {
    const q = termo || nome;
    setLoadingAI(true);
    try {
      const fotoRes = await fetch(`/api/buscar-foto?query=${encodeURIComponent(q)}`);
      const fotoData = await fotoRes.json();
      if (fotoData.url) setUrlFoto(fotoData.url);
    } catch (err) {
      console.log("Error searching photo.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEdit = (esp: any) => {
    setEditingId(esp.id);
    setNome(esp.nome || '');
    setNomeCientifico(esp.nome_cientifico || '');
    setDescricao(esp.descricao || '');
    setCondicoesIdeais(esp.condicoes_ideais || '');
    setDiasGerminacao(esp.tempo_estimado_germinacao_dias?.toString() || esp.dias_germinacao?.toString() || '');
    setDiasFloracao(esp.tempo_estimado_floracao_dias?.toString() || '');
    setUrlFoto(esp.url_foto || '');
    setDificuldade(esp.dificuldade || '');
    setFrequenciaRega(esp.frequencia_rega || '');
    setTipoSolo(esp.tipo_solo || '');
    setPhSolo(esp.ph_solo || '');
    setClimaIdeal(esp.clima_ideal || '');
    setCategoriasIa(esp.categorias_ia || '');
    setPrecoSugerido(esp.preco_sugerido?.toString() || '0');
  };

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setNomeCientifico('');
    setDescricao('');
    setCondicoesIdeais('');
    setDiasGerminacao('');
    setDiasFloracao('');
    setUrlFoto('');
    setDificuldade('');
    setFrequenciaRega('');
    setTipoSolo('');
    setPhSolo('');
    setClimaIdeal('');
    setCategoriasIa('');
    setPrecoSugerido('0');
  };

  const handleDelete = async (id: string, n: string) => {
    if (!confirm(t('delete') + ` "${n}"?`)) return;
    await supabase.from('especies').delete().eq('id', id);
    loadEspecies();
  };

  const especiesFiltradas = especies.filter(esp => {
    const nomeNormalizado = (esp.nome || '').toLowerCase();
    const cientificoNormalizado = (esp.nome_cientifico || '').toLowerCase();
    const buscaNormalizada = busca.toLowerCase();
    
    const matchBusca = nomeNormalizado.includes(buscaNormalizada) || 
                       cientificoNormalizado.includes(buscaNormalizada);
    
    const dias = esp.tempo_estimado_floracao_dias || 0;
    
    if (filtroCiclo === 'rapido') return matchBusca && (dias > 0 && dias <= 60);
    if (filtroCiclo === 'longo') return matchBusca && (dias > 60);
    
    return matchBusca;
  });

  const handleAtualizarTudo = async () => {
    const especiesParaAtualizar = especies.filter(e => !e.nome_cientifico || !e.tipo_solo);
    if (especiesParaAtualizar.length === 0) return alert("Todas as espécies já possuem dados botânicos.");
    
    if (!confirm(`${t('updating_catalog')} (${especiesParaAtualizar.length} ${t('species')}). ¿Continuar?`)) return;
    
    setLoading(true);
    setTotalEspeciesIA(especiesParaAtualizar.length);
    setProgressoIA(0);
    let sucessos = 0;

    for (const esp of especiesParaAtualizar) {
      try {
        const res = await fetch('/api/ai/completar-especie', {
          method: 'POST',
          body: JSON.stringify({ especie: esp.nome })
        });
        const data = await res.json();
        if (res.ok && data.analise) {
          const payload = {
            nome_cientifico: data.analise.nome_cientifico,
            descricao: data.analise.descricao,
            condicoes_ideais: data.analise.condicoes_ideais,
            tempo_estimado_germinacao_dias: data.analise.dias_germinacao,
            tempo_estimado_floracao_dias: data.analise.dias_colheita,
            dificuldade: data.analise.dificuldade,
            frequencia_rega: data.analise.frequencia_rega,
            tipo_solo: data.analise.tipo_solo,
            ph_solo: data.analise.ph_solo,
            clima_ideal: data.analise.clima_ideal,
            categorias_ia: data.analise.categorias_ia,
            preco_sugerido: data.analise.preco_sugerido
          };
          await supabase.from('especies').update(payload).eq('id', esp.id);
          sucessos++;
        }
      } catch (e) {
        console.error(`Erro ao atualizar ${esp.nome}:`, e);
      }
      setProgressoIA(prev => prev + 1);
    }
    
    alert(`${sucessos} ${t('species')} ${t('processed')}!`);
    loadEspecies();
    setLoading(false);
    setProgressoIA(0);
    setTotalEspeciesIA(0);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-3 rounded-2xl">
            <Flower2 className="text-green-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('species')}</h1>
            <p className="text-secondary text-sm">Gestiona el catálogo botánico de tu vivero.</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={handleAtualizarTudo} 
            disabled={loading || loadingAI}
            className="bg-purple-100 text-purple-700 px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-purple-200 transition border-2 border-purple-200 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={14}/> {t('updating_catalog')} (IA)
          </button>
          {totalEspeciesIA > 0 && (
            <div className="w-48 bg-purple-100 rounded-full h-2 overflow-hidden border border-purple-200">
              <div 
                className="bg-purple-600 h-full transition-all duration-500" 
                style={{ width: `${(progressoIA / totalEspeciesIA) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      <form onSubmit={handleSalvar} className="bg-surface-container-low p-8 rounded-[2rem] border border-surface-container-highest flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-purple-600 text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest shadow-lg">
          <Bot size={14}/> {t('ai_connected')}
        </div>

        <div className="flex flex-col gap-8 mt-6">
          
          {/* SEÇÃO 1: Identificação e Foto */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">{t('common_name')}</label>
                  <div className="flex gap-2">
                    <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Rosa" className="flex-1 bg-white border-2 border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none focus:border-primary font-bold text-lg shadow-sm transition-all" />
                    <button type="button" onClick={handleCompletarComIA} disabled={loadingAI} className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl font-black text-xs shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                      {loadingAI ? '...' : <><Sparkles size={14}/> IA</>}
                    </button>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">{t('scientific_name')}</label>
                  <input type="text" value={nomeCientifico} onChange={(e) => setNomeCientifico(e.target.value)} placeholder="Scientific name..." className="w-full bg-white border-2 border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none italic font-semibold focus:border-secondary shadow-sm transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">{t('price')} (COP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold opacity-40">$</span>
                    <input type="number" value={precoSugerido} onChange={(e) => setPrecoSugerido(e.target.value)} className="w-full bg-white border-2 border-surface-container-highest rounded-xl pl-10 pr-4 py-3 outline-none font-black text-green-700 focus:border-green-600 shadow-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">{t('difficulty')}</label>
                  <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value)} className="w-full bg-white border-2 border-surface-container-highest rounded-xl px-4 py-3 outline-none font-bold focus:border-primary shadow-sm cursor-pointer h-[52px]">
                    <option value="Baixa">🟢 {t('difficulty')} Baixa</option>
                    <option value="Média">🟡 {t('difficulty')} Média</option>
                    <option value="Alta">🔴 {t('difficulty')} Alta</option>
                    <option value="Expert">💎 Expert</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">{t('climate')}</label>
                  <select value={climaIdeal} onChange={(e) => setClimaIdeal(e.target.value)} className="w-full bg-white border-2 border-surface-container-highest rounded-xl px-4 py-3 outline-none font-bold focus:border-primary shadow-sm cursor-pointer h-[52px]">
                    <option value="">{t('climate')}...</option>
                    <option value="Cálido">☀️ Cálido</option>
                    <option value="Templado">⛅ Templado</option>
                    <option value="Frío">❄️ Frío</option>
                    <option value="Tropical">🏝️ Tropical</option>
                    <option value="Desértico">🌵 Desértico</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 h-full">
              <div className="space-y-2 h-full">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest text-center block">{t('photo')}</label>
                <div className="bg-white border-2 border-dashed border-surface-container-highest rounded-3xl p-4 h-[190px] flex flex-col items-center justify-center relative group hover:border-primary/50 transition-all shadow-sm overflow-hidden">
                  {urlFoto ? (
                    <>
                      <img src={urlFoto} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl">
                        <button type="button" onClick={() => buscarNovaFoto()} className="bg-white text-black px-4 py-2 rounded-full font-black text-xs shadow-2xl hover:scale-105 transition flex items-center gap-2">
                          <Sparkles size={14}/> Nova Foto
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Flower2 size={32} className="text-secondary opacity-30" />
                      <button type="button" onClick={() => buscarNovaFoto()} className="bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-[10px] hover:bg-primary hover:text-white transition flex items-center gap-2 uppercase tracking-tighter">
                        <Camera size={14}/> Buscar Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Ficha Técnica (Reorganizada para evitar estouro) */}
          <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-surface-container-highest shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Germinação e Ciclo em 4 colunas cada (total 8) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Germinación</label>
              <div className="flex items-center bg-white border-2 border-surface-container-highest rounded-xl px-4 h-[52px] focus-within:border-primary transition-all">
                <input type="number" value={diasGerminacao} onChange={(e) => setDiasGerminacao(e.target.value)} className="flex-1 outline-none font-black text-lg bg-transparent w-full" placeholder="0" />
                <span className="text-[9px] font-black text-secondary opacity-40 uppercase ml-2">días</span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ciclo Floración</label>
              <div className="flex items-center bg-white border-2 border-surface-container-highest rounded-xl px-4 h-[52px] focus-within:border-primary transition-all">
                <input type="number" value={diasFloracao} onChange={(e) => setDiasFloracao(e.target.value)} className="flex-1 outline-none font-black text-lg bg-transparent w-full" placeholder="0" />
                <span className="text-[9px] font-black text-secondary opacity-40 uppercase ml-2">días</span>
              </div>
            </div>

            {/* Rega com mais espaço (6 colunas) */}
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Frecuencia de Riego</label>
              <input type="text" value={frequenciaRega} onChange={(e) => setFrequenciaRega(e.target.value)} placeholder="Ex: Cada 2-3 dias" className="w-full bg-white border-2 border-surface-container-highest rounded-xl px-4 py-3 outline-none font-semibold text-sm focus:border-primary transition-all h-[52px]" />
            </div>

            {/* Solo e pH em uma linha nova com 12 colunas */}
            <div className="md:col-span-12 space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">{t('soil')} y {t('ph')}</label>
              <div className="flex flex-col md:flex-row gap-4">
                <select value={tipoSolo} onChange={(e) => setTipoSolo(e.target.value)} className="flex-1 bg-white border-2 border-surface-container-highest rounded-xl px-4 py-3 outline-none font-bold focus:border-primary transition-all h-[52px] cursor-pointer">
                  <option value="">{t('soil')}...</option>
                  <option value="Arenoso">Arenoso</option>
                  <option value="Arcilloso">Arcilloso</option>
                  <option value="Franco">Franco</option>
                  <option value="Orgânico">Orgânico</option>
                </select>
                <div className="flex-[0.5] relative">
                  <input type="text" value={phSolo} onChange={(e) => setPhSolo(e.target.value)} placeholder="pH (ex: 6.5)" className="w-full bg-white border-2 border-surface-container-highest rounded-xl px-4 py-3 outline-none text-center font-black focus:border-primary transition-all h-[52px]" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Categorias e Textos */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Categorías de Mercado (Tags)</label>
              <input type="text" value={categoriasIa} onChange={(e) => setCategoriasIa(e.target.value)} placeholder="Ex: Sombra, Interior, Resistente, Medicinal..." className="w-full bg-white border-2 border-surface-container-highest rounded-xl px-6 py-4 outline-none font-bold text-base text-primary focus:border-primary shadow-sm transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                  <Bot size={14} className="text-primary"/> {t('ideal_conditions')}
                </label>
                <textarea rows={4} value={condicoesIdeais} onChange={(e) => setCondicoesIdeais(e.target.value)} className="w-full bg-white border-2 border-surface-container-highest text-on-surface rounded-3xl px-6 py-4 outline-none resize-none text-sm leading-relaxed focus:border-primary shadow-sm transition-all" placeholder="Requisitos de luz e cuidados..."></textarea>
              </div>
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                   Descripción / Historia
                </label>
                <textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-white border-2 border-surface-container-highest text-on-surface rounded-3xl px-6 py-4 outline-none resize-none text-sm leading-relaxed focus:border-primary shadow-sm transition-all" placeholder="História e curiosidades..."></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé: Ações */}
        <div className="flex gap-4 justify-end mt-4 pt-6 border-t-2 border-surface-container-highest">
          {editingId && (
            <button type="button" onClick={resetForm} className="bg-surface-container-high text-secondary font-black px-8 py-4 rounded-2xl hover:bg-surface-container-highest transition flex items-center gap-2 uppercase text-xs tracking-widest">
               <X size={20} /> {t('cancel')}
            </button>
          )}
          <button disabled={loading} type="submit" className="bg-green-900 text-white font-black px-12 py-4 rounded-2xl shadow-[0_10px_20px_rgba(26,61,26,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 uppercase text-sm tracking-widest">
            {loading ? '...' : (editingId ? <><Save size={20} /> {t('save')}</> : <><Plus size={20} /> {t('save')}</>)}
          </button>
        </div>
      </form>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-sm">
        <div className="relative flex-1 w-full">
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t('search')} className="w-full bg-surface border border-surface-container-highest rounded-xl pl-10 pr-4 py-2 outline-none focus:border-primary" />
          <Bot size={18} className="absolute left-3 top-2.5 text-secondary opacity-50" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setFiltroCiclo('todos')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filtroCiclo === 'todos' ? 'bg-primary text-on-primary' : 'bg-surface text-secondary hover:bg-surface-container'}`}>{t('all')}</button>
          <button onClick={() => setFiltroCiclo('rapido')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filtroCiclo === 'rapido' ? 'bg-green-600 text-white' : 'bg-surface text-secondary hover:bg-surface-container'}`}>{t('fast_cycle')} (≤ 60d)</button>
          <button onClick={() => setFiltroCiclo('longo')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filtroCiclo === 'longo' ? 'bg-orange-600 text-white' : 'bg-surface text-secondary hover:bg-surface-container'}`}>{t('long_cycle')} (&gt; 60d)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {especiesFiltradas.map(esp => (
          <div key={esp.id} className="bg-surface-container-lowest rounded-2xl border border-surface-container hover:border-primary/30 transition group overflow-hidden flex flex-col">
            {esp.url_foto && (
              <div className="h-32 w-full relative overflow-hidden">
                <img src={esp.url_foto} alt={esp.nome} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent opacity-60"></div>
              </div>
            )}
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-black text-lg text-on-surface leading-tight">{esp.nome}</h3>
                  {esp.nome_cientifico && <p className="text-xs text-primary font-medium italic opacity-70 mb-2">{esp.nome_cientifico}</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => handleEdit(esp)} className="text-secondary hover:text-primary bg-surface p-1.5 rounded-lg shadow-sm border border-surface-container"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(esp.id, esp.nome)} className="text-secondary hover:text-error bg-surface p-1.5 rounded-lg shadow-sm border border-surface-container"><Trash2 size={16}/></button>
                </div>
              </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {esp.tempo_estimado_germinacao_dias && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md">
                  🌱 ~{esp.tempo_estimado_germinacao_dias}d
                </span>
              )}
              {esp.tempo_estimado_floracao_dias && (
                <span className="bg-orange-500/10 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-md">
                  🌸 ~{esp.tempo_estimado_floracao_dias}d
                </span>
              )}
              {esp.dificuldade && (
                <span className="bg-surface-container-high text-on-surface text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  {esp.dificuldade === 'Baixa' ? '🟢' : esp.dificuldade === 'Média' ? '🟡' : '🔴'} {esp.dificuldade}
                </span>
              )}
              {esp.clima_ideal && (
                <span className="bg-blue-500/10 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md">
                   ☁️ {esp.clima_ideal}
                </span>
              )}
            </div>

            {/* Chips de Categorias (IA) */}
            {esp.categorias_ia && (
              <div className="flex flex-wrap gap-1 mb-3">
                {esp.categorias_ia.split(',').map((cat: string, i: number) => (
                  <span key={i} className="bg-purple-500/10 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-purple-500/20">
                    #{cat.trim()}
                  </span>
                ))}
              </div>
            )}
            
            <div className="bg-surface-container-low p-3 rounded-xl mb-3 relative">
               <p className="text-[11px] text-secondary line-clamp-2 leading-relaxed italic">
                {esp.condicoes_ideais || t('search')}
              </p>
              {esp.preco_sugerido > 0 && (
                <div className="absolute -top-3 -right-2 bg-green-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                  ${esp.preco_sugerido.toLocaleString()} COP
                </div>
              )}
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
