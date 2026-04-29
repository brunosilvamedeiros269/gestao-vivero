import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const host = `${url.protocol}//${url.host}`;

    if (!code) {
      return NextResponse.redirect(`${host}/admin/configuracoes?error=ml_code_missing`);
    }

    // Buscar chaves nas configurações
    const { data: config } = await supabase.from('configuracoes').select('id, api_keys').limit(1).single();
    
    if (!config || !config.api_keys || !config.api_keys.mercadolivre_app_id || !config.api_keys.mercadolivre_secret) {
      return NextResponse.redirect(`${host}/admin/configuracoes?error=ml_keys_missing`);
    }

    const appId = config.api_keys.mercadolivre_app_id;
    const secretKey = config.api_keys.mercadolivre_secret;
    const redirectUri = `${host}/api/integracoes/mercadolivre/callback`;

    // Trocar o código pelo token
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: secretKey,
        code: code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Erro ao buscar token do ML:', tokenData);
      return NextResponse.redirect(`${host}/admin/configuracoes?error=ml_token_failed`);
    }

    // Atualizar as chaves no banco de dados com os tokens gerados
    const newApiKeys = {
      ...config.api_keys,
      ml_access_token: tokenData.access_token,
      ml_refresh_token: tokenData.refresh_token,
      ml_token_expires_in: tokenData.expires_in,
      ml_token_created_at: new Date().toISOString()
    };

    await supabase.from('configuracoes')
      .update({ api_keys: newApiKeys })
      .eq('id', config.id);

    return NextResponse.redirect(`${host}/admin/configuracoes?success=ml_connected`);
  } catch (error) {
    console.error('Erro no ML Callback:', error);
    const url = new URL(req.url);
    return NextResponse.redirect(`${url.protocol}//${url.host}/admin/configuracoes?error=ml_unknown`);
  }
}
