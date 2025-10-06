"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Plus } from "lucide-react"

export default function GeofencingPage() {
  return (
    <div className="flex flex-col">
      <Header title="Geofencing & Location Management" />
      
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Safety Zones</CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Safety Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">8</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Danger Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">3</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-yellow-600" />
                    Restricted Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">5</div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Create and manage safety/danger zones</li>
                <li>Set up automatic alerts for specific areas</li>
                <li>Configure location-based notifications</li>
                <li>Define jurisdiction boundaries</li>
                <li>Manage service area coverage</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

