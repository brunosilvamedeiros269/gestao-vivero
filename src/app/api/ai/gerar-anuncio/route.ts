import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { chamarIA } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { especie, detalhes } = await req.json();

    if (!especie) {
      return NextResponse.json({ error: 'Espécie não informada.' }, { status: 400 });
    }

    const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
    if (!config || !config.api_keys) {
      return NextResponse.json({ error: 'Configuração de chaves de API não encontrada.' }, { status: 500 });
    }

    const prompt = `Você é um agrônomo e mestre em copywriting para marketplaces (como Mercado Livre). 
Crie um anúncio altamente conversivo para a venda de mudas/plantas da espécie "${especie}".
Informações adicionais fornecidas pelo vendedor: ${detalhes || 'Nenhuma.'}

Obrigatório retornar APENAS um objeto JSON com as seguintes chaves, sem markdown:
{
  "titulo_viral": "Título chamativo e claro, focando no benefício, com no MÁXIMO 60 caracteres. (Ex: Muda De Rosa Do Deserto Original - Floração Rápida)",
  "descricao_comercial": "Uma descrição persuasiva para vendas online. Inclua: 1. Uma introdução atraente focando na beleza/benefício da planta. 2. Instruções claras e fáceis de entender sobre as condições climáticas ideais (luz, rega, solo) para garantir que o cliente cuide bem da planta."
}
`;

    const provedorIA = config.api_keys.gemini_api_key ? 'gemini' : 
                       config.api_keys.openai_api_key ? 'openai' : 
                       config.api_keys.groq_api_key ? 'groq' : null;

    if (!provedorIA) {
      return NextResponse.json({ error: 'Nenhuma chave de IA configurada (Gemini, OpenAI ou Groq).' }, { status: 500 });
    }

    const respostaTexto = await chamarIA({
      provider: provedorIA,
      keys: config.api_keys,
      prompt: prompt
    });

    const jsonObj = JSON.parse(respostaTexto);

    return NextResponse.json(jsonObj);
  } catch (error: any) {
    console.error("Erro ao gerar anúncio com IA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
