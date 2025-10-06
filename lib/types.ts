// Shared types for the admin dashboard

export interface Report {
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
  latitude?: number
  longitude?: number
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
  attachments?: string[]
  status?: string
  assigned_to?: string
  admin_notes?: string
}

export interface Profile {
  id: string
  updated_at?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  avatar_url?: string
  role?: string
}

export interface Bounty {
  id: string
  type: 'wanted' | 'missing_person' | 'lost_pet'
  title: string
  description: string
  department: string
  reward: number
  status: 'alive' | 'dead' | 'dead_or_alive' | 'presumed_alive' | 'presumed_dead' | 'active'
  priority: 'critical' | 'high' | 'medium' | 'low'
  views: number
  crimes?: string[]
  created_at: string
  updated_at?: string
  created_by: string
  approved: boolean
  approved_by?: string
  approved_at?: string
}

export interface LostFoundItem {
  id: string
  type: 'lost' | 'found'
  name: string
  category: string
  description: string
  date: string
  location: string
  street_address: string
  city: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  reward?: number
  status: 'active' | 'claimed' | 'resolved' | 'archived'
  case_id: string
  case_officer?: string
  images?: string[]
  created_at: string
  created_by: string
}

export interface CommunityResource {
  id: string
  type: 'hospital' | 'therapist' | 'legal_professional'
  name: string
  description?: string
  address: string
  city: string
  phone: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  verified: boolean
  created_at: string
  updated_at?: string
}

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id: string
  details?: Record<string, any>
  created_at: string
}

export interface SystemConfig {
  id: string
  key: string
  value: string | number | boolean | Record<string, any>
  description?: string
  updated_at: string
  updated_by: string
}

export interface GeofenceZone {
  id: string
  name: string
  type: 'safety' | 'danger' | 'restricted'
  coordinates: Array<{ lat: number; lng: number }>
  radius?: number
  description?: string
  active: boolean
  created_at: string
  created_by: string
}

