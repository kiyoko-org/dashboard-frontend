"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle } from "lucide-react"

export default function EmergencyPage() {
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
              <div className="text-2xl font-bold text-red-600">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2 min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">12</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Real-Time Emergency Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Real-time emergency alert monitoring</li>
              <li>Dispatch coordination with emergency services</li>
              <li>Emergency contact verification</li>
              <li>Mass alert/notification system</li>
              <li>Emergency response time tracking</li>
              <li>Integration with 911/local authorities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

