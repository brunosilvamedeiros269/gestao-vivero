import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chamarIA } from '@/lib/ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { fotoUrl, especie, diasPlantio } = await req.json();

    // 1. Buscar Chaves de API do Banco de Dados
    const { data: configs } = await supabase.from('configuracoes').select('api_keys, idioma').order('id', { ascending: false });
    const config = configs?.find(c => c.api_keys && Object.keys(c.api_keys).length > 0) || configs?.[0];
    
    if (!config?.api_keys) {
      return NextResponse.json({ error: 'Configure as chaves de IA nas configurações primeiro.' }, { status: 400 });
    }

    const keys = config.api_keys;
    const provider = keys.ai_provider || (keys.groq_api_key ? 'groq' : keys.openai_api_key ? 'openai' : 'gemini');

    // 2. Converter imagem para Base64
    const imageRes = await fetch(fotoUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

    // 3. Chamar IA
    const prompt = `Analise o crescimento deste lote de ${especie}, que foi plantado há ${diasPlantio} dias.
    Retorne um JSON com os campos:
    - 'desvio_desenvolvimento': string (se está atrasado, no prazo ou adiantado)
    - 'estado_saude': string (ex: Saudável, Estressada, Com Pragas)
    - 'doenca_detectada': string (Nome da doença ou 'Nenhuma')
    - 'acao_sugerida': string (O que o produtor deve fazer agora)`;

    const responseText = await chamarIA({
      provider: provider as any,
      keys,
      prompt,
      imageBase64,
      mimeType,
      language: config.idioma || 'pt'
    });

    return NextResponse.json({ success: true, analise: JSON.parse(responseText || '{}') });
  } catch (error: any) {
    console.error('Erro na análise IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
