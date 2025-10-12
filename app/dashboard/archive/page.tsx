"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RotateCcw,
  Download,
  Archive as ArchiveIcon,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  MapPin,
} from "lucide-react"

type ArchiveType = "incidents" | "users" | "emergency" | "all"
type ArchivedStatus = "archived" | "deleted"

interface ArchivedItem {
  id: string
  type: ArchiveType
  title: string
  description: string
  archivedDate: string
  archivedBy: string
  originalStatus: string
  archiveStatus: ArchivedStatus
  category?: string
  location?: string
}

export default function ArchivePage() {
  const [typeFilter, setTypeFilter] = useState<ArchiveType>("all")
  const [statusFilter, setStatusFilter] = useState<ArchivedStatus | "all">("all")
  const [dateFilter, setDateFilter] = useState("all")

  // Start with empty archived data - fresh start
  const [archivedItems] = useState<ArchivedItem[]>([])

  const filteredItems = archivedItems.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.archiveStatus === statusFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const itemDate = new Date(item.archivedDate)
      const now = new Date()
      const daysAgo = parseInt(dateFilter)
      const filterDate = new Date(now.setDate(now.getDate() - daysAgo))
      matchesDate = itemDate >= filterDate
    }

    return matchesType && matchesStatus && matchesDate
  })

  const stats = {
    total: archivedItems.length,
    incidents: archivedItems.filter((i) => i.type === "incidents").length,
    users: archivedItems.filter((i) => i.type === "users").length,
    emergency: archivedItems.filter((i) => i.type === "emergency").length,
  }

  const getTypeBadge = (type: ArchiveType) => {
    const variants: Record<ArchiveType, { variant: "default" | "warning" | "destructive" | "success", label: string }> = {
      incidents: { variant: "warning", label: "Incident" },
      users: { variant: "default", label: "User" },
      emergency: { variant: "destructive", label: "Emergency" },
      all: { variant: "default", label: "All" },
    }
    const config = variants[type]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (status: ArchivedStatus) => {
    return status === "archived" ? (
      <Badge variant="default">Archived</Badge>
    ) : (
      <Badge variant="destructive">Deleted</Badge>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Archive Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Archived</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.incidents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.users}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emergency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.emergency}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                {/* Type Filter */}
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ArchiveType)}
                >
                  <option value="all">All Types</option>
                  <option value="incidents">Incidents</option>
                  <option value="users">Users</option>
                  <option value="emergency">Emergency</option>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ArchivedStatus | "all")}
                >
                  <option value="all">All Status</option>
                  <option value="archived">Archived</option>
                  <option value="deleted">Deleted</option>
                </Select>

                {/* Date Filter */}
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </Select>
              </div>

              {/* Export Button */}
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Archive Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArchiveIcon className="h-5 w-5" />
              Archived Items ({filteredItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category/Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Archived Date</TableHead>
                  <TableHead>Archived By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No archived items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        #{item.id}
                      </TableCell>
                      <TableCell>{getTypeBadge(item.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.type === "incidents" ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : item.type === "users" ? (
                            <UserIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArchiveIcon className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.category && (
                            <div className="font-medium">{item.category}</div>
                          )}
                          <div className="text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {item.location}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {item.archivedDate}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.archivedBy}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.archiveStatus)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Restore"
                          >
                            <RotateCcw className="h-4 w-4 text-blue-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

