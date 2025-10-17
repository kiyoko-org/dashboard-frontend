"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useRealtimeReports, getDispatchClient, useCategories } from "dispatch-lib"

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
  const { reports, loading, error } = useRealtimeReports()
  const { categories } = useCategories()
  const client = getDispatchClient()
  const [typeFilter, setTypeFilter] = useState<ArchiveType>("all")
  const [statusFilter, setStatusFilter] = useState<ArchivedStatus | "all">("all")
  const [dateFilter, setDateFilter] = useState("all")

  // Helper functions to get category and subcategory names
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId || !categories) return "Unknown Category"
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || "Unknown Category"
  }

  const getSubcategoryName = (categoryId?: number | null, subcategoryIndex?: number | null) => {
    if (!categoryId || subcategoryIndex === null || subcategoryIndex === undefined || !categories) return "Unknown Subcategory"
    const category = categories.find(cat => cat.id === categoryId)
    if (!category?.sub_categories || subcategoryIndex >= category.sub_categories.length) return "Unknown Subcategory"
    return category.sub_categories[subcategoryIndex] || "Unknown Subcategory"
  }

  const archivedItems = reports.filter((report) => (report as any).is_archived)

  const filteredItems = archivedItems.filter((item) => {
    const matchesType = typeFilter === "all" || "incidents" === typeFilter // All archived are incidents for now
    const matchesStatus = statusFilter === "all" || (item.status === 'cancelled' ? "deleted" : "archived") === statusFilter

    let matchesDate = true
    if (dateFilter !== "all") {
      const itemDate = new Date(item.created_at)
      const now = new Date()
      const daysAgo = parseInt(dateFilter)
      const filterDate = new Date(now.setDate(now.getDate() - daysAgo))
      matchesDate = itemDate >= filterDate
    }

    return matchesType && matchesStatus && matchesDate
  })

  const stats = {
    total: archivedItems.length,
    incidents: archivedItems.length, // All are incidents
    users: 0,
    emergency: 0,
  }

  const handleRestore = async (reportId: number) => {
    try {
      const { error } = await client.updateReport(reportId, { is_archived: false })

      if (error) throw error

      // The realtime hook should update the local state automatically
    } catch (error) {
      console.error('Failed to restore report:', error)
    }
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

  const getStatusBadge = (status: string) => {
    const getStatusClasses = (status?: string | null) => {
      const base = "capitalize text-center"
      switch(status) {
        case "pending": return `${base} bg-yellow-500 text-white`
        case "assigned": return `${base} bg-blue-500 text-white`
        case "in-progress": return `${base} bg-orange-500 text-white`
        case "resolved": return `${base} bg-green-500 text-white`
        case "cancelled": return `${base} bg-red-500 text-white`
        default: return `${base} bg-gray-500 text-white`
      }
    }
    const txt = String(status ?? "unknown").replace("-", " ")
    return (
      <Badge className={getStatusClasses(status)}>
        {txt}
      </Badge>
    )
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

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
                  onValueChange={(value) => setTypeFilter(value as ArchiveType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incidents">Incidents</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as ArchivedStatus | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Details</TableHead>
                   <TableHead>Location</TableHead>
                  <TableHead>Archived Date</TableHead>
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
                        #{String(item.id).slice(-8)}
                      </TableCell>
                      <TableCell>{getTypeBadge("incidents")}</TableCell>
                      <TableCell>
                      <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{item.incident_title}</span>
                      </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                      {getCategoryName(item.category_id)} - {getSubcategoryName(item.category_id, item.sub_category)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                      {item.what_happened || 'No description'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {item.street_address}
                        </div>
                      </TableCell>
                      <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {item.archived_date ? new Date(item.archived_date).toLocaleDateString() : 'Unknown'}
                      </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Restore"
                            onClick={() => handleRestore(item.id)}
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

