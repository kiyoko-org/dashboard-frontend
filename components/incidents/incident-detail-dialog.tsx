import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, MapPin, Music, Video, FileText, File, ImageIcon, Download } from "lucide-react"
import type { Database } from "dispatch-lib/database.types"

type Report = Database["public"]["Tables"]["reports"]["Row"]
type Officer = Database["public"]["Tables"]["officers"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

export type WitnessDisplay = {
    userId: string
    name: string
    email: string | null
    statement: string | null
}

interface IncidentDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: Report | null
    witnesses: WitnessDisplay[]
    witnessCount: string
    onViewWitnessStatement: (witness: WitnessDisplay) => void
    officers: Officer[]
    officersLoading: boolean
    categories: Category[] | null
    onAttachmentClick: (attachment: string, index: number, fileType: string) => void
    downloadingAttachments: Set<number>
    downloadProgress: Map<number, number>
    thumbnailSignedUrls: Record<number, string>
    thumbnailLoading: Record<number, boolean>
}

export function IncidentDetailDialog({
    open,
    onOpenChange,
    report,
    witnesses,
    witnessCount,
    onViewWitnessStatement,
    officers,
    officersLoading,
    categories,
    onAttachmentClick,
    downloadingAttachments,
    downloadProgress,
    thumbnailSignedUrls,
    thumbnailLoading
}: IncidentDetailDialogProps) {

    // Helper functions
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

    const getCategoryName = (categoryId?: number | null) => {
        if (categoryId === null || categoryId === undefined) return "Not Defined"
        if (!categories) return "Unknown Category"
        const category = categories.find(cat => cat.id === categoryId)
        return category?.name || "Unknown Category"
    }

    const getSubcategoryName = (categoryId?: number | null, subcategoryIndex?: number | null) => {
        if (!categoryId || subcategoryIndex === null || subcategoryIndex === undefined || !categories) return "Unknown Subcategory"
        const category = categories.find(cat => cat.id === categoryId)
        if (!category?.sub_categories || subcategoryIndex >= category.sub_categories.length) return "Unknown Subcategory"
        return category.sub_categories[subcategoryIndex] || "Unknown Subcategory"
    }

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay className="bg-gray-900/20 backdrop-blur-sm" />
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 gap-0">
                    <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl">Report Details</DialogTitle>
                            {report && getStatusBadge(report.status)}
                        </div>
                        {report && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-foreground">#{String(report.id).slice(-8)}</span>
                                </div>
                                <div className="hidden sm:block text-border">•</div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Reported: {new Date(report.created_at).toLocaleString()}</span>
                                </div>
                                {report.is_archived && (
                                    <>
                                        <div className="hidden sm:block text-border">•</div>
                                        <Badge variant="outline" className="text-xs h-5">Archived</Badge>
                                    </>
                                )}
                            </div>
                        )}
                    </DialogHeader>

                    {report && (
                        <div className="p-6 space-y-8">
                            {/* Main Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    {/* Incident Section */}
                                    <section>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                                                <div className="font-medium text-lg mt-0.5">{report.incident_title}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span>{report.incident_date}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</label>
                                                    <div className="mt-1">{report.incident_time || 'Not specified'}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                                                <div className="mt-1 flex flex-wrap gap-2">
                                                    <Badge variant="secondary" className="px-2 py-0.5 text-sm font-normal">
                                                        {getCategoryName(report.category_id)}
                                                    </Badge>
                                                    {report.sub_category !== null && (
                                                        <Badge variant="outline" className="px-2 py-0.5 text-sm font-normal text-muted-foreground">
                                                            {getSubcategoryName(report.category_id, report.sub_category)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Location Section */}
                                    <section>
                                        <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-foreground">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            Location
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="bg-muted/30 p-3 rounded-lg border">
                                                <div className="font-medium">{report.street_address || 'Not specified'}</div>
                                                {report.nearby_landmark && (
                                                    <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                                                        <span className="shrink-0">Near:</span>
                                                        <span>{report.nearby_landmark}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {(report.latitude || report.longitude) && (
                                                <div className="text-xs font-mono text-muted-foreground flex items-center gap-3 px-1">
                                                    <span>LAT: {report.latitude}</span>
                                                    <span>LONG: {report.longitude}</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    {/* Description Section */}
                                    <section>
                                        <h3 className="text-base font-semibold mb-4 text-foreground">Description</h3>
                                        <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border min-h-[120px]">
                                            {report.what_happened || "No description provided."}
                                        </div>
                                    </section>

                                    {/* Response Metrics */}
                                    {report.arrived_at && (
                                        <section className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                Response Metrics
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-blue-600/80 dark:text-blue-300/80 mb-1">Arrived At</div>
                                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                                        {new Date(report.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-blue-600/80 dark:text-blue-300/80 mb-1">Response Time</div>
                                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                                        {getResponseTime(report) || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>



                            {/* Witnesses Section */}
                            {witnesses.length > 0 && (
                                <>
                                    <div className="h-px bg-border" />
                                    <section>
                                        <h3 className="text-base font-semibold mb-4 text-foreground">Witnesses ({witnessCount})</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {witnesses.map((witness) => (
                                                <div key={witness.userId} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group">
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">{witness.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{witness.email || "No email"}</div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onViewWitnessStatement(witness)}>
                                                        Statement
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* Attachments Section */}
                            {report.attachments && report.attachments.length > 0 && (
                                <>
                                    <div className="h-px bg-border" />
                                    <section>
                                        <h3 className="text-base font-semibold mb-4 text-foreground">Evidence & Attachments</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {report.attachments.map((attachment, index) => {
                                                const fileType = getFileType(attachment)
                                                const IconComponent = getFileIcon(fileType)
                                                const filename = attachment.split('/').pop() || `attachment-${index + 1}`
                                                const isDownloading = downloadingAttachments.has(index)
                                                const progress = downloadProgress.get(index) || 0

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`group relative flex flex-col gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all hover:shadow-sm ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        onClick={() => {
                                                            if (isDownloading) return
                                                            onAttachmentClick(attachment, index, fileType)
                                                        }}
                                                    >
                                                        <div className="aspect-video w-full bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                                                            {fileType === 'image' ? (
                                                                thumbnailLoading[index] ? (
                                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                                                ) : (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={thumbnailSignedUrls[index] || attachment} alt={filename} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                                )
                                                            ) : (
                                                                <IconComponent className="h-8 w-8 text-muted-foreground" />
                                                            )}
                                                            {/* Hover Overlay */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                {isDownloading ? (
                                                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                ) : (
                                                                    <Download className="h-6 w-6 text-white drop-shadow-md" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-xs font-medium truncate" title={filename}>
                                                                {filename}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                {fileType}
                                                            </div>
                                                        </div>
                                                        {isDownloading && progress > 0 && (
                                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
                                                                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* Official Use Section */}
                            <div className="bg-muted/30 -mx-6 -mb-6 p-6 border-t mt-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-border" />
                                    Official Use Only
                                    <div className="h-px flex-1 bg-border" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-medium mb-3 text-foreground">Assigned Officers</h4>
                                        <div className="bg-background border rounded-lg divide-y">
                                            {officersLoading ? (
                                                <div className="p-4 text-sm text-muted-foreground text-center">Loading officers...</div>
                                            ) : (
                                                (() => {
                                                    let assignedOfficers;
                                                    if (report.status === 'resolved' && (report.officers_involved?.length ?? 0) > 0) {
                                                        assignedOfficers = officers.filter(officer =>
                                                            report.officers_involved?.includes(officer.id)
                                                        );
                                                    } else {
                                                        assignedOfficers = officers.filter(officer => officer.assigned_report_id === report.id);
                                                    }

                                                    if (assignedOfficers.length === 0) {
                                                        return <div className="p-4 text-sm text-muted-foreground text-center">No officers assigned</div>
                                                    }
                                                    return assignedOfficers.map(officer => (
                                                        <div key={officer.id} className="flex items-center gap-3 p-3">
                                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                                {officer.first_name[0]}{officer.last_name[0]}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium">
                                                                    {officer.first_name} {officer.middle_name} {officer.last_name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {officer.rank} • Badge #{officer.badge_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                })()
                                            )}
                                        </div>
                                    </div>
                                    {report.police_notes && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-3 text-foreground">Police Notes</h4>
                                            <div className="bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-lg text-sm whitespace-pre-wrap text-foreground/90">
                                                {report.police_notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="p-4 border-t bg-background sticky bottom-0 z-10">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
