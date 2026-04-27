'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Settings, Save, ShoppingCart, Bot, Key, Users, Globe } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [valorHora, setValorHora] = useState('0');

  const [form, setForm] = useState({
    gemini_api_key: '',
    openai_api_key: '',
    groq_api_key: '',
    ai_provider: 'gemini',
    mercadolivre_app_id: '',
    mercadolivre_secret: '',
    amazon_seller_id: '',
    amazon_client_id: '',
    meta_catalog_id: '',
    meta_token: '',
    exito_api_key: '',
    falabella_api_key: '',
    tiktok_app_key: ''
  });

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    try {
      // Busca todas as configurações e pega a primeira (ou cria se não houver)
      const { data, error } = await supabase.from('configuracoes').select('*').order('created_at', { ascending: false }).limit(1);
      
      if (error) throw error;

      if (data && data.length > 0) {
        const config = data[0];
        setConfigId(config.id);
        setValorHora(config.valor_hora_trabalho?.toString() || '0');
        if (config.idioma) setLanguage(config.idioma);
        
        const keys = config.api_keys || {};
        setForm(prev => ({
          ...prev,
          ...keys,
          ai_provider: keys.ai_provider || 'gemini'
        }));
      }
    } catch (e) {
      console.log('Sem configurações prévias ou erro ao carregar:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        api_keys: form,
        valor_hora_trabalho: parseFloat(valorHora) || 0,
        idioma: language,
        updated_at: new Date().toISOString()
      };

      let result;
      if (configId) {
        result = await supabase.from('configuracoes').update(payload).eq('id', configId);
      } else {
        // Se não tem ID, tenta fazer um upsert ou insert simples
        result = await supabase.from('configuracoes').insert([{ ...payload, moeda_padrao: 'COP' }]).select();
        if (result.data?.[0]) setConfigId(result.data[0].id);
      }

      if (result.error) throw result.error;
      
      alert(t('save') + '!');
      // Recarrega para garantir sincronia
      carregarConfiguracoes();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-8 text-secondary">{t('loading')}</div>;

  return (
    <div className="bg-surface min-h-screen text-on-surface p-8 max-w-4xl mx-auto space-y-8 pb-20">
      
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3"><Settings className="text-primary"/> {t('settings')}</h1>
        <p className="text-secondary text-sm mt-1">Configura el comportamiento global de tu sistema de gestión.</p>
      </div>

      <form onSubmit={handleSalvar} className="space-y-6">
        
        {/* Bloco Idioma */}
        <section className="bg-surface-container-low border border-surface-container-highest p-6 rounded-3xl">
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><Globe size={20} className="text-blue-500"/> {t('language')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              type="button"
              onClick={() => setLanguage('es')}
              className={`p-4 rounded-2xl border-2 transition text-left ${language === 'es' ? 'border-primary bg-primary/10' : 'border-surface-container-highest bg-surface'}`}
            >
              <p className="font-bold text-sm">{t('language_es')}</p>
            </button>
            <button 
              type="button"
              onClick={() => setLanguage('pt')}
              className={`p-4 rounded-2xl border-2 transition text-left ${language === 'pt' ? 'border-primary bg-primary/10' : 'border-surface-container-highest bg-surface'}`}
            >
              <p className="font-bold text-sm">{t('language_pt')}</p>
            </button>
            <button 
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-2xl border-2 transition text-left ${language === 'en' ? 'border-primary bg-primary/10' : 'border-surface-container-highest bg-surface'}`}
            >
              <p className="font-bold text-sm">{t('language_en')}</p>
            </button>
          </div>
        </section>

        {/* Bloco Inteligência Artificial */}
        <section className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-4"><Bot size={20}/> {t('ai_connected')}</h2>
          <p className="text-xs text-secondary mb-4">Habilita la visión computacional en campo y sugerencias automáticas de cultivo.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button 
              type="button"
              onClick={() => setForm(p => ({...p, ai_provider: 'gemini'}))}
              className={`p-4 rounded-2xl border-2 transition text-left ${form.ai_provider === 'gemini' ? 'border-primary bg-primary/10' : 'border-surface-container-highest bg-surface'}`}
            >
              <p className="font-bold text-sm">Google Gemini</p>
              <p className="text-[10px] text-secondary">Grátis (AI Studio)</p>
            </button>
            <button 
              type="button"
              onClick={() => setForm(p => ({...p, ai_provider: 'openai'}))}
              className={`p-4 rounded-2xl border-2 transition text-left ${form.ai_provider === 'openai' ? 'border-primary bg-primary/10' : 'border-surface-container-highest bg-surface'}`}
            >
              <p className="font-bold text-sm">OpenAI ChatGPT</p>
              <p className="text-[10px] text-secondary">Pago (GPT-4o)</p>
            </button>
            <button 
              type="button"
              onClick={() => setForm(p => ({...p, ai_provider: 'groq'}))}
              className={`p-4 rounded-2xl border-2 transition text-left ${form.ai_provider === 'groq' ? 'border-primary bg-primary/10' : 'border-surface-container-highest bg-surface'}`}
            >
              <p className="font-bold text-sm">Groq Cloud</p>
              <p className="text-[10px] text-secondary">Ultra Rápido (Free Tier)</p>
            </button>
          </div>

          <div className="space-y-4">
            {form.ai_provider === 'gemini' && (
              <div className="animate-slide-up">
                <label className="block text-sm font-bold text-on-surface mb-1">Google Gemini API Key</label>
                <input type="password" name="gemini_api_key" value={form.gemini_api_key} onChange={handleChange} placeholder="AIzaSy..." className="w-full bg-surface border border-surface-container-highest rounded-xl px-4 py-2 outline-none focus:border-primary" />
                <p className="text-[10px] text-secondary mt-1">Adquira no Google AI Studio.</p>
              </div>
            )}
            {form.ai_provider === 'openai' && (
              <div className="animate-slide-up">
                <label className="block text-sm font-bold text-on-surface mb-1">OpenAI API Key</label>
                <input type="password" name="openai_api_key" value={form.openai_api_key} onChange={handleChange} placeholder="sk-..." className="w-full bg-surface border border-surface-container-highest rounded-xl px-4 py-2 outline-none focus:border-primary" />
                <p className="text-[10px] text-secondary mt-1">Use chaves da plataforma OpenAI (ex: gpt-4o).</p>
              </div>
            )}
            {form.ai_provider === 'groq' && (
              <div className="animate-slide-up">
                <label className="block text-sm font-bold text-on-surface mb-1">Groq API Key</label>
                <input type="password" name="groq_api_key" value={form.groq_api_key} onChange={handleChange} placeholder="gsk_..." className="w-full bg-surface border border-surface-container-highest rounded-xl px-4 py-2 outline-none focus:border-primary" />
                <p className="text-[10px] text-secondary mt-1">Adquira no Groq Cloud Console (Llama 3).</p>
              </div>
            )}
          </div>
        </section>

        {/* Bloco Operacional */}
        <section className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-3xl">
          <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2 mb-4"><Users size={20}/> Operacional & Recursos Humanos</h2>
          <p className="text-xs text-secondary mb-4">Configurações para rastreio de custos e mão de obra no campo.</p>
          
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">Custo Médio Hora/Homem (COP)</label>
              <input type="number" value={valorHora} onChange={(e) => setValorHora(e.target.value)} placeholder="Ex: 5000" className="w-full bg-surface border border-surface-container-highest rounded-xl px-4 py-2 outline-none focus:border-orange-500 font-medium" />
              <p className="text-[10px] text-secondary mt-1">Será usado no PWA para jogar o custo de mão de obra de podas/regas no custo final da planta.</p>
            </div>
          </div>
        </section>

        {/* Bloco Marketplaces */}
        <section className="bg-surface-container-lowest border border-surface-container-highest p-6 rounded-3xl space-y-6">
          <div className="border-b border-surface-container-highest pb-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2"><ShoppingCart size={20} className="text-amber-500"/> Canais de Venda (Marketplaces)</h2>
            <p className="text-xs text-secondary mt-1">Preencha as chaves das lojas que deseja habilitar na tela de Publicação de Lotes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mercado Livre */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container">
              <h3 className="font-bold text-sm mb-3">Mercado Libre</h3>
              <div className="space-y-3">
                <input type="text" name="mercadolivre_app_id" value={form.mercadolivre_app_id} onChange={handleChange} placeholder="APP ID" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
                <input type="password" name="mercadolivre_secret" value={form.mercadolivre_secret} onChange={handleChange} placeholder="Secret Key" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            {/* Amazon */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container">
              <h3 className="font-bold text-sm mb-3">Amazon</h3>
              <div className="space-y-3">
                <input type="text" name="amazon_seller_id" value={form.amazon_seller_id} onChange={handleChange} placeholder="Seller ID" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
                <input type="password" name="amazon_client_id" value={form.amazon_client_id} onChange={handleChange} placeholder="Client ID" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            {/* Meta */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container">
              <h3 className="font-bold text-sm mb-3">Facebook / Instagram</h3>
              <div className="space-y-3">
                <input type="text" name="meta_catalog_id" value={form.meta_catalog_id} onChange={handleChange} placeholder="Catalog ID" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
                <input type="password" name="meta_token" value={form.meta_token} onChange={handleChange} placeholder="Access Token" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            {/* Varejistas */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-4">
              <div>
                <h3 className="font-bold text-sm mb-2">Éxito</h3>
                <input type="password" name="exito_api_key" value={form.exito_api_key} onChange={handleChange} placeholder="API Key" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">Falabella</h3>
                <input type="password" name="falabella_api_key" value={form.falabella_api_key} onChange={handleChange} placeholder="Seller API Key" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">TikTok Shop</h3>
                <input type="password" name="tiktok_app_key" value={form.tiktok_app_key} onChange={handleChange} placeholder="App Key / Token" className="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

          </div>
        </section>

        <div className="flex justify-end">
          <button disabled={salvando} type="submit" className="bg-primary text-on-primary font-bold px-8 py-3 rounded-xl shadow-md hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2">
            <Save size={20}/> {salvando ? 'Salvando...' : 'Salvar Chaves de Acesso'}
          </button>
        </div>

      </form>
    </div>
  );
}
