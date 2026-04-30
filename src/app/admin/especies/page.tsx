'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import { Flower2, Plus, Save, Trash2, Edit2, Bot, Sparkles, X, Camera, ArrowLeft, Search, Filter as FilterIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EspeciesAdmin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [especies, setEspecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [condicoesIdeais, setCondicoesIdeais] = useState('');
  const [diasGerminacao, setDiasGerminacao] = useState('');
  const [diasFloracao, setDiasFloracao] = useState('');
  const [nomeCientifico, setNomeCientifico] = useState('');
  const [urlFoto, setUrlFoto] = useState('');
  const [urlFotoComercial, setUrlFotoComercial] = useState('');
  const [dificuldade, setDificuldade] = useState('Baixa');
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
        url_foto_comercial: urlFotoComercial,
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
      setShowForm(false);
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
    setUrlFotoComercial(esp.url_foto_comercial || '');
    setDificuldade(esp.dificuldade || 'Baixa');
    setFrequenciaRega(esp.frequencia_rega || '');
    setTipoSolo(esp.tipoSolo || '');
    setPhSolo(esp.phSolo || '');
    setClimaIdeal(esp.clima_ideal || '');
    setCategoriasIa(esp.categorias_ia || '');
    setPrecoSugerido(esp.preco_sugerido?.toString() || '0');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setUrlFotoComercial('');
    setDificuldade('Baixa');
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

  return (
    <div className="bg-background min-h-screen text-on-surface pb-20">
      {/* Header App Style */}
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => showForm ? setShowForm(false) : router.push('/')} className="p-2 hover:bg-surface-container rounded-full transition">
            <ArrowLeft size={24} className="text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-black text-on-surface leading-tight">{showForm ? (editingId ? 'Editar Espécie' : 'Nova Espécie') : 'Catálogo'}</h1>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{especies.length} espécies cadastradas</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="p-3 bg-primary text-on-primary rounded-2xl shadow-lg active:scale-95 transition">
            <Plus size={20} />
          </button>
        )}
      </header>

      <main className="px-6 py-6 space-y-6">
        
        {showForm ? (
          /* FORMULARIO MOBILE-FIRST */
          <form onSubmit={handleSalvar} className="space-y-6">
            <div className="bg-surface-container-low p-6 rounded-[2.5rem] border border-surface-container shadow-xl space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-purple-600 text-white px-5 py-2 rounded-bl-3xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                 <Bot size={12}/> IA Ativa
               </div>

               {/* Fotos: Evolutiva vs Comercial */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Foto de Produção (Evolutiva)</label>
                   <div className="aspect-square bg-white border-2 border-dashed border-surface-container-highest rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                     {urlFoto ? (
                       <>
                         <img src={urlFoto} alt="Preview" className="w-full h-full object-cover" />
                         <button type="button" onClick={() => buscarNovaFoto()} className="absolute bottom-4 right-4 p-4 bg-white/90 backdrop-blur text-black rounded-full shadow-2xl hover:scale-105 transition">
                           <Camera size={20} className="text-secondary" />
                         </button>
                       </>
                     ) : (
                       <div className="text-center p-6">
                          <Flower2 size={32} className="mx-auto text-surface-container-highest mb-4" />
                          <button type="button" onClick={() => buscarNovaFoto()} className="bg-secondary/10 text-secondary px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Camera size={14}/> Buscar Produção
                          </button>
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Foto Comercial (PDV & Venda)</label>
                   <div className="aspect-square bg-[#064E3B]/5 border-2 border-dashed border-[#064E3B]/20 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                     {urlFotoComercial ? (
                       <>
                         <img src={urlFotoComercial} alt="Preview Comercial" className="w-full h-full object-cover" />
                         <button type="button" onClick={() => buscarNovaFoto('comercial')} className="absolute bottom-4 right-4 p-4 bg-[#064E3B] text-white rounded-full shadow-2xl hover:scale-105 transition">
                           <Sparkles size={20} />
                         </button>
                       </>
                     ) : (
                       <div className="text-center p-6">
                          <Sparkles size={32} className="mx-auto text-[#064E3B]/30 mb-4" />
                          <button type="button" onClick={async () => {
                            const q = nome + " plant studio photography high resolution";
                            setLoadingAI(true);
                            try {
                              const res = await fetch(`/api/buscar-foto?query=${encodeURIComponent(q)}`);
                              const data = await res.json();
                              if (data.url) setUrlFotoComercial(data.url);
                            } finally { setLoadingAI(false); }
                          }} className="bg-[#064E3B] text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
                            <Bot size={14}/> Buscar Imagem HD
                          </button>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Nome Popular</label>
                    <div className="flex gap-2">
                      <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Girassol" className="flex-1 bg-white border-2 border-surface-container rounded-2xl px-5 py-4 outline-none focus:border-primary font-black text-lg shadow-sm transition-all" />
                      <button type="button" onClick={handleCompletarComIA} disabled={loadingAI} className="bg-purple-600 text-white px-4 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 transition">
                        {loadingAI ? '...' : <Sparkles size={20}/>}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Nome Científico</label>
                    <input type="text" value={nomeCientifico} onChange={(e) => setNomeCientifico(e.target.value)} placeholder="Helianthus annuus" className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-3 outline-none italic font-bold focus:border-secondary shadow-sm transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Preço Sugerido</label>
                      <input type="number" value={precoSugerido} onChange={(e) => setPrecoSugerido(e.target.value)} className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-3 outline-none font-black text-green-700" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Dificuldade</label>
                      <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value)} className="w-full bg-white border-2 border-surface-container rounded-2xl px-4 py-3 outline-none font-bold">
                        <option value="Baixa">🟢 Baixa</option>
                        <option value="Média">🟡 Média</option>
                        <option value="Alta">🔴 Alta</option>
                      </select>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-[2.5rem] border border-surface-container shadow-sm space-y-4">
               <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-2 border-b border-surface-container pb-2">Ficha Técnica</h3>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-primary uppercase tracking-widest">Germinação (dias)</label>
                   <input type="number" value={diasGerminacao} onChange={(e) => setDiasGerminacao(e.target.value)} className="w-full bg-white border border-surface-container rounded-xl px-4 py-2 font-black" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-primary uppercase tracking-widest">Ciclo Total (dias)</label>
                   <input type="number" value={diasFloracao} onChange={(e) => setDiasFloracao(e.target.value)} className="w-full bg-white border border-surface-container rounded-xl px-4 py-2 font-black" />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-black text-secondary uppercase tracking-widest">Frequência de Rega</label>
                 <input type="text" value={frequenciaRega} onChange={(e) => setFrequenciaRega(e.target.value)} className="w-full bg-white border border-surface-container rounded-xl px-4 py-2 font-bold text-sm" />
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-black text-secondary uppercase tracking-widest">Descrição / Requisitos IA</label>
                 <textarea rows={4} value={condicoesIdeais} onChange={(e) => setCondicoesIdeais(e.target.value)} className="w-full bg-white border border-surface-container rounded-2xl px-4 py-3 text-xs leading-relaxed outline-none resize-none" />
               </div>
            </div>

            <div className="flex gap-4">
               <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-surface-container-highest text-secondary font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95 transition">Cancelar</button>
               <button type="submit" disabled={loading} className="flex-[2] py-4 bg-primary text-on-primary font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest active:scale-95 transition">
                 {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Salvar Espécie')}
               </button>
            </div>
          </form>
        ) : (
          /* LISTAGEM MOBILE-FIRST */
          <div className="space-y-6">
            {/* Busca e Filtros */}
            <div className="space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50" />
                <input 
                  type="text" 
                  value={busca} 
                  onChange={(e) => setBusca(e.target.value)} 
                  placeholder="Pesquisar espécie..." 
                  className="w-full bg-surface-container-low border border-surface-container rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-primary shadow-sm" 
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setFiltroCiclo('todos')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filtroCiclo === 'todos' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-secondary'}`}>Todos</button>
                <button onClick={() => setFiltroCiclo('rapido')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filtroCiclo === 'rapido' ? 'bg-green-600 text-white' : 'bg-surface-container-low text-secondary'}`}>Ciclo Rápido</button>
                <button onClick={() => setFiltroCiclo('longo')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filtroCiclo === 'longo' ? 'bg-orange-600 text-white' : 'bg-surface-container-low text-secondary'}`}>Ciclo Longo</button>
              </div>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 gap-4">
              {especiesFiltradas.map(esp => (
                <div key={esp.id} className="bg-surface-container-lowest rounded-3xl border border-surface-container overflow-hidden shadow-sm active:scale-[0.98] transition-all group">
                  <div className="flex">
                    <div className="w-24 h-32 relative flex-shrink-0">
                      {esp.url_foto ? (
                        <img src={esp.url_foto} alt={esp.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container flex items-center justify-center text-surface-container-highest">
                          <Flower2 size={32} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                         <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${esp.dificuldade === 'Baixa' ? 'bg-green-500' : esp.dificuldade === 'Média' ? 'bg-amber-500' : 'bg-error'}`}></div>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-on-surface leading-tight">{esp.nome}</h3>
                          <p className="text-[9px] font-bold text-secondary uppercase tracking-tighter italic">{esp.nome_cientifico || 'N/A'}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleEdit(esp)} className="p-2 bg-surface-container-low text-secondary rounded-xl hover:text-primary transition"><Edit2 size={16}/></button>
                           <button onClick={() => handleDelete(esp.id, esp.nome)} className="p-2 bg-surface-container-low text-secondary rounded-xl hover:text-error transition"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-2">
                           <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">🌱 {esp.tempo_estimado_germinacao_dias || '?'}d</span>
                           <span className="text-[10px] font-black text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md">🌸 {esp.tempo_estimado_floracao_dias || '?'}d</span>
                        </div>
                        {esp.preco_sugerido > 0 && (
                          <span className="text-xs font-black text-green-700">${esp.preco_sugerido.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {especiesFiltradas.length === 0 && (
               <div className="py-20 text-center space-y-4">
                 <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto text-surface-container-highest">
                    <Search size={40} />
                 </div>
                 <p className="text-sm font-bold text-secondary">Nenhuma espécie encontrada.</p>
                 <button onClick={() => { resetForm(); setShowForm(true); }} className="text-primary text-xs font-black uppercase underline">Cadastrar primeira</button>
               </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
