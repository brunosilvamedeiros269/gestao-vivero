import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Utilitário centralizado para chamadas de IA Multimodelo
 */
export async function chamarIA({ provider, keys, prompt, imageBase64, mimeType, language = 'es' }: { 
  provider: 'gemini' | 'openai' | 'groq', 
  keys: any, 
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
  language?: string
}) {
  const langInstruction = `\n\nIMPORTANTE: Responda obrigatoriamente no idioma: ${language}.`;
  const finalPrompt = prompt + langInstruction;
  
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(keys.gemini_api_key);
    // Tenta usar gemini-1.5-flash como padrão para visão, senão gemini-pro para texto puro
    const modelName = imageBase64 ? "gemini-1.5-flash" : "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelName });

    let result;
    if (imageBase64 && mimeType) {
      result = await model.generateContent([finalPrompt, { inlineData: { data: imageBase64, mimeType } }]);
    } else {
      result = await model.generateContent(finalPrompt);
    }
    
    let text = result.response.text();
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  if (provider === 'openai') {
    const messages: any[] = [
      { role: "system", content: "Você é um agrônomo especialista." },
      { role: "user", content: imageBase64 ? [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ] : prompt 
      }
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.openai_api_key}`
      },
      body: JSON.stringify({
        model: imageBase64 ? "gpt-4o" : "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Erro OpenAI');
    return data.choices[0].message.content;
  }

  if (provider === 'groq') {
    const messages: any[] = [
      { role: "system", content: "Você é um agrônomo especialista. Responda apenas com o JSON solicitado." },
      { role: "user", content: imageBase64 ? [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ] : prompt 
      }
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.groq_api_key}`
      },
      body: JSON.stringify({
        model: imageBase64 ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile",
        messages,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Erro Groq');
    return data.choices[0].message.content;
  }

  throw new Error("Provedor de IA desconhecido.");
}
