import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chamarIA } from '@/lib/ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { fotoUrl, especie, diasPlantio } = await req.json();

    if (!fotoUrl || !especie) {
      return NextResponse.json({ error: 'Faltam dados da planta ou foto.' }, { status: 400 });
    }

    const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
    const keys = config?.api_keys;
    const provider = keys?.ai_provider || 'gemini';

    if (!keys) {
      return NextResponse.json({ error: 'Configurações de IA não encontradas.' }, { status: 401 });
    }

    // Download da imagem para buffer
    const imageResp = await fetch(fotoUrl);
    if (!imageResp.ok) throw new Error('Erro ao baixar imagem.');
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    const prompt = `Você é um Engenheiro Agrônomo especialista em viveiros na Colômbia. 
 Analise a foto de um lote de ${especie} com ${diasPlantio} dias de vida.
 Responda EXATAMENTE neste formato JSON, sem marcação markdown adicional:
 {
   "desvio_desenvolvimento": "Normal ou Atrasado (Baseado na idade esperada)",
   "estado_saude": "Saudável ou Infermidade Detectada",
   "doenca_detectada": "Se houver, nome da praga/fungo. Senão, 'Nenhuma'",
   "acao_sugerida": "Ação curta que o produtor deve tomar hoje"
 }`;

    const responseText = await chamarIA({ 
        provider, 
        keys, 
        prompt, 
        imageBase64: base64Image, 
        mimeType 
    });

    return NextResponse.json({ success: true, analise: JSON.parse(responseText) });
    
  } catch (error: any) {
    console.error("Erro na IA:", error);
    return NextResponse.json({ error: error.message || 'Falha ao analisar a foto.' }, { status: 500 });
  }
}
