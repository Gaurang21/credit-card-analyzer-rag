// Hand-written typings that mirror db/migrations/001_init.sql.
// Replace with generated types once a project ref exists:
//   pnpm dlx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Empty = Record<string, never>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string };
        Insert: { id: string; display_name?: string | null; created_at?: string };
        Update: { display_name?: string | null };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          issuer: string | null;
          network: string | null;
          last_four: string | null;
          annual_fee: number | null;
          foreign_txn_fee_pct: number | null;
          signup_bonus: Json | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          issuer?: string | null;
          network?: string | null;
          last_four?: string | null;
          annual_fee?: number | null;
          foreign_txn_fee_pct?: number | null;
          signup_bonus?: Json | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          issuer?: string | null;
          network?: string | null;
          last_four?: string | null;
          annual_fee?: number | null;
          foreign_txn_fee_pct?: number | null;
          signup_bonus?: Json | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      card_categories: {
        Row: {
          id: string;
          card_id: string;
          category: string;
          multiplier: number;
          cap_amount: number | null;
          cap_period: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          card_id: string;
          category: string;
          multiplier: number;
          cap_amount?: number | null;
          cap_period?: string | null;
          notes?: string | null;
        };
        Update: {
          category?: string;
          multiplier?: number;
          cap_amount?: number | null;
          cap_period?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "card_categories_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
        ];
      };
      card_embeddings: {
        Row: { card_id: string; embedding: number[]; updated_at: string };
        Insert: { card_id: string; embedding: number[]; updated_at?: string };
        Update: { embedding?: number[]; updated_at?: string };
        Relationships: [];
      };
      merchant_categories: {
        Row: {
          id: string;
          merchant: string;
          category: string;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant: string;
          category: string;
          embedding?: number[] | null;
        };
        Update: {
          merchant?: string;
          category?: string;
          embedding?: number[] | null;
        };
        Relationships: [];
      };
      advisor_queries: {
        Row: { id: string; user_id: string; query: string; response: Json; created_at: string };
        Insert: { id?: string; user_id: string; query: string; response: Json };
        Update: { response?: Json };
        Relationships: [];
      };
    };
    Views: Empty;
    Functions: {
      match_merchant_category: {
        Args: { query_embedding: number[]; match_count?: number };
        Returns: { id: string; merchant: string; category: string; similarity: number }[];
      };
      match_user_cards: {
        Args: { user_id_input: string; query_embedding: number[]; match_count?: number };
        Returns: { card_id: string; similarity: number }[];
      };
    };
    Enums: Empty;
    CompositeTypes: Empty;
  };
}
