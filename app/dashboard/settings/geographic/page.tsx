"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GeographicSettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Geographic Configuration" />
      
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
            <CardTitle>Service Area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Country</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default City</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Service Radius (km)</label>
              <Input type="number" />
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Map Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Map API Key</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default Latitude</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Default Longitude</label>
              <Input />
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

