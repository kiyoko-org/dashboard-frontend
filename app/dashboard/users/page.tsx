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
  Download,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  verified: boolean
  reportsCount: number
  joinedDate: string
  lastActive: string
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data
  const users: UserData[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+63 912 345 6789",
      role: "citizen",
      status: "active",
      verified: true,
      reportsCount: 5,
      joinedDate: "2024-12-01",
      lastActive: "2025-01-15 14:30",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria.santos@example.com",
      phone: "+63 923 456 7890",
      role: "moderator",
      status: "active",
      verified: true,
      reportsCount: 12,
      joinedDate: "2024-11-15",
      lastActive: "2025-01-15 10:20",
    },
    {
      id: "3",
      name: "Pedro Cruz",
      email: "pedro.cruz@example.com",
      phone: "+63 934 567 8901",
      role: "citizen",
      status: "active",
      verified: false,
      reportsCount: 2,
      joinedDate: "2025-01-10",
      lastActive: "2025-01-14 16:45",
    },
    {
      id: "4",
      name: "Anna Reyes",
      email: "anna.reyes@example.com",
      phone: "+63 945 678 9012",
      role: "citizen",
      status: "suspended",
      verified: true,
      reportsCount: 8,
      joinedDate: "2024-10-20",
      lastActive: "2025-01-10 09:15",
    },
    {
      id: "5",
      name: "Miguel Torres",
      email: "miguel.torres@example.com",
      phone: "+63 956 789 0123",
      role: "verified_citizen",
      status: "active",
      verified: true,
      reportsCount: 15,
      joinedDate: "2024-09-05",
      lastActive: "2025-01-15 12:00",
    },
  ]

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "success" | "warning" | "destructive", label: string }> = {
      citizen: { variant: "default", label: "Citizen" },
      verified_citizen: { variant: "success", label: "Verified Citizen" },
      moderator: { variant: "warning", label: "Moderator" },
      admin: { variant: "destructive", label: "Admin" },
    }
    const config = variants[role] || variants.citizen
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      active: "success",
      suspended: "warning",
      banned: "destructive",
    }
    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    verified: users.filter((u) => u.verified).length,
    suspended: users.filter((u) => u.status === "suspended").length,
  }

  return (
    <div className="flex flex-col">
      <Header title="User Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.verified}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.suspended}
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
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Role Filter */}
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="citizen">Citizen</option>
                  <option value="verified_citizen">Verified Citizen</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            {user.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{user.reportsCount}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {user.joinedDate}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastActive}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit User">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Suspend User"
                        >
                          <Ban className="h-4 w-4 text-yellow-500" />
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

