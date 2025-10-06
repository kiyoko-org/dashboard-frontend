"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResourcesPage() {
  return (
    <div className="flex flex-col">
      <Header title="Community Resources Management" />
      
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hospitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Therapists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Legal Professionals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resource Management</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Add, edit, and remove community resources</li>
              <li>Verify professional credentials</li>
              <li>Manage resource categories</li>
              <li>Update contact information and availability</li>
              <li>Review ratings and feedback</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

