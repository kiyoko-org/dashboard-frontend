"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Audit Logs" />
      
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>System Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Admin action logs (who did what, when)</li>
              <li>System access logs</li>
              <li>Data modification history</li>
              <li>Security event logs</li>
              <li>Failed login attempts</li>
              <li>API usage logs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

