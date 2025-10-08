import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { DatabaseReport, ReportUpdate } from './types'

interface UseReportsReturn {
  reports: DatabaseReport[]
  loading: boolean
  error: string | null
  updateReportStatus: (reportId: string, status: DatabaseReport['status']) => Promise<void>
  refetch: () => Promise<void>
}

export function useReports(): UseReportsReturn {
  const [reports, setReports] = useState<DatabaseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setReports(data || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateReportStatus = useCallback(async (reportId: string, status: DatabaseReport['status']) => {
    try {
      const updateData: ReportUpdate = { status }
      const { error: updateError } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)

      if (updateError) {
        throw updateError
      }

      // Update local state optimistically
      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, status, updated_at: new Date().toISOString() }
            : report
        )
      )
    } catch (err) {
      console.error('Error updating report status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update report status')
      // Refetch to revert optimistic update on error
      await fetchReports()
    }
  }, [fetchReports])

  useEffect(() => {
    fetchReports()

    // Set up real-time subscription
    const channel = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('Real-time update:', payload)
          fetchReports() // Refetch all reports on any change
        }
      )
      .subscribe((status, err) => {
			console.log('Subscription status:', status)
			console.log('Subscription error:', err?.message)
		})

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  return {
    reports,
    loading,
    error,
    updateReportStatus,
    refetch: fetchReports
  }
}
