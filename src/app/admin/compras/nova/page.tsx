'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ImagePlus } from 'lucide-react';

export default function NovaCompraPage() {
  const router = useRouter();
  
  // States para opções dos selects
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [isSemente, setIsSemente] = useState(false);
  const [isVaso, setIsVaso] = useState(false);
  const [modoCalcVaso, setModoCalcVaso] = useState<'direto' | 'dimensoes'>('direto');
  const [vasoDimensoes, setVasoDimensoes] = useState({ diametroCm: '', alturaCm: '' });

  // Evidência Fotográfica opcional
  const [foto, setFoto] = useState<File | null>(null);

  // States do Formulário
  const [form, setForm] = useState({
    categoria_id: '',
    especie_id: '',
    fornecedor_id: '',
    nome_item: '',
    data_compra: new Date().toISOString().split('T')[0],
    unidade_medida: 'Gramas', // Default ajustado para mais comum
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
    
    // Se mudou a categoria, verificar se é "semente" ou "vaso"
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
      // Volume Cilindro: Pi * R² * H (em cm³). Divide por 1000 para Litros.
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

      // Upload de Foto da Nota (Se existir)
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
        quantidade_restante: parseFloat(form.quantidade_comprada), // Estoque inicial
        custo_total: parseFloat(form.custo_total),
        capacidade_substrato_vazao: isVaso && form.capacidade_substrato_vazao ? parseFloat(form.capacidade_substrato_vazao) : 0,
        url_foto: urlFoto
      };

      const { error } = await supabase.from('compras_insumos').insert([payload]);

      if (error) throw error;
      
      alert('Compra salva com sucesso!');
      router.push('/admin/compras'); // Voltar para tabela
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      <nav className="border-b border-surface-container-highest px-8 py-4 bg-surface-container-lowest flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface-container-high rounded-full transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Registrar Nova Compra</h1>
      </nav>

      <main className="p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSalvar} className="bg-surface-container-low p-8 rounded-2xl border border-surface-container-highest shadow-sm space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco: O que é? */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-surface-container-highest pb-2">Identificação</h2>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Nome / Descrição do Item</label>
                <input required type="text" name="nome_item" value={form.nome_item} onChange={handleChange} placeholder="Ex: Sementes Premium Ouro 0.5g" className="w-full bg-surface border border-surface-container-highest text-on-surface placeholder:text-secondary rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Categoria</label>
                <select required name="categoria_id" value={form.categoria_id} onChange={handleChange} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none">
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              {isSemente && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">A qual espécie pertence?</label>
                  <select required name="especie_id" value={form.especie_id} onChange={handleChange} className="w-full bg-primary-fixed text-on-primary-fixed-variant border border-primary-container rounded-xl px-4 py-2 outline-none font-bold">
                    <option value="">Selecione a Espécie...</option>
                    {especies.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
              )}

              {isVaso && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-primary mb-1">Capacidade Interna (Volumetria)</label>
                    <p className="text-[10px] font-medium text-secondary leading-tight">Como deseja informar o volume de terra que este vaso consome?</p>
                  </div>
                  
                  <div className="flex bg-surface-container-high p-1 rounded-lg">
                    <button type="button" onClick={() => setModoCalcVaso('direto')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${modoCalcVaso === 'direto' ? 'bg-primary text-on-primary shadow' : 'text-secondary'}`}>Informar Litros</button>
                    <button type="button" onClick={() => setModoCalcVaso('dimensoes')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${modoCalcVaso === 'dimensoes' ? 'bg-primary text-on-primary shadow' : 'text-secondary'}`}>Usar Régua/Trena</button>
                  </div>

                  {modoCalcVaso === 'dimensoes' ? (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-secondary uppercase">Diâmetro (Boca) cm</label>
                        <input type="number" step="0.1" name="diametroCm" value={vasoDimensoes.diametroCm} onChange={handleDimensoesChange} placeholder="Ex: 15" className="w-full bg-surface border border-primary/30 text-on-surface rounded-lg px-3 py-2 outline-none font-bold mt-1" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-secondary uppercase">Altura (cm)</label>
                        <input type="number" step="0.1" name="alturaCm" value={vasoDimensoes.alturaCm} onChange={handleDimensoesChange} placeholder="Ex: 20" className="w-full bg-surface border border-primary/30 text-on-surface rounded-lg px-3 py-2 outline-none font-bold mt-1" />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="text-[10px] font-bold text-secondary uppercase">Resultado em Litros (L/Kg)</label>
                    <input required type="number" step="0.001" readOnly={modoCalcVaso === 'dimensoes'} name="capacidade_substrato_vazao" value={form.capacidade_substrato_vazao} onChange={handleChange} placeholder="Ex: 0.5" className={`w-full bg-surface border border-primary/30 text-on-surface rounded-xl px-4 py-2 outline-none font-bold mt-1 ${modoCalcVaso === 'dimensoes' ? 'bg-primary/10 cursor-not-allowed' : ''}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Bloco: Valores e Origem */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-surface-container-highest pb-2">Fornecedor e Nota</h2>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Fornecedor</label>
                <select required name="fornecedor_id" value={form.fornecedor_id} onChange={handleChange} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none">
                  <option value="">Selecione um fornecedor...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Data da Compra</label>
                <input required type="date" name="data_compra" value={form.data_compra} onChange={handleChange} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Evidência (Recibo/Pacote) - Opcional</label>
                <label className="flex items-center gap-2 cursor-pointer w-full bg-surface border border-dashed border-surface-container-highest rounded-xl px-4 py-2 text-primary hover:bg-surface-container-high transition">
                  <ImagePlus size={18} />
                  <span className="text-sm">{foto ? foto.name : 'Anexar Foto ou PDF (Clique)'}</span>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setFoto(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-surface-container-highest bg-surface-container-lowest -mx-8 px-8 py-6 rounded-b-2xl">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Qtd Comprada</label>
              <input required type="number" step="0.0001" name="quantidade_comprada" value={form.quantidade_comprada} onChange={handleChange} placeholder="Ex: 0.5" className="w-full bg-surface border border-surface-container-highest text-on-surface placeholder:text-secondary rounded-xl px-4 py-2 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Unidade de Medida</label>
              <select required name="unidade_medida" value={form.unidade_medida} onChange={handleChange} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-2 outline-none">
                <option value="Gramas">Gramas</option>
                <option value="Kg">Kg</option>
                <option value="Litros">Litros</option>
                <option value="Unidades">Unidades (Mudas/Vasos)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Custo Total (Na nota)</label>
              <input required type="number" step="0.01" name="custo_total" value={form.custo_total} onChange={handleChange} placeholder="Ex: 7000" className="w-full bg-surface border border-surface-container-highest text-on-surface placeholder:text-secondary rounded-xl px-4 py-2 outline-none" />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button disabled={loading} type="submit" className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2">
              <Save size={20} />
              {loading ? 'Processando NF...' : 'Gravar Compra no Estoque'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
