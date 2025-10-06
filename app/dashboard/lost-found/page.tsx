"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

export default function LostFoundPage() {
  return (
    <div className="flex flex-col">
      <Header title="Lost & Found Management" />
      
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lost Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Found Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Matched Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">45</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lost & Found Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Review lost and found item reports</li>
              <li>AI-powered matching between lost and found items</li>
              <li>Verify claim requests and ownership</li>
              <li>Handle disputed claims</li>
              <li>Archive old listings automatically</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

