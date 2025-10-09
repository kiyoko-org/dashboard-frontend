import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { DatabaseEmergency, EmergencyUpdate } from './types'

interface UseEmergenciesReturn {
	emergencies: DatabaseEmergency[]
	loading: boolean
	error: string | null
	updateOutcome: (id: string, outcome: DatabaseEmergency['outcome']) => Promise<void>
	refetch: () => Promise<void>
}

export function useEmergencies(): UseEmergenciesReturn {
	const [emergencies, setEmergencies] = useState<DatabaseEmergency[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchEmergencies = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const { data, error: fetchError } = await supabase
				.from('emergency_calls')
				.select('*')
				.order('call_timestamp', { ascending: false })

			if (fetchError) throw fetchError

			setEmergencies(data || [])
		} catch (err) {
			console.error('Error fetching emergency calls:', err)
			setError(err instanceof Error ? err.message : 'Failed to fetch emergency calls')
		} finally {
			setLoading(false)
		}
	}, [])

	const updateOutcome = useCallback(
		async (id: string, outcome: DatabaseEmergency['outcome']) => {
			try {
				const updateData: EmergencyUpdate = { outcome }
				const { error: updateError } = await supabase
					.from('emergency_calls')
					.update(updateData)
					.eq('id', id)

				if (updateError) throw updateError

				// Optimistic update
				setEmergencies(prev =>
					prev.map(e => (e.id === id ? { ...e, outcome } : e))
				)
			} catch (err) {
				console.error('Error updating emergency outcome:', err)
				setError(err instanceof Error ? err.message : 'Failed to update emergency outcome')
				// Refetch to revert optimistic update or get authoritative state
				await fetchEmergencies()
			}
		},
		[fetchEmergencies]
	)

	useEffect(() => {
		fetchEmergencies()

		const channel = supabase
			.channel('emergency_calls_changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'emergency_calls'
				},
				(payload) => {
					console.log('Realtime emergency call update:', payload)
					fetchEmergencies()
				}
			)
			.subscribe((status, err) => {
				console.log('Subscription status:', status)
				console.log('Subscription error:', err?.message)
			})

		return () => {
			supabase.removeChannel(channel)
		}
	}, [fetchEmergencies])

	return {
		emergencies,
		loading,
		error,
		updateOutcome,
		refetch: fetchEmergencies
	}
}
