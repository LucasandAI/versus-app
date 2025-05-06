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
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      club_chat_messages: {
        Row: {
          club_id: string | null
          id: string
          message: string
          sender_id: string | null
          timestamp: string
        }
        Insert: {
          club_id?: string | null
          id?: string
          message: string
          sender_id?: string | null
          timestamp?: string
        }
        Update: {
          club_id?: string | null
          id?: string
          message?: string
          sender_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_chat_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_chat_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "club_chat_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "club_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invites: {
        Row: {
          club_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["request_status_old"]
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["request_status_old"]
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["request_status_old"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_invites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "club_invites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          is_admin: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          club_id: string
          is_admin?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          club_id?: string
          is_admin?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_messages_read: {
        Row: {
          club_id: string
          id: string
          last_read_timestamp: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          last_read_timestamp?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          last_read_timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_read_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_read_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "club_messages_read_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      club_requests: {
        Row: {
          club_id: string
          created_at: string
          id: string
          status: "PENDING" | "SUCCESS" | "ERROR"
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          status?: "PENDING" | "SUCCESS" | "ERROR"
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          status?: "PENDING" | "SUCCESS" | "ERROR"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_requests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_requests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "club_requests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      clubs: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          division: string
          elite_points: number
          id: string
          logo: string | null
          member_count: number
          name: string
          slug: string
          tier: number
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          division: string
          elite_points?: number
          id?: string
          logo?: string | null
          member_count?: number
          name: string
          slug: string
          tier: number
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          division?: string
          elite_points?: number
          id?: string
          logo?: string | null
          member_count?: number
          name?: string
          slug?: string
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_conversations: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          conversation_id: string | null
          id: string
          receiver_id: string
          sender_id: string
          text: string
          timestamp: string
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          text: string
          timestamp?: string
        }
        Update: {
          conversation_id?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          text?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages_read: {
        Row: {
          conversation_id: string
          id: string
          last_read_timestamp: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          last_read_timestamp?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          last_read_timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_read_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      match_distances: {
        Row: {
          club_id: string | null
          created_at: string
          distance: number
          id: string
          match_id: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          distance: number
          id?: string
          match_id?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          distance?: number
          id?: string
          match_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_distances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_distances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "match_distances_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "match_distances_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_distances_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_distances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_club_id: string | null
          created_at: string
          end_date: string
          home_club_id: string | null
          id: string
          league_after_match: Json | null
          league_before_match: Json | null
          start_date: string
          status: string
          winner: string | null
        }
        Insert: {
          away_club_id?: string | null
          created_at?: string
          end_date: string
          home_club_id?: string | null
          id?: string
          league_after_match?: Json | null
          league_before_match?: Json | null
          start_date: string
          status: string
          winner?: string | null
        }
        Update: {
          away_club_id?: string | null
          created_at?: string
          end_date?: string
          home_club_id?: string | null
          id?: string
          league_after_match?: Json | null
          league_before_match?: Json | null
          start_date?: string
          status?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          club_id: string
          division: string
          queued_at: string | null
          tier: number
        }
        Insert: {
          club_id: string
          division: string
          queued_at?: string | null
          tier: number
        }
        Update: {
          club_id?: string
          division?: string
          queued_at?: string | null
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaking_queue_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matchmaking_queue_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      notifications: {
        Row: {
          club_id: string | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          message: string | null
          read: boolean
          status: Database["public"]["Enums"]["notification_status"]
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          message?: string | null
          read?: boolean
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          message?: string | null
          read?: boolean
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "view_full_match_info"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          facebook: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          tiktok: string | null
          twitter: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          facebook?: string | null
          id: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      view_full_match_info: {
        Row: {
          away_club_division: string | null
          away_club_id: string | null
          away_club_logo: string | null
          away_club_name: string | null
          away_club_tier: number | null
          away_members: Json | null
          end_date: string | null
          home_club_division: string | null
          home_club_id: string | null
          home_club_logo: string | null
          home_club_name: string | null
          home_club_tier: number | null
          home_members: Json | null
          match_id: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_eligible_opponents: {
        Args: { p_club_id: string; p_division: string; p_tier: number }
        Returns: {
          club_id: string
          division_diff: number
        }[]
      }
      get_unread_club_messages_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_unread_dm_count: {
        Args: { user_id: string }
        Returns: number
      }
      is_club_admin: {
        Args: { club_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "read"
        | "unread"
      notification_type:
        | "invite"
        | "join_request"
        | "match_result"
        | "match_start"
        | "achievement"
        | "invitation"
        | "activity"
        | "incoming_request"
        | "request_accepted"
      request_status: "PENDING" | "SUCCESS" | "REJECTED"
      request_status_legacy: "pending" | "accepted"
      request_status_old: "pending" | "accepted" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_status: [
        "pending",
        "accepted",
        "rejected",
        "read",
        "unread",
      ],
      notification_type: [
        "invite",
        "join_request",
        "match_result",
        "match_start",
        "achievement",
        "invitation",
        "activity",
        "incoming_request",
        "request_accepted",
      ],
      request_status: ["PENDING", "SUCCESS", "REJECTED"],
      request_status_legacy: ["pending", "accepted"],
      request_status_old: ["pending", "accepted", "rejected"],
    },
  },
} as const
