import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testML() {
  const { data: config } = await supabase.from('configuracoes').select('api_keys').limit(1).single();
  const token = config?.api_keys?.ml_access_token;
  
  console.log("Token exists?", !!token);

  if (!token) return;

  const mlPayload = {
    title: "Planta Teste - Lote MOCK123",
    category_id: "MCO1284", 
    price: 15000,
    currency_id: "COP",
    available_quantity: 5,
    buying_mode: "buy_it_now",
    condition: "new",
    listing_type_id: "gold_special",
    description: {
      plain_text: "Venda de lote de plantas.\n\nEspécie: Teste\nLote ID: MOCK\nCultivo registrado e monitorado pelo sistema de gestão de viveiros."
    },
    pictures: [
      {
        source: "https://http2.mlstatic.com/D_NQ_NP_2X_789422-MCO71221764724_082023-F.webp"
      }
    ]
  };

  const response = await fetch('https://api.mercadolibre.com/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mlPayload)
  });

  const mlResult = await response.json();
  console.log("Status:", response.status);
  console.dir(mlResult, { depth: null });
}

testML();
