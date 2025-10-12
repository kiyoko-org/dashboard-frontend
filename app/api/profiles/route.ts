import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

const server = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await server.rpc("get_profiles_with_emails")
    if (error) {
      console.error("Profiles API error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    console.error("Profiles API exception:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
