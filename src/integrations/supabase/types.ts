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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          action_date: string
          action_type: string
          category: string | null
          content: string | null
          created_at: string
          customer: string
          description: string | null
          id: string
          responsibles: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_date: string
          action_type: string
          category?: string | null
          content?: string | null
          created_at?: string
          customer: string
          description?: string | null
          id?: string
          responsibles?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_date?: string
          action_type?: string
          category?: string | null
          content?: string | null
          created_at?: string
          customer?: string
          description?: string | null
          id?: string
          responsibles?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      champions: {
        Row: {
          created_at: string
          customer_id: string
          email: string | null
          id: string
          linkedin: string | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string | null
          id?: string
          linkedin?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "champions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "champions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          condicao_pagamento: string | null
          created_at: string
          customer_id: string
          data_movimento: string | null
          id: string
          id_contrato: string | null
          id_financeiro: string | null
          import_id: string | null
          indice_renovacao: string | null
          meses_vigencia: number | null
          movimento_mrr: number | null
          mrr: number | null
          mrr_atual: boolean | null
          observacoes: string | null
          status_cliente: string | null
          status_contrato: string | null
          tipo_documento: string | null
          tipo_movimento: string | null
          tipo_renovacao: string | null
          updated_at: string
          valor_contrato: number | null
          valor_original_mrr: number | null
          vendedor: string | null
          vigencia_final: string | null
          vigencia_inicial: string | null
        }
        Insert: {
          condicao_pagamento?: string | null
          created_at?: string
          customer_id: string
          data_movimento?: string | null
          id?: string
          id_contrato?: string | null
          id_financeiro?: string | null
          import_id?: string | null
          indice_renovacao?: string | null
          meses_vigencia?: number | null
          movimento_mrr?: number | null
          mrr?: number | null
          mrr_atual?: boolean | null
          observacoes?: string | null
          status_cliente?: string | null
          status_contrato?: string | null
          tipo_documento?: string | null
          tipo_movimento?: string | null
          tipo_renovacao?: string | null
          updated_at?: string
          valor_contrato?: number | null
          valor_original_mrr?: number | null
          vendedor?: string | null
          vigencia_final?: string | null
          vigencia_inicial?: string | null
        }
        Update: {
          condicao_pagamento?: string | null
          created_at?: string
          customer_id?: string
          data_movimento?: string | null
          id?: string
          id_contrato?: string | null
          id_financeiro?: string | null
          import_id?: string | null
          indice_renovacao?: string | null
          meses_vigencia?: number | null
          movimento_mrr?: number | null
          mrr?: number | null
          mrr_atual?: boolean | null
          observacoes?: string | null
          status_cliente?: string | null
          status_contrato?: string | null
          tipo_documento?: string | null
          tipo_movimento?: string | null
          tipo_renovacao?: string | null
          updated_at?: string
          valor_contrato?: number | null
          valor_original_mrr?: number | null
          vendedor?: string | null
          vigencia_final?: string | null
          vigencia_inicial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_history"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_domains: {
        Row: {
          created_at: string
          customer_id: string
          domain: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          domain: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          domain?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_domains_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_domains_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          cnpj: string
          created_at: string
          cs_responsavel: string | null
          data_cohort: string | null
          id: string
          import_id: string | null
          nome_fantasia: string
          razao_social: string
          status: string
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          cs_responsavel?: string | null
          data_cohort?: string | null
          id?: string
          import_id?: string | null
          nome_fantasia: string
          razao_social: string
          status?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          cs_responsavel?: string | null
          data_cohort?: string | null
          id?: string
          import_id?: string | null
          nome_fantasia?: string
          razao_social?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_history"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_metrics: {
        Row: {
          arr: number | null
          cash_balance: number | null
          cash_flow_operations: number | null
          cost_of_services: number | null
          created_at: string
          customers_count: number | null
          ebit: number | null
          ebitda: number | null
          ebitda_margin: number | null
          employees_count: number | null
          free_cash_flow: number | null
          ga_expenses: number | null
          gross_profit: number | null
          gross_profit_margin: number | null
          gross_revenue: number | null
          id: string
          mrr: number | null
          net_income: number | null
          net_revenue: number | null
          non_recurring_revenue: number | null
          overhead_sga: number | null
          period_date: string
          recurring_revenue: number | null
          revenue_taxes: number | null
          sales_marketing_expenses: number | null
          updated_at: string
        }
        Insert: {
          arr?: number | null
          cash_balance?: number | null
          cash_flow_operations?: number | null
          cost_of_services?: number | null
          created_at?: string
          customers_count?: number | null
          ebit?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          employees_count?: number | null
          free_cash_flow?: number | null
          ga_expenses?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          gross_revenue?: number | null
          id?: string
          mrr?: number | null
          net_income?: number | null
          net_revenue?: number | null
          non_recurring_revenue?: number | null
          overhead_sga?: number | null
          period_date: string
          recurring_revenue?: number | null
          revenue_taxes?: number | null
          sales_marketing_expenses?: number | null
          updated_at?: string
        }
        Update: {
          arr?: number | null
          cash_balance?: number | null
          cash_flow_operations?: number | null
          cost_of_services?: number | null
          created_at?: string
          customers_count?: number | null
          ebit?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          employees_count?: number | null
          free_cash_flow?: number | null
          ga_expenses?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          gross_revenue?: number | null
          id?: string
          mrr?: number | null
          net_income?: number | null
          net_revenue?: number | null
          non_recurring_revenue?: number | null
          overhead_sga?: number | null
          period_date?: string
          recurring_revenue?: number | null
          revenue_taxes?: number | null
          sales_marketing_expenses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      import_history: {
        Row: {
          contracts_created: number | null
          contracts_updated: number | null
          created_at: string
          customers_created: number | null
          customers_updated: number | null
          error_message: string | null
          file_name: string
          file_path: string | null
          id: string
          import_type: string
          imported_by: string | null
          records_imported: number | null
          status: string
        }
        Insert: {
          contracts_created?: number | null
          contracts_updated?: number | null
          created_at?: string
          customers_created?: number | null
          customers_updated?: number | null
          error_message?: string | null
          file_name: string
          file_path?: string | null
          id?: string
          import_type: string
          imported_by?: string | null
          records_imported?: number | null
          status?: string
        }
        Update: {
          contracts_created?: number | null
          contracts_updated?: number | null
          created_at?: string
          customers_created?: number | null
          customers_updated?: number | null
          error_message?: string | null
          file_name?: string
          file_path?: string | null
          id?: string
          import_type?: string
          imported_by?: string | null
          records_imported?: number | null
          status?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_view: boolean
          created_at: string
          id: string
          page: Database["public"]["Enums"]["app_page"]
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_view?: boolean
          created_at?: string
          id?: string
          page: Database["public"]["Enums"]["app_page"]
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_view?: boolean
          created_at?: string
          id?: string
          page?: Database["public"]["Enums"]["app_page"]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          author_name: string | null
          author_type: string
          body: string | null
          created_at: string
          id: string
          intercom_message_id: string | null
          ticket_id: string
        }
        Insert: {
          author_name?: string | null
          author_type: string
          body?: string | null
          created_at?: string
          id?: string
          intercom_message_id?: string | null
          ticket_id: string
        }
        Update: {
          author_name?: string | null
          author_type?: string
          body?: string | null
          created_at?: string
          id?: string
          intercom_message_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          archived: boolean | null
          assignee_name: string | null
          closed_at: string | null
          created_at: string
          customer_id: string | null
          from_email: string | null
          from_name: string | null
          id: string
          intercom_conversation_id: string
          priority: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          assignee_name?: string | null
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          intercom_conversation_id: string
          priority?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          assignee_name?: string | null
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          intercom_conversation_id?: string
          priority?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_metrics: {
        Row: {
          cnpj: string | null
          contratos_vigentes: number | null
          cs_responsavel: string | null
          data_cohort: string | null
          id: string | null
          ltv_total: number | null
          meses_ativo: number | null
          mrr_atual_total: number | null
          nome_fantasia: string | null
          razao_social: string | null
          status: string | null
          total_contratos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_page:
        | "visao_geral"
        | "pipeline"
        | "growth"
        | "clientes"
        | "raio_x"
        | "acoes"
        | "convidar"
        | "perfis_acesso"
      app_role: "admin" | "editor" | "viewer" | "customer_success" | "growth"
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
    Enums: {
      app_page: [
        "visao_geral",
        "pipeline",
        "growth",
        "clientes",
        "raio_x",
        "acoes",
        "convidar",
        "perfis_acesso",
      ],
      app_role: ["admin", "editor", "viewer", "customer_success", "growth"],
    },
  },
} as const
