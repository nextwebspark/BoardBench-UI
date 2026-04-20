export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "active" | "paused" | "archived";
          region: string | null;
          focus_company_id: number | null;
          peer_company_ids: number[] | null;
          benchmark_year: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: "active" | "paused" | "archived";
          region?: string | null;
          focus_company_id?: number | null;
          peer_company_ids?: number[] | null;
          benchmark_year?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: "active" | "paused" | "archived";
          region?: string | null;
          focus_company_id?: number | null;
          peer_company_ids?: number[] | null;
          benchmark_year?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: number;
          company_name: Json;
          exchange: Json;
          country: Json;
          sector: Json | null;
          sub_sector: Json | null;
          source_document_url: string | null;
          source_system: string;
          extraction_run_id: string | null;
          data_version: string | null;
          company_name_value: string;
          exchange_value: string | null;
          country_value: string;
          sector_value: string | null;
          sub_sector_value: string | null;
          created_at: string;
          updated_at: string;
          company_code: string | null;
        };
        Insert: {
          company_name: Json;
          exchange: Json;
          country: Json;
          sector?: Json | null;
          sub_sector?: Json | null;
          source_document_url?: string | null;
          source_system?: string;
          extraction_run_id?: string | null;
          data_version?: string | null;
          created_at?: string;
          updated_at?: string;
          company_code?: string | null;
        };
        Update: {
          company_name?: Json;
          exchange?: Json;
          country?: Json;
          sector?: Json | null;
          sub_sector?: Json | null;
          source_document_url?: string | null;
          source_system?: string;
          extraction_run_id?: string | null;
          data_version?: string | null;
          updated_at?: string;
          company_code?: string | null;
        };
        Relationships: [];
      };
      company_facts: {
        Row: {
          id: number;
          company_id: number;
          year: number;
          revenue: Json;
          profit_net: Json;
          market_capitalisation: Json | null;
          employees: Json | null;
          source_document_url: string | null;
          source_system: string;
          extraction_run_id: string | null;
          data_version: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: number;
          year: number;
          revenue: Json;
          profit_net: Json;
          market_capitalisation?: Json | null;
          employees?: Json | null;
          source_document_url?: string | null;
          source_system?: string;
          extraction_run_id?: string | null;
          data_version?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: number;
          year?: number;
          revenue?: Json;
          profit_net?: Json;
          market_capitalisation?: Json | null;
          employees?: Json | null;
          source_document_url?: string | null;
          source_system?: string;
          extraction_run_id?: string | null;
          data_version?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      board_directors: {
        Row: {
          id: number;
          fact_id: number;
          director_name: string;
          nationality: string | null;
          ethnicity: string | null;
          local_expat: string | null;
          gender: string | null;
          age: number | null;
          board_role: string | null;
          director_type: string | null;
          skills: string | null;
          board_meetings_attended: number | null;
          retainer_fee: number | null;
          benefits_in_kind: number | null;
          attendance_allowance: number | null;
          expense_allowance: number | null;
          assembly_fee: number | null;
          director_board_committee_fee: number | null;
          variable_remuneration: number | null;
          variable_remuneration_description: string | null;
          other_remuneration: number | null;
          other_remuneration_description: string | null;
          total_fee: number | null;
          created_at: string | null;
        };
        Insert: {
          fact_id: number;
          director_name: string;
          nationality?: string | null;
          ethnicity?: string | null;
          local_expat?: string | null;
          gender?: string | null;
          age?: number | null;
          board_role?: string | null;
          director_type?: string | null;
          skills?: string | null;
          board_meetings_attended?: number | null;
          retainer_fee?: number | null;
          benefits_in_kind?: number | null;
          attendance_allowance?: number | null;
          expense_allowance?: number | null;
          assembly_fee?: number | null;
          director_board_committee_fee?: number | null;
          variable_remuneration?: number | null;
          variable_remuneration_description?: string | null;
          other_remuneration?: number | null;
          other_remuneration_description?: string | null;
          total_fee?: number | null;
          created_at?: string | null;
        };
        Update: {
          fact_id?: number;
          director_name?: string;
          nationality?: string | null;
          gender?: string | null;
          age?: number | null;
          board_role?: string | null;
          director_type?: string | null;
          total_fee?: number | null;
        };
        Relationships: [];
      };
      board_committees: {
        Row: {
          id: number;
          fact_id: number;
          member_name: string;
          nationality: string | null;
          ethnicity: string | null;
          local_expat: string | null;
          gender: string | null;
          age: number | null;
          committee_name: string | null;
          committee_role: string | null;
          committee_meetings_attended: number | null;
          committee_retainer_fee: number | null;
          committee_allowances: number | null;
          committee_total_fee: number | null;
          created_at: string | null;
        };
        Insert: {
          fact_id: number;
          member_name: string;
          nationality?: string | null;
          ethnicity?: string | null;
          local_expat?: string | null;
          gender?: string | null;
          age?: number | null;
          committee_name?: string | null;
          committee_role?: string | null;
          committee_meetings_attended?: number | null;
          committee_retainer_fee?: number | null;
          committee_allowances?: number | null;
          committee_total_fee?: number | null;
          created_at?: string | null;
        };
        Update: {
          fact_id?: number;
          member_name?: string;
          committee_name?: string | null;
          committee_role?: string | null;
          committee_total_fee?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row types
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyFact = Database["public"]["Tables"]["company_facts"]["Row"];
export type BoardDirector = Database["public"]["Tables"]["board_directors"]["Row"];
export type BoardCommittee = Database["public"]["Tables"]["board_committees"]["Row"];
