"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getDispatchClient } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"

type VerificationRequestRow = Database["public"]["Tables"]["verification_requests"]["Row"]

type UseVerificationRequestsReturn = {
  requests: VerificationRequestRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useVerificationRequests(): UseVerificationRequestsReturn {
  const dispatchClient = getDispatchClient()
  const [requests, setRequests] = useState<VerificationRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)

  const fetchRequests = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? true
    const requestId = ++requestIdRef.current

    if (showLoading) {
      setLoading(true)
    }

    try {
      setError(null)
      const { data, error: fetchError } = await dispatchClient.fetchVerificationRequests()

      if (!isMountedRef.current || requestId !== requestIdRef.current) return
      if (fetchError) throw new Error(fetchError.message)

      setRequests((data ?? []) as VerificationRequestRow[])
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return
      const message = error instanceof Error ? error.message : "Failed to fetch verification requests"
      setError(message)
    } finally {
      if (!showLoading || !isMountedRef.current || requestId !== requestIdRef.current) return
      setLoading(false)
    }
  }, [dispatchClient])

  const refresh = useCallback(async () => {
    await fetchRequests({ showLoading: true })
  }, [fetchRequests])

  useEffect(() => {
    isMountedRef.current = true
    void fetchRequests({ showLoading: true })

    return () => {
      isMountedRef.current = false
    }
  }, [fetchRequests])

  return {
    requests,
    loading,
    error,
    refresh,
  }
}
