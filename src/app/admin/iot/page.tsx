'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Thermometer, Droplets, Wifi, Battery, Activity, Plus, RefreshCw, Leaf } from 'lucide-react';

export default function IotDashboardAdmin() {
  const [sensores, setSensores] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal Novo Sensor
  const [modalAberto, setModalAberto] = useState(false);
  const [idTag, setIdTag] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('');

  async function carregarTudo() {
    setLoading(true);
    const { data: sec } = await supabase.from('setores_estufa').select('id, nome');
    if (sec) setSetores(sec);

    const { data: S } = await supabase.from('sensores_iot').select('*, setor:setores_estufa(nome)').order('ultima_leitura', { ascending: false });
    if (S) setSensores(S);
    setLoading(false);
  }

  useEffect(() => {
    carregarTudo();
    // Simulate realtime updates every 10s locally just for visual effect
    const interval = setInterval(() => {
      setSensores(prev => prev.map(s => {
        if(s.status === 'ativo') {
          // variacao randomica leve
          const novaTemp = parseFloat(s.temperatura_c) + (Math.random() * 0.4 - 0.2);
          const novaUmid = parseFloat(s.umidade_ar_percentual) + (Math.random() * 2 - 1);
          const novaTerra = parseFloat(s.umidade_solo_percentual) + (Math.random() * 1 - 0.5);
          return {
            ...s,
            temperatura_c: novaTemp.toFixed(1),
            umidade_ar_percentual: novaUmid.toFixed(1),
            umidade_solo_percentual: novaTerra.toFixed(1)
          };
        }
        return s;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSalvarSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idTag) return;
    try {
      await supabase.from('sensores_iot').insert([{
        identificacao: idTag,
        setor_id: setorSelecionado || null,
        status: 'ativo',
        temperatura_c: 25.5,
        umidade_ar_percentual: 60.0,
        umidade_solo_percentual: 80.0,
        bateria_percentual: 100
      }]);
      setModalAberto(false);
      setIdTag('');
      setSetorSelecionado('');
      carregarTudo();
    } catch(err) {
      alert("Erro ao parear sensor.");
    }
  };

  const corStatusUmidade = (umidade: number) => umidade < 30 ? 'text-red-500' : umidade < 50 ? 'text-amber-500' : 'text-blue-500';
  const corTemp = (t: number) => t > 35 ? 'text-red-500' : t < 15 ? 'text-blue-500' : 'text-green-500';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-3 rounded-2xl">
            <Wifi className="text-emerald-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">IoT & Clima (Sensores)</h1>
            <p className="text-secondary text-sm">Monitore temperatura e umidade em tempo real nas suas estufas.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={carregarTudo} className="bg-surface-container-low text-secondary p-3 rounded-xl hover:bg-surface-container-high transition">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setModalAberto(true)} className="bg-primary text-on-primary font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:bg-primary/90 transition">
            <Plus size={20} /> Parear Sensor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensores.map(s => {
           const umid = parseFloat(s.umidade_solo_percentual);
           const temp = parseFloat(s.temperatura_c);
           return (
            <div key={s.id} className="bg-surface-container-low border border-surface-container-highest rounded-3xl p-6 shadow-sm relative overflow-hidden">
              {/* Barra de Bateria Top */}
              <div className="absolute top-0 left-0 w-full h-1 bg-surface-container-highest">
                 <div className="h-full bg-emerald-500" style={{width: `${s.bateria_percentual}%`}}></div>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-lg text-on-surface">{s.identificacao}</h3>
                  <p className="text-xs text-secondary font-mono bg-surface-container px-2 py-1 rounded-md mt-1 inline-block">Local: {s.setor?.nome || 'N/A'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Activity size={10}/> Online
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-secondary">
                    <Battery size={12}/> {s.bateria_percentual}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Temperatura */}
                <div className="bg-surface rounded-2xl p-4 border border-surface-container text-center">
                   <Thermometer size={24} className={`mx-auto mb-2 ${corTemp(temp)}`} />
                   <p className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Temp. Ar</p>
                   <p className={`text-2xl font-black ${corTemp(temp)}`}>{temp}°<span className="text-sm font-medium">C</span></p>
                </div>
                
                {/* Umidade Ar */}
                <div className="bg-surface rounded-2xl p-4 border border-surface-container text-center">
                   <Droplets size={24} className="mx-auto mb-2 text-blue-400" />
                   <p className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Umid. Ar</p>
                   <p className="text-2xl font-black text-blue-500">{parseFloat(s.umidade_ar_percentual).toFixed(0)}<span className="text-sm font-medium">%</span></p>
                </div>

                {/* Umidade Solo */}
                <div className="col-span-2 bg-surface rounded-2xl p-4 border border-surface-container flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl bg-surface-container-high ${corStatusUmidade(umid)}`}>
                        <Leaf size={20} />
                     </div>
                     <div className="text-left">
                       <p className="text-xs text-secondary font-bold uppercase tracking-widest">Umidade do Solo</p>
                       <p className={`text-xl font-black ${corStatusUmidade(umid)}`}>{parseFloat(s.umidade_solo_percentual).toFixed(1)}%</p>
                     </div>
                   </div>
                   <div className="text-right">
                     {umid < 30 ? (
                       <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md uppercase">Regar Agora</span>
                     ) : (
                       <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase">Solo Bom</span>
                     )}
                   </div>
                </div>
              </div>
            </div>
          );
        })}

        {sensores.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-secondary border-2 border-dashed border-surface-container rounded-3xl">
            <Wifi size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum sensor pareado. Clique em "Parear Sensor".</p>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSalvarSensor} className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-surface-container-highest animate-slide-up">
            <div className="bg-surface-container-low p-6 border-b border-surface-container-highest">
              <h3 className="text-lg font-bold text-on-surface">Adicionar Sensor</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">ID do Dispositivo (MAC/Tag)</label>
                <input required type="text" value={idTag} onChange={e=>setIdTag(e.target.value)} placeholder="Ex: SENS-001" className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none uppercase font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">Setor Alocado</label>
                <select value={setorSelecionado} onChange={e=>setSetorSelecionado(e.target.value)} className="w-full bg-surface border border-surface-container-highest text-on-surface rounded-xl px-4 py-3 outline-none">
                  <option value="">Nenhum (Livre)</option>
                  {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-surface-container flex gap-3">
              <button type="button" onClick={() => setModalAberto(false)} className="flex-1 px-4 py-3 bg-surface text-on-surface border border-surface-container rounded-xl font-bold hover:bg-surface-container-high transition">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition">Parear</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
