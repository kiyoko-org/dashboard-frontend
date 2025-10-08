import { useEffect, useState, useCallback } from "react"
import { supabase } from "./supabase"
import type { Database } from "./types"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

export function useProfiles() {
  const [profiles, setProfiles] = useState<(ProfileRow & { email?: string; joined_date?: string; last_sign_in_at?: string; reports_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/profiles")
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setProfiles(data || [])
    } catch (err: any) {
      console.error("Error fetching profiles:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch profiles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()

    const channel = supabase
      .channel("profiles_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Profiles realtime payload:", payload)
          // simple approach: refetch on any change (keeps it consistent)
          fetchProfiles()
        }
      )
      .subscribe((status, err) => {
        console.log("Profiles subscription status:", status, err?.message)
      })

    return () => {
      // cleanup
      try {
        supabase.removeChannel(channel)
      } catch {
        // best-effort
      }
    }
  }, [fetchProfiles])

  return { profiles, loading, error, refetch: fetchProfiles }
}