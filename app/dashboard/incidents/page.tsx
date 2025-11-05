"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
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
	GitMerge,
	Check,
	X,
	ImageIcon,
	File,
	Music,
	FileText,
	Video,
	FileImage,
} from "lucide-react"
import { useRealtimeReports, getDispatchClient, useCategories, useOfficers, useProfiles } from "dispatch-lib"
import type { Witness } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import "jspdf/dist/polyfills.es"

type Report = Database["public"]["Tables"]["reports"]["Row"]
type WitnessDisplay = {
	userId: string
	name: string
	email: string | null
	statement: string | null
}

const isWitnessRecord = (value: unknown): value is Witness => {
	if (!value || typeof value !== "object") return false
	const candidate = value as { user_id?: unknown }
	return typeof candidate.user_id === "string" && candidate.user_id.length > 0
}

export default function IncidentsPage() {
	const { reports, loading, error, isConnected } = useRealtimeReports()
	const { categories, loading: categoriesLoading } = useCategories()
	const { officers, loading: officersLoading } = useOfficers()
	const { profiles } = useProfiles()
	const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
	const [includeArchived, setIncludeArchived] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [categoryFilter, setCategoryFilter] = useState("all")
	const [subcategoryFilter, setSubcategoryFilter] = useState("all")
	const [sortField, setSortField] = useState<keyof Report | null>("id")
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [isExporting, setIsExporting] = useState(false)
	const [selectedReportIdsForMerge, setSelectedReportIdsForMerge] = useState<Set<number>>(new Set())
	const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
	const [mergePrimaryId, setMergePrimaryId] = useState<number | null>(null)
	const [mergeError, setMergeError] = useState<string | null>(null)
	const [isMerging, setIsMerging] = useState(false)

	const isReportArchived = useCallback((report: Report) => {
		const isArchivedFlag = Boolean(report.is_archived)
		const isArchivedStatus = report.status === "archived"
		const isLocallyArchived = archivedIds.has(report.id.toString())
		return isArchivedFlag || isArchivedStatus || isLocallyArchived
	}, [archivedIds])

	const selectedReportsForMerge = useMemo<Report[]>(() => {
		if (selectedReportIdsForMerge.size === 0) return []

		return reports.filter((report) => selectedReportIdsForMerge.has(report.id))
	}, [reports, selectedReportIdsForMerge])

	const canMergeSelectedReports = selectedReportIdsForMerge.size === 2
	const mergeSelectionLimitReached = selectedReportIdsForMerge.size >= 2
	const mergeSelectionCount = selectedReportIdsForMerge.size
	const mergeButtonLabel = canMergeSelectedReports ? "Merge Selected" : `Merge Selected (${mergeSelectionCount}/2)`

	const toggleMergeSelection = (report: Report, forceSelect?: boolean) => {
		if (isReportArchived(report)) return

		setSelectedReportIdsForMerge((prev) => {
			const next = new Set(prev)
			const isCurrentlySelected = next.has(report.id)
			const shouldSelect = forceSelect ?? !isCurrentlySelected

			if (shouldSelect) {
				if (isCurrentlySelected || next.size >= 2) {
					return prev
				}
				next.add(report.id)
			} else {
				if (!isCurrentlySelected) {
					return prev
				}
				next.delete(report.id)
			}

			return next
		})
	}

	const clearMergeSelection = () => {
		setSelectedReportIdsForMerge(new Set())
		setMergePrimaryId(null)
		setMergeError(null)
	}

	const openMergeDialog = () => {
		if (!canMergeSelectedReports) return
		setMergePrimaryId(selectedReportsForMerge[0]?.id ?? null)
		setMergeError(null)
		setIsMergeDialogOpen(true)
	}

	const handleConfirmMerge = async () => {
		if (!mergePrimaryId || selectedReportsForMerge.length !== 2) {
			setMergeError("Select two reports before merging.")
			return
		}

		const primaryReport = selectedReportsForMerge.find((report) => report.id === mergePrimaryId)
		const secondaryReport = selectedReportsForMerge.find((report) => report.id !== mergePrimaryId)

		if (!primaryReport || !secondaryReport) {
			setMergeError("Could not determine which reports to merge.")
			return
		}

		setIsMerging(true)
		setMergeError(null)

		try {
			const client = getDispatchClient()

			const primaryAttachments = Array.isArray(primaryReport.attachments) ? primaryReport.attachments : []
			const secondaryAttachments = Array.isArray(secondaryReport.attachments) ? secondaryReport.attachments : []
			const mergedAttachments = Array.from(new Set([...primaryAttachments, ...secondaryAttachments]))

			if (mergedAttachments.length !== primaryAttachments.length) {
				const updateResult = await client.updateReport(primaryReport.id, { attachments: mergedAttachments })
				if (updateResult.error) {
					throw new Error(updateResult.error.message || "Failed to merge attachments.")
				}
			}

			if (secondaryReport.reporter_id) {
				const witnessHelper =
					typeof (client as any).addToWitness === "function"
						? (client as any).addToWitness.bind(client)
						: client.addWitnessToReport?.bind(client)

				if (!witnessHelper) {
					throw new Error("Witness helper not available.")
				}

				const witnessResult = await witnessHelper(
					primaryReport.id,
					secondaryReport.reporter_id,
					secondaryReport.description ?? null,
				)

				if (witnessResult?.error) {
					throw new Error(witnessResult.error.message || "Failed to add witness.")
				}
			}

			const archiveResult = await client.archiveReport(secondaryReport.id)
			if (archiveResult.error) {
				throw new Error(archiveResult.error.message || "Failed to archive merged report.")
			}

			setArchivedIds((prev) => {
				const next = new Set(prev)
				next.add(secondaryReport.id.toString())
				return next
			})

			clearMergeSelection()
			setIsMergeDialogOpen(false)
		} catch (error) {
			console.error("Failed to merge reports:", error)
			setMergeError(error instanceof Error ? error.message : "Failed to merge reports.")
		} finally {
			setIsMerging(false)
		}
	}

	useEffect(() => {
		setSelectedReportIdsForMerge((prev) => {
			if (prev.size === 0) return prev

			let changed = false
			const next = new Set<number>()

			prev.forEach((id) => {
				const report = reports.find((candidate) => candidate.id === id)
				if (report && !isReportArchived(report)) {
					next.add(id)
				} else {
					changed = true
				}
			})

			return changed ? next : prev
		})
	}, [reports, isReportArchived])

	useEffect(() => {
		if (!canMergeSelectedReports) {
			setMergePrimaryId(null)
			return
		}

		if (mergePrimaryId && selectedReportIdsForMerge.has(mergePrimaryId)) {
			return
		}

		const [firstId] = Array.from(selectedReportIdsForMerge)
		setMergePrimaryId(firstId ?? null)
	}, [canMergeSelectedReports, mergePrimaryId, selectedReportIdsForMerge])

	useEffect(() => {
		if (!canMergeSelectedReports && !isMerging && isMergeDialogOpen) {
			setIsMergeDialogOpen(false)
		}
	}, [canMergeSelectedReports, isMerging, isMergeDialogOpen])

	const generateReportTitle = () => {
		let title = "Incident Report - "

		if (startDate || endDate) {
			const start = startDate ? new Date(startDate).toLocaleDateString() : "Start"
			const end = endDate ? new Date(endDate).toLocaleDateString() : "End"
			title += `${start} to ${end}`
		} else {
			title += "All Dates"
		}

		const filters: string[] = []
		if (categoryFilter !== "all") {
			const catName = categories?.find(c => c.id.toString() === categoryFilter)?.name || categoryFilter
			filters.push(`${catName}`)
		} else {
			filters.push("all categories")
		}

		if (statusFilter !== "all") {
			filters.push(`${statusFilter} status`)
		}

		return `${title} - ${filters.join(", ")}`
	}

	const exportToPDF = async () => {
		if (sortedIncidents.length === 0) return

		setIsExporting(true)
		try {
			const doc = new jsPDF({
				orientation: "landscape",
				unit: "mm",
				format: "a4",
			})

		const pageWidth = doc.internal.pageSize.getWidth()
		const pageHeight = doc.internal.pageSize.getHeight()
		const margin = 10
		let yPos = margin

		doc.setFont("times", "bold")
		doc.setFontSize(16)
		doc.text("Dispatch", pageWidth / 2, yPos, { align: "center" })

		yPos += 8

		doc.setFont("times", "bold")
		doc.setFontSize(14)
		const title = generateReportTitle()
		doc.text(title, pageWidth / 2, yPos, { align: "center" })

			yPos += 10

			doc.setFont("times", "normal")
			doc.setFontSize(10)
			const generatedAt = `Generated: ${new Date().toLocaleString()}`
			doc.text(generatedAt, margin, yPos)

			yPos += 8

			const tableData = sortedIncidents.map((report) => [
				String(report.id).slice(-8),
				report.incident_title || "",
				getCategoryName(report.category_id),
				report.incident_date || "",
				report.street_address || "",
				report.status || "unknown",
			])

			const columns = ["ID", "Title", "Category", "Date", "Location", "Status"]

			autoTable(doc, {
				head: [columns],
				body: tableData,
				startY: yPos,
				margin: margin,
				styles: {
					fontSize: 8,
					cellPadding: 2,
				},
				headStyles: {
					fillColor: [66, 133, 244],
					textColor: 255,
					fontStyle: "bold",
				},
				alternateRowStyles: {
					fillColor: [245, 245, 245],
				},
			})

			doc.save(`incidents_${new Date().getTime()}.pdf`)
		} catch (error) {
			console.error("Error generating PDF:", error)
		} finally {
			setIsExporting(false)
		}
	}

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
	const [isWitnessDialogOpen, setIsWitnessDialogOpen] = useState(false)
	const [selectedWitnessForStatement, setSelectedWitnessForStatement] = useState<WitnessDisplay | null>(null)
	const [downloadingAttachments, setDownloadingAttachments] = useState<Set<number>>(new Set())
	const [downloadProgress, setDownloadProgress] = useState<Map<number, number>>(new Map())
	const [viewerOpen, setViewerOpen] = useState(false)
	const [viewerSrc, setViewerSrc] = useState<string | null>(null)
	const [viewerType, setViewerType] = useState<'image' | 'audio' | 'video' | 'file' | null>(null)
	const [viewerFilename, setViewerFilename] = useState<string | null>(null)
	const [viewerIndex, setViewerIndex] = useState<number | null>(null)
	const [viewerSignedUrlLoading, setViewerSignedUrlLoading] = useState(false)
	const [thumbnailSignedUrls, setThumbnailSignedUrls] = useState<Record<number, string>>({})
	const [thumbnailLoading, setThumbnailLoading] = useState<Record<number, boolean>>({})

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
			; (async () => {
				const newMap: Record<number, string> = {}
				const attachments = selectedReportForDetail.attachments!
				for (let i = 0; i < attachments.length; i++) {
					const attachment = attachments[i]
					const fileType = getFileType(attachment)
					if (fileType === 'image') {
						try {
							setThumbnailLoading(prev => ({ ...prev, [i]: true }))
							const { url } = await createSignedUrlForAttachment(attachment)
							if (cancelled) return
							newMap[i] = url
						} catch (e) {
							// ignore
						} finally {
							setThumbnailLoading(prev => ({ ...prev, [i]: false }))
						}
					}
				}
				if (!cancelled) setThumbnailSignedUrls(newMap)
			})()
		return () => { cancelled = true }
	}, [isDetailDialogOpen, selectedReportForDetail])

	useEffect(() => {
		if (!isDetailDialogOpen) {
			setIsWitnessDialogOpen(false)
			setSelectedWitnessForStatement(null)
		}
	}, [isDetailDialogOpen])

	const witnessEntries = useMemo<WitnessDisplay[]>(() => {
		if (!selectedReportForDetail || !Array.isArray(selectedReportForDetail.witnesses)) {
			return []
		}

		return selectedReportForDetail.witnesses
			.map((entry) => {
				if (!isWitnessRecord(entry)) return null

				const witnessData = entry
				const profile = profiles?.find((profile) => profile.id === witnessData.user_id)
				const nameParts = profile ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean) : []
				const fallbackName = witnessData.user_id.length > 8
					? `Witness ${witnessData.user_id.slice(0, 8)}…`
					: witnessData.user_id
				const name = nameParts.length > 0 ? nameParts.join(" ") : fallbackName
				const email = profile?.email ?? null
				const statement = typeof witnessData.statement === "string" ? witnessData.statement : null

				return {
					userId: witnessData.user_id,
					name,
					email,
					statement,
				}
			})
			.filter((entry): entry is WitnessDisplay => entry !== null)
	}, [profiles, selectedReportForDetail])

	const witnessCountDisplay = witnessEntries.length > 0
		? String(witnessEntries.length)
		: (selectedReportForDetail?.number_of_witnesses ?? "0")


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
				return ImageIcon
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
			const blob = new Blob(chunks as BlobPart[])

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
			switch (status) {
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


	const visibleReports = reports.filter((report) =>
		includeArchived ? true : !isReportArchived(report),
	)

	// Helpers to parse YYYY-MM-DD as LOCAL dates (avoid UTC shift)
	const isIsoDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)
	const toLocalDateMs = (s: string) => {
		const [y, m, d] = s.split('-').map(Number)
		return new Date(y, (m || 1) - 1, d || 1).getTime()
	}

	// Helper to format duration between two timestamps
	const formatDuration = (startMs: number, endMs: number): string => {
		const diffMs = endMs - startMs
		if (diffMs < 0) return "0 sec"

		const seconds = Math.floor(diffMs / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)

		if (days > 0) {
			const remainingHours = hours % 24
			return `${days}d ${remainingHours}h`
		} else if (hours > 0) {
			const remainingMinutes = minutes % 60
			return `${hours}h ${remainingMinutes}m`
		} else if (minutes > 0) {
			const remainingSeconds = seconds % 60
			return `${minutes}m ${remainingSeconds}s`
		} else {
			return `${seconds}s`
		}
	}

	// Helper to compute response time between report creation and arrival
	const getResponseTime = (report: Report): string | null => {
		if (!report.created_at || !report.arrived_at) return null

		try {
			const createdMs = new Date(report.created_at).getTime()
			const arrivedMs = new Date(report.arrived_at).getTime()

			if (isNaN(createdMs) || isNaN(arrivedMs)) return null

			return formatDuration(createdMs, arrivedMs)
		} catch {
			return null
		}
	}

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

		let matchesDateRange = true
		if (startDate || endDate) {
			let reportDateMs = 0
			if (report.incident_date) {
				reportDateMs = isIsoDateOnly(report.incident_date)
					? toLocalDateMs(report.incident_date)
					: new Date(report.incident_date).getTime()
			}
			const startMs = startDate ? toLocalDateMs(startDate) : -Infinity
			const endMs = endDate ? toLocalDateMs(endDate) + 86400000 - 1 : Infinity
			matchesDateRange = reportDateMs >= startMs && reportDateMs <= endMs
		}

		return matchesSearch && matchesStatus && matchesCategory && matchesSubcategory && matchesDateRange
	})

	// Sort the filtered incidents
	const sortedIncidents = [...filteredIncidents].sort((a, b) => {
		if (!sortField) return 0

		const aValue = a[sortField]
		const bValue = b[sortField]

		// Handle null/undefined values
		if (aValue === null || aValue === undefined) return sortDirection === "asc" ? 1 : -1
		if (bValue === null || bValue === undefined) return sortDirection === "asc" ? -1 : 1

		// Handle string comparison (except date fields)
		if (typeof aValue === "string" && typeof bValue === "string" && sortField !== "incident_date" && sortField !== "created_at") {
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
			const parseDateTime = (r: Report) => {
				const dateStr = r.incident_date as string
				if (!dateStr) return 0
				if (isIsoDateOnly(dateStr)) {
					let ms = toLocalDateMs(dateStr)
					const t = r.incident_time
					if (t && /^\d{2}:\d{2}/.test(t)) {
						const [hhStr, mmStr] = t.split(":")
						const hh = parseInt(hhStr, 10)
						const mm = parseInt(mmStr, 10)
						if (!Number.isNaN(hh)) ms += hh * 3600000
						if (!Number.isNaN(mm)) ms += mm * 60000
					}
					return ms
				}
				const d = new Date(dateStr).getTime()
				return Number.isNaN(d) ? 0 : d
			}
			const aMs = parseDateTime(a)
			const bMs = parseDateTime(b)
			const comparison = aMs - bMs
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
	const [editedPoliceNotes, setEditedPoliceNotes] = useState<string>("")
	const [saving, setSaving] = useState(false)
	const [updateError, setUpdateError] = useState<string | null>(null)

	const handleSaveStatus = async () => {
		if (!selectedReport) return
		
		const statusChanged = editedStatus !== (selectedReport.status ?? 'pending')
		const policeNotesChanged = editedPoliceNotes !== (selectedReport.police_notes ?? "")
		
		if (!statusChanged && !policeNotesChanged) {
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

		const updateData: any = {}
		if (statusChanged) {
			updateData.status = editedStatus
		}
		if (editedStatus === 'cancelled') {
			updateData.is_archived = true
		}
		if (policeNotesChanged && (editedStatus === 'resolved' || selectedReport.status === 'resolved')) {
			updateData.police_notes = editedPoliceNotes
		}

			const result = await client.updateReport(selectedReport.id, updateData)
			if (result.error) {
				throw new Error(result.error.message || 'Failed to update status')
			}

			// Notify reporter of status change
			if (statusChanged && selectedReport.reporter_id) {
				const statusText = String(editedStatus ?? 'pending').replace('-', ' ')
				await client.notifyUser(
					selectedReport.reporter_id,
					"Report Status Updated",
					`Your report #${selectedReport.id} status has been updated to ${statusText}`
				)
			}

			setIsEditOpen(false)
			setSelectedReport(null)
			setEditedPoliceNotes("")
		} catch (err) {
			console.error("Failed to update status", err)
			setUpdateError(err instanceof Error ? err.message : 'Failed to update status')
		} finally {
			setSaving(false)
		}
	}

	const saveDisabled = saving || !!(selectedReport && editedStatus === ((selectedReport.status ?? 'pending') as ReportStatus) && editedPoliceNotes === (selectedReport.police_notes ?? ""))

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
							<div className="flex flex-col gap-4">
								{/* First Row: Search and Filters */}
								<div className="flex flex-col lg:flex-row gap-2">
									{/* Search */}
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-9"
										/>
									</div>

									{/* Status Filter */}
									<Select value={statusFilter} onValueChange={setStatusFilter}>
										<SelectTrigger className="w-full lg:w-[160px]">
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
										<SelectTrigger className="w-full lg:w-[160px]">
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
										<SelectTrigger className="w-full lg:w-[160px]">
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

								{/* Second Row: Date Range, Archive Toggle, and Export */}
								<div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-end">
									{/* Date Range Filters */}
									<div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1 lg:flex-none">
										<div className="flex items-center gap-1 w-full sm:w-auto">
											<Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
											<Input
												type="date"
												value={startDate}
												onChange={(e) => setStartDate(e.target.value)}
												className="flex-1 sm:w-32"
												placeholder="Start date"
											/>
										</div>
										<span className="text-muted-foreground hidden sm:inline">to</span>
										<Input
											type="date"
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
											className="flex-1 sm:w-32"
											placeholder="End date"
										/>
									</div>

									{/* Archive Toggle */}
									<div className="flex items-center gap-2">
										<Switch checked={includeArchived} onCheckedChange={setIncludeArchived} />
										<span className="text-sm text-muted-foreground">Show archived</span>
									</div>

									{/* Merge Actions */}
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
										<Button
											onClick={openMergeDialog}
											disabled={!canMergeSelectedReports}
											className="w-full sm:w-auto"
										>
											<GitMerge className="mr-2 h-4 w-4" />
											{mergeButtonLabel}
										</Button>
										{mergeSelectionCount > 0 && (
											<div className="flex items-center gap-2">
												<Badge variant="secondary" className="px-3 py-1">
													{mergeSelectionCount}/2 selected
												</Badge>
												<Button
													variant="ghost"
													size="sm"
													onClick={clearMergeSelection}
													className="w-full sm:w-auto"
												>
													Clear
												</Button>
											</div>
										)}
									</div>

									{/* Export Button */}
									<Button
										variant="outline"
										onClick={exportToPDF}
										disabled={isExporting || filteredIncidents.length === 0}
										className="w-full lg:w-auto"
									>
										<Download className="mr-2 h-4 w-4" />
										{isExporting ? "Exporting..." : "Export"}
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
											<TableHead className="w-[60px] text-center">
												Merge
											</TableHead>
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
											const isArchived = isReportArchived(report)
											const isSelected = selectedReportIdsForMerge.has(report.id)
											const rowClass = `${isArchived ? "opacity-60" : ""} ${isSelected ? "bg-muted/40" : ""}`.trim() || undefined
											return (
												<TableRow key={report.id} className={rowClass}>
													<TableCell className="w-[60px]">
														<div className="flex justify-center">
															<Checkbox
																checked={isSelected}
																onCheckedChange={(checked) => toggleMergeSelection(report, checked === true)}
																disabled={isArchived || (!isSelected && mergeSelectionLimitReached)}
																aria-label={`Select report ${report.id} for merging`}
															/>
														</div>
													</TableCell>
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
																setEditedStatus((report.status ?? "pending") as ReportStatus)
																setEditedPoliceNotes(report.police_notes ?? "")
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
				setEditedPoliceNotes("")
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
							{editedStatus === 'resolved' && (
								<div>
									<div className="text-sm text-muted-foreground mb-2">Police Notes</div>
									<Textarea
										value={editedPoliceNotes}
										onChange={(e) => setEditedPoliceNotes(e.target.value)}
										placeholder="Enter police notes for this resolved incident..."
										disabled={saving}
										className="min-h-24"
									/>
								</div>
							)}
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
										setEditedPoliceNotes("")
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
									{saving ? "Saving..." : (selectedReport && editedStatus === (selectedReport.status ?? 'pending') && editedPoliceNotes === (selectedReport.police_notes ?? "") ? 'No Changes' : 'Save')}
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
												className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isAssigned
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

																// Notify reporter of status change to pending
																if (selectedReportForAssignment.reporter_id) {
																	await client.notifyUser(
																		selectedReportForAssignment.reporter_id,
																		"Report Status Updated",
																		`Your report #${selectedReportForAssignment.id} status has been updated to pending`
																	)
																}
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

											// Send notification to officer
											if (!error) {
												await client.notifyUser(
													officerId,
													"New Assignment",
													`You have been assigned to incident #${selectedReportForAssignment.id}`
												)
											}

											console.log(officerId, selectedReportForAssignment.id)

											console.log("Assign to report result:", { data, error })

											if (error) {
												console.error(`Failed to assign officer ${officerId}:`, error)
												hasError = true
											}
										}

										if (!hasError) {
											// Update report status to assigned
											if (selectedReportForAssignment.status !== 'assigned') {
												const { data, error } = await client.updateReport(selectedReportForAssignment.id, { status: 'assigned' })

												console.log("Report status updated to assigned:", selectedReportForAssignment.id, selectedReportForAssignment.incident_title)

												console.log("Update report status result:", { data, error })
											}

											// Notify reporter of assignment
											if (selectedReportForAssignment.reporter_id) {
												await client.notifyUser(
													selectedReportForAssignment.reporter_id,
													"Officers Assigned",
													`Officers have been assigned to your report #${selectedReportForAssignment.id}`
												)
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

			{/* Merge Reports Dialog */}
			<Dialog
				open={isMergeDialogOpen}
				onOpenChange={(open) => {
					if (!open && isMerging) return
					setIsMergeDialogOpen(open)
					if (!open) {
						setMergeError(null)
						setMergePrimaryId(null)
					}
				}}
			>
				<DialogPortal>
					<DialogOverlay />
					<DialogContent className="sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Merge Reports</DialogTitle>
						</DialogHeader>
						{selectedReportsForMerge.length !== 2 ? (
							<div className="text-sm text-muted-foreground">
								Select exactly two reports to merge.
							</div>
						) : (
							<div className="space-y-4">
								<p className="text-sm text-muted-foreground">
									Choose the report to keep. The other report will be archived, its reporter added as a witness, and its attachments copied over.
								</p>
								<div className="grid gap-3 md:grid-cols-2">
									{selectedReportsForMerge.map((report) => {
										const isPrimary = mergePrimaryId === report.id
										const attachmentsCount = Array.isArray(report.attachments) ? report.attachments.length : 0
										return (
											<button
												type="button"
												key={report.id}
												onClick={() => setMergePrimaryId(report.id)}
												className={`rounded-md border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${isPrimary ? "border-primary bg-primary/5 ring-2 ring-primary/40" : "border-border hover:border-primary/60"}`}
											>
												<div className="flex items-center justify-between text-sm font-medium">
													<span>#{String(report.id).slice(-8)}</span>
													<Badge variant={isPrimary ? "success" : "outline"} className="uppercase">
														{isPrimary ? "Main" : "Will Archive"}
													</Badge>
												</div>
												<div className="mt-2 font-semibold">
													{report.incident_title || "Untitled incident"}
												</div>
												{report.street_address && (
													<div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
														<MapPin className="mt-0.5 h-3.5 w-3.5" />
														<span>{report.street_address}</span>
													</div>
												)}
												<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
													<Calendar className="h-3.5 w-3.5" />
													<span>{report.incident_date || "No date"}</span>
													{report.incident_time && <span>{report.incident_time}</span>}
												</div>
												{report.description && (
													<p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
														{report.description}
													</p>
												)}
												<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
													<span>{report.reporter_id ? `Reporter: ${report.reporter_id}` : "Reporter unknown"}</span>
													<span>{attachmentsCount} attachment{attachmentsCount === 1 ? "" : "s"}</span>
												</div>
											</button>
										)
									})}
								</div>
								{mergeError && (
									<div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-600">
										{mergeError}
									</div>
								)}
							</div>
						)}
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									if (isMerging) return
									setIsMergeDialogOpen(false)
									setMergeError(null)
									setMergePrimaryId(null)
								}}
								disabled={isMerging}
							>
								Cancel
							</Button>
							<Button
								onClick={handleConfirmMerge}
								disabled={isMerging || !mergePrimaryId || selectedReportsForMerge.length !== 2}
							>
								{isMerging ? "Merging..." : "Merge Reports"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</DialogPortal>
			</Dialog>

			{/* Witness Statement Dialog */}
			<Dialog open={isWitnessDialogOpen} onOpenChange={(open) => {
				setIsWitnessDialogOpen(open)
				if (!open) {
					setSelectedWitnessForStatement(null)
				}
			}}>
				<DialogPortal>
					<DialogOverlay />
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Witness Statement</DialogTitle>
						</DialogHeader>
						{selectedWitnessForStatement ? (
							<div className="space-y-4">
								<div>
									<div className="text-sm text-muted-foreground mb-1">Witness</div>
									<div className="font-medium">{selectedWitnessForStatement.name}</div>
									<div className="text-sm text-muted-foreground">{selectedWitnessForStatement.email ?? "Email not available"}</div>
								</div>
								<div>
									<div className="text-sm text-muted-foreground mb-1">Statement</div>
									<div className="bg-muted p-3 rounded-lg whitespace-pre-wrap">
										{selectedWitnessForStatement.statement || "No statement provided."}
									</div>
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">No statement available.</div>
						)}
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									setIsWitnessDialogOpen(false)
									setSelectedWitnessForStatement(null)
								}}
							>
								Close
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

								{/* Arrived Date */}
								{selectedReportForDetail.arrived_at && (
									<div className="mt-3">
										<div className="text-sm text-muted-foreground mb-1">Arrived</div>
										<div className="font-medium flex items-center gap-2">
											<Calendar className="h-4 w-4" />
											{(() => {
												try {
													return new Date(selectedReportForDetail.arrived_at).toLocaleString()
												} catch {
													return selectedReportForDetail.arrived_at
												}
											})()}
										</div>
										<div className="text-sm text-muted-foreground mb-1 mt-2">Response Time</div>
										<div className="font-medium">
											{(() => {
												const responseTime = getResponseTime(selectedReportForDetail)
												return responseTime || 'N/A'
											})()}
										</div>
									</div>
								)}

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

								{/* Witness List */}
								{witnessEntries.length > 0 && (
									<div>
										<div className="text-lg font-semibold mb-3">Witnesses ({witnessCountDisplay})</div>
										<div className="space-y-3">
											{witnessEntries.map((witness) => (
												<div key={witness.userId} className="border rounded-lg p-3">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
														<div>
															<div className="font-medium">{witness.name}</div>
															<div className="text-sm text-muted-foreground">{witness.email ?? "Email not available"}</div>
														</div>
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSelectedWitnessForStatement(witness)
																setIsWitnessDialogOpen(true)
															}}
														>
															View Statement
														</Button>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

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
														className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''
															}`}
														onClick={() => {
															if (isDownloading) return
															if (fileType === 'image' || fileType === 'video') {
																openAttachmentViewer(attachment, index, fileType)
															} else {
																handleAttachmentClick(attachment, index)
															}
														}}
													>
														<div className="flex-shrink-0">
															{fileType === 'image' ? (
																thumbnailLoading[index] ? (
																	<div className="h-16 w-24 flex items-center justify-center bg-muted rounded-md">
																		<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
																	</div>
																) : (
																	// eslint-disable-next-line @next/next/no-img-element
																	<img src={thumbnailSignedUrls[index] || attachment} alt={filename} className="h-16 w-24 object-cover rounded-md" />
																)
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
														) : fileType !== 'image' ? (
															<Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
														) : null}
													</div>
												)
											})}
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
												let assignedOfficers;
												
												if (selectedReportForDetail.status === 'resolved' && (selectedReportForDetail.officers_involved?.length ?? 0) > 0) {
													assignedOfficers = officers.filter(officer => 
														selectedReportForDetail.officers_involved?.includes(officer.id)
													);
												} else {
													assignedOfficers = officers.filter(officer => officer.assigned_report_id === selectedReportForDetail.id);
												}
												
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

								{/* Police Notes */}
								{selectedReportForDetail.police_notes && (
									<div>
										<div className="text-lg font-semibold mb-3">Police Notes</div>
										<div className="bg-muted p-3 rounded-lg">
											<div className="whitespace-pre-wrap">{selectedReportForDetail.police_notes}</div>
										</div>
									</div>
								)}
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
											// eslint-disable-next-line @next/next/no-img-element
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
					<p>Are you sure you want to archive &quot;{confirmArchiveReport?.incident_title}&quot;? This action will move the incident to archived status.</p>
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
