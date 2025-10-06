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

export default function DashboardPage() {
  // Mock data - will be replaced with real data from Supabase
  const stats = {
    totalIncidents: 1247,
    incidentsChange: "+12%",
    incidentsUp: true,
    activeUsers: 8392,
    usersChange: "+23%",
    usersUp: true,
    activeBounties: 34,
    bountiesChange: "-5%",
    bountiesUp: false,
    lostFoundItems: 156,
    itemsChange: "+8%",
    itemsUp: true,
  }

  const recentIncidents = [
    {
      id: 1,
      title: "Theft at Downtown Mall",
      category: "Theft",
      status: "investigating",
      time: "10 minutes ago",
      severity: "high",
    },
    {
      id: 2,
      title: "Traffic Accident on Main Street",
      category: "Accident",
      status: "resolved",
      time: "1 hour ago",
      severity: "medium",
    },
    {
      id: 3,
      title: "Suspicious Activity Near School",
      category: "Suspicious Activity",
      status: "pending",
      time: "2 hours ago",
      severity: "critical",
    },
    {
      id: 4,
      title: "Missing Person Report",
      category: "Missing Person",
      status: "investigating",
      time: "3 hours ago",
      severity: "critical",
    },
    {
      id: 5,
      title: "Property Damage Report",
      category: "Vandalism",
      status: "pending",
      time: "5 hours ago",
      severity: "low",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "warning" | "success" | "destructive"> = {
      pending: "warning",
      investigating: "default",
      resolved: "success",
      closed: "default",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "warning" | "destructive"> = {
      low: "default",
      medium: "warning",
      high: "warning",
      critical: "destructive",
    }
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>
  }

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
              <div className="text-2xl font-bold">{stats.totalIncidents}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.incidentsUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={stats.incidentsUp ? "text-green-600" : "text-red-600"}>
                  {stats.incidentsChange}
                </span>
                {" "}from last month
              </p>
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
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.usersUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={stats.usersUp ? "text-green-600" : "text-red-600"}>
                  {stats.usersChange}
                </span>
                {" "}from last month
              </p>
            </CardContent>
          </Card>

          {/* Active Bounties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Bounties
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBounties}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.bountiesUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={stats.bountiesUp ? "text-green-600" : "text-red-600"}>
                  {stats.bountiesChange}
                </span>
                {" "}from last month
              </p>
            </CardContent>
          </Card>

          {/* Lost & Found Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lost & Found Items
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lostFoundItems}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.itemsUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={stats.itemsUp ? "text-green-600" : "text-red-600"}>
                  {stats.itemsChange}
                </span>
                {" "}from last month
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
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{incident.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {incident.category}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {incident.time}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                  </div>
                </div>
              ))}
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
              <div className="text-2xl font-bold">12 min</div>
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
              <div className="text-2xl font-bold">87%</div>
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
              <div className="text-2xl font-bold">99.9%</div>
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

