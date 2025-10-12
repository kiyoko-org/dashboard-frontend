"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
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
  Plus,
  Edit,
  Archive,
  Phone,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

type HotlineCategory = "emergency" | "health" | "police" | "fire" | "rescue" | "mental_health" | "other"

interface Hotline {
  id: string
  name: string
  number: string
  category: HotlineCategory
  description: string
  available: string
  createdAt: string
}

export default function HotlinesPage() {
  const [hotlines, setHotlines] = useState<Hotline[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<HotlineCategory | "all">("all")

  // Add new hotline state
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [newCategory, setNewCategory] = useState<HotlineCategory>("emergency")
  const [newDescription, setNewDescription] = useState("")
  const [newAvailable, setNewAvailable] = useState("")

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingHotline, setEditingHotline] = useState<Hotline | null>(null)
  const [editName, setEditName] = useState("")
  const [editNumber, setEditNumber] = useState("")
  const [editCategory, setEditCategory] = useState<HotlineCategory>("emergency")
  const [editDescription, setEditDescription] = useState("")
  const [editAvailable, setEditAvailable] = useState("")

  const filteredHotlines = hotlines.filter((hotline) => {
    const matchesSearch =
      hotline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotline.number.includes(searchQuery) ||
      hotline.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === "all" || hotline.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const stats = {
    total: hotlines.length,
    emergency: hotlines.filter((h) => h.category === "emergency").length,
    health: hotlines.filter((h) => h.category === "health").length,
    police: hotlines.filter((h) => h.category === "police").length,
  }

  // CREATE - Add new hotline
  const handleAddHotline = () => {
    if (!newName || !newNumber) return

    const newHotline: Hotline = {
      id: Date.now().toString(),
      name: newName,
      number: newNumber,
      category: newCategory,
      description: newDescription,
      available: newAvailable,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setHotlines([...hotlines, newHotline])
    setNewName("")
    setNewNumber("")
    setNewCategory("emergency")
    setNewDescription("")
    setNewAvailable("")
  }

  // UPDATE - Edit existing hotline
  const handleEditClick = (hotline: Hotline) => {
    setEditingHotline(hotline)
    setEditName(hotline.name)
    setEditNumber(hotline.number)
    setEditCategory(hotline.category)
    setEditDescription(hotline.description)
    setEditAvailable(hotline.available)
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingHotline || !editName || !editNumber) return

    setHotlines(
      hotlines.map((hotline) =>
        hotline.id === editingHotline.id
          ? {
              ...hotline,
              name: editName,
              number: editNumber,
              category: editCategory,
              description: editDescription,
              available: editAvailable,
            }
          : hotline
      )
    )

    setIsEditOpen(false)
    setEditingHotline(null)
    setEditName("")
    setEditNumber("")
    setEditCategory("emergency")
    setEditDescription("")
    setEditAvailable("")
  }

  const handleCancelEdit = () => {
    setIsEditOpen(false)
    setEditingHotline(null)
    setEditName("")
    setEditNumber("")
    setEditCategory("emergency")
    setEditDescription("")
    setEditAvailable("")
  }

  // ARCHIVE - Archive/delete hotline
  const handleArchiveHotline = (id: string) => {
    setHotlines(hotlines.filter((hotline) => hotline.id !== id))
  }

  const getCategoryBadge = (category: HotlineCategory) => {
    const variants: Record<HotlineCategory, { variant: "default" | "warning" | "destructive" | "success", label: string }> = {
      emergency: { variant: "destructive", label: "Emergency" },
      health: { variant: "success", label: "Health" },
      police: { variant: "default", label: "Police" },
      fire: { variant: "destructive", label: "Fire" },
      rescue: { variant: "warning", label: "Rescue" },
      mental_health: { variant: "success", label: "Mental Health" },
      other: { variant: "default", label: "Other" },
    }
    const config = variants[category]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="flex flex-col">
      <Header title="Emergency Hotlines" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Hotlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emergency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.emergency}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.health}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Police</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.police}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Hotline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Add New Hotline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as HotlineCategory)}
                >
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Available</label>
                <Input
                  value={newAvailable}
                  onChange={(e) => setNewAvailable(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddHotline} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Hotline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as HotlineCategory | "all")}
              >
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Hotlines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Hotlines ({filteredHotlines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotlines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hotlines found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHotlines.map((hotline) => (
                    <TableRow key={hotline.id}>
                      <TableCell className="font-medium">{hotline.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {hotline.number}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(hotline.category)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {hotline.description}
                      </TableCell>
                      <TableCell className="text-sm">{hotline.available}</TableCell>
                      <TableCell>{hotline.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => handleEditClick(hotline)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Archive"
                            onClick={() => handleArchiveHotline(hotline.id)}
                          >
                            <Archive className="h-4 w-4 text-orange-500" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Hotline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as HotlineCategory)}
                >
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Available</label>
                <Input
                  value={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  )
}

