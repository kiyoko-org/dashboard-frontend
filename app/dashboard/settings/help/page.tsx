"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ExternalLink, Mail } from "lucide-react"
import Link from "next/link"

export default function HelpCenterPage() {
  return (
    <div className="flex flex-col">
      <Header title="Help Center" />
      
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
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Support Email</label>
              <Input type="email" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Support Phone</label>
              <Input type="tel" />
            </div>

            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              Documentation
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              API Reference
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Video Tutorials
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Community Forum
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">2025-10-12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">License</span>
              <span className="font-medium">Enterprise</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

