import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plataforma } = body;

    // Simulação do tempo de requisição com o MercadoLivre / VTEX / Amazon
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log(`[INTEGRATION MOCK] Enviando dados para: ${plataforma}`);

    return NextResponse.json({
      success: true,
      message: `Anúncio criado na plataforma ${plataforma} com sucesso.`,
      id_externo: `MOCK-${Math.floor(Math.random() * 999999)}`,
      status: 'active'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Falha na integração mock.' }, { status: 500 });
  }
}
