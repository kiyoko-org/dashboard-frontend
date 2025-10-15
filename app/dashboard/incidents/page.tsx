"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Download,
  Eye,
  Edit,
  Archive,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { useRealtimeReports, getDispatchClient, useCategories } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"

type Report = Database["public"]["Tables"]["reports"]["Row"]

export default function IncidentsPage() {
  const { reports, loading, error, isConnected } = useRealtimeReports()
  const { categories, loading: categoriesLoading } = useCategories()
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [includeArchived, setIncludeArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [subcategoryFilter, setSubcategoryFilter] = useState("all")
  const [sortField, setSortField] = useState<keyof Report | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const getStatusBadge = (status?: string | null) => {
    const variants: Record<string, "default" | "warning" | "success" | "destructive"> = {
      pending: "warning",
      assigned: "default",
      "in-progress": "default",
      resolved: "success",
      cancelled: "destructive",
    }
    const txt = String(status ?? "unknown").replace("-", " ")
    return (
      <Badge variant={variants[status as string] || "default"} className="capitalize">
        {txt}
      </Badge>
    )
  }

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

  // Get subcategories for the selected category
  const getSubcategoriesForCategory = (categoryId: string) => {
    if (categoryId === "all" || !categories) return []
    const category = categories.find(cat => cat.id.toString() === categoryId)
    return category?.sub_categories || []
  }

  // Reset subcategory filter when category changes
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value)
    setSubcategoryFilter("all") // Reset subcategory filter when category changes
  }


  const visibleReports = reports.filter((r) => {
    const isArchivedFlag = Boolean(r.is_archived)
    const isArchivedStatus = r.status === 'archived'
    const isLocallyArchived = archivedIds.has(r.id.toString())
    const isArchived = isArchivedFlag || isArchivedStatus || isLocallyArchived
    return includeArchived ? true : !isArchived
  })

  const filteredIncidents = visibleReports.filter((report) => {
    const q = (searchQuery ?? '').toLowerCase()
    const title = String(report.incident_title ?? '').toLowerCase()
    const street = String(report.street_address ?? '').toLowerCase()
    const categoryName = getCategoryName(report.category_id).toLowerCase()
    const subcategoryName = getSubcategoryName(report.category_id, report.sub_category).toLowerCase()

    const matchesSearch =
      title.includes(q) || street.includes(q) || categoryName.includes(q) || subcategoryName.includes(q)

    const matchesStatus =
      statusFilter === "all" || (report.status ?? '').toString() === statusFilter

    const matchesCategory =
      categoryFilter === "all" || (report.category_id ?? '').toString() === categoryFilter

    const matchesSubcategory = subcategoryFilter === "all" || 
      (report.sub_category !== null && report.sub_category !== undefined && 
       report.sub_category.toString() === subcategoryFilter)

    return matchesSearch && matchesStatus && matchesCategory && matchesSubcategory
  })

  // Sort the filtered incidents
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return sortDirection === "asc" ? 1 : -1
    if (bValue === null || bValue === undefined) return sortDirection === "asc" ? -1 : 1

    // Handle string comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue)
      return sortDirection === "asc" ? comparison : -comparison
    }

    // Handle number comparison
    if (typeof aValue === "number" && typeof bValue === "number") {
      const comparison = aValue - bValue
      return sortDirection === "asc" ? comparison : -comparison
    }

    // Handle date comparison
    if (sortField === "created_at") {
      const aDate = new Date(aValue as string)
      const bDate = new Date(bValue as string)
      const comparison = aDate.getTime() - bDate.getTime()
      return sortDirection === "asc" ? comparison : -comparison
    }

    // Handle incident date + time comparison
    if (sortField === "incident_date") {
      const aDate = new Date(aValue as string)
      const bDate = new Date(bValue as string)
      
      // If dates are the same, compare by time
      if (aDate.toDateString() === bDate.toDateString()) {
        const aTime = a.incident_time || "00:00"
        const bTime = b.incident_time || "00:00"
        const aDateTime = new Date(`${aDate.toDateString()} ${aTime}`)
        const bDateTime = new Date(`${bDate.toDateString()} ${bTime}`)
        const comparison = aDateTime.getTime() - bDateTime.getTime()
        return sortDirection === "asc" ? comparison : -comparison
      }
      
      const comparison = aDate.getTime() - bDate.getTime()
      return sortDirection === "asc" ? comparison : -comparison
    }

    return 0
  })

  const handleSort = (field: keyof Report) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: keyof Report) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const stats = {
    total: visibleReports.length,
    pending: visibleReports.filter((r) => r.status === "pending").length,
    investigating: visibleReports.filter((r) => r.status === "in-progress").length,
    resolved: visibleReports.filter((r) => r.status === "resolved").length,
  }

  // Dialog state for editing status
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  type ReportStatus = "pending" | "assigned" | "in-progress" | "resolved" | "cancelled"
  const [editedStatus, setEditedStatus] = useState<ReportStatus>("pending")
  const [saving, setSaving] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleSaveStatus = async () => {
    if (!selectedReport) return
    if (editedStatus === (selectedReport.status ?? 'pending')) {
      setIsEditOpen(false)
      setSelectedReport(null)
      return
    }
    setSaving(true)
    setUpdateError(null)
    try {
      const client = getDispatchClient()
      const result = await client.updateReport(selectedReport.id, { status: editedStatus })
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update status')
      }
      setIsEditOpen(false)
      setSelectedReport(null)
    } catch (err) {
      console.error("Failed to update status", err)
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const saveDisabled = saving || (selectedReport && editedStatus === (selectedReport.status ?? 'pending'))

  return (
    <div className="flex flex-col">
      <Header title="Incident Management" />

      <div className="flex-1 space-y-6 p-6">
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-red-600">Error loading reports: {error}</div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading reports...</div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.investigating}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.resolved}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 gap-2">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Category Filter */}
                    <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Subcategory Filter */}
                    <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Subcategories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subcategories</SelectItem>
                        {getSubcategoriesForCategory(categoryFilter).map((subcategory, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={includeArchived} onCheckedChange={setIncludeArchived} />
                      <span className="text-sm text-muted-foreground">Show archived</span>
                    </div>
                    {/* Export Button */}
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incidents Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Incidents ({filteredIncidents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("id")}
                      >
                        <div className="flex items-center gap-2">
                          ID
                          {getSortIcon("id")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("incident_title")}
                      >
                        <div className="flex items-center gap-2">
                          Title
                          {getSortIcon("incident_title")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("category_id")}
                      >
                        <div className="flex items-center gap-2">
                          Category
                          {getSortIcon("category_id")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("incident_date")}
                      >
                        <div className="flex items-center gap-2">
                          Date & Time
                          {getSortIcon("incident_date")}
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[18rem]">Location</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {getSortIcon("status")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIncidents.map((report) => {
                      const isArchivedFlag = Boolean(report.is_archived)
                      const isArchivedStatus = report.status === 'archived'
                      const isLocallyArchived = archivedIds.has(report.id.toString())
                      const isArchived = isArchivedFlag || isArchivedStatus || isLocallyArchived
                      return (
                      <TableRow key={report.id} className={isArchived ? "opacity-60" : undefined}>
                        <TableCell className="font-medium">
                          #{String(report.id).slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="font-medium">{report.incident_title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getCategoryName(report.category_id)}</div>
                            {report.sub_category !== null && report.sub_category !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {getSubcategoryName(report.category_id, report.sub_category)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {report.incident_date}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {report.incident_time}
                          </div>
                        </TableCell>
                         <TableCell className="min-w-[18rem]">
                           <div className="flex items-start gap-1">
                             <MapPin className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                             <span className="text-sm">
                               {report.street_address}
                               {report.nearby_landmark && ` (${report.nearby_landmark})`}
                             </span>
                           </div>
                         </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" disabled={isArchived} title={isArchived ? "Disabled for archived reports" : undefined}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setSelectedReport(report)
                              setEditedStatus(report.status ?? "pending")
                              setIsEditOpen(true)
                            }} title="Edit status" disabled={isArchived}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Archive"
                              onClick={async () => {
                                try {
                                  const client = getDispatchClient()
                                  const result = await client.archiveReport(report.id)
                                  if (result.error) {
                                    console.error("Failed to archive report:", result.error)
                                    return
                                  }
                                  setArchivedIds((prev) => new Set(prev).add(report.id.toString()))
                                } catch (e) {
                                  console.error("Failed to archive report:", e)
                                }
                              }}
                              disabled={isArchived}
                            >
                              <Archive className="h-4 w-4 text-orange-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!saving && !open) {
          setIsEditOpen(false)
          setSelectedReport(null)
        } else {
          setIsEditOpen(open)
        }
      }}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Report</div>
                <div className="font-medium">{selectedReport?.incident_title}</div>
                <div className="text-xs text-muted-foreground">#{String(selectedReport?.id ?? "").slice(-8)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Status</div>
                <Select value={editedStatus} onValueChange={(value) => setEditedStatus(value as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {updateError && (
                <div className="text-sm text-red-600 border border-red-300 rounded p-2 bg-red-50">
                  {updateError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { if (!saving) { setIsEditOpen(false); setSelectedReport(null) } }} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveStatus} disabled={saveDisabled}>{saving ? "Saving..." : (selectedReport && editedStatus === (selectedReport.status ?? 'pending') ? 'No Changes' : 'Save')}</Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  )
}
