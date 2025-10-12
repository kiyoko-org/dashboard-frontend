"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Security and Access" />
      
      <div className="flex-1 space-y-6 p-6">
        <Link 
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Password Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Password</label>
              <Input type="password" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">New Password</label>
              <Input type="password" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
              <Input type="password" />
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rate Limiting</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Session Timeout (minutes)</label>
              <Input type="number" />
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

