'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Droplets, Package, Thermometer, ShieldAlert, TrendingDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { saveSubscription } from '@/app/actions/push';

const VAPID_PUBLIC_KEY = 'BO3ngAeqOse2gaQEOxG8WjS2OOwaVhtKAdmIuQaZuegZiVpAr-CRzDwureyRgLsHWezwZ5yt5o3cz-OXfvXgE14';

export default function NotificationBell({ role }: { role: 'admin' | 'funcionario' }) {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [aberto, setAberto] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    carregarNotificacoes();
    registrarPush();
    
    const channel = supabase
      .channel('notificacoes_changes')
      .on('postgres_changes', { event: 'INSERT', table: 'sistema_notificacoes' }, (payload) => {
        if (!payload.new.target_role || payload.new.target_role === role) {
          setNotificacoes(prev => [payload.new, ...prev]);
          setUnreadCount(count => count + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  async function carregarNotificacoes() {
    const { data } = await supabase
      .from('sistema_notificacoes')
      .select('*')
      .or(`target_role.eq.${role},target_role.is.null`)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotificacoes(data);
      setUnreadCount(data.filter(n => !n.lida).length);
    }
  }

  async function registrarPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY
        });
        
        await saveSubscription(JSON.parse(JSON.stringify(subscription)), role);
      } catch (err) {
        console.warn('Push registration failed:', err);
      }
    }
  }

  async function marcarComoLida(id: string) {
    await supabase.from('sistema_notificacoes').update({ lida: true }).eq('id', id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setUnreadCount(count => Math.max(0, count - 1));
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'clima': return <Thermometer className="text-blue-500" size={16} />;
      case 'estoque': return <Package className="text-amber-500" size={16} />;
      case 'operacional': return <Droplets className="text-cyan-500" size={16} />;
      case 'merma': return <TrendingDown className="text-error" size={16} />;
      default: return <Bell className="text-secondary" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setAberto(!aberto)}
        className={`p-2 rounded-full transition relative ${aberto ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-high text-secondary'}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-on-error text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-container-lowest shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setAberto(false)} />
          <div className="absolute right-0 mt-3 w-[340px] bg-surface-container-lowest border border-surface-container-highest rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-5 bg-surface-container-low border-b border-surface-container-highest flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-on-surface">Alertas do Viveiro</h3>
                {unreadCount > 0 && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} novos</span>}
              </div>
              <button onClick={() => setAberto(false)} className="p-1.5 hover:bg-surface-container-high rounded-full transition text-secondary">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
              {notificacoes.length > 0 ? (
                notificacoes.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => marcarComoLida(n.id)}
                    className={`p-5 border-b border-surface-container last:border-0 hover:bg-surface-container-high cursor-pointer transition flex gap-4 ${!n.lida ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${!n.lida ? 'bg-white shadow-sm' : 'bg-surface-container opacity-60'}`}>
                      {getIcon(n.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className={`text-sm font-bold truncate ${!n.lida ? 'text-on-surface' : 'text-secondary'}`}>{n.titulo}</p>
                        {!n.lida && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                      </div>
                      <p className="text-xs text-secondary leading-normal mb-2">{n.mensagem}</p>
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] text-secondary/50 font-medium">{new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                         {n.lida && <CheckCircle2 size={12} className="text-primary/40" />}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="bg-surface-container p-4 rounded-full mb-4 opacity-20">
                    <Bell size={32} />
                  </div>
                  <p className="text-sm font-bold text-secondary mb-1">Tudo limpo!</p>
                  <p className="text-xs text-secondary/60">Você não tem novas notificações no momento.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-surface-container-low text-center border-t border-surface-container-highest">
               <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Ver Histórico Completo</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
