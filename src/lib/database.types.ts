export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias_insumo: {
        Row: {
          id: string
          nome: string
        }
        Insert: {
          id?: string
          nome: string
        }
        Update: {
          id?: string
          nome?: string
        }
        Relationships: []
      }
      clientes_atacado: {
        Row: {
          contato_nome: string | null
          created_at: string | null
          desconto_padrao_percentual: number | null
          email: string | null
          endereco: string | null
          id: string
          nit_cnpj: string | null
          nome_empresa: string
          telefone: string | null
        }
        Insert: {
          contato_nome?: string | null
          created_at?: string | null
          desconto_padrao_percentual?: number | null
          email?: string | null
          endereco?: string | null
          id?: string
          nit_cnpj?: string | null
          nome_empresa: string
          telefone?: string | null
        }
        Update: {
          contato_nome?: string | null
          created_at?: string | null
          desconto_padrao_percentual?: number | null
          email?: string | null
          endereco?: string | null
          id?: string
          nit_cnpj?: string | null
          nome_empresa?: string
          telefone?: string | null
        }
        Relationships: []
      }
      compras_insumos: {
        Row: {
          capacidade_substrato_vazao: number | null
          categoria_id: string | null
          created_at: string | null
          custo_total: number
          custo_unitario: number | null
          data_compra: string
          especie_id: string | null
          fornecedor_id: string | null
          id: string
          nome_item: string
          quantidade_comprada: number
          quantidade_restante: number
          unidade_medida: string
          url_foto: string | null
        }
        Insert: {
          capacidade_substrato_vazao?: number | null
          categoria_id?: string | null
          created_at?: string | null
          custo_total: number
          custo_unitario?: number | null
          data_compra: string
          especie_id?: string | null
          fornecedor_id?: string | null
          id?: string
          nome_item: string
          quantidade_comprada: number
          quantidade_restante: number
          unidade_medida: string
          url_foto?: string | null
        }
        Update: {
          capacidade_substrato_vazao?: number | null
          categoria_id?: string | null
          created_at?: string | null
          custo_total?: number
          custo_unitario?: number | null
          data_compra?: string
          especie_id?: string | null
          fornecedor_id?: string | null
          id?: string
          nome_item?: string
          quantidade_comprada?: number
          quantidade_restante?: number
          unidade_medida?: string
          url_foto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_insumos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_insumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_insumos_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_insumos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          api_keys: Json | null
          created_at: string | null
          id: string
          idioma: string | null
          moeda_padrao: string | null
          nome_viveiro: string | null
          updated_at: string | null
          valor_hora_trabalho: number | null
        }
        Insert: {
          api_keys?: Json | null
          created_at?: string | null
          id?: string
          idioma?: string | null
          moeda_padrao?: string | null
          nome_viveiro?: string | null
          updated_at?: string | null
          valor_hora_trabalho?: number | null
        }
        Update: {
          api_keys?: Json | null
          created_at?: string | null
          id?: string
          idioma?: string | null
          moeda_padrao?: string | null
          nome_viveiro?: string | null
          updated_at?: string | null
          valor_hora_trabalho?: number | null
        }
        Relationships: []
      }
      especies: {
        Row: {
          categorias_ia: string | null
          clima_ideal: string | null
          condicoes_ideais: string | null
          created_at: string | null
          descricao: string | null
          dias_germinacao: number | null
          dificuldade: string | null
          frequencia_rega: string | null
          id: string
          nome: string
          nome_cientifico: string | null
          ph_solo: string | null
          preco_sugerido: number | null
          tempo_estimado_floracao_dias: number
          tempo_estimado_germinacao_dias: number
          tipo_solo: string | null
          url_foto: string | null
        }
        Insert: {
          categorias_ia?: string | null
          clima_ideal?: string | null
          condicoes_ideais?: string | null
          created_at?: string | null
          descricao?: string | null
          dias_germinacao?: number | null
          dificuldade?: string | null
          frequencia_rega?: string | null
          id?: string
          nome: string
          nome_cientifico?: string | null
          ph_solo?: string | null
          preco_sugerido?: number | null
          tempo_estimado_floracao_dias: number
          tempo_estimado_germinacao_dias: number
          tipo_solo?: string | null
          url_foto?: string | null
        }
        Update: {
          categorias_ia?: string | null
          clima_ideal?: string | null
          condicoes_ideais?: string | null
          created_at?: string | null
          descricao?: string | null
          dias_germinacao?: number | null
          dificuldade?: string | null
          frequencia_rega?: string | null
          id?: string
          nome?: string
          nome_cientifico?: string | null
          ph_solo?: string | null
          preco_sugerido?: number | null
          tempo_estimado_floracao_dias?: number
          tempo_estimado_germinacao_dias?: number
          tipo_solo?: string | null
          url_foto?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          contato_telefone: string | null
          created_at: string | null
          id: string
          nome_fantasia: string
          nota_qualidade: number | null
        }
        Insert: {
          contato_telefone?: string | null
          created_at?: string | null
          id?: string
          nome_fantasia: string
          nota_qualidade?: number | null
        }
        Update: {
          contato_telefone?: string | null
          created_at?: string | null
          id?: string
          nome_fantasia?: string
          nota_qualidade?: number | null
        }
        Relationships: []
      }
      fotos_evolutivas: {
        Row: {
          created_at: string | null
          data_captura: string | null
          id: string
          lote_plantio_id: string | null
          observacao: string | null
          planta_id: string | null
          status_no_momento: string | null
          url_foto: string
        }
        Insert: {
          created_at?: string | null
          data_captura?: string | null
          id?: string
          lote_plantio_id?: string | null
          observacao?: string | null
          planta_id?: string | null
          status_no_momento?: string | null
          url_foto: string
        }
        Update: {
          created_at?: string | null
          data_captura?: string | null
          id?: string
          lote_plantio_id?: string | null
          observacao?: string | null
          planta_id?: string | null
          status_no_momento?: string | null
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_evolutivas_lote_plantio_id_fkey"
            columns: ["lote_plantio_id"]
            isOneToOne: false
            referencedRelation: "lotes_plantio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_evolutivas_planta_id_fkey"
            columns: ["planta_id"]
            isOneToOne: false
            referencedRelation: "plantas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_clima: {
        Row: {
          alertas: string | null
          created_at: string | null
          data: string
          id: string
          precipitacao: number | null
          temperatura_media: number | null
          umidade_media: number | null
        }
        Insert: {
          alertas?: string | null
          created_at?: string | null
          data: string
          id?: string
          precipitacao?: number | null
          temperatura_media?: number | null
          umidade_media?: number | null
        }
        Update: {
          alertas?: string | null
          created_at?: string | null
          data?: string
          id?: string
          precipitacao?: number | null
          temperatura_media?: number | null
          umidade_media?: number | null
        }
        Relationships: []
      }
      leituras_iot_historico: {
        Row: {
          data_hora: string | null
          id: string
          sensor_id: string | null
          temperatura_c: number | null
          umidade_ar_percentual: number | null
          umidade_solo_percentual: number | null
        }
        Insert: {
          data_hora?: string | null
          id?: string
          sensor_id?: string | null
          temperatura_c?: number | null
          umidade_ar_percentual?: number | null
          umidade_solo_percentual?: number | null
        }
        Update: {
          data_hora?: string | null
          id?: string
          sensor_id?: string | null
          temperatura_c?: number | null
          umidade_ar_percentual?: number | null
          umidade_solo_percentual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leituras_iot_historico_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensores_iot"
            referencedColumns: ["id"]
          },
        ]
      }
      lote_diario_tarefas: {
        Row: {
          analise_ia: Json | null
          data_execucao: string
          foto_url: string | null
          id: string
          lote_plantio_id: string | null
          minutos_trabalhados: number | null
          observacao: string | null
          planta_id: string | null
          tipo_tarefa: string
        }
        Insert: {
          analise_ia?: Json | null
          data_execucao?: string
          foto_url?: string | null
          id?: string
          lote_plantio_id?: string | null
          minutos_trabalhados?: number | null
          observacao?: string | null
          planta_id?: string | null
          tipo_tarefa: string
        }
        Update: {
          analise_ia?: Json | null
          data_execucao?: string
          foto_url?: string | null
          id?: string
          lote_plantio_id?: string | null
          minutos_trabalhados?: number | null
          observacao?: string | null
          planta_id?: string | null
          tipo_tarefa?: string
        }
        Relationships: [
          {
            foreignKeyName: "lote_diario_tarefas_lote_plantio_id_fkey"
            columns: ["lote_plantio_id"]
            isOneToOne: false
            referencedRelation: "lotes_plantio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lote_diario_tarefas_planta_id_fkey"
            columns: ["planta_id"]
            isOneToOne: false
            referencedRelation: "plantas"
            referencedColumns: ["id"]
          },
        ]
      }
      lote_uso_insumos: {
        Row: {
          compra_insumo_id: string | null
          created_at: string | null
          custo_absorvido: number
          data_uso: string | null
          id: string
          lote_plantio_id: string | null
          quantidade_usada: number
        }
        Insert: {
          compra_insumo_id?: string | null
          created_at?: string | null
          custo_absorvido: number
          data_uso?: string | null
          id?: string
          lote_plantio_id?: string | null
          quantidade_usada: number
        }
        Update: {
          compra_insumo_id?: string | null
          created_at?: string | null
          custo_absorvido?: number
          data_uso?: string | null
          id?: string
          lote_plantio_id?: string | null
          quantidade_usada?: number
        }
        Relationships: [
          {
            foreignKeyName: "lote_uso_insumos_compra_insumo_id_fkey"
            columns: ["compra_insumo_id"]
            isOneToOne: false
            referencedRelation: "compras_insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lote_uso_insumos_lote_plantio_id_fkey"
            columns: ["lote_plantio_id"]
            isOneToOne: false
            referencedRelation: "lotes_plantio"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_plantio: {
        Row: {
          created_at: string | null
          data_estimada_floracao: string | null
          data_estimada_germinacao: string | null
          data_plantio: string
          especie_id: string | null
          id: string
          identificacao_lote: string
          integracoes: Json | null
          preco_venda_estimado: number | null
          quantidade_morta: number | null
          quantidade_plantada: number
          setor_id: string | null
          status: string | null
          tipo_gestao: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_estimada_floracao?: string | null
          data_estimada_germinacao?: string | null
          data_plantio: string
          especie_id?: string | null
          id?: string
          identificacao_lote: string
          integracoes?: Json | null
          preco_venda_estimado?: number | null
          quantidade_morta?: number | null
          quantidade_plantada: number
          setor_id?: string | null
          status?: string | null
          tipo_gestao?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_estimada_floracao?: string | null
          data_estimada_germinacao?: string | null
          data_plantio?: string
          especie_id?: string | null
          id?: string
          identificacao_lote?: string
          integracoes?: Json | null
          preco_venda_estimado?: number | null
          quantidade_morta?: number | null
          quantidade_plantada?: number
          setor_id?: string | null
          status?: string | null
          tipo_gestao?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_plantio_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotes_plantio_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores_estufa"
            referencedColumns: ["id"]
          },
        ]
      }
      plantas: {
        Row: {
          created_at: string | null
          data_germinacao: string | null
          data_ultima_rega: string | null
          id: string
          identificador_individual: string
          lote_plantio_id: string | null
          qr_code_uuid: string | null
          saude: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data_germinacao?: string | null
          data_ultima_rega?: string | null
          id?: string
          identificador_individual: string
          lote_plantio_id?: string | null
          qr_code_uuid?: string | null
          saude?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data_germinacao?: string | null
          data_ultima_rega?: string | null
          id?: string
          identificador_individual?: string
          lote_plantio_id?: string | null
          qr_code_uuid?: string | null
          saude?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantas_lote_plantio_id_fkey"
            columns: ["lote_plantio_id"]
            isOneToOne: false
            referencedRelation: "lotes_plantio"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_venda: {
        Row: {
          created_at: string | null
          id: string
          lote_plantio_id: string | null
          preco_venda: number
          publicado_mercado_libre: boolean | null
          publicado_rappi: boolean | null
          quantidade_disponivel: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lote_plantio_id?: string | null
          preco_venda: number
          publicado_mercado_libre?: boolean | null
          publicado_rappi?: boolean | null
          quantidade_disponivel: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lote_plantio_id?: string | null
          preco_venda?: number
          publicado_mercado_libre?: boolean | null
          publicado_rappi?: boolean | null
          quantidade_disponivel?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_venda_lote_plantio_id_fkey"
            columns: ["lote_plantio_id"]
            isOneToOne: false
            referencedRelation: "lotes_plantio"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_role: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_role: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_role?: string
        }
        Relationships: []
      }
      sensores_iot: {
        Row: {
          bateria_percentual: number | null
          id: string
          identificacao: string
          setor_id: string | null
          status: string | null
          temperatura_c: number | null
          ultima_leitura: string | null
          umidade_ar_percentual: number | null
          umidade_solo_percentual: number | null
        }
        Insert: {
          bateria_percentual?: number | null
          id?: string
          identificacao: string
          setor_id?: string | null
          status?: string | null
          temperatura_c?: number | null
          ultima_leitura?: string | null
          umidade_ar_percentual?: number | null
          umidade_solo_percentual?: number | null
        }
        Update: {
          bateria_percentual?: number | null
          id?: string
          identificacao?: string
          setor_id?: string | null
          status?: string | null
          temperatura_c?: number | null
          ultima_leitura?: string | null
          umidade_ar_percentual?: number | null
          umidade_solo_percentual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sensores_iot_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores_estufa"
            referencedColumns: ["id"]
          },
        ]
      }
      setores_estufa: {
        Row: {
          capacidade_bancadas: number | null
          created_at: string | null
          id: string
          nome: string
          tipo_clima: string | null
        }
        Insert: {
          capacidade_bancadas?: number | null
          created_at?: string | null
          id?: string
          nome: string
          tipo_clima?: string | null
        }
        Update: {
          capacidade_bancadas?: number | null
          created_at?: string | null
          id?: string
          nome?: string
          tipo_clima?: string | null
        }
        Relationships: []
      }
      sistema_notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          mensagem: string
          target_role: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          mensagem: string
          target_role?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          target_role?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      usuarios_app: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
