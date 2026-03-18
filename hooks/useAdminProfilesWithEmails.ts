"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getDispatchClient } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"

type AdminProfileWithEmail = Database["public"]["Functions"]["get_profiles_with_emails"]["Returns"][number]

type UseAdminProfilesWithEmailsReturn = {
	profiles: AdminProfileWithEmail[]
	profilesById: Map<string, AdminProfileWithEmail>
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
}

const REFRESH_DEBOUNCE_MS = 150

export function useAdminProfilesWithEmails(): UseAdminProfilesWithEmailsReturn {
	const dispatchClient = getDispatchClient()
	const supabaseClient = dispatchClient.supabaseClient as SupabaseClient<Database>
	const [profiles, setProfiles] = useState<AdminProfileWithEmail[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const hasLoadedOnceRef = useRef(false)
	const isMountedRef = useRef(true)
	const requestIdRef = useRef(0)
	const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const fetchProfiles = useCallback(async (options?: { showLoading?: boolean }) => {
		const showLoading = options?.showLoading ?? !hasLoadedOnceRef.current
		const requestId = ++requestIdRef.current

		if (showLoading) {
			setLoading(true)
		}

		try {
			setError(null)
			const { data, error: fetchError } = await dispatchClient.fetchProfilesWithEmails()

			if (!isMountedRef.current || requestId !== requestIdRef.current) return
			if (fetchError) throw new Error(fetchError.message)

			setProfiles((data ?? []) as AdminProfileWithEmail[])
			hasLoadedOnceRef.current = true
		} catch (error) {
			if (!isMountedRef.current || requestId !== requestIdRef.current) return

			const message = error instanceof Error ? error.message : "Failed to fetch admin profiles"
			setError(message)
		} finally {
			if (!showLoading || !isMountedRef.current || requestId !== requestIdRef.current) return
			setLoading(false)
		}
	}, [dispatchClient])

	const scheduleRefresh = useCallback(() => {
		if (refreshTimeoutRef.current) {
			clearTimeout(refreshTimeoutRef.current)
		}

		refreshTimeoutRef.current = setTimeout(() => {
			void fetchProfiles()
		}, REFRESH_DEBOUNCE_MS)
	}, [fetchProfiles])

	const refresh = useCallback(async () => {
		await fetchProfiles({ showLoading: true })
	}, [fetchProfiles])

	useEffect(() => {
		isMountedRef.current = true
		void fetchProfiles({ showLoading: true })

		const channel = supabaseClient
			.channel("admin-profiles-with-emails")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "profiles" },
				() => {
					scheduleRefresh()
				},
			)
			.subscribe()

		return () => {
			isMountedRef.current = false

			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current)
			}

			void supabaseClient.removeChannel(channel)
		}
	}, [fetchProfiles, scheduleRefresh, supabaseClient])

	const profilesById = useMemo(() => {
		return new Map(profiles.map((profile) => [profile.id, profile]))
	}, [profiles])

	return {
		profiles,
		profilesById,
		loading,
		error,
		refresh,
	}
}
