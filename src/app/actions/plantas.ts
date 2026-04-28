'use server';

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function criarPlantasDoLote(loteId: string, quantidade: number, identificacaoBase: string) {
  try {
    const novasPlantas = [];
    
    for (let i = 1; i <= quantidade; i++) {
      const numFormatado = String(i).padStart(3, '0');
      novasPlantas.push({
        lote_plantio_id: loteId,
        identificador_individual: `${identificacaoBase}-${numFormatado}`,
        qr_code_uuid: uuidv4(),
        status: 'Semente',
        saude: 'Boa'
      });
    }

    // O supabase suporta bulk insert
    const { data, error } = await supabase
      .from('plantas')
      .insert(novasPlantas)
      .select();

    if (error) {
      console.error('Erro ao criar plantas em lote:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err: any) {
    console.error('Exception em criarPlantasDoLote:', err);
    return { error: err.message };
  }
}

export async function registrarEventoEmMassa(
  loteId: string, 
  tipoTarefa: string, 
  observacao?: string, 
  minutosTrabalhados?: number
) {
  try {
    // 1. Criar o evento na tabela lote_diario_tarefas para o LOTE (planta_id nulo)
    const { error: errorTarefa } = await supabase.from('lote_diario_tarefas').insert({
      lote_plantio_id: loteId,
      tipo_tarefa: tipoTarefa,
      observacao: observacao || '',
      minutos_trabalhados: minutosTrabalhados || 0
    });

    if (errorTarefa) throw errorTarefa;

    // 2. Se for rega, atualiza a data_ultima_rega de TODAS as plantas do lote
    if (tipoTarefa.toLowerCase() === 'rega' || tipoTarefa.toLowerCase() === 'regar') {
      const { error: errorPlantas } = await supabase
        .from('plantas')
        .update({ data_ultima_rega: new Date().toISOString() })
        .eq('lote_plantio_id', loteId);
        
      if (errorPlantas) throw errorPlantas;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception em registrarEventoEmMassa:', err);
    return { error: err.message };
  }
}
