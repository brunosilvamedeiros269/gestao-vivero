import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) return NextResponse.json({ error: 'Query não informada' }, { status: 400 });

  const PIXABAY_KEY = '43553255-66736274431e6704602f2329e';

  async function fetchFromPixabay(searchTerm: string) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(searchTerm)}&image_type=photo&category=nature&per_page=5&safesearch=true&lang=es`;
    const res = await fetch(url);
    const data = await res.json();
    return data.hits && data.hits.length > 0 ? data.hits[0].largeImageURL : null;
  }

  try {
    // Tenta 1: Termo Original
    let imageUrl = await fetchFromPixabay(query);

    // Tenta 2: Se tem parênteses (nome científico), tenta só o que está dentro ou fora
    if (!imageUrl && query.includes('(')) {
      const match = query.match(/\(([^)]+)\)/);
      if (match) imageUrl = await fetchFromPixabay(match[1]);
    }

    // Tenta 3: Primeira palavra do nome (geralmente o gênero/tipo)
    if (!imageUrl) {
      const firstWord = query.split(' ')[0];
      imageUrl = await fetchFromPixabay(firstWord);
    }

    // Tenta 4: Termo genérico de segurança
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1000&auto=format&fit=crop';
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    return NextResponse.json({ url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1000&auto=format&fit=crop' });
  }
}
