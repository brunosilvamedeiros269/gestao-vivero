import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chamarIA } from '@/lib/ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { especie } = await req.json();
    if (!especie) return NextResponse.json({ error: 'Espécie não informada.' }, { status: 400 });

    // Busca os últimos registros para garantir que pegamos um que tenha dados
    const { data: configs, error: dbError } = await supabase
      .from('configuracoes')
      .select('api_keys, idioma')
      .order('id', { ascending: false });
    
    if (dbError) {
       console.error("DB Error:", dbError);
    }

    // Procura o primeiro registro que tenha chaves de API
    const config = configs?.find(c => c.api_keys && Object.keys(c.api_keys).length > 0) || configs?.[0];

    const keys = config?.api_keys || {};
    
    // Fallback para variáveis de ambiente se o banco estiver vazio
    const groqEnvKey = process.env.GROQ_API_KEY;
    const geminiEnvKey = process.env.GEMINI_API_KEY;

    let provider = keys.ai_provider;
    if (!provider) {
       if (keys.groq_api_key || groqEnvKey) provider = 'groq';
       else if (keys.openai_api_key) provider = 'openai';
       else if (keys.gemini_api_key || geminiEnvKey) provider = 'gemini';
    }

    const language = config?.idioma || 'es';

    // Injeta chaves do ENV caso o banco falhe
    const mergedKeys = {
       ...keys,
       groq_api_key: keys.groq_api_key || groqEnvKey,
       gemini_api_key: keys.gemini_api_key || geminiEnvKey
    };

    if (!provider) {
       return NextResponse.json({ error: 'Nenhuma configuração de IA encontrada no banco ou no sistema.' }, { status: 400 });
    }

    const hasKey = (provider === 'gemini' && mergedKeys?.gemini_api_key) ||
                   (provider === 'openai' && mergedKeys?.openai_api_key) ||
                   (provider === 'groq' && mergedKeys?.groq_api_key);

    if (!hasKey) {
      return NextResponse.json({ 
        error: `Por favor, configure la llave de API para o provedor selecionado (${provider}) nas configurações.` 
      }, { status: 401 });
    }

    const prompt = `Você é um agrônomo especialista na Colômbia.
  Gere uma ficha botânica técnica COMPLETA para a espécie: ${especie}.
  Retorne APENAS um JSON no seguinte formato:
  {
    "nome_cientifico": "string",
    "dias_germinacao": number,
    "dias_colheita": number,
    "condicoes_ideais": "string (resumo)",
    "descricao": "string (história e uso)",
    "dificuldade": "Fácil | Média | Difícil",
    "frequencia_rega": "string",
    "tipo_solo": "Arenoso | Arcilloso | Limoso | Franco | Orgânico",
    "ph_solo": "string",
    "clima_ideal": "Cálido | Templado | Frío | Tropical | Desértico",
    "categorias_ia": "string (ex: Ornamental, Frutífera...)",
    "preco_sugerido": number (em COP)
  }
  IMPORTANTE: Responda obrigatoriamente no idioma: ${language}`;

    const responseText = await chamarIA({ 
      prompt, 
      provider: provider as any, 
      keys: mergedKeys, 
      language 
    });

    return NextResponse.json({ success: true, analise: JSON.parse(responseText) });
    
  } catch (error: any) {
    console.error("Erro na IA:", error);
    return NextResponse.json({ error: error.message || 'Falha ao analisar.' }, { status: 500 });
  }
}
