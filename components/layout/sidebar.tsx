"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Target,
  Package,
  Bell,
  Building2,
  Shield,
  FileText,
  Settings,
  MessageSquare,
  FileSearch,
  Scale,
  BadgeCheck,
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
    name: "Bounties",
    href: "/dashboard/bounties",
    icon: Target,
  },
  {
    name: "Lost & Found",
    href: "/dashboard/lost-found",
    icon: Package,
  },
  {
    name: "Emergency Response",
    href: "/dashboard/emergency",
    icon: Bell,
  },
  {
    name: "Community Resources",
    href: "/dashboard/resources",
    icon: Building2,
  },
  {
    name: "Content Moderation",
    href: "/dashboard/moderation",
    icon: Shield,
  },
  {
    name: "Reports & Analytics",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    name: "Communications",
    href: "/dashboard/communications",
    icon: MessageSquare,
  },
  {
    name: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: FileSearch,
  },
  {
    name: "Legal & Compliance",
    href: "/dashboard/legal",
    icon: Scale,
  },
  {
    name: "Verification",
    href: "/dashboard/verification",
    icon: BadgeCheck,
  },
  {
    name: "Geofencing",
    href: "/dashboard/geofencing",
    icon: MapPin,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

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
    </div>
  )
}

