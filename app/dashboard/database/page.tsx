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
  Database as DatabaseIcon,
  X,
} from "lucide-react"

type ItemType = "status" | "category" | "subcategory" | "role"

interface DatabaseItem {
  id: string
  type: ItemType
  value: string
  label: string
  createdAt: string
}

export default function DatabasePage() {
  const [selectedType, setSelectedType] = useState<ItemType>("status")
  const [newItemValue, setNewItemValue] = useState("")
  const [newItemLabel, setNewItemLabel] = useState("")

  // Start with empty data - fresh start
  const [items, setItems] = useState<DatabaseItem[]>([])
  
  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DatabaseItem | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editLabel, setEditLabel] = useState("")

  const filteredItems = items.filter((item) => item.type === selectedType)

  // CREATE - Add new item
  const handleAddItem = () => {
    if (!newItemValue || !newItemLabel) return

    const newItem: DatabaseItem = {
      id: Date.now().toString(),
      type: selectedType,
      value: newItemValue,
      label: newItemLabel,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setItems([...items, newItem])
    setNewItemValue("")
    setNewItemLabel("")
  }

  // UPDATE - Edit existing item
  const handleEditClick = (item: DatabaseItem) => {
    setEditingItem(item)
    setEditValue(item.value)
    setEditLabel(item.label)
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingItem || !editValue || !editLabel) return

    setItems(items.map((item) => 
      item.id === editingItem.id
        ? { ...item, value: editValue, label: editLabel }
        : item
    ))

    setIsEditOpen(false)
    setEditingItem(null)
    setEditValue("")
    setEditLabel("")
  }

  const handleCancelEdit = () => {
    setIsEditOpen(false)
    setEditingItem(null)
    setEditValue("")
    setEditLabel("")
  }

  // ARCHIVE - Archive/delete item
  const handleArchiveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const stats = {
    statuses: items.filter((i) => i.type === "status").length,
    categories: items.filter((i) => i.type === "category").length,
    subcategories: items.filter((i) => i.type === "subcategory").length,
    roles: items.filter((i) => i.type === "role").length,
  }

  return (
    <div className="flex flex-col">
      <Header title="Database Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Statuses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.statuses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subcategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Add New Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ItemType)}
                >
                  <option value="status">Status</option>
                  <option value="category">Category</option>
                  <option value="subcategory">Subcategory</option>
                  <option value="role">Role</option>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Value</label>
                <Input
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                />
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Label</label>
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                />
              </div>

              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Items
                ({filteredItems.length})
              </CardTitle>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ItemType)}
              >
                <option value="status">Status</option>
                <option value="category">Category</option>
                <option value="subcategory">Subcategory</option>
                <option value="role">Role</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Value</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.value}
                      </TableCell>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="capitalize">{item.type}</TableCell>
                      <TableCell>{item.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Edit"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Archive"
                            onClick={() => handleArchiveItem(item.id)}
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
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <div className="text-sm text-muted-foreground capitalize">
                  {editingItem?.type}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Value</label>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Label</label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
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

