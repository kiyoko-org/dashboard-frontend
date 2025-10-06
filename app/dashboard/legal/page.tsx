"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LegalPage() {
  return (
    <div className="flex flex-col">
      <Header title="Legal & Compliance" />
      
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Legal & Compliance Management</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Privacy policy management</li>
              <li>Terms of service updates</li>
              <li>GDPR/data subject requests</li>
              <li>Subpoena/legal request management</li>
              <li>Data export for legal purposes</li>
              <li>User consent tracking</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

