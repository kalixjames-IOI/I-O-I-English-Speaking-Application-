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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      community_comments: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_reactions: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          level: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      dialogues: {
        Row: {
          audio_url: string | null
          id: string
          lesson_id: string | null
          order_number: number | null
          speaker: string
          text: string
        }
        Insert: {
          audio_url?: string | null
          id?: string
          lesson_id?: string | null
          order_number?: number | null
          speaker: string
          text: string
        }
        Update: {
          audio_url?: string | null
          id?: string
          lesson_id?: string | null
          order_number?: number | null
          speaker?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "dialogues_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_topics: {
        Row: {
          examples: string | null
          explanation: string | null
          id: string
          lesson_id: string | null
          topic: string
        }
        Insert: {
          examples?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          topic: string
        }
        Update: {
          examples?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_topics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          ai_prompt: string | null
          audio_url: string | null
          content: Json | null
          created_at: string | null
          id: string
          lesson_type: string | null
          order_number: number | null
          title: string
          unit_id: string | null
          video_url: string | null
        }
        Insert: {
          ai_prompt?: string | null
          audio_url?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          lesson_type?: string | null
          order_number?: number | null
          title: string
          unit_id?: string | null
          video_url?: string | null
        }
        Update: {
          ai_prompt?: string | null
          audio_url?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          lesson_type?: string | null
          order_number?: number | null
          title?: string
          unit_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          course_id: string | null
          id: string
          name: string
          order_number: number
        }
        Insert: {
          course_id?: string | null
          id?: string
          name: string
          order_number: number
        }
        Update: {
          course_id?: string | null
          id?: string
          name?: string
          order_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "levels_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          current_level: string
          daily_minutes_goal: number
          email: string | null
          fluency_score: number
          full_name: string | null
          id: string
          learning_style: string
          native_language: string | null
          plan: string
          roadmap: Json | null
          streak_days: number
          target_goal: string
          total_xp: number
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          current_level?: string
          daily_minutes_goal?: number
          email?: string | null
          fluency_score?: number
          full_name?: string | null
          id: string
          learning_style?: string
          native_language?: string | null
          plan?: string
          roadmap?: Json | null
          streak_days?: number
          target_goal?: string
          total_xp?: number
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          current_level?: string
          daily_minutes_goal?: number
          email?: string | null
          fluency_score?: number
          full_name?: string | null
          id?: string
          learning_style?: string
          native_language?: string | null
          plan?: string
          roadmap?: Json | null
          streak_days?: number
          target_goal?: string
          total_xp?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          correct_answer: string
          id: string
          lesson_id: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_number: number | null
          question: string
        }
        Insert: {
          correct_answer: string
          id?: string
          lesson_id?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_number?: number | null
          question: string
        }
        Update: {
          correct_answer?: string
          id?: string
          lesson_id?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_number?: number | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_practice: {
        Row: {
          ai_instruction: string | null
          difficulty_level: string | null
          id: string
          lesson_id: string | null
          scenario: string
        }
        Insert: {
          ai_instruction?: string | null
          difficulty_level?: string | null
          id?: string
          lesson_id?: string | null
          scenario: string
        }
        Update: {
          ai_instruction?: string | null
          difficulty_level?: string | null
          id?: string
          lesson_id?: string | null
          scenario?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaking_practice_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          payment_provider: string | null
          plan_name: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          start_date: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_provider?: string | null
          plan_name: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          start_date?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_provider?: string | null
          plan_name?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          start_date?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          description: string | null
          id: string
          level_id: string | null
          order_number: number
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          level_id?: string | null
          order_number: number
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          level_id?: string | null
          order_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completion_status: string | null
          id: string
          last_accessed: string | null
          lesson_id: string | null
          score: number | null
          speaking_score: number | null
          user_id: string | null
          xp_earned: number
        }
        Insert: {
          completion_status?: string | null
          id?: string
          last_accessed?: string | null
          lesson_id?: string | null
          score?: number | null
          speaking_score?: number | null
          user_id?: string | null
          xp_earned?: number
        }
        Update: {
          completion_status?: string | null
          id?: string
          last_accessed?: string | null
          lesson_id?: string | null
          score?: number | null
          speaking_score?: number | null
          user_id?: string | null
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          audio_url: string | null
          example_sentence: string | null
          id: string
          lesson_id: string | null
          meaning: string | null
          pronunciation: string | null
          word: string
        }
        Insert: {
          audio_url?: string | null
          example_sentence?: string | null
          id?: string
          lesson_id?: string | null
          meaning?: string | null
          pronunciation?: string | null
          word: string
        }
        Update: {
          audio_url?: string | null
          example_sentence?: string | null
          id?: string
          lesson_id?: string | null
          meaning?: string | null
          pronunciation?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_progress_summary: { Args: { user_uuid: string }; Returns: Json }
      get_user_subscription_status: {
        Args: { user_uuid: string }
        Returns: string
      }
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
