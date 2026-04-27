import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const alertsGenerated = [];

    // 1. CHECAR ESTOQUE CRÍTICO
    const { data: insumos } = await supabase.from('compras_insumos').select('*').gt('quantidade_restante', 0);
    if (insumos) {
      for (const item of insumos) {
        if (item.quantidade_restante < 5) { // Limiar de exemplo
          alertsGenerated.push({
            titulo: 'Estoque Crítico!',
            mensagem: `O item ${item.nome_item} está acabando (restam apenas ${item.quantidade_restante}).`,
            target_role: 'admin',
            tipo: 'estoque'
          });
        }
      }
    }

    // 2. CHECAR REGA ATRASADA
    const { data: lotes } = await supabase.from('lotes_plantio').select('*, diario:lote_diario_tarefas(*)').neq('status', 'esgotado_vendido');
    if (lotes) {
      const hoje = new Date();
      for (const lote of lotes) {
        const ultimaRega = lote.diario?.filter((d: any) => d.tipo_tarefa === 'Rega').sort((a: any, b: any) => new Date(b.data_execucao).getTime() - new Date(a.data_execucao).getTime())[0];
        
        const diasSemRega = ultimaRega ? (hoje.getTime() - new Date(ultimaRega.data_execucao).getTime()) / (1000 * 3600 * 24) : 99;
        
        if (diasSemRega > 2) {
          alertsGenerated.push({
            titulo: 'Lembrete: Rega Atrasada',
            mensagem: `O lote ${lote.identificacao_lote} não é regado há ${Math.floor(diasSemRega)} dias!`,
            target_role: 'funcionario',
            tipo: 'operacional'
          });
        }
      }
    }

    // 3. CHECAR CLIMA (IOT)
    const { data: sensores } = await supabase.from('sensores_iot').select('*').eq('status', 'ativo');
    if (sensores) {
      for (const s of sensores) {
        if (parseFloat(s.umidade_ar_percentual) > 85) {
          alertsGenerated.push({
            titulo: 'Risco de Fungos!',
            mensagem: `Alta umidade (${s.umidade_ar_percentual}%) detectada no setor. Risco de Mofo Cinzento.`,
            target_role: 'funcionario',
            tipo: 'clima'
          });
        }
      }
    }

    // Enviar todos os alertas gerados para a API de notificações
    for (const alert of alertsGenerated) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notificacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    }

    return new Response(JSON.stringify({ success: true, count: alertsGenerated.length }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
