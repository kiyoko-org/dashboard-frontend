"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthContext } from "dispatch-lib"
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Bell,
  Settings,
  BadgeCheck,
  Database,
  Archive,
  Phone,
  LogOut,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    name: "Emergency Response",
    href: "/dashboard/emergency",
    icon: Bell,
  },
  {
    name: "Incidents",
    href: "/dashboard/incidents",
    icon: AlertTriangle,
  },
  {
    name: "Hotlines",
    href: "/dashboard/hotlines",
    icon: Phone,
  },
  {
    name: "Verification",
    href: "/dashboard/verification",
    icon: BadgeCheck,
  },
  {
    name: "Database",
    href: "/dashboard/database",
    icon: Database,
  },
  {
    name: "Archive",
    href: "/dashboard/archive",
    icon: Archive,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user } = useAuthContext()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">Dispatch Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info and sign out */}
      <div className="border-t border-slate-800 p-4">
        {user && (
          <div className="mb-3 px-3 py-2">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

