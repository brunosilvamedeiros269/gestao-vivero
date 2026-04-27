import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

webpush.setVapidDetails(
  'mailto:contato@vivero.com',
  'BO3ngAeqOse2gaQEOxG8WjS2OOwaVhtKAdmIuQaZuegZiVpAr-CRzDwureyRgLsHWezwZ5yt5o3cz-OXfvXgE14',
  'O-9mQPZSsjDLZk-uVdSuS7ewmyGqyNnFs5Tpw6z30HI'
);

export async function POST(req: Request) {
  try {
    const { titulo, mensagem, target_role, tipo } = await req.json();

    // 1. Salvar no banco para o sino in-app
    await supabase.from('sistema_notificacoes').insert({
      titulo,
      mensagem,
      target_role,
      tipo
    });

    // 2. Buscar assinaturas de push para o role alvo
    let query = supabase.from('push_subscriptions').select('*');
    if (target_role) {
      query = query.eq('user_role', target_role);
    }
    const { data: subs } = await query;

    // 3. Enviar notificações nativas via web-push
    if (subs) {
      const promises = subs.map(s => {
        const payload = JSON.stringify({
          title: titulo,
          body: mensagem,
          url: target_role === 'admin' ? '/admin' : '/'
        });
        
        return webpush.sendNotification({
          endpoint: s.endpoint,
          keys: {
            p256dh: s.p256dh,
            auth: s.auth
          }
        }, payload).catch(e => console.error('Push error:', e));
      });
      await Promise.all(promises);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
