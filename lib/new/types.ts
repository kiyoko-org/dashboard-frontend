// lib/types.ts
// Shared types for the application

// Supabase Database Schema Types
export interface Database {
	public: {
		Tables: {
			reports: {
				Row: {
					id: string
					incident_category: string
					incident_subcategory: string
					incident_title: string
					incident_date: string
					incident_time: string
					street_address: string
					nearby_landmark: string | null
					city: string
					reporter_id: string
					province: string
					brief_description: string
					what_happened: string
					who_was_involved: string
					number_of_witnesses: string | null
					injuries_reported: string | null
					property_damage: string | null
					suspect_description: string | null
					witness_contact_info: string | null
					request_follow_up: boolean
					share_with_community: boolean
					is_anonymous: boolean
					status: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled'
					priority: 'low' | 'medium' | 'high' | 'critical'
					assigned_to: string | null
					created_at: string
					updated_at: string
				}
				Insert: {
					id?: string
					incident_category: string
					incident_subcategory: string
					incident_title: string
					incident_date: string
					incident_time: string
					street_address: string
					nearby_landmark?: string | null
					city: string
					province: string
					brief_description: string
					what_happened: string
					who_was_involved: string
					number_of_witnesses?: string | null
					injuries_reported?: string | null
					property_damage?: string | null
					suspect_description?: string | null
					witness_contact_info?: string | null
					request_follow_up?: boolean
					share_with_community?: boolean
					is_anonymous?: boolean
					status?: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled'
					priority?: 'low' | 'medium' | 'high' | 'critical'
					assigned_to?: string | null
					created_at?: string
					updated_at?: string
				}
				Update: {
					id?: string
					incident_category?: string
					incident_subcategory?: string
					incident_title?: string
					incident_date?: string
					incident_time?: string
					street_address?: string
					nearby_landmark?: string | null
					city?: string
					province?: string
					brief_description?: string
					what_happened?: string
					who_was_involved?: string
					number_of_witnesses?: string | null
					injuries_reported?: string | null
					property_damage?: string | null
					suspect_description?: string | null
					witness_contact_info?: string | null
					request_follow_up?: boolean
					share_with_community?: boolean
					is_anonymous?: boolean
					status?: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled'
					priority?: 'low' | 'medium' | 'high' | 'critical'
					assigned_to?: string | null
					created_at?: string
					updated_at?: string
				}
			}
			profiles: {
				Row: {
					id: string
					first_name: string | null
					middle_name: string | null
					last_name: string | null
					avatar_url: string | null
					badge_number: string | null
				}
				Insert: {
					id: string
					first_name?: string | null
					middle_name?: string | null
					last_name?: string | null
					avatar_url?: string | null
					badge_number?: string | null
				}
				Update: {
					id?: string
					first_name?: string | null
					middle_name?: string | null
					last_name?: string | null
					avatar_url?: string | null
					badge_number?: string | null
				}
			}
			emergency_calls: {
				Row: {
					id: string
					user_id: string
					called_number: string
					caller_number: string | null
					call_type: 'police' | 'fire' | 'medical' | 'general'
					call_timestamp: string
					location_lat: number | null
					location_lng: number | null
					outcome: string
					created_at: string
				}
				Insert: {
					id?: string
					user_id: string
					called_number: string
					caller_number?: string | null
					call_type?: 'police' | 'fire' | 'medical' | 'general'
					call_timestamp?: string
					location_lat?: number | null
					location_lng?: number | null
					outcome?: string
					created_at?: string
				}
				Update: {
					id?: string
					user_id?: string
					called_number?: string
					caller_number?: string | null
					call_type?: 'police' | 'fire' | 'medical' | 'general'
					call_timestamp?: string
					location_lat?: number | null
					location_lng?: number | null
					outcome?: string
					created_at?: string
				}
			}
		}
	}
}

// ReportData: Centralized type for incident reports, derived from the database schema
export interface ReportData {
	// Basic Information
	incident_category: string
	incident_subcategory: string
	incident_title: string
	incident_date: string
	incident_time: string

	// Location Information
	street_address: string
	nearby_landmark: string | null
	city: string
	province: string
	brief_description: string

	// Detailed Information
	what_happened: string
	who_was_involved: string
	number_of_witnesses: string | null
	injuries_reported: string | null
	property_damage: string | null
	suspect_description: string | null
	witness_contact_info: string | null

	// Options
	request_follow_up: boolean
	share_with_community: boolean
	is_anonymous: boolean
}

// Database report type (full report from Supabase)
export type DatabaseReport = Database['public']['Tables']['reports']['Row']

// Insert type for creating new reports
export type ReportInsert = Database['public']['Tables']['reports']['Insert']

// Update type for updating existing reports
export type ReportUpdate = Database['public']['Tables']['reports']['Update']

// Emergency call types
export type DatabaseEmergency = Database['public']['Tables']['emergency_calls']['Row']
export type EmergencyInsert = Database['public']['Tables']['emergency_calls']['Insert']
export type EmergencyUpdate = Database['public']['Tables']['emergency_calls']['Update']

