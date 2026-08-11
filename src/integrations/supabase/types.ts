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
      dogs: {
        Row: {
          age_years: number | null
          bio: string | null
          breed: string | null
          created_at: string
          id: string
          is_published: boolean
          lat: number | null
          lng: number | null
          name: string
          neighborhood: string | null
          owner_id: string
          photo_url: string | null
          show_on_map: boolean
          size: Database["public"]["Enums"]["dog_size"] | null
          updated_at: string
        }
        Insert: {
          age_years?: number | null
          bio?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          neighborhood?: string | null
          owner_id: string
          photo_url?: string | null
          show_on_map?: boolean
          size?: Database["public"]["Enums"]["dog_size"] | null
          updated_at?: string
        }
        Update: {
          age_years?: number | null
          bio?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          neighborhood?: string | null
          owner_id?: string
          photo_url?: string | null
          show_on_map?: boolean
          size?: Database["public"]["Enums"]["dog_size"] | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_published: boolean
          lat: number
          lng: number
          rsvp_url: string | null
          starts_at: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          address: string
          city?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          lat: number
          lng: number
          rsvp_url?: string | null
          starts_at: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          lat?: number
          lng?: number
          rsvp_url?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      match_requests: {
        Row: {
          admin_notes: string | null
          age: string | null
          allergies: string | null
          animal: string | null
          area: string | null
          breed: string | null
          children: string | null
          created_at: string
          deadline_at: string
          diet: string | null
          email: string
          end_date: string | null
          exercise: string | null
          exp_level: string | null
          frequency: string | null
          full_name: string
          gender_pref: string | null
          has_medical: string | null
          hours: number | null
          house_trained: string | null
          id: string
          issues: string | null
          language: string | null
          matched_sitter_id: string | null
          meals: number | null
          medical_desc: string | null
          notes: string | null
          other_pets: string | null
          other_qualities: string | null
          outdoor: string | null
          parasite: string | null
          pet_name: string | null
          phone: string | null
          raw: Json
          recurring: string | null
          referral: string | null
          services: string[]
          sex: string | null
          size: string | null
          sleep: string | null
          start_date: string | null
          status: string
          submitted_at: string
          temperament: string | null
          traits: string[]
          updated_at: string
          updates: string | null
          used_before: string | null
          user_id: string | null
          vaccines: string | null
        }
        Insert: {
          admin_notes?: string | null
          age?: string | null
          allergies?: string | null
          animal?: string | null
          area?: string | null
          breed?: string | null
          children?: string | null
          created_at?: string
          deadline_at?: string
          diet?: string | null
          email: string
          end_date?: string | null
          exercise?: string | null
          exp_level?: string | null
          frequency?: string | null
          full_name: string
          gender_pref?: string | null
          has_medical?: string | null
          hours?: number | null
          house_trained?: string | null
          id?: string
          issues?: string | null
          language?: string | null
          matched_sitter_id?: string | null
          meals?: number | null
          medical_desc?: string | null
          notes?: string | null
          other_pets?: string | null
          other_qualities?: string | null
          outdoor?: string | null
          parasite?: string | null
          pet_name?: string | null
          phone?: string | null
          raw?: Json
          recurring?: string | null
          referral?: string | null
          services?: string[]
          sex?: string | null
          size?: string | null
          sleep?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string
          temperament?: string | null
          traits?: string[]
          updated_at?: string
          updates?: string | null
          used_before?: string | null
          user_id?: string | null
          vaccines?: string | null
        }
        Update: {
          admin_notes?: string | null
          age?: string | null
          allergies?: string | null
          animal?: string | null
          area?: string | null
          breed?: string | null
          children?: string | null
          created_at?: string
          deadline_at?: string
          diet?: string | null
          email?: string
          end_date?: string | null
          exercise?: string | null
          exp_level?: string | null
          frequency?: string | null
          full_name?: string
          gender_pref?: string | null
          has_medical?: string | null
          hours?: number | null
          house_trained?: string | null
          id?: string
          issues?: string | null
          language?: string | null
          matched_sitter_id?: string | null
          meals?: number | null
          medical_desc?: string | null
          notes?: string | null
          other_pets?: string | null
          other_qualities?: string | null
          outdoor?: string | null
          parasite?: string | null
          pet_name?: string | null
          phone?: string | null
          raw?: Json
          recurring?: string | null
          referral?: string | null
          services?: string[]
          sex?: string | null
          size?: string | null
          sleep?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string
          temperament?: string | null
          traits?: string[]
          updated_at?: string
          updates?: string | null
          used_before?: string | null
          user_id?: string | null
          vaccines?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_requests_matched_sitter_id_fkey"
            columns: ["matched_sitter_id"]
            isOneToOne: false
            referencedRelation: "petsitters"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string
          category: Database["public"]["Enums"]["partner_category"]
          city: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          lat: number
          lng: number
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          category?: Database["public"]["Enums"]["partner_category"]
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          lat: number
          lng: number
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          category?: Database["public"]["Enums"]["partner_category"]
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      petsitters: {
        Row: {
          accepts_children: boolean
          accepts_other_pets: boolean
          admin_notes: string | null
          animals: string[]
          bio: string | null
          created_at: string
          daily_rate: number | null
          email: string | null
          experience_level: string
          full_name: string
          gender: string | null
          handles_aggressive: boolean
          handles_anxious: boolean
          handles_medical: boolean
          has_outdoor_space: boolean
          hourly_rate: number | null
          id: string
          languages: string[]
          max_concurrent_bookings: number
          neighborhoods: string[]
          phone: string | null
          photo_url: string | null
          services: string[]
          size_capacity: string[]
          status: string
          updated_at: string
          years_experience: number
        }
        Insert: {
          accepts_children?: boolean
          accepts_other_pets?: boolean
          admin_notes?: string | null
          animals?: string[]
          bio?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          experience_level?: string
          full_name: string
          gender?: string | null
          handles_aggressive?: boolean
          handles_anxious?: boolean
          handles_medical?: boolean
          has_outdoor_space?: boolean
          hourly_rate?: number | null
          id?: string
          languages?: string[]
          max_concurrent_bookings?: number
          neighborhoods?: string[]
          phone?: string | null
          photo_url?: string | null
          services?: string[]
          size_capacity?: string[]
          status?: string
          updated_at?: string
          years_experience?: number
        }
        Update: {
          accepts_children?: boolean
          accepts_other_pets?: boolean
          admin_notes?: string | null
          animals?: string[]
          bio?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          experience_level?: string
          full_name?: string
          gender?: string | null
          handles_aggressive?: boolean
          handles_anxious?: boolean
          handles_medical?: boolean
          has_outdoor_space?: boolean
          hourly_rate?: number | null
          id?: string
          languages?: string[]
          max_concurrent_bookings?: number
          neighborhoods?: string[]
          phone?: string | null
          photo_url?: string | null
          services?: string[]
          size_capacity?: string[]
          status?: string
          updated_at?: string
          years_experience?: number
        }
        Relationships: []
      }
      playdate_requests: {
        Row: {
          created_at: string
          from_dog_id: string | null
          from_user_id: string
          id: string
          message: string | null
          park_lat: number | null
          park_lng: number | null
          park_name: string | null
          proposed_at: string | null
          status: Database["public"]["Enums"]["playdate_status"]
          to_dog_id: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_dog_id?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          park_lat?: number | null
          park_lng?: number | null
          park_name?: string | null
          proposed_at?: string | null
          status?: Database["public"]["Enums"]["playdate_status"]
          to_dog_id: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_dog_id?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          park_lat?: number | null
          park_lng?: number | null
          park_name?: string | null
          proposed_at?: string | null
          status?: Database["public"]["Enums"]["playdate_status"]
          to_dog_id?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playdate_requests_from_dog_id_fkey"
            columns: ["from_dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playdate_requests_to_dog_id_fkey"
            columns: ["to_dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      dog_size: "small" | "medium" | "large" | "xlarge"
      map_pin_kind: "partner" | "event" | "sitter_zone"
      partner_category:
        | "vet"
        | "groomer"
        | "boutique"
        | "cafe"
        | "park"
        | "training"
        | "daycare"
        | "other"
      playdate_status: "pending" | "accepted" | "declined" | "cancelled"
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
      app_role: ["admin", "user"],
      dog_size: ["small", "medium", "large", "xlarge"],
      map_pin_kind: ["partner", "event", "sitter_zone"],
      partner_category: [
        "vet",
        "groomer",
        "boutique",
        "cafe",
        "park",
        "training",
        "daycare",
        "other",
      ],
      playdate_status: ["pending", "accepted", "declined", "cancelled"],
    },
  },
} as const
