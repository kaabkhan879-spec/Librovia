export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          user_id: string
          email: string | null
          role: 'user' | 'super_admin' | 'moderator'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email?: string | null
          role?: 'user' | 'super_admin' | 'moderator'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string | null
          role?: 'user' | 'super_admin' | 'moderator'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string | null
          publisher: string | null
          category: string | null
          language: string | null
          isbn: string | null
          pages: number
          edition: string | null
          description: string | null
          tags: string[]
          file_url: string
          cover_url: string | null
          file_size: number | null
          is_favorite: boolean
          status: string
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author?: string | null
          publisher?: string | null
          category?: string | null
          language?: string | null
          isbn?: string | null
          pages?: number
          edition?: string | null
          description?: string | null
          tags?: string[]
          file_url: string
          cover_url?: string | null
          file_size?: number | null
          is_favorite?: boolean
          status?: string
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string | null
          publisher?: string | null
          category?: string | null
          language?: string | null
          isbn?: string | null
          pages?: number
          edition?: string | null
          description?: string | null
          tags?: string[]
          file_url?: string
          cover_url?: string | null
          file_size?: number | null
          is_favorite?: boolean
          status?: string
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          book_id: string
          current_page: number
          total_pages: number | null
          last_read_at: string
          is_completed: boolean
          started_at: string
          reading_time: number
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          current_page?: number
          total_pages?: number | null
          last_read_at?: string
          is_completed?: boolean
          started_at?: string
          reading_time?: number
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          current_page?: number
          total_pages?: number | null
          last_read_at?: string
          is_completed?: boolean
          started_at?: string
          reading_time?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          user_id: string
          book_id: string
          page_number: number
          note_text: string
          rating: number | null
          highlighted_text: string | null
          is_bookmarked: boolean
          tags: string[]
          x_position: number | null
          y_position: number | null
          note_title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          page_number: number
          note_text: string
          rating?: number | null
          highlighted_text?: string | null
          is_bookmarked?: boolean
          tags?: string[]
          x_position?: number | null
          y_position?: number | null
          note_title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          page_number?: number
          note_text?: string
          rating?: number | null
          highlighted_text?: string | null
          is_bookmarked?: boolean
          tags?: string[]
          x_position?: number | null
          y_position?: number | null
          note_title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          description: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          description: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          description?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      collection_books: {
        Row: {
          id: string
          collection_id: string
          book_id: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          book_id: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          book_id?: string
          created_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          book_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          created_at?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          book_id: string
          page_number: number
          question: string
          answer: string
          difficulty: 'easy' | 'medium' | 'hard'
          topic: string
          is_learned: boolean
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          page_number: number
          question: string
          answer: string
          difficulty?: 'easy' | 'medium' | 'hard'
          topic?: string
          is_learned?: boolean
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          page_number?: number
          question?: string
          answer?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          topic?: string
          is_learned?: boolean
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          transaction_id: string
          customer_name: string | null
          customer_email: string
          plan_name: string
          amount_pkr: number
          gateway: string
          status: string
          billing_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          customer_name?: string | null
          customer_email: string
          plan_name: string
          amount_pkr?: number
          gateway?: string
          status?: string
          billing_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          customer_name?: string | null
          customer_email?: string
          plan_name?: string
          amount_pkr?: number
          gateway?: string
          status?: string
          billing_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          event: string
          category: string
          severity: string
          actor_email: string | null
          actor_role: string | null
          ip_address: string | null
          user_agent: string | null
          location: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event: string
          category?: string
          severity?: string
          actor_email?: string | null
          actor_role?: string | null
          ip_address?: string | null
          user_agent?: string | null
          location?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event?: string
          category?: string
          severity?: string
          actor_email?: string | null
          actor_role?: string | null
          ip_address?: string | null
          user_agent?: string | null
          location?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          plan_name: string
          description: string | null
          badge: string | null
          price_monthly: number
          price_yearly: number
          storage_limit_bytes: number
          ai_daily_limit: number
          offline_download_limit: number
          family_member_limit: number
          features: Json
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          plan_name: string
          description?: string | null
          badge?: string | null
          price_monthly?: number
          price_yearly?: number
          storage_limit_bytes?: number
          ai_daily_limit?: number
          offline_download_limit?: number
          family_member_limit?: number
          features?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_name?: string
          description?: string | null
          badge?: string | null
          price_monthly?: number
          price_yearly?: number
          storage_limit_bytes?: number
          ai_daily_limit?: number
          offline_download_limit?: number
          family_member_limit?: number
          features?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          billing_cycle: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          billing_cycle?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          billing_cycle?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
    Enums: {
      [key: string]: never
    }
  }
}
