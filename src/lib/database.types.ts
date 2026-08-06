export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
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
          email: string | null
          full_name: string | null
          id: string
          native_language: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          native_language?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          native_language?: string | null
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
        }
        Insert: {
          completion_status?: string | null
          id?: string
          last_accessed?: string | null
          lesson_id?: string | null
          score?: number | null
          speaking_score?: number | null
          user_id?: string | null
        }
        Update: {
          completion_status?: string | null
          id?: string
          last_accessed?: string | null
          lesson_id?: string | null
          score?: number | null
          speaking_score?: number | null
          user_id?: string | null
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
