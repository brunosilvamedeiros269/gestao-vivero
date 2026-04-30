import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resource, topic } = body;

    console.log(`[Webhook ML] Recebido: ${topic} - ${resource}`);

    // Só processamos pedidos por enquanto
    if (topic !== 'orders_v2') {
      return NextResponse.json({ received: true });
    }

    // 1. Obter Token do ML
    const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
    if (!config?.api_keys?.ml_access_token) {
      console.error('[Webhook ML] Token não encontrado');
      return NextResponse.json({ error: 'Token missing' }, { status: 500 });
    }

    const accessToken = config.api_keys.ml_access_token;

    // 2. Buscar detalhes do pedido no ML
    const mlOrderRes = await fetch(`https://api.mercadolibre.com${resource}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!mlOrderRes.ok) {
      console.error('[Webhook ML] Erro ao buscar pedido no ML');
      return NextResponse.json({ error: 'ML API Error' }, { status: 400 });
    }

    const orderData = await mlOrderRes.json();
    const item = orderData.order_items[0];
    const mlItemId = item.item.id;
    const qtdVendida = item.quantity;

    // 3. Identificar o Lote no nosso sistema
    // Procuramos na coluna JSONB 'integracoes' pela chave 'mercadolivre' com o id_externo correspondente
    const { data: lote, error: loteError } = await supabase
      .from('lotes_plantio')
      .select('*')
      .contains('integracoes', { mercadolivre: { id_externo: mlItemId } })
      .single();

    if (loteError || !lote) {
      console.warn(`[Webhook ML] Lote não encontrado para o item ${mlItemId}`);
      return NextResponse.json({ error: 'Lote not found' }, { status: 404 });
    }

    // 4. Verificar se o pedido já foi processado (evitar duplicidade de webhooks)
    const { data: pedidoExistente } = await supabase
      .from('pedidos_venda')
      .select('id')
      .eq('id_pedido_externo', orderData.id.toString())
      .single();

    if (pedidoExistente) {
      return NextResponse.json({ message: 'Pedido já processado' });
    }

    // 5. Atualizar estoque no Lote
    const novaQuantidade = (lote.quantidade_plantada || 0) - qtdVendida;
    await supabase
      .from('lotes_plantio')
      .update({ quantidade_plantada: Math.max(0, novaQuantidade) })
      .eq('id', lote.id);

    // 6. Registrar o Pedido Centralizado
    await supabase.from('pedidos_venda').insert({
      lote_id: lote.id,
      plataforma: 'mercadolivre',
      id_pedido_externo: orderData.id.toString(),
      cliente: {
        nome: orderData.buyer.first_name + ' ' + orderData.buyer.last_name,
        email: orderData.buyer.email,
        telefone: orderData.buyer.phone?.number,
        endereco: orderData.shipping?.receiver_address
      },
      valor_total: orderData.total_amount,
      status_pagamento: orderData.status === 'paid' ? 'pago' : 'pendente',
      status_fulfillment: 'recebido',
      dados_envio: {
        shipping_id: orderData.shipping?.id,
        logistic_type: orderData.shipping?.logistic_type
      }
    });

    // 7. TODO: Disparar Sincronização Multicanal (Sync Stock para outras plataformas)

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Webhook ML] Erro Fatal:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
