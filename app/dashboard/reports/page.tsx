"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col">
      <Header title="Reports & Analytics" />
      
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Crime Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive crime data and trends
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    User engagement and activity metrics
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Financial Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bounty transactions and payments
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Compliance Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Privacy and data retention reports
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">System Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Platform usage and performance
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Custom Report Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build custom reports with your criteria
                  </p>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Build Custom Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

