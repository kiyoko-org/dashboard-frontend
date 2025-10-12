"use client"

import { useMemo } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle } from "lucide-react"
import { useEmergencies } from "@/lib/new/useEmergencies"

export default function EmergencyPage() {
  const { emergencies, loading, error, refetch } = useEmergencies()

  const activeCount = useMemo(
    () => emergencies.filter((e) => e.outcome !== "resolved").length,
    [emergencies]
  )

  const resolvedToday = useMemo(() => {
    const todayStr = new Date().toDateString()
    return emergencies.filter((e) => {
      const created = new Date(e.created_at)
      return created.toDateString() === todayStr && e.outcome === "resolved"
    }).length
  }, [emergencies])

  const avgResponseTime = "0 min"

  return (
    <div className="flex flex-col">
      <Header title="Emergency Response Coordination" />

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Emergencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? "…" : activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? "…" : resolvedToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Real-Time Emergency Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading emergency calls…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : emergencies.length === 0 ? (
              <div className="text-sm text-muted-foreground">No emergency calls found.</div>
            ) : (
              <ul className="divide-y">
                {emergencies.map((e) => {
                  return (
                    <li key={e.id} className="py-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-sm">
                            {e.call_type ?? "general"} — {e.called_number}
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {e.outcome}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <button
                          className="text-sm underline"
                          onClick={() => {
                            // simple manual refetch — better actions (view details, update outcome) can be added
                            refetch()
                          }}
                        >
                          Refresh
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

