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
      agent_messages: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_agent_logs: {
        Row: {
          action_taken: string | null
          client_id: string | null
          created_at: string | null
          id: string
          result_status: string | null
        }
        Insert: {
          action_taken?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          result_status?: string | null
        }
        Update: {
          action_taken?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          result_status?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          created_at: string | null
          id: string
          last_action: string | null
          name: string
          role: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_action?: string | null
          name: string
          role: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_action?: string | null
          name?: string
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          api_reference: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          api_reference?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          api_reference?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      brief_submissions: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          lead_id: string | null
          service_type: string
        }
        Insert: {
          answers?: Json
          created_at?: string | null
          id?: string
          lead_id?: string | null
          service_type: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          lead_id?: string | null
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          branding_color: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          branding_color?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          branding_color?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_websites: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          site_type: string | null
          url: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          site_type?: string | null
          url: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          site_type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_websites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          chat_id: string
          created_at: string | null
          id: string
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          chat_id: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          chat_id?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          layout_config: Json | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          service_type: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          service_type?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          service_type?: string | null
          status?: string
        }
        Relationships: []
      }
      metrics_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          response: Json
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          response: Json
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          response?: Json
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          message: string
          read_by: string[]
          title: string
          type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read_by?: string[]
          title: string
          type?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read_by?: string[]
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          max_ai_agents: number | null
          max_dashboards: number | null
          max_goals_per_project: number | null
          max_integrations: number | null
          max_projects: number | null
          name: string
          price: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          max_ai_agents?: number | null
          max_dashboards?: number | null
          max_goals_per_project?: number | null
          max_integrations?: number | null
          max_projects?: number | null
          name: string
          price?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          max_ai_agents?: number | null
          max_dashboards?: number | null
          max_goals_per_project?: number | null
          max_integrations?: number | null
          max_projects?: number | null
          name?: string
          price?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_goals: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          metric_key: string
          period: string | null
          project_id: string
          target_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          metric_key: string
          period?: string | null
          project_id: string
          target_value: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          metric_key?: string
          period?: string | null
          project_id?: string
          target_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      proposal_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          name: string
          service_type: string
        }
        Insert: {
          created_at?: string
          html_content?: string
          id?: string
          name: string
          service_type: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          name?: string
          service_type?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          company_name: string
          created_at: string | null
          cta_primary_url: string | null
          cta_secondary_url: string | null
          html_content: string
          id: string
          lead_id: string | null
          payment_type: string
          price: string
          proposal_date: string
          service_type: string
          slug: string
          status: string
          terms_conditions: string
          title: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string
          created_at?: string | null
          cta_primary_url?: string | null
          cta_secondary_url?: string | null
          html_content?: string
          id?: string
          lead_id?: string | null
          payment_type?: string
          price?: string
          proposal_date?: string
          service_type?: string
          slug: string
          status?: string
          terms_conditions?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          cta_primary_url?: string | null
          cta_secondary_url?: string | null
          html_content?: string
          id?: string
          lead_id?: string | null
          payment_type?: string
          price?: string
          proposal_date?: string
          service_type?: string
          slug?: string
          status?: string
          terms_conditions?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          company_id: string
          created_at: string | null
          currency: string | null
          expires_at: string | null
          id: string
          plan_id: string | null
          plan_name: string
          price: number
          starts_at: string
          status: string
          stripe_customer_id: string | null
          stripe_link: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          company_id: string
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          plan_name: string
          price: number
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_link?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          company_id?: string
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string
          price?: number
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_link?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string | null
          account_ids: string[] | null
          account_name: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          meta_app_id: string | null
          platform: string
          refresh_token: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_ids?: string[] | null
          account_name?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          meta_app_id?: string | null
          platform: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_ids?: string[] | null
          account_name?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          meta_app_id?: string | null
          platform?: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_link_clicks: {
        Row: {
          clicked_at: string
          country: string | null
          device_type: string | null
          id: string
          ip_hash: string | null
          link_id: string
          referrer: string | null
        }
        Insert: {
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          link_id: string
          referrer?: string | null
        }
        Update: {
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_link_analytics"
            referencedColumns: ["link_id"]
          },
          {
            foreignKeyName: "whatsapp_link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_links"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link_type: Database["public"]["Enums"]["whatsapp_link_type"]
          message: string | null
          phone: string
          slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_type?: Database["public"]["Enums"]["whatsapp_link_type"]
          message?: string | null
          phone: string
          slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_type?: Database["public"]["Enums"]["whatsapp_link_type"]
          message?: string | null
          phone?: string
          slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      widgets: {
        Row: {
          created_at: string | null
          dashboard_id: string
          data_source: string
          grid_settings: Json
          id: string
          metric_config: Json
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dashboard_id: string
          data_source: string
          grid_settings?: Json
          id?: string
          metric_config?: Json
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dashboard_id?: string
          data_source?: string
          grid_settings?: Json
          id?: string
          metric_config?: Json
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      whatsapp_link_analytics: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          last_click_at: string | null
          link_id: string | null
          link_type: Database["public"]["Enums"]["whatsapp_link_type"] | null
          phone: string | null
          slug: string | null
          total_clicks: number | null
          unique_clicks: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_slug_available: { Args: { p_slug: string }; Returns: boolean }
      create_company_for_user: {
        Args: { _branding_color?: string; _company_name: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_notification_read: {
        Args: { _notification_id: string }
        Returns: undefined
      }
      mark_proposal_viewed: { Args: { _slug: string }; Returns: undefined }
      upsert_lead_and_brief: {
        Args: {
          _answers: Json
          _company: string
          _email: string
          _name: string
          _service_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      whatsapp_link_type: "chat" | "catalog"
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
      app_role: ["admin", "moderator", "user"],
      whatsapp_link_type: ["chat", "catalog"],
    },
  },
} as const
