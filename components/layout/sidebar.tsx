"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthContext } from "dispatch-lib"
import { useSidebar } from "@/components/providers/sidebar-provider"
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Settings,
  Database,
  Archive,
  Phone,
  LogOut,
  ShieldCheck,
  X,
  MapPin,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Incidents",
    href: "/dashboard/incidents",
    icon: AlertTriangle,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    name: "Officers",
    href: "/dashboard/officers",
    icon: ShieldCheck,
  },
  {
    name: "Barangays",
    href: "/dashboard/barangays",
    icon: MapPin,
  },
  {
    name: "Hotlines",
    href: "/dashboard/hotlines",
    icon: Phone,
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
  const { isOpen, closeSidebar } = useSidebar()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-slate-900 text-white transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">Dispatch Admin</h1>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
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
    </>
  )
}

