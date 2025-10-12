"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DisplaySettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Display and Appearance" />
      
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
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme Mode</label>
              <Input />
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Primary Color</label>
              <Input type="color" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Secondary Color</label>
              <Input type="color" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Accent Color</label>
              <Input type="color" />
            </div>

            <Button className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Base Font Size</label>
              <Input type="number" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Heading Font Size</label>
              <Input type="number" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Body Font Size</label>
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

