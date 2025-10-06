"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ModerationPage() {
  return (
    <div className="flex flex-col">
      <Header title="Content Moderation" />
      
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">23</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">7</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">45</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Content Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Review user-submitted content</li>
              <li>Moderate flagged messages and chats</li>
              <li>Review uploaded photos and evidence</li>
              <li>Configure keyword and content filtering rules</li>
              <li>View automated moderation logs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

