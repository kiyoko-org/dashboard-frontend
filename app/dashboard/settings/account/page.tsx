"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AccountSettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Account Settings" />
      
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
            <CardTitle>Police Officer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Officer Name</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Badge Number</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rank</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Input />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input type="tel" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Station Address</label>
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

