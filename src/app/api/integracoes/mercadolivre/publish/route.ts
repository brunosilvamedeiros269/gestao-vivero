import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lote, preco, plataforma } = body;

    if (plataforma !== 'mercadolivre') {
      return NextResponse.json({ error: 'Endpoint exclusivo para Mercado Livre' }, { status: 400 });
    }

    // 1. Obter token de acesso do ML das configuracoes
    const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
    
    if (!config || !config.api_keys || !config.api_keys.ml_access_token) {
      return NextResponse.json({ 
        error: 'Conta do Mercado Livre não conectada.', 
        needsManualLink: true 
      }, { status: 401 });
    }

    const accessToken = config.api_keys.ml_access_token;

    // 2. Construir o JSON de Produto para o Mercado Livre
    // Estamos usando uma categoria genérica de plantas na Colômbia: MCO1284 (Jardines y Exteriores > Plantas)
    // O título deve ter no máximo 60 caracteres
    const titulo = `Planta ${lote.especie?.nome} - Lote ${lote.identificacao_lote}`.substring(0, 60);

    const mlPayload = {
      title: titulo,
      category_id: "MCO1284", 
      price: preco,
      currency_id: "COP",
      available_quantity: lote.quantidade_plantada || 1,
      buying_mode: "buy_it_now",
      condition: "new",
      listing_type_id: "gold_special",
      description: {
        plain_text: `Venda de lote de plantas.\n\nEspécie: ${lote.especie?.nome}\nLote ID: ${lote.identificacao_lote}\nCultivo registrado e monitorado pelo sistema de gestão de viveiros.`
      },
      pictures: [
        {
          source: "https://http2.mlstatic.com/D_NQ_NP_2X_789422-MCO71221764724_082023-F.webp" // Placeholder genérico para evitar erro de imagem nula
        }
      ]
    };

    // 3. Fazer POST para o Mercado Livre API
    const response = await fetch('https://api.mercadolibre.com/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mlPayload)
    });

    const mlResult = await response.json();

    if (!response.ok) {
      console.error('Erro na API do ML:', mlResult);
      return NextResponse.json({ 
        error: 'A API do Mercado Livre rejeitou o anúncio.', 
        details: mlResult,
        needsManualLink: true 
      }, { status: 400 });
    }

    // 4. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Anúncio publicado no Mercado Livre com sucesso!',
      id_externo: mlResult.id, // Ex: MCO12345678
      permalink: mlResult.permalink
    });

  } catch (error) {
    console.error('Erro ao publicar no ML:', error);
    return NextResponse.json({ 
      error: 'Falha interna ao publicar no ML.',
      needsManualLink: true
    }, { status: 500 });
  }
}
