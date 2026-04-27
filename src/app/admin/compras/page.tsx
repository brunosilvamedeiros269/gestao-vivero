import { supabase } from '@/lib/supabase';
import { Package, Filter, Plus, Truck, Leaf, Beaker } from 'lucide-react';
import Link from 'next/link';

export default async function EstoqueAdmin() {
  // 1. Puxar Configurações (Moeda)
  const { data: configData } = await supabase.from('configuracoes').select('*').limit(1);
  const moeda = configData && configData.length > 0 ? configData[0].moeda_padrao : 'COP';

  // Formatar Moeda
  const formatadorMoeda = new Intl.NumberFormat(moeda === 'BRL' ? 'pt-BR' : moeda === 'USD' ? 'en-US' : 'es-CO', {
    style: 'currency',
    currency: moeda,
    minimumFractionDigits: 0
  });

  // 2. Buscar Compras de Insumos (Estoque)
  const { data: insumos } = await supabase
    .from('compras_insumos')
    .select(`
      *,
      fornecedores(nome_fantasia),
      categorias_insumo(nome)
    `)
    .order('data_compra', { ascending: false });

  // Agrupadores (Para Dashboard)
  const totalInsumos = insumos?.length || 0;
  
  // Agrupar saldos por Tipo de Produto
  const saldoPorCategoria = insumos?.reduce((acc, curr) => {
    const cat = curr.categorias_insumo?.nome || 'Outros';
    acc[cat] = (acc[cat] || 0) + curr.quantidade_restante;
    return acc;
  }, {} as Record<string, number>) || {};

  const getIconForCategoria = (catName: string) => {
    if (catName.toLowerCase().includes('semente')) return <Leaf className="w-5 h-5 text-primary" />;
    if (catName.toLowerCase().includes('fungicida') || catName.toLowerCase().includes('controle')) return <Beaker className="w-5 h-5 text-tertiary" />;
    return <Package className="w-5 h-5 text-secondary" />;
  }

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Navbar Minimalista de Escritório */}
      <nav className="border-b border-surface-container-highest px-8 py-4 flex justify-between items-center bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <Truck className="text-primary w-6 h-6" />
          <h1 className="text-xl font-bold">Gestão de Compras e Suprimentos</h1>
        </div>
        <div className="flex gap-4">
          <span className="text-sm font-medium bg-surface-container-low px-3 py-1 rounded text-on-surface-variant flex items-center">
            Moeda Ativa: {moeda}
          </span>
          <Link href="/admin/compras/nova" className="bg-primary text-on-primary font-medium px-4 py-2 rounded shadow hover:bg-primary-container transition flex gap-2 items-center">
            <Plus size={18} /> Nova Compra
          </Link>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Gráficos / Top Info */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container-highest flex flex-col justify-between">
            <span className="text-secondary text-sm font-semibold uppercase tracking-wider">Lotes de Compras</span>
            <div className="text-4xl font-bold text-primary mt-2">{totalInsumos}</div>
          </div>
          
          {/* Renderização Dinâmica do Estoque por Categoria */}
          {Object.entries(saldoPorCategoria).map(([categoria, saldo]) => (
            <div key={categoria} className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-highest flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start opacity-70">
                <span className="text-secondary text-sm font-semibold tracking-wider truncate mr-2">{categoria}</span>
                {getIconForCategoria(categoria)}
              </div>
              <div className="text-3xl font-bold text-on-surface mt-4">{saldo}</div>
            </div>
          ))}
        </section>

        {/* Tabela de Estoque Atual */}
        <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-low/50">
            <h2 className="font-bold text-lg">Insumos Disponíveis para Plantio</h2>
            <button className="text-secondary hover:text-primary"><Filter size={20} /></button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-secondary text-sm">
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Item & Fornecedor</th>
                  <th className="px-6 py-3 font-semibold">Data Compra</th>
                  <th className="px-6 py-3 font-semibold">Custo Unid.</th>
                  <th className="px-6 py-3 font-semibold text-right">Saldo em Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest">
                {insumos && insumos.length > 0 ? (
                  insumos.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-surface-container-high p-2 rounded-lg">
                            {getIconForCategoria(item.categorias_insumo?.nome || '')}
                          </span>
                          <span className="text-sm font-medium text-secondary">{item.categorias_insumo?.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-surface">{item.nome_item}</div>
                        {item.capacidade_substrato_vazao > 0 && (
                          <div className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded inline-block mt-1">
                            Cap. Substrato: {item.capacidade_substrato_vazao} L/Kg
                          </div>
                        )}
                        <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                          Fornecedor: <span className="font-medium">{item.fornecedores?.nome_fantasia}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(item.data_compra).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-on-surface">
                        {formatadorMoeda.format(item.custo_unitario)} <span className="text-secondary text-xs">/ {item.unidade_medida}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-lg text-primary">{item.quantidade_restante}</div>
                        <div className="text-xs text-secondary">{item.unidade_medida}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                      <Package className="w-12 h-12 mx-auto text-surface-container-highest mb-3" />
                      O estoque de insumos está vazio. Adicione uma Nova Compra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
