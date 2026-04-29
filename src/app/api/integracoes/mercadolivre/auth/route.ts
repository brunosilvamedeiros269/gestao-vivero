import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const host = `${url.protocol}//${url.host}`;
    
    // Buscar APP_ID do Mercado Livre nas configurações
    const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
    
    if (!config || !config.api_keys || !config.api_keys.mercadolivre_app_id) {
      return NextResponse.redirect(`${host}/admin/configuracoes?error=ml_keys_missing`);
    }

    const appId = config.api_keys.mercadolivre_app_id;
    const redirectUri = `${host}/api/integracoes/mercadolivre/callback`;

    // Redireciona o usuário para autorizar o app no ML Colômbia
    const authUrl = `https://auth.mercadolibre.com.co/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Erro no ML Auth:', error);
    return NextResponse.json({ error: 'Falha ao iniciar autenticação' }, { status: 500 });
  }
}
