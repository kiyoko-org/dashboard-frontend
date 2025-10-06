"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Bell } from "lucide-react"

export default function CommunicationsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Communications & Messaging" />
      
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Broadcast Communications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg">
              <Send className="mr-2 h-5 w-5" />
              Send Broadcast Announcement
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <Bell className="mr-2 h-5 w-5" />
              Send Emergency Alert
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8 min</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

