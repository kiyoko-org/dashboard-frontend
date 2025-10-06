// Generated types from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string | null
        }
      }
      reports: {
        Row: {
          id: number
          reporter_id: string
          created_at: string
          incident_category: string
          incident_subcategory: string
          incident_title: string
          incident_date: string
          incident_time: string
          street_address: string
          nearby_landmark: string
          city: string
          province: string
          latitude: number | null
          longitude: number | null
          brief_description: string
          what_happened: string
          who_was_involved: string
          number_of_witnesses: string
          injuries_reported: string
          property_damage: string
          suspect_description: string
          witness_contact_info: string
          request_follow_up: boolean
          share_with_community: boolean
          is_anonymous: boolean
          attachments: string[] | null
          status: string | null
          assigned_to: string | null
          admin_notes: string | null
        }
        Insert: {
          id?: number
          reporter_id?: string
          created_at?: string
          incident_category: string
          incident_subcategory: string
          incident_title: string
          incident_date: string
          incident_time: string
          street_address: string
          nearby_landmark: string
          city?: string
          province?: string
          latitude?: number | null
          longitude?: number | null
          brief_description: string
          what_happened: string
          who_was_involved: string
          number_of_witnesses: string
          injuries_reported: string
          property_damage: string
          suspect_description: string
          witness_contact_info: string
          request_follow_up?: boolean
          share_with_community?: boolean
          is_anonymous?: boolean
          attachments?: string[] | null
          status?: string | null
          assigned_to?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: number
          reporter_id?: string
          created_at?: string
          incident_category?: string
          incident_subcategory?: string
          incident_title?: string
          incident_date?: string
          incident_time?: string
          street_address?: string
          nearby_landmark?: string
          city?: string
          province?: string
          latitude?: number | null
          longitude?: number | null
          brief_description?: string
          what_happened?: string
          who_was_involved?: string
          number_of_witnesses?: string
          injuries_reported?: string
          property_damage?: string
          suspect_description?: string
          witness_contact_info?: string
          request_follow_up?: boolean
          share_with_community?: boolean
          is_anonymous?: boolean
          attachments?: string[] | null
          status?: string | null
          assigned_to?: string | null
          admin_notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

