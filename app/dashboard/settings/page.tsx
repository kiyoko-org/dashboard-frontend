"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Search,
  ChevronRight,
  User,
  Shield,
  Lock,
  Bell,
  Globe,
  Eye,
  Database,
  HelpCircle
} from "lucide-react"

interface SettingItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
}

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const settingsItems: SettingItem[] = [
    { id: "account", label: "Account Settings", icon: User, href: "/dashboard/settings/account" },
    { id: "security", label: "Security and Access", icon: Shield, href: "/dashboard/settings/security" },
    { id: "privacy", label: "Privacy and Safety", icon: Lock, href: "/dashboard/settings/privacy" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/dashboard/settings/notifications" },
    { id: "geographic", label: "Geographic Configuration", icon: Globe, href: "/dashboard/settings/geographic" },
    { id: "display", label: "Display and Appearance", icon: Eye, href: "/dashboard/settings/display" },
    { id: "data", label: "Data Management", icon: Database, href: "/dashboard/settings/data" },
    { id: "help", label: "Help Center", icon: HelpCircle, href: "/dashboard/settings/help" },
  ]

  const filteredItems = settingsItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col">
      <Header title="Settings" />
      
      <div className="flex-1 p-6">
        <Card className="max-w-2xl">
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-0 focus-visible:ring-0 bg-muted/50"
                />
              </div>
            </div>

            {/* Settings List */}
            <div className="divide-y">
              {filteredItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No settings found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

