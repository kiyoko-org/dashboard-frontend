"use client"

import { AuthProvider } from "dispatch-lib"
import { Inter } from "next/font/google"
import { DispatchClientProvider } from "@/components/providers/dispatch-client-provider"
import { AuthGuard } from "@/components/providers/auth-guard"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <DispatchClientProvider>
          <AuthProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AuthProvider>
        </DispatchClientProvider>
      </body>
    </html>
  )
}
