"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

export default function DataManagementPage() {
  return (
    <div className="flex flex-col">
      <Header title="Data Management" />
      
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
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Auto-Archive After (days)</label>
              <Input type="number" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Permanent Delete After (days)</label>
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
            <CardTitle>Backup & Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Backup Frequency</label>
              <Input />
            </div>

            <div className="flex gap-2">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Create Backup Now
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Database Connection String</label>
              <Input type="password" />
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Update Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

