"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Eye, DollarSign, TrendingUp } from "lucide-react"

export default function BountiesPage() {
  const stats = {
    total: 34,
    wanted: 12,
    missingPeople: 18,
    lostPets: 4,
    totalValue: 450000,
  }

  return (
    <div className="flex flex-col">
      <Header title="Bounty Management" />
      
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Bounties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Wanted Persons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.wanted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Missing People</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.missingPeople}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lost Pets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.lostPets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reward Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₱{stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bounty Management Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Manage bounties for wanted persons, missing people, and lost pets.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Review and approve new bounty submissions</li>
                <li>Monitor bounty payments and escrow</li>
                <li>Verify bounty completion claims</li>
                <li>Handle disputes between bounty creators and claimants</li>
                <li>Track bounty success rates and analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

