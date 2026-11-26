export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      drive_clipboard_items: {
        Row: {
          content: string;
          created_at: string;
          created_by: string;
          id: string;
          owner_user_id: string | null;
          session_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          owner_user_id?: string | null;
          session_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          owner_user_id?: string | null;
          session_id?: string;
        };
        Relationships: [];
      };
      drive_files: {
        Row: {
          created_at: string;
          file_category: 'image' | 'document' | 'archive' | 'text' | 'other';
          file_name: string;
          id: string;
          mime_type: string;
          owner_user_id: string | null;
          session_id: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          file_category: 'image' | 'document' | 'archive' | 'text' | 'other';
          file_name: string;
          id?: string;
          mime_type?: string;
          owner_user_id?: string | null;
          session_id: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by?: string;
        };
        Update: {
          created_at?: string;
          file_category?: 'image' | 'document' | 'archive' | 'text' | 'other';
          file_name?: string;
          id?: string;
          mime_type?: string;
          owner_user_id?: string | null;
          session_id?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_by?: string;
        };
        Relationships: [];
      };
      drive_sessions: {
        Row: {
          created_at: string;
          duration_minutes: number;
          expires_at: string;
          has_password: boolean;
          id: string;
          lockdown_mode: boolean;
          owner_user_id: string | null;
          password_hash: string | null;
          password_salt: string | null;
          status: 'active' | 'ended';
          token: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          expires_at: string;
          has_password?: boolean;
          id?: string;
          lockdown_mode?: boolean;
          owner_user_id?: string | null;
          password_hash?: string | null;
          password_salt?: string | null;
          status?: 'active' | 'ended';
          token: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          expires_at?: string;
          has_password?: boolean;
          id?: string;
          lockdown_mode?: boolean;
          owner_user_id?: string | null;
          password_hash?: string | null;
          password_salt?: string | null;
          status?: 'active' | 'ended';
          token?: string;
        };
        Relationships: [];
      };
      rotor_presets: {
        Row: {
          created_at: string;
          description: string;
          id: number;
          left_position: number;
          left_ring_setting: number;
          left_rotor_id: string;
          left_turnover_notch: number;
          middle_position: number;
          middle_ring_setting: number;
          middle_rotor_id: string;
          middle_turnover_notch: number;
          name: string;
          reflector: string;
          right_position: number;
          right_ring_setting: number;
          right_rotor_id: string;
          right_turnover_notch: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: never;
          left_position: number;
          left_ring_setting: number;
          left_rotor_id?: string;
          left_turnover_notch: number;
          middle_position: number;
          middle_ring_setting: number;
          middle_rotor_id?: string;
          middle_turnover_notch: number;
          name: string;
          reflector?: string;
          right_position: number;
          right_ring_setting: number;
          right_rotor_id?: string;
          right_turnover_notch: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: never;
          left_position?: number;
          left_ring_setting?: number;
          left_rotor_id?: string;
          left_turnover_notch?: number;
          middle_position?: number;
          middle_ring_setting?: number;
          middle_rotor_id?: string;
          middle_turnover_notch?: number;
          name?: string;
          reflector?: string;
          right_position?: number;
          right_ring_setting?: number;
          right_rotor_id?: string;
          right_turnover_notch?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_workspace_state: {
        Row: {
          input_text: string;
          left_position: number;
          left_ring_setting: number;
          left_rotor_id: string;
          left_turnover_notch: number;
          middle_position: number;
          middle_ring_setting: number;
          middle_rotor_id: string;
          middle_turnover_notch: number;
          reflector: string;
          right_position: number;
          right_ring_setting: number;
          right_rotor_id: string;
          right_turnover_notch: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          input_text?: string;
          left_position?: number;
          left_ring_setting?: number;
          left_rotor_id?: string;
          left_turnover_notch?: number;
          middle_position?: number;
          middle_ring_setting?: number;
          middle_rotor_id?: string;
          middle_turnover_notch?: number;
          reflector?: string;
          right_position?: number;
          right_ring_setting?: number;
          right_rotor_id?: string;
          right_turnover_notch?: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          input_text?: string;
          left_position?: number;
          left_ring_setting?: number;
          left_rotor_id?: string;
          left_turnover_notch?: number;
          middle_position?: number;
          middle_ring_setting?: number;
          middle_rotor_id?: string;
          middle_turnover_notch?: number;
          reflector?: string;
          right_position?: number;
          right_ring_setting?: number;
          right_rotor_id?: string;
          right_turnover_notch?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type RotorPresetRow = Database['public']['Tables']['rotor_presets']['Row'];
export type RotorPresetInsert = Database['public']['Tables']['rotor_presets']['Insert'];
export type RotorPresetUpdate = Database['public']['Tables']['rotor_presets']['Update'];
export type UserWorkspaceStateRow = Database['public']['Tables']['user_workspace_state']['Row'];
