"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthContext } from "dispatch-lib"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login")
    }
    
    if (!isLoading && user && pathname === "/login") {
      router.push("/dashboard")
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && pathname !== "/login") {
    return null
  }

  if (user && pathname === "/login") {
    return null
  }

  return <>{children}</>
}
