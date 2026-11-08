// Generated from the Supabase schema (project xwcgolyhwobifaupkjzn).
// Regenerate after schema changes instead of editing by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      favorites: {
        Row: { created_at: string; set_id: string; user_id: string }
        Insert: { created_at?: string; set_id: string; user_id: string }
        Update: { created_at?: string; set_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "favorites_set_id_fkey"; columns: ["set_id"]; isOneToOne: false; referencedRelation: "question_sets"; referencedColumns: ["id"] },
          { foreignKeyName: "favorites_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          current_index: number
          ended_at: string | null
          game_type: Database["public"]["Enums"]["game_type"]
          host_id: string
          id: string
          join_code: string
          set_id: string
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          created_at?: string
          current_index?: number
          ended_at?: string | null
          game_type: Database["public"]["Enums"]["game_type"]
          host_id: string
          id?: string
          join_code: string
          set_id: string
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: Partial<Database["public"]["Tables"]["game_sessions"]["Insert"]>
        Relationships: [
          { foreignKeyName: "game_sessions_host_id_fkey"; columns: ["host_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "game_sessions_set_id_fkey"; columns: ["set_id"]; isOneToOne: false; referencedRelation: "question_sets"; referencedColumns: ["id"] },
        ]
      }
      grades: {
        Row: { id: number; name_ar: string; number: number }
        Insert: { id?: never; name_ar: string; number: number }
        Update: { id?: never; name_ar?: string; number?: number }
        Relationships: []
      }
      lessons: {
        Row: {
          id: number
          objectives: string | null
          position: number
          title_ar: string
          title_en: string | null
          unit_id: number
        }
        Insert: {
          id?: never
          objectives?: string | null
          position?: number
          title_ar: string
          title_en?: string | null
          unit_id: number
        }
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>
        Relationships: [
          { foreignKeyName: "lessons_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          school: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      question_sets: {
        Row: {
          copied_from: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          lesson_id: number
          owner_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          copied_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lesson_id: number
          owner_id?: string | null
          title: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["question_sets"]["Insert"]>
        Relationships: [
          { foreignKeyName: "question_sets_copied_from_fkey"; columns: ["copied_from"]; isOneToOne: false; referencedRelation: "question_sets"; referencedColumns: ["id"] },
          { foreignKeyName: "question_sets_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
          { foreignKeyName: "question_sets_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      questions: {
        Row: {
          answer: string
          choices: Json
          created_at: string
          id: string
          image_url: string | null
          position: number
          prompt: string
          set_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          answer: string
          choices?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          position?: number
          prompt: string
          set_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>
        Relationships: [
          { foreignKeyName: "questions_set_id_fkey"; columns: ["set_id"]; isOneToOne: false; referencedRelation: "question_sets"; referencedColumns: ["id"] },
        ]
      }
      session_answers: {
        Row: {
          answered_at: string
          id: number
          is_correct: boolean
          nickname: string
          question_id: string
          session_id: string
          team: string | null
        }
        Insert: {
          answered_at?: string
          id?: never
          is_correct: boolean
          nickname: string
          question_id: string
          session_id: string
          team?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["session_answers"]["Insert"]>
        Relationships: [
          { foreignKeyName: "session_answers_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "questions"; referencedColumns: ["id"] },
          { foreignKeyName: "session_answers_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "game_sessions"; referencedColumns: ["id"] },
        ]
      }
      subjects: {
        Row: { id: number; name_ar: string; name_en: string | null }
        Insert: { id?: never; name_ar: string; name_en?: string | null }
        Update: { id?: never; name_ar?: string; name_en?: string | null }
        Relationships: []
      }
      units: {
        Row: {
          grade_id: number
          id: number
          position: number
          semester: number
          subject_id: number
          title_ar: string
          title_en: string | null
        }
        Insert: {
          grade_id: number
          id?: never
          position?: number
          semester: number
          subject_id: number
          title_ar: string
          title_en?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>
        Relationships: [
          { foreignKeyName: "units_grade_id_fkey"; columns: ["grade_id"]; isOneToOne: false; referencedRelation: "grades"; referencedColumns: ["id"] },
          { foreignKeyName: "units_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      copy_question_set: { Args: { source_id: string }; Returns: string }
    }
    Enums: {
      game_type: "sail_race" | "frankincense_caravan"
      question_type: "mcq" | "true_false" | "short"
      session_status: "lobby" | "active" | "finished"
      user_role: "teacher" | "admin"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
