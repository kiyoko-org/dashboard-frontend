"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react"

interface Incident {
  id: number
  title: string
  category: string
  subcategory: string
  reporter: string
  date: string
  time: string
  location: string
  status: string
  severity: string
  isAnonymous: boolean
}

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Mock data - will be replaced with Supabase data
  const incidents: Incident[] = [
    {
      id: 1,
      title: "Theft at Downtown Mall",
      category: "Theft",
      subcategory: "Shoplifting",
      reporter: "John Doe",
      date: "2025-01-15",
      time: "14:30",
      location: "Downtown Mall, Tuguegarao City",
      status: "investigating",
      severity: "high",
      isAnonymous: false,
    },
    {
      id: 2,
      title: "Traffic Accident on Main Street",
      category: "Accident",
      subcategory: "Vehicle Collision",
      reporter: "Anonymous",
      date: "2025-01-15",
      time: "09:15",
      location: "Main Street, Tuguegarao City",
      status: "resolved",
      severity: "medium",
      isAnonymous: true,
    },
    {
      id: 3,
      title: "Suspicious Activity Near School",
      category: "Suspicious Activity",
      subcategory: "Loitering",
      reporter: "Maria Santos",
      date: "2025-01-14",
      time: "16:45",
      location: "Elementary School, Barangay Centro",
      status: "pending",
      severity: "critical",
      isAnonymous: false,
    },
    {
      id: 4,
      title: "Missing Person Report",
      category: "Missing Person",
      subcategory: "Adult Missing",
      reporter: "Pedro Cruz",
      date: "2025-01-14",
      time: "08:00",
      location: "Residential Area, Cagayan",
      status: "investigating",
      severity: "critical",
      isAnonymous: false,
    },
    {
      id: 5,
      title: "Property Damage - Vandalism",
      category: "Vandalism",
      subcategory: "Graffiti",
      reporter: "Anonymous",
      date: "2025-01-13",
      time: "22:30",
      location: "Public Park, Tuguegarao",
      status: "pending",
      severity: "low",
      isAnonymous: true,
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "warning" | "success" | "destructive"> = {
      pending: "warning",
      investigating: "default",
      resolved: "success",
      closed: "default",
    }
    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "warning" | "destructive"> = {
      low: "default",
      medium: "warning",
      high: "warning",
      critical: "destructive",
    }
    return (
      <Badge variant={variants[severity] || "default"} className="capitalize">
        {severity}
      </Badge>
    )
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || incident.status === statusFilter

    const matchesCategory =
      categoryFilter === "all" || incident.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const stats = {
    total: incidents.length,
    pending: incidents.filter((i) => i.status === "pending").length,
    investigating: incidents.filter((i) => i.status === "investigating").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  }

  return (
    <div className="flex flex-col">
      <Header title="Incident Management" />

      <div className="flex-1 space-y-6 p-6">
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
                Investigating
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
                    placeholder="Search incidents..."
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
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>

                {/* Category Filter */}
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Theft">Theft</option>
                  <option value="Accident">Accident</option>
                  <option value="Vandalism">Vandalism</option>
                  <option value="Suspicious Activity">
                    Suspicious Activity
                  </option>
                  <option value="Missing Person">Missing Person</option>
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
                  <TableHead>Location</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      #{incident.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{incident.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{incident.category}</div>
                        <div className="text-xs text-muted-foreground">
                          {incident.subcategory}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {incident.isAnonymous ? (
                          <>
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground italic">
                              Anonymous
                            </span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4" />
                            <span>{incident.reporter}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {incident.date}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {incident.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{incident.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

