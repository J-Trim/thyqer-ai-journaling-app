export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      code_analysis: {
        Row: {
          id: string
          component_name: string
          analysis_result: Json
          analyzed_at: string | null
        }
        Insert: {
          id?: string
          component_name: string
          analysis_result: Json
          analyzed_at?: string | null
        }
        Update: {
          id?: string
          component_name?: string
          analysis_result?: Json
          analyzed_at?: string | null
        }
        Relationships: []
      }
      custom_prompts: {
        Row: {
          id: string
          prompt_name: string
          prompt_template: string
          user_id: string
        }
        Insert: {
          id?: string
          prompt_name: string
          prompt_template: string
          user_id: string
        }
        Update: {
          id?: string
          prompt_name?: string
          prompt_template?: string
          user_id?: string
        }
        Relationships: []
      }
      enhanced_prompts: {
        Row: {
          created_at: string | null
          enhanced_template: string
          id: string
          original_type: Database["public"]["Enums"]["valid_transformation"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enhanced_template: string
          id?: string
          original_type: Database["public"]["Enums"]["valid_transformation"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          enhanced_template?: string
          id?: string
          original_type?: Database["public"]["Enums"]["valid_transformation"]
          user_id?: string
        }
        Relationships: []
      }
      entry_tags: {
        Row: {
          entry_id: string
          id: string
          tag_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          tag_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_tags_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          audio_url: string | null
          created_at: string | null
          has_been_edited: boolean | null
          id: string
          text: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          has_been_edited?: boolean | null
          id?: string
          text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          has_been_edited?: boolean | null
          id?: string
          text?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          created_at: string | null
          entry_id: string
          id: string
          transformation_type: Database["public"]["Enums"]["valid_transformation"]
          transformed_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_id: string
          id?: string
          transformation_type?: Database["public"]["Enums"]["valid_transformation"]
          transformed_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string
          id?: string
          transformation_type?: Database["public"]["Enums"]["valid_transformation"]
          transformed_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
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
      valid_transformation:
        | "Quick Summary"
        | "Emotional Check-In"
        | "Daily Affirmation"
        | "Mindfulness Reflection"
        | "Psychoanalysis"
        | "Goal Setting"
        | "Action Plan"
        | "Self-Care Checklist"
        | "Blog Post"
        | "Email"
        | "Instagram Post"
        | "YouTube Script"
        | "X (Twitter) Post"
        | "Instagram Reel / TikTok Clip"
        | "Podcast Show Notes"
        | "LinkedIn Article"
        | "Motivational Snippet"
        | "Lesson Plan"
        | "Meeting Agenda"
        | "Project Proposal"
        | "Performance Review"
        | "Team Update / Status Report"
        | "Implementation Plan"
        | "Project Retrospective"
        | "Executive Summary"
        | "Short Story"
        | "Poem or Song Lyrics"
        | "Comedy Sketch"
        | "Screenplay Scene"
        | "Summary Abstract"
        | "Annotated Bibliography"
        | "Discussion Questions"
        | "Lecture Notes"
        | "Meal Plan"
        | "Workout Routine"
        | "Travel Itinerary"
        | "Brainstorm Session Outline"
        | "Feedback Request"
        | "Conflict Resolution Guide"
        | "Team Charter"
        | "Tagline Generator"
        | "Ad Copy"
        | "Promotional Flyer"
        | "Marketing Strategy Outline"
        | "Code Snippet Explanation"
        | "Bug Report"
        | "API Documentation"
        | "Technical Spec"
        | "2nd Iambic Pentameter Rap"
        | "Bukowski"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
