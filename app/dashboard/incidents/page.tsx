"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  User,
  AlertTriangle,
} from "lucide-react"
import { useReports } from "@/lib/new/useReports"
import type { DatabaseReport } from "@/lib/new/types"

export default function IncidentsPage() {
  const { reports, loading, error, updateReportStatus } = useReports()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

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

  const getSeverityBadge = (severity?: string | null) => {
    const s = (severity ?? "low").toLowerCase()
    const variants: Record<string, "default" | "warning" | "destructive"> = {
      low: "default",
      medium: "warning",
      high: "warning",
      critical: "destructive",
    }
    return (
      <Badge variant={variants[s] || "default"} className="capitalize">
        {s}
      </Badge>
    )
  }

  const filteredIncidents = reports.filter((report) => {
    const matchesSearch =
      report.incident_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.street_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.incident_category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter

    const matchesCategory =
      categoryFilter === "all" || report.incident_category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    investigating: reports.filter((r) => r.status === "in-progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  }

  // Dialog state for editing status
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<DatabaseReport | null>(null)
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
      await updateReportStatus(selectedReport.id, editedStatus)
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
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                    </Select>

                    {/* Category Filter */}
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
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
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date & Time</TableHead>
                       <TableHead className="min-w-[18rem]">Location</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.map((report) => (
                      <TableRow key={report.id}>
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
                            <div className="font-medium">{report.incident_category}</div>
                            <div className="text-xs text-muted-foreground">
                              {report.incident_subcategory}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const profile = (report as any).profiles
                              const reporterName = profile && (profile.first_name || profile.last_name) ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : report.reporter_id
                              return report.is_anonymous ? (
                                <>
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground italic">
                                    Anonymous
                                  </span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4" />
                                  <span>{reporterName}</span>
                                </>
                              )
                            })()}
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
                               {report.street_address}, {report.city}, {report.province}
                               {report.nearby_landmark && ` (${report.nearby_landmark})`}
                             </span>
                           </div>
                         </TableCell>
                        <TableCell>{getSeverityBadge(report.priority)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setSelectedReport(report)
                              setEditedStatus(report.status ?? "pending")
                              setIsEditOpen(true)
                            }} title="Edit status">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Archive">
                              <Archive className="h-4 w-4 text-orange-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                 <Select value={editedStatus} onChange={(e) => setEditedStatus(e.target.value as ReportStatus)}>
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
