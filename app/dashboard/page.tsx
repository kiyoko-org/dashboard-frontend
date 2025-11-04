"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  AlertTriangle,
  Target,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRealtimeReports, useCategories } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"

type Report = Database["public"]["Tables"]["reports"]["Row"]

export default function DashboardPage() {
  // Use the realtime reports hook
  const { reports = [], loading, error } = useRealtimeReports()
  const { categories } = useCategories()

  const totalIncidents = reports?.length ?? 0

  // Calculate resolution rate (excluding cancelled cases)
  const resolvedCount = reports?.filter((r) => r.status === "resolved").length ?? 0
  const cancelledCount = reports?.filter((r) => r.status === "cancelled").length ?? 0
  const resolvableIncidents = totalIncidents - cancelledCount
  const resolutionRate = resolvableIncidents > 0 ? ((resolvedCount / resolvableIncidents) * 100).toFixed(1) : "0.0"

  // Calculate average response time in minutes using arrived_at timestamps
  const responseTimes = reports
    ?.map((report) => {
      if (!report.arrived_at) return null
      const created = new Date(report.created_at).getTime()
      const arrived = new Date(report.arrived_at).getTime()
      if (Number.isNaN(created) || Number.isNaN(arrived)) return null
      const diffMs = arrived - created
      if (diffMs < 0) return null
      return diffMs / 60000 // minutes
    })
    .filter((value): value is number => value !== null) ?? []
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, minutes) => sum + minutes, 0) / responseTimes.length
    : null

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

  const getStatusBadge = (status: Report["status"] | string) => {
    const variants: Record<string, "default" | "warning" | "success" | "destructive"> = {
      pending: "warning",
      assigned: "default",
      "in-progress": "warning",
      unresolved: "destructive",
      resolved: "success",
      cancelled: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  // Helper to get category name from category_id using useCategories()
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId || !categories) return "Unknown Category"
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || "Unknown Category"
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

          {/* Response Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageResponseTime !== null ? `${averageResponseTime.toFixed(1)} min` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          {/* Resolution Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolution Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolutionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Incidents resolved
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
                const category = getCategoryName(report.category_id)
                const time = report.incident_time || new Date(report.created_at).toLocaleString()
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
                      {getStatusBadge(status)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
