"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="System Configuration" />
      
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure push notifications, email, and SMS settings
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Feature Flags</h3>
              <p className="text-sm text-muted-foreground">
                Enable or disable features across the application
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Geographic Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure service areas and geographic boundaries
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Integration Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage API keys and third-party integrations
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Security Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure rate limiting, security policies, and access controls
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Data Retention</h3>
              <p className="text-sm text-muted-foreground">
                Manage data retention policies and automated cleanup
              </p>
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

