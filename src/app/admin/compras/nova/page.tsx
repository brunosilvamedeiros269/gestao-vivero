'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ImagePlus, Camera, Package, Truck, Calendar, DollarSign, Calculator } from 'lucide-react';

export default function NovaCompraPage() {
  const router = useRouter();
  
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [isSemente, setIsSemente] = useState(false);
  const [isVaso, setIsVaso] = useState(false);
  const [modoCalcVaso, setModoCalcVaso] = useState<'direto' | 'dimensoes'>('direto');
  const [vasoDimensoes, setVasoDimensoes] = useState({ diametroCm: '', alturaCm: '' });
  const [foto, setFoto] = useState<File | null>(null);

  const [form, setForm] = useState({
    categoria_id: '',
    especie_id: '',
    fornecedor_id: '',
    nome_item: '',
    data_compra: new Date().toISOString().split('T')[0],
    unidade_medida: 'Gramas',
    quantidade_comprada: '',
    custo_total: '',
    capacidade_substrato_vazao: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      const { data: f } = await supabase.from('fornecedores').select('id, nome_fantasia');
      const { data: c } = await supabase.from('categorias_insumo').select('id, nome');
      const { data: e } = await supabase.from('especies').select('id, nome');
      
      if (f) setFornecedores(f);
      if (c) setCategorias(c);
      if (e) setEspecies(e);
    }
    loadOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'categoria_id') {
      const selectedCat = categorias.find(c => c.id === value);
      const catName = selectedCat?.nome.toLowerCase() || '';
      setIsSemente(catName.includes('semente'));
      setIsVaso(catName.includes('vaso') || catName.includes('matera') || catName.includes('bandeja'));
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDimensoesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const novasDimensoes = { ...vasoDimensoes, [name]: value };
    setVasoDimensoes(novasDimensoes);

    if (novasDimensoes.diametroCm && novasDimensoes.alturaCm) {
      const d = parseFloat(novasDimensoes.diametroCm);
      const h = parseFloat(novasDimensoes.alturaCm);
      const raio = d / 2;
      const volLitros = (Math.PI * Math.pow(raio, 2) * h) / 1000;
      setForm(prev => ({ ...prev, capacidade_substrato_vazao: volLitros.toFixed(3) }));
    } else {
      setForm(prev => ({ ...prev, capacidade_substrato_vazao: '' }));
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let urlFoto = null;

      if (foto) {
        const fileName = `compra-${Date.now()}-${foto.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { error: uploadError } = await supabase.storage
          .from('notas_compras')
          .upload(fileName, foto, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('notas_compras').getPublicUrl(fileName);
        urlFoto = publicUrl;
      }

      const payload = {
        categoria_id: form.categoria_id,
        especie_id: isSemente && form.especie_id ? form.especie_id : null,
        fornecedor_id: form.fornecedor_id,
        nome_item: form.nome_item,
        data_compra: form.data_compra,
        unidade_medida: form.unidade_medida,
        quantidade_comprada: parseFloat(form.quantidade_comprada),
        quantidade_restante: parseFloat(form.quantidade_comprada),
        custo_total: parseFloat(form.custo_total),
        capacidade_substrato_vazao: isVaso && form.capacidade_substrato_vazao ? parseFloat(form.capacidade_substrato_vazao) : 0,
        url_foto: urlFoto
      };

      const { error } = await supabase.from('compras_insumos').insert([payload]);
      if (error) throw error;
      
      router.push('/admin/compras');
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-surface pb-20">
      {/* Header App Style */}
      <header className="sticky top-0 z-[100] bg-surface border-b border-surface-container px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-full transition">
            <ArrowLeft size={24} className="text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-black text-on-surface leading-tight">Nova Compra</h1>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Registrar Insumo</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8">
        <form onSubmit={handleSalvar} className="space-y-8">
          
          {/* Seção 1: Identificação */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Package size={16} className="text-primary" />
              <h2 className="text-xs font-black text-secondary uppercase tracking-widest">Identificação</h2>
            </div>
            
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-surface-container shadow-sm space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">O que você comprou?</label>
                <input required type="text" name="nome_item" value={form.nome_item} onChange={handleChange} placeholder="Ex: Sementes Premium" className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold shadow-sm transition-all" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Categoria</label>
                  <select required name="categoria_id" value={form.categoria_id} onChange={handleChange} className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-3 outline-none font-bold">
                    <option value="">Selecione...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                {isSemente && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Espécie Associada</label>
                    <select required name="especie_id" value={form.especie_id} onChange={handleChange} className="w-full bg-primary/5 border-2 border-primary/30 text-primary rounded-2xl px-5 py-3 outline-none font-black shadow-sm">
                      <option value="">Selecione a Espécie...</option>
                      {especies.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Seção 2: Medidas Específicas (Vaso/Bandeja) */}
          {isVaso && (
            <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 px-1">
                <Calculator size={16} className="text-secondary" />
                <h2 className="text-xs font-black text-secondary uppercase tracking-widest">Volumetria</h2>
              </div>
              
              <div className="bg-surface-container-low p-6 rounded-[2rem] border border-surface-container shadow-sm space-y-4">
                <div className="flex bg-white p-1.5 rounded-2xl border border-surface-container">
                  <button type="button" onClick={() => setModoCalcVaso('direto')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ${modoCalcVaso === 'direto' ? 'bg-primary text-on-primary shadow-lg' : 'text-secondary'}`}>Informar Litros</button>
                  <button type="button" onClick={() => setModoCalcVaso('dimensoes')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition ${modoCalcVaso === 'dimensoes' ? 'bg-primary text-on-primary shadow-lg' : 'text-secondary'}`}>Calcular Dimensões</button>
                </div>

                {modoCalcVaso === 'dimensoes' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-secondary uppercase tracking-widest ml-1">Boca (cm)</label>
                      <input type="number" step="0.1" name="diametroCm" value={vasoDimensoes.diametroCm} onChange={handleDimensoesChange} placeholder="15" className="w-full bg-white border border-surface-container rounded-xl px-4 py-2 font-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-secondary uppercase tracking-widest ml-1">Altura (cm)</label>
                      <input type="number" step="0.1" name="alturaCm" value={vasoDimensoes.alturaCm} onChange={handleDimensoesChange} placeholder="20" className="w-full bg-white border border-surface-container rounded-xl px-4 py-2 font-black" />
                    </div>
                  </div>
                )}

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <label className="text-[9px] font-black text-primary uppercase tracking-widest">Resultado do Volume (L/Kg)</label>
                  <input required type="number" step="0.001" readOnly={modoCalcVaso === 'dimensoes'} name="capacidade_substrato_vazao" value={form.capacidade_substrato_vazao} onChange={handleChange} className={`w-full bg-transparent text-xl font-black text-primary outline-none mt-1 ${modoCalcVaso === 'dimensoes' ? 'opacity-70' : ''}`} placeholder="0.000" />
                </div>
              </div>
            </section>
          )}

          {/* Seção 3: Valores e Logística */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Truck size={16} className="text-secondary" />
              <h2 className="text-xs font-black text-secondary uppercase tracking-widest">Logística e Valores</h2>
            </div>
            
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-surface-container shadow-sm space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Fornecedor</label>
                <select required name="fornecedor_id" value={form.fornecedor_id} onChange={handleChange} className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-3 outline-none font-bold">
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Data</label>
                  <input required type="date" name="data_compra" value={form.data_compra} onChange={handleChange} className="w-full bg-white border-2 border-surface-container rounded-2xl px-5 py-3 outline-none font-bold" />
                </div>
                <div className="space-y-1.5 text-right">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest mr-1">Foto da Nota</label>
                  <label className="flex items-center justify-center gap-2 h-[52px] bg-surface-container-high border-2 border-dashed border-surface-container rounded-2xl px-4 cursor-pointer text-primary active:scale-95 transition">
                    <Camera size={18} />
                    <span className="text-[10px] font-black uppercase truncate">{foto ? 'Anexada' : 'Anexar'}</span>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setFoto(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Quantidade</label>
                  <div className="flex items-center bg-white border-2 border-surface-container rounded-2xl px-5 py-3">
                    <input required type="number" step="0.0001" name="quantidade_comprada" value={form.quantidade_comprada} onChange={handleChange} placeholder="0.0" className="w-full outline-none font-black" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Unidade</label>
                  <select required name="unidade_medida" value={form.unidade_medida} onChange={handleChange} className="w-full bg-white border-2 border-surface-container rounded-2xl px-4 py-3 outline-none font-bold text-xs">
                    <option value="Gramas">Gramas</option>
                    <option value="Kg">Kg</option>
                    <option value="Litros">Litros</option>
                    <option value="Unidades">Unid.</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-green-700 uppercase tracking-widest ml-1">Custo Total (NF)</label>
                <div className="relative">
                  <DollarSign size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-green-600 opacity-50" />
                  <input required type="number" step="0.01" name="custo_total" value={form.custo_total} onChange={handleChange} placeholder="0.00" className="w-full bg-white border-2 border-green-200 text-green-900 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-green-600 font-black text-xl shadow-sm transition-all" />
                </div>
              </div>
            </div>
          </section>

          <button disabled={loading} type="submit" className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm">
            {loading ? (
              <span className="flex items-center gap-2">Processando...</span>
            ) : (
              <>
                <Save size={20} />
                <span>Salvar no Estoque</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
