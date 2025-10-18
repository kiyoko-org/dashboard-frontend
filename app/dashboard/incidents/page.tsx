"use client"

import { useState, useEffect } from "react"
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
	UserPlus,
	Check,
	X,
	Image,
	File,
	Music,
	FileText,
	Video,
	FileImage,
} from "lucide-react"
import { useRealtimeReports, getDispatchClient, useCategories, useOfficers } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"

type Report = Database["public"]["Tables"]["reports"]["Row"]

export default function IncidentsPage() {
	const { reports, loading, error, isConnected } = useRealtimeReports()
	const { categories, loading: categoriesLoading } = useCategories()
	const { officers, loading: officersLoading } = useOfficers()
	const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
	const [includeArchived, setIncludeArchived] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [categoryFilter, setCategoryFilter] = useState("all")
	const [subcategoryFilter, setSubcategoryFilter] = useState("all")
	const [sortField, setSortField] = useState<keyof Report | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

	// Assignment dialog state
	const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
	const [selectedReportForAssignment, setSelectedReportForAssignment] = useState<Report | null>(null)
	const [selectedOfficers, setSelectedOfficers] = useState<Set<string>>(new Set())
	const [officerSearchQuery, setOfficerSearchQuery] = useState("")
	const [isAssigning, setIsAssigning] = useState(false)

	// Confirmation dialog state
	const [showCancelConfirm, setShowCancelConfirm] = useState(false)
	const [confirmArchiveReport, setConfirmArchiveReport] = useState<Report | null>(null)

	// Detail view dialog state
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
	const [selectedReportForDetail, setSelectedReportForDetail] = useState<Report | null>(null)
	const [downloadingAttachments, setDownloadingAttachments] = useState<Set<number>>(new Set())
	const [downloadProgress, setDownloadProgress] = useState<Map<number, number>>(new Map())
	const [viewerOpen, setViewerOpen] = useState(false)
	const [viewerSrc, setViewerSrc] = useState<string | null>(null)
	const [viewerType, setViewerType] = useState<'image'|'audio'|'video'|'file'|null>(null)
	const [viewerFilename, setViewerFilename] = useState<string | null>(null)
	const [viewerIndex, setViewerIndex] = useState<number | null>(null)
	const [viewerSignedUrlLoading, setViewerSignedUrlLoading] = useState(false)
	const [thumbnailSignedUrls, setThumbnailSignedUrls] = useState<Record<number, string>>({})

	const createSignedUrlForAttachment = async (attachment: string) => {
		try {
			const client = getDispatchClient()
			const filePath = attachment.replace(/^.*\/attachments\//, '')
			const filename = filePath.split('/').pop() || ''
			const { data, error } = await client.supabaseClient.storage.from('attachments').createSignedUrl(filePath, 3600)
			if (error || !data?.signedUrl) {
				return { url: attachment, filename }
			}
			return { url: data.signedUrl, filename }
		} catch (e) {
			console.error('Error creating signed URL:', e)
			const filename = attachment.split('/').pop() || ''
			return { url: attachment, filename }
		}
	}

	const openAttachmentViewer = async (attachment: string, index: number, fileType: string) => {
		setViewerSignedUrlLoading(true)
		const { url, filename } = await createSignedUrlForAttachment(attachment)
		setViewerSrc(url)
		setViewerType(fileType as any)
		setViewerFilename(filename)
		setViewerIndex(index)
		setViewerSignedUrlLoading(false)
		setViewerOpen(true)
	}

	// Prefetch signed thumbnail URLs for images when the detail dialog opens
	useEffect(() => {
		if (!isDetailDialogOpen || !selectedReportForDetail?.attachments) return
		let cancelled = false
		;(async () => {
			const newMap: Record<number, string> = {}
			for (let i = 0; i < selectedReportForDetail.attachments.length; i++) {
				const attachment = selectedReportForDetail.attachments[i]
				const fileType = getFileType(attachment)
				if (fileType === 'image') {
					try {
						const { url } = await createSignedUrlForAttachment(attachment)
						if (cancelled) return
						newMap[i] = url
					} catch (e) {
						// ignore
					}
				}
			}
			if (!cancelled) setThumbnailSignedUrls(newMap)
		})()
		return () => { cancelled = true }
	}, [isDetailDialogOpen, selectedReportForDetail])


	// Utility functions for file handling
	const getFileType = (filename: string) => {
		const extension = filename.split('.').pop()?.toLowerCase()
		
		if (!extension) return 'unknown'
		
		const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
		const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
		const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
		const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
		
		if (imageExtensions.includes(extension)) return 'image'
		if (audioExtensions.includes(extension)) return 'audio'
		if (videoExtensions.includes(extension)) return 'video'
		if (documentExtensions.includes(extension)) return 'document'
		
		return 'file'
	}

	const getFileIcon = (fileType: string) => {
		switch (fileType) {
			case 'image':
				return Image
			case 'audio':
				return Music
			case 'video':
				return Video
			case 'document':
				return FileText
			default:
				return File
		}
	}

	const downloadFile = async (url: string, filename: string, index: number) => {
		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			
			const contentLength = response.headers.get('content-length')
			const total = contentLength ? parseInt(contentLength, 10) : 0
			let loaded = 0
			
			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error('No reader available')
			}
			
			const chunks: Uint8Array[] = []
			
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				
				chunks.push(value)
				loaded += value.length
				
				// Update progress if we have total size
				if (total > 0) {
					const progress = (loaded / total) * 100
					setDownloadProgress(prev => new Map(prev).set(index, progress))
				}
			}
			
			// Combine all chunks into a single blob
			const blob = new Blob(chunks)
			
			// Create download link
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = filename
			link.style.display = 'none'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			
			// Clean up the object URL
			URL.revokeObjectURL(link.href)
			
			// Clear progress
			setDownloadProgress(prev => {
				const newMap = new Map(prev)
				newMap.delete(index)
				return newMap
			})
		} catch (error) {
			console.error('Error downloading file:', error)
			// Fallback to direct link download
			const link = document.createElement('a')
			link.href = url
			link.download = filename
			link.target = '_blank'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			
			// Clear progress on error
			setDownloadProgress(prev => {
				const newMap = new Map(prev)
				newMap.delete(index)
				return newMap
			})
		}
	}

	const handleAttachmentClick = async (attachment: string, index: number) => {
		setDownloadingAttachments(prev => new Set(prev).add(index))
		
		try {
			const client = getDispatchClient()
			
			// Extract the file path from the attachment URL
			// Assuming attachments are stored in a bucket called 'attachments'
			const filePath = attachment.replace(/^.*\/attachments\//, '')
			const filename = filePath.split('/').pop() || `attachment-${index + 1}`
			
			// Create a signed URL for the file (valid for 1 hour)
			const { data, error } = await client.supabaseClient.storage
				.from('attachments')
				.createSignedUrl(filePath, 3600) // 3600 seconds = 1 hour
			
			if (error) {
				console.error('Error creating signed URL:', error)
				// Fallback to original URL if there's an error
				await downloadFile(attachment, filename, index)
				return
			}
			
			// Download the file using the signed URL
			await downloadFile(data.signedUrl, filename, index)
		} catch (error) {
			console.error('Error handling attachment:', error)
			// Fallback to original URL if there's an error
			const filename = attachment.split('/').pop() || `attachment-${index + 1}`
			await downloadFile(attachment, filename, index)
		} finally {
			setDownloadingAttachments(prev => {
				const newSet = new Set(prev)
				newSet.delete(index)
				return newSet
			})
		}
	}

	const getStatusBadge = (status?: string | null) => {
		const getStatusClasses = (status?: string | null) => {
			const base = "capitalize text-center"
			switch(status) {
				case "pending": return `${base} bg-yellow-500 text-white`
				case "assigned": return `${base} bg-blue-500 text-white`
				case "in-progress": return `${base} bg-orange-500 text-white`
				case "resolved": return `${base} bg-green-500 text-white`
				case "cancelled": return `${base} bg-red-500 text-white`
				case "unresolved": return `${base} bg-purple-500 text-white`
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
		unresolved: visibleReports.filter((r) => r.status === "unresolved").length,
	}

	// Dialog state for editing status
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [selectedReport, setSelectedReport] = useState<Report | null>(null)
	type ReportStatus = "pending" | "assigned" | "in-progress" | "resolved" | "cancelled" | "unresolved"
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

		if (editedStatus === 'cancelled' && !showCancelConfirm) {
			setShowCancelConfirm(true)
			return
		}

		setSaving(true)
		setUpdateError(null)
		setShowCancelConfirm(false)
		try {
			const client = getDispatchClient()

			if (editedStatus === 'resolved') {
				const { data: assignedOfficers, error: fetchError } = await client.supabaseClient
					.from('officers')
					.select('id')
					.eq('assigned_report_id', selectedReport.id)
				
				if (fetchError) {
					throw new Error(`Failed to fetch assigned officers: ${fetchError.message}`)
				}

				if (assignedOfficers && assignedOfficers.length > 0) {
					for (const officer of assignedOfficers) {
						const { error: unassignError } = await client.supabaseClient
							.from('officers')
							.update({ assigned_report_id: null })
							.eq('id', officer.id)
						
						if (unassignError) {
							throw new Error(`Failed to unassign officer ${officer.id}: ${unassignError.message}`)
						}
					}
				}
			}

			const updateData = { status: editedStatus }
			if (editedStatus === 'cancelled') {
				updateData.is_archived = true
			}

			const result = await client.updateReport(selectedReport.id, updateData)
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
						<div className="grid gap-4 md:grid-cols-5">
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
									<CardTitle className="text-sm font-medium">Unresolved</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-purple-600">
										{stats.unresolved}
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
												<SelectItem value="unresolved">Unresolved</SelectItem>
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
															<Button
															variant="ghost"
															 size="icon"
											disabled={isArchived}
											title={isArchived ? "Disabled for archived reports" : "View details"}
											onClick={() => {
												setSelectedReportForDetail(report)
												setIsDetailDialogOpen(true)
											}}
										>
											<Eye className="h-4 w-4" />
										</Button>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => {
																	setSelectedReportForAssignment(report)
																	setSelectedOfficers(new Set())
																	setOfficerSearchQuery("")
																	setIsAssignDialogOpen(true)
																}}
																title={
																	report.status === 'resolved' 
																		? "Cannot assign to resolved report" 
																		: report.status === 'cancelled'
																			? "Cannot assign to cancelled report"
																			: "Assign officers"
																}
																disabled={isArchived || report.status === 'resolved' || report.status === 'cancelled'}
															>
																<UserPlus className="h-4 w-4" />
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
															onClick={() => setConfirmArchiveReport(report)}
															disabled={isArchived || report.status !== 'resolved'}
															>
															<Archive className={`h-4 w-4 ${isArchived || report.status !== 'resolved' ? 'text-gray-400' : 'text-orange-500'}`} />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											)
										})}
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
				setShowCancelConfirm(false)
			} else {
				setIsEditOpen(open)
			}
		}}>
				<DialogPortal>
					<DialogOverlay />
					<DialogContent>
						{saving && (
							<div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
								<div className="flex flex-col items-center gap-2">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									<div className="text-sm text-muted-foreground">
										{editedStatus === 'resolved' ? 'Unassigning officers and updating status...' : 'Updating status...'}
									</div>
								</div>
							</div>
						)}
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
								<Select 
									value={editedStatus} 
									onValueChange={(value) => {
										setEditedStatus(value as ReportStatus)
										setShowCancelConfirm(false)
									}} 
									disabled={saving}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pending">Pending</SelectItem>
										<SelectItem value="assigned">Assigned</SelectItem>
										<SelectItem value="in-progress">In Progress</SelectItem>
										<SelectItem value="unresolved">Unresolved</SelectItem>
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
							{showCancelConfirm && editedStatus === 'cancelled' && (
								<div className="text-sm text-amber-600 border border-amber-300 rounded p-3 bg-amber-50">
									<div className="font-medium mb-1">Are you sure?</div>
									<div>This will cancel the report. This action cannot be undone.</div>
								</div>
							)}
						</div>
						<DialogFooter>
							<Button 
								variant="outline" 
								onClick={() => { 
									if (!saving) { 
										setIsEditOpen(false)
										setSelectedReport(null)
										setShowCancelConfirm(false)
									} 
								}} 
								disabled={saving}
							>
								Cancel
							</Button>
							{showCancelConfirm && editedStatus === 'cancelled' ? (
								<Button 
									variant="destructive" 
									onClick={handleSaveStatus} 
									disabled={saving}
								>
									{saving ? "Cancelling Report..." : "Yes, Cancel Report"}
								</Button>
							) : (
								<Button onClick={handleSaveStatus} disabled={saveDisabled}>
									{saving ? "Saving..." : (selectedReport && editedStatus === (selectedReport.status ?? 'pending') ? 'No Changes' : 'Save')}
								</Button>
							)}
						</DialogFooter>
					</DialogContent>
				</DialogPortal>
			</Dialog>

			{/* Assignment Dialog */}
			<Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
				if (!isAssigning && !open) {
					setIsAssignDialogOpen(false)
					setSelectedReportForAssignment(null)
					setSelectedOfficers(new Set())
					setOfficerSearchQuery("")
				} else {
					setIsAssignDialogOpen(open)
				}
			}}>
				<DialogPortal>
					<DialogOverlay />
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Assign Officers to Report</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<div className="text-sm text-muted-foreground">Report</div>
								<div className="font-medium">{selectedReportForAssignment?.incident_title}</div>
								<div className="text-xs text-muted-foreground">#{String(selectedReportForAssignment?.id ?? "").slice(-8)}</div>
							</div>

							{/* Search Bar */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={officerSearchQuery}
									onChange={(e) => setOfficerSearchQuery(e.target.value)}
									className="pl-9"
									placeholder="Search officers..."
								/>
							</div>

							{/* Officers List */}
							<div className="max-h-96 overflow-y-auto space-y-2">
								{officersLoading ? (
									<div className="text-center py-4">Loading officers...</div>
								) : (() => {
									const filteredOfficers = officers.filter(officer => {
										const searchTerm = officerSearchQuery.toLowerCase()
										const fullName = `${officer.first_name || ''} ${officer.middle_name || ''} ${officer.last_name || ''}`.toLowerCase()
										const badgeNumber = officer.badge_number?.toLowerCase() || ''
										const rank = officer.rank?.toLowerCase() || ''
										return fullName.includes(searchTerm) ||
											badgeNumber.includes(searchTerm) ||
											rank.includes(searchTerm)
									})

									const assignedToThisReport = filteredOfficers.filter(
										officer => officer.assigned_report_id === selectedReportForAssignment?.id
									)
									const otherOfficers = filteredOfficers.filter(
										officer => officer.assigned_report_id !== selectedReportForAssignment?.id
									)

									const renderOfficerCard = (officer: typeof officers[0]) => {
										const isAssigned = selectedOfficers.has(officer.id)
										const isCurrentlyAssigned = officer.assigned_report_id !== null
										const isAvailable = officer.assigned_report_id === null
										const isAssignedToThis = officer.assigned_report_id === selectedReportForAssignment?.id

										return (
											<div
												key={officer.id}
												className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
													isAssigned
														? 'bg-blue-50 border-blue-200'
														: isCurrentlyAssigned && !isAssignedToThis
															? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
															: 'hover:bg-gray-50 border-gray-200 cursor-pointer'
												}`}
												onClick={() => {
													if (!isCurrentlyAssigned || isAssignedToThis) {
														if (!isAssignedToThis) {
															setSelectedOfficers(prev => {
																const newSet = new Set(prev)
																if (isAssigned) {
																	newSet.delete(officer.id)
																} else {
																	newSet.add(officer.id)
																}
																return newSet
															})
														}
													}
												}}
											>
												<div className="flex items-center gap-2 flex-1">
													{isAvailable && (
														<div className="w-3 h-3 rounded-full bg-green-500"></div>
													)}
													{isCurrentlyAssigned && (
														<div className="w-3 h-3 rounded-full bg-red-500"></div>
													)}
													<div className="flex-1">
														<div className="font-medium">
															{officer.first_name} {officer.middle_name} {officer.last_name}
														</div>
														<div className="text-sm text-muted-foreground">
															{officer.rank} • Badge #{officer.badge_number}
														</div>
													</div>
												</div>
												{isAssignedToThis ? (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={async (e) => {
															e.stopPropagation()
															try {
																const client = getDispatchClient()

																// Get current report status
																const { data: report, error: reportError } = await client.supabaseClient
																	.from('reports')
																	.select('status')
																	.eq('id', selectedReportForAssignment?.id)
																	.single()

																if (reportError) {
																	console.error('Failed to fetch report status:', reportError)
																	return
																}

																// Unassign the officer
																const { error } = await client.supabaseClient
																	.from('officers')
																	.update({ assigned_report_id: null })
																	.eq('id', officer.id)

																if (error) {
																	console.error(`Failed to unassign officer ${officer.id}:`, error)
																	return
																}

																// Check if any officers are still assigned
																const { count } = await client.supabaseClient
																	.from('officers')
																	.select('*', { count: 'exact', head: true })
																	.eq('assigned_report_id', selectedReportForAssignment?.id)

																if (count === 0 && report.status === 'assigned') {
																	// Update report status to pending
																	await client.updateReport(selectedReportForAssignment!.id, { status: 'pending' })
																}
															} catch (error) {
																console.error("Failed to unassign officer:", error)
															}
														}}
														title="Unassign from this report"
													>
														<X className="h-4 w-4 text-red-600" />
													</Button>
												) : isAssigned ? (
													<Check className="h-5 w-5 text-blue-600" />
												) : null}
											</div>
										)
									}

									return (
										<>
											{assignedToThisReport.length > 0 && (
												<>
													<div className="text-sm font-medium text-muted-foreground px-1 py-1">
														Currently Assigned to This Report
													</div>
													{assignedToThisReport.map(renderOfficerCard)}
													{otherOfficers.length > 0 && (
														<div className="border-t my-3"></div>
													)}
												</>
											)}
											{assignedToThisReport.length > 0 && otherOfficers.length > 0 && (
												<div className="text-sm font-medium text-muted-foreground px-1 py-1">
													Other Officers
												</div>
											)}
											{otherOfficers.map(renderOfficerCard)}
										</>
									)
								})()}
							</div>

							{selectedOfficers.size > 0 && (
								<div className="text-sm text-muted-foreground">
									{selectedOfficers.size} officer{selectedOfficers.size > 1 ? 's' : ''} selected
								</div>
							)}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									if (!isAssigning) {
										setIsAssignDialogOpen(false)
										setSelectedReportForAssignment(null)
										setSelectedOfficers(new Set())
										setOfficerSearchQuery("")
									}
								}}
								disabled={isAssigning}
							>
								Cancel
							</Button>
							<Button
								onClick={async () => {
									if (!selectedReportForAssignment || selectedOfficers.size === 0) return

									setIsAssigning(true)
									try {
										const client = getDispatchClient()
										let hasError = false

										// Assign each selected officer to the report
										for (const officerId of selectedOfficers) {
											const { data, error } = await client.supabaseClient.from('officers').update({ assigned_report_id: selectedReportForAssignment.id }).eq('id', officerId).select();


											console.log(officerId, selectedReportForAssignment.id)

											console.log("Assign to report result:", { data, error })

											if (error) {
												console.error(`Failed to assign officer ${officerId}:`, error)
												hasError = true
											}
										}

										if (!hasError) {
											// Update report status to assigned if it was pending
											if (selectedReportForAssignment.status === 'pending') {
												await client.updateReport(selectedReportForAssignment.id, { status: 'assigned' })
											}

											setIsAssignDialogOpen(false)
											setSelectedReportForAssignment(null)
											setSelectedOfficers(new Set())
											setOfficerSearchQuery("")
										}
									} catch (error) {
										console.error("Failed to assign officers:", error)
									} finally {
										setIsAssigning(false)
									}
								}}
								disabled={isAssigning || selectedOfficers.size === 0}
							>
								{isAssigning ? "Assigning..." : `Assign ${selectedOfficers.size} Officer${selectedOfficers.size > 1 ? 's' : ''}`}
							</Button>
						</DialogFooter>
					</DialogContent>
				</DialogPortal>
			</Dialog>

			{/* Detail View Dialog */}
			<Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
				if (!open) {
					setIsDetailDialogOpen(false)
					setSelectedReportForDetail(null)
				} else {
					setIsDetailDialogOpen(open)
				}
			}}>
				<DialogPortal>
					<DialogOverlay />
					<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Report Details</DialogTitle>
						</DialogHeader>
						{selectedReportForDetail && (
							<div className="space-y-6">
								{/* Basic Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<div className="text-sm text-muted-foreground mb-1">Report ID</div>
										<div className="font-medium">#{String(selectedReportForDetail.id).slice(-8)}</div>
									</div>
									<div>
										<div className="text-sm text-muted-foreground mb-1">Status</div>
										<div>{getStatusBadge(selectedReportForDetail.status)}</div>
									</div>
									<div>
										<div className="text-sm text-muted-foreground mb-1">Created At</div>
										<div className="font-medium">
											{new Date(selectedReportForDetail.created_at).toLocaleString()}
										</div>
									</div>
									<div>
										<div className="text-sm text-muted-foreground mb-1">Archived</div>
										<div className="font-medium">
											{selectedReportForDetail.is_archived ? 'Yes' : 'No'}
										</div>
									</div>
								</div>

								{/* Incident Details */}
								<div>
									<div className="text-lg font-semibold mb-3 flex items-center gap-2">
										<AlertTriangle className="h-5 w-5 text-red-500" />
										Incident Information
									</div>
									<div className="space-y-3">
										<div>
											<div className="text-sm text-muted-foreground mb-1">Title</div>
											<div className="font-medium text-lg">{selectedReportForDetail.incident_title}</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<div className="text-sm text-muted-foreground mb-1">Date</div>
												<div className="font-medium flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													{selectedReportForDetail.incident_date}
												</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground mb-1">Time</div>
												<div className="font-medium">{selectedReportForDetail.incident_time || 'Not specified'}</div>
											</div>
										</div>
									</div>
								</div>

								{/* Location */}
								<div>
									<div className="text-lg font-semibold mb-3 flex items-center gap-2">
										<MapPin className="h-5 w-5 text-blue-500" />
										Location
									</div>
									<div className="space-y-2">
										<div>
											<div className="text-sm text-muted-foreground mb-1">Street Address</div>
											<div className="font-medium">{selectedReportForDetail.street_address || 'Not specified'}</div>
										</div>
										{(selectedReportForDetail.city || selectedReportForDetail.province) && (
											<div>
												<div className="text-sm text-muted-foreground mb-1">City & Province</div>
												<div className="font-medium">
													{[selectedReportForDetail.city, selectedReportForDetail.province].filter(Boolean).join(', ')}
												</div>
											</div>
										)}
										{selectedReportForDetail.nearby_landmark && (
											<div>
												<div className="text-sm text-muted-foreground mb-1">Nearby Landmark</div>
												<div className="font-medium">{selectedReportForDetail.nearby_landmark}</div>
											</div>
										)}
										{(selectedReportForDetail.latitude !== null && selectedReportForDetail.longitude !== null) && (
											<div>
												<div className="text-sm text-muted-foreground mb-1">Coordinates</div>
												<div className="font-medium font-mono text-sm">
													{selectedReportForDetail.latitude}, {selectedReportForDetail.longitude}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Category */}
								<div>
									<div className="text-lg font-semibold mb-3">Category</div>
									<div className="flex items-center gap-2">
										<div className="font-medium">{getCategoryName(selectedReportForDetail.category_id)}</div>
										{selectedReportForDetail.sub_category !== null && selectedReportForDetail.sub_category !== undefined && (
											<>
												<span className="text-muted-foreground">•</span>
												<div className="font-medium text-muted-foreground">{getSubcategoryName(selectedReportForDetail.category_id, selectedReportForDetail.sub_category)}</div>
											</>
										)}
									</div>
								</div>

								{/* What Happened */}
								{selectedReportForDetail.what_happened && (
									<div>
										<div className="text-lg font-semibold mb-3">What Happened</div>
										<div className="bg-muted p-3 rounded-lg">
											<div className="whitespace-pre-wrap">{selectedReportForDetail.what_happened}</div>
										</div>
									</div>
								)}

								{/* Additional Incident Details */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{selectedReportForDetail.who_was_involved && (
										<div>
											<div className="text-sm text-muted-foreground mb-1">Who Was Involved</div>
											<div className="font-medium">{selectedReportForDetail.who_was_involved}</div>
										</div>
									)}
									{selectedReportForDetail.number_of_witnesses && (
										<div>
											<div className="text-sm text-muted-foreground mb-1">Number of Witnesses</div>
											<div className="font-medium">{selectedReportForDetail.number_of_witnesses}</div>
										</div>
									)}
									{selectedReportForDetail.injuries_reported && (
										<div>
											<div className="text-sm text-muted-foreground mb-1">Injuries Reported</div>
											<div className="font-medium">{selectedReportForDetail.injuries_reported}</div>
										</div>
									)}
									{selectedReportForDetail.property_damage && (
										<div>
											<div className="text-sm text-muted-foreground mb-1">Property Damage</div>
											<div className="font-medium">{selectedReportForDetail.property_damage}</div>
										</div>
									)}
								</div>

								{/* Suspect & Witness Information */}
								{(selectedReportForDetail.suspect_description || selectedReportForDetail.witness_contact_info) && (
									<div className="space-y-3">
										{selectedReportForDetail.suspect_description && (
											<div>
												<div className="text-lg font-semibold mb-2">Suspect Description</div>
												<div className="bg-muted p-3 rounded-lg">
													<div className="whitespace-pre-wrap">{selectedReportForDetail.suspect_description}</div>
												</div>
											</div>
										)}
										{selectedReportForDetail.witness_contact_info && (
											<div>
												<div className="text-lg font-semibold mb-2">Witness Contact Information</div>
												<div className="bg-muted p-3 rounded-lg">
													<div className="whitespace-pre-wrap">{selectedReportForDetail.witness_contact_info}</div>
												</div>
											</div>
										)}
									</div>
								)}

				{/* Attachments */}
				{selectedReportForDetail.attachments && selectedReportForDetail.attachments.length > 0 && (
					<div>
						<div className="text-lg font-semibold mb-3">Attachments</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{selectedReportForDetail.attachments.map((attachment, index) => {
								const fileType = getFileType(attachment)
								const IconComponent = getFileIcon(fileType)
								const filename = attachment.split('/').pop() || `attachment-${index + 1}`
								const isDownloading = downloadingAttachments.has(index)
								const progress = downloadProgress.get(index) || 0
								
								return (
									<div
										key={index}
										className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
											isDownloading ? 'opacity-50 cursor-not-allowed' : ''
										}`}
										onClick={() => {
											if (isDownloading) return
											if (fileType === 'image' || fileType === 'audio' || fileType === 'video') {
												openAttachmentViewer(attachment, index, fileType)
											} else {
												handleAttachmentClick(attachment, index)
											}
										}}
									>
										<div className="flex-shrink-0">
											{fileType === 'image' ? (
												<img src={thumbnailSignedUrls[index] || attachment} alt={filename} className="h-16 w-24 object-cover rounded-md" />
											) : fileType === 'audio' ? (
												<div className="h-12 w-12 flex items-center justify-center bg-muted rounded-md">
													<Music className="h-6 w-6 text-muted-foreground" />
												</div>
											) : fileType === 'video' ? (
												<div className="h-12 w-12 flex items-center justify-center bg-muted rounded-md">
													<Video className="h-6 w-6 text-muted-foreground" />
												</div>
											) : (
												<IconComponent className="h-8 w-8 text-muted-foreground" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium truncate" title={filename}>
												{filename}
											</div>
											<div className="text-xs text-muted-foreground capitalize">
												{fileType}
											</div>
											{isDownloading && progress > 0 && (
												<div className="mt-1">
													<div className="w-full bg-muted rounded-full h-1">
														<div className="bg-primary h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
													</div>
													<div className="text-xs text-muted-foreground mt-1">
														{progress.toFixed(1)}%
													</div>
												</div>
											)}
										</div>
										{isDownloading ? (
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent flex-shrink-0" />
										) : (
											<Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
										)}
									</div>
								)
							})}
						</div>
					</div>
				)}

								{/* Description */}
								{selectedReportForDetail.description && (
									<div>
										<div className="text-lg font-semibold mb-3">Description</div>
										<div className="bg-muted p-3 rounded-lg">
											<div className="whitespace-pre-wrap">{selectedReportForDetail.description}</div>
										</div>
									</div>
								)}

								{/* Admin Notes */}
								{selectedReportForDetail.admin_notes && (
									<div>
										<div className="text-lg font-semibold mb-3">Admin Notes</div>
										<div className="bg-muted p-3 rounded-lg border-l-4 border-orange-500">
											<div className="whitespace-pre-wrap text-orange-800">{selectedReportForDetail.admin_notes}</div>
										</div>
									</div>
								)}

								{/* Assigned Officers */}
								<div>
									<div className="text-lg font-semibold mb-3">Assigned Officers</div>
									<div className="bg-muted p-3 rounded-lg">
										{officersLoading ? (
											<div>Loading officers...</div>
										) : (
											(() => {
												const assignedOfficers = officers.filter(officer => officer.assigned_report_id === selectedReportForDetail.id)
												if (assignedOfficers.length === 0) {
													return <div className="text-muted-foreground">No officers assigned</div>
												}
												return (
													<div className="space-y-2">
														{assignedOfficers.map(officer => (
															<div key={officer.id} className="flex items-center gap-2">
																<div className="w-2 h-2 rounded-full bg-blue-500"></div>
																<div className="font-medium">
																	{officer.first_name} {officer.middle_name} {officer.last_name}
																</div>
																<div className="text-sm text-muted-foreground">
																	{officer.rank} • Badge #{officer.badge_number}
																</div>
															</div>
														))}
													</div>
												)
											})()
										)}
									</div>
								</div>
							</div>
						)}
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									setIsDetailDialogOpen(false)
									setSelectedReportForDetail(null)
								}}
							>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</DialogPortal>
				</Dialog>

				{/* Attachment Viewer Dialog */}
				<Dialog open={viewerOpen} onOpenChange={(open) => {
					if (!open) {
						setViewerOpen(false)
						setViewerSrc(null)
						setViewerType(null)
						setViewerFilename(null)
						setViewerIndex(null)
					} else {
						setViewerOpen(open)
					}
				}}>
					<DialogPortal>
						<DialogOverlay />
						<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
							<DialogHeader>
								<DialogTitle>{viewerFilename || 'Attachment'}</DialogTitle>
							</DialogHeader>
							<div className="py-4">
								{viewerSignedUrlLoading ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
									</div>
								) : (
									viewerSrc ? (
										<div className="flex flex-col items-center justify-center">
											{viewerType === 'image' && (
												<img src={viewerSrc} alt={viewerFilename || 'image'} className="max-h-[70vh] w-auto object-contain rounded-md" />
											)}
											{viewerType === 'audio' && (
												<audio controls autoPlay src={viewerSrc} className="w-full" />
											)}
											{viewerType === 'video' && (
												<video controls autoPlay src={viewerSrc} className="max-h-[70vh] w-full rounded-md" />
											)}
											{(viewerType !== 'image' && viewerType !== 'audio' && viewerType !== 'video') && (
												<div className="w-full text-center">
													<p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
													<a href={viewerSrc} target="_blank" rel="noreferrer" className="underline text-primary">Open in new tab</a>
												</div>
											)}
										</div>
									) : (
										<div className="text-center text-muted-foreground py-6">No preview available</div>
									)
								)}
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => {
									setViewerOpen(false)
									setViewerSrc(null)
									setViewerType(null)
									setViewerFilename(null)
									setViewerIndex(null)
								}}>Close</Button>
								{viewerSrc && (
									<Button onClick={() => downloadFile(viewerSrc, viewerFilename || `attachment-${viewerIndex ?? 0}`, viewerIndex ?? 0)}>
										<Download className="mr-2 h-4 w-4" />
										Download
									</Button>
								)}
							</DialogFooter>
						</DialogContent>
						</DialogPortal>
					</Dialog>

				{/* Archive Confirmation Dialog */}
				<Dialog open={!!confirmArchiveReport} onOpenChange={(open) => !open && setConfirmArchiveReport(null)}>
					<DialogContent>
					<DialogHeader>
						<DialogTitle>Archive Incident</DialogTitle>
					</DialogHeader>
					<p>Are you sure you want to archive "{confirmArchiveReport?.incident_title}"? This action will move the incident to archived status.</p>
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => setConfirmArchiveReport(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={async () => {
							if (!confirmArchiveReport) return
							try {
								const client = getDispatchClient()
								const result = await client.archiveReport(confirmArchiveReport.id)
								if (result.error) {
									console.error("Failed to archive report:", result.error)
									return
								}
								setArchivedIds((prev) => new Set(prev).add(confirmArchiveReport.id.toString()))
								setConfirmArchiveReport(null)
							} catch (e) {
								console.error("Failed to archive report:", e)
							}
						}}>
							Archive
						</Button>
					</div>
				</DialogContent>
			</Dialog>

		</div >
	)
}
