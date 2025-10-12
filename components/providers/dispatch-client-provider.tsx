"use client"

import { useEffect, useState } from "react"
import { initDispatchClient } from "dispatch-lib"

export function DispatchClientProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return
    }

    initDispatchClient({
      supabaseClientConfig: {
        url: supabaseUrl,
        anonymousKey: supabaseKey,
        detectSessionInUrl: true,
      },
    })

    setIsInitialized(true)
  }, [])

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
