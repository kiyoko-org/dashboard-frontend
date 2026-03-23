"use client"

import { useEffect, useState } from "react"
import { initDispatchClient } from "dispatch-lib"

export function DispatchClientProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setError("Missing Supabase environment variables")
      return
    }

    try {
      initDispatchClient({
        supabaseClientConfig: {
          url: supabaseUrl,
          anonymousKey: supabaseKey,
          detectSessionInUrl: true,
        },
        useProxy: true,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize")
      return
    }

    setIsInitialized(true)
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-medium">Initialization Error</p>
          <p className="mt-2 text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
