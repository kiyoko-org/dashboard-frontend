import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "dispatch-lib/database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function requireEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing ${name}`)
	}

	return value
}

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey)

function createServerSupabaseClient(key: string): SupabaseClient<Database> {
	return createClient<Database>(url, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	})
}

export function createAnonServerSupabaseClient() {
	return createServerSupabaseClient(anonKey)
}

export function createServiceRoleServerSupabaseClient() {
	const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey)
	return createServerSupabaseClient(serviceRoleKey)
}
