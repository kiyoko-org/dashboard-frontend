"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getDispatchClient } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"

type IncidentReportWithTrust = Database["public"]["Tables"]["reports"]["Row"] &
	Database["public"]["Views"]["incident_reports_with_trust"]["Row"]

type UseRealtimeIncidentReportsWithTrustReturn = {
	reports: IncidentReportWithTrust[]
	loading: boolean
	error: string | null
	isConnected: boolean
	refresh: () => Promise<void>
}

const REFRESH_DEBOUNCE_MS = 150

export function useRealtimeIncidentReportsWithTrust(): UseRealtimeIncidentReportsWithTrustReturn {
	const dispatchClient = getDispatchClient()
	const supabaseClient = dispatchClient.supabaseClient as SupabaseClient<Database>
	const [reports, setReports] = useState<IncidentReportWithTrust[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const hasLoadedOnceRef = useRef(false)
	const isMountedRef = useRef(true)
	const requestIdRef = useRef(0)
	const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const fetchReports = useCallback(async (options?: { showLoading?: boolean }) => {
		const showLoading = options?.showLoading ?? !hasLoadedOnceRef.current
		const requestId = ++requestIdRef.current

		if (showLoading) {
			setLoading(true)
		}

		try {
			setError(null)
			const { data, error: fetchError } = await supabaseClient
				.from("incident_reports_with_trust")
				.select("*")

			if (!isMountedRef.current || requestId !== requestIdRef.current) return
			if (fetchError) throw new Error(fetchError.message)

			setReports((data ?? []) as IncidentReportWithTrust[])
			hasLoadedOnceRef.current = true
		} catch (error) {
			if (!isMountedRef.current || requestId !== requestIdRef.current) return

			const message = error instanceof Error ? error.message : "Failed to fetch incident reports"
			setError(message)
		} finally {
			if (!showLoading || !isMountedRef.current || requestId !== requestIdRef.current) return
			setLoading(false)
		}
	}, [supabaseClient])

	const scheduleRefresh = useCallback(() => {
		if (refreshTimeoutRef.current) {
			clearTimeout(refreshTimeoutRef.current)
		}

		refreshTimeoutRef.current = setTimeout(() => {
			void fetchReports()
		}, REFRESH_DEBOUNCE_MS)
	}, [fetchReports])

	const refresh = useCallback(async () => {
		await fetchReports({ showLoading: true })
	}, [fetchReports])

	useEffect(() => {
		isMountedRef.current = true
		void fetchReports({ showLoading: true })

		const channel = supabaseClient
			.channel("incident-reports-with-trust")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "reports" },
				() => {
					scheduleRefresh()
				},
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "profiles" },
				() => {
					scheduleRefresh()
				},
			)
			.subscribe((status) => {
				if (!isMountedRef.current) return

				setIsConnected(status === "SUBSCRIBED")
				if (status === "CHANNEL_ERROR") {
					setError("Failed to connect to incident realtime updates")
				}
			})

		return () => {
			isMountedRef.current = false

			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current)
			}

			void supabaseClient.removeChannel(channel)
		}
	}, [fetchReports, scheduleRefresh, supabaseClient])

	return {
		reports,
		loading,
		error,
		isConnected,
		refresh,
	}
}
