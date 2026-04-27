import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { imageUrl, especieNome } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista botânico sênior. Analise a imagem da planta e forneça um diagnóstico técnico, porém prático. Identifique sinais de pragas, deficiências nutricionais ou estresse hídrico. Retorne apenas JSON."
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analise a saúde desta planta (${especieNome}). Retorne um JSON com os campos: 'saude' (de 0 a 100), 'diagnostico' (string curta), 'recomendacao' (string curta) e 'sinais_alerta' (array de strings).` },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(response.choices[0].message.content || '{}'));
  } catch (error: any) {
    console.error('Erro na análise de IA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
