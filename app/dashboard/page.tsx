"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  AlertTriangle,
  Users,
  Target,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useReports } from "@/lib/new/useReports"
import type { DatabaseReport } from "@/lib/new/types"

export default function DashboardPage() {
  // Use the reports hook
  const { reports, loading, error } = useReports()

  const totalIncidents = reports?.length ?? 0

  // Calculate incidents change from last month
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const thisMonthCount = reports?.filter(r => new Date(r.created_at) >= thisMonth && new Date(r.created_at) < nextMonth).length ?? 0
  const lastMonthCount = reports?.filter(r => new Date(r.created_at) >= lastMonth && new Date(r.created_at) < thisMonth).length ?? 0
  const change = lastMonthCount === 0 ? 0 : ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
  const incidentsChange = change === 0 ? "0%" : `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
  const incidentsUp = change > 0

  const getStatusBadge = (status: DatabaseReport["status"] | string) => {
    const variants: Record<string, "default" | "warning" | "success" | "destructive"> = {
      pending: "warning",
      assigned: "default",
      "in-progress": "warning",
      resolved: "success",
      cancelled: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getSeverityBadge = (severity: DatabaseReport["priority"] | string) => {
    const variants: Record<string, "default" | "warning" | "destructive"> = {
      low: "default",
      medium: "warning",
      high: "warning",
      critical: "destructive",
    }
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>
  }

  // Show the most recent 5 reports for the "Recent Incidents" list
  const recent = reports?.slice(0, 5) ?? []

  return (
    <div className="flex flex-col">
      <Header title="Dashboard Overview" />
      
      <div className="flex-1 space-y-6 p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Incidents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Incidents
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalIncidents}</div>
                  <p className="text-xs text-muted-foreground">Total reports</p>
                </div>

                <div className="text-right">
                  <div className={`text-sm ${incidentsUp ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                    {incidentsChange}
                  </div>
                  <p className="text-xs text-muted-foreground">From last month</p>
                </div>
              </div>

              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{thisMonthCount}</span>
                  <span className="text-xs">This month</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{lastMonthCount}</span>
                  <span className="text-xs">Last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total active users
              </p>
            </CardContent>
          </Card>

          {/* Resolved Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolved Cases
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reports?.filter((r) => r.status === "resolved").length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully resolved
              </p>
            </CardContent>
          </Card>

          {/* Pending Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Cases
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reports?.filter((r) => r.status === "pending").length ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting action
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <p className="text-sm text-muted-foreground">Loading recent incidents...</p>}
              {error && <p className="text-sm text-destructive">Error: {error}</p>}
              {!loading && !error && recent.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent incidents</p>
              )}

              {recent.map((report) => {
                const title = report.incident_title || "Untitled incident"
                const category = report.incident_category || "Unknown"
                const time = report.incident_time || new Date(report.created_at).toLocaleString()
                const severity = report.priority || "low"
                const status = report.status || "pending"

                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {category}
                          </span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {time}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(severity)}
                      {getStatusBadge(status)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 min</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Resolution Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Incidents resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                System Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

