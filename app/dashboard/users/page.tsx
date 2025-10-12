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
  Archive,
  CheckCircle,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { useProfiles } from "@/lib/new/useProfiles"

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

  const { profiles, loading, error } = useProfiles()

  const users: UserData[] = (profiles ?? []).map((p) => {
    const fullName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")
    const email = p.email ?? ""
    return {
      id: p.id,
      name: fullName || p.id,
      email,
      phone: "", // not present on profiles by default
      role: "citizen", // default; extend db if you have role
      status: "active",
      verified: false,
      reportsCount: p.reports_count || 0,
      joinedDate: p.joined_date ? new Date(p.joined_date).toLocaleDateString() : "",
      lastActive: p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleString() : "",
    }
  })

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



  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.verified).length,
  }

  return (
    <div className="flex flex-col">
      <Header title="User Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {loading && <div className="p-4 text-sm text-muted-foreground">Loading users…</div>}
        {error && <div className="p-4 text-sm text-red-500">Failed to load users: {String(error)}</div>}

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

                {/* Role Filter */}
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
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
                          title="Archive User"
                        >
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
      </div>
    </div>
  )
}

