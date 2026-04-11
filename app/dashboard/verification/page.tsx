"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { getDispatchClient } from "dispatch-lib"
import type { Database } from "dispatch-lib/database.types"
import { useAdminProfilesWithEmails } from "@/hooks/useAdminProfilesWithEmails"
import { useVerificationRequests } from "@/hooks/useVerificationRequests"

type VerificationRequestRow = Database["public"]["Tables"]["verification_requests"]["Row"]
type VerificationRequestStatus = Database["public"]["Enums"]["verification_request_status"]
type VerificationDocumentType = Database["public"]["Enums"]["verification_document_type"]

type StatusFilter = VerificationRequestStatus | "all"
type DocumentTypeFilter = VerificationDocumentType | "all"

const REJECTION_NOTE_TEMPLATES = [
  "Photo is blurry",
  "ID details are unreadable",
  "Front image is missing",
  "Back image is missing",
  "Document does not match submission requirements",
  "Please resubmit a clearer image",
]

export default function VerificationPage() {
  const dispatchClient = getDispatchClient()
  const { requests, loading, error, refresh } = useVerificationRequests()
  const {
    profilesById,
    loading: profilesLoading,
    error: profilesError,
    refresh: refreshProfiles,
  } = useAdminProfilesWithEmails()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentTypeFilter>("all")
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestRow | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null)
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null)

  const counts = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === "pending").length,
      approved: requests.filter((request) => request.status === "approved").length,
      rejected: requests.filter((request) => request.status === "rejected").length,
    }
  }, [requests])

  const filteredRequests = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false
      if (documentTypeFilter !== "all" && request.document_type !== documentTypeFilter) return false
      if (!search) return true

      const profile = profilesById.get(request.profile_id)
      const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const email = (profile?.email ?? "").toLowerCase()
      const profileId = request.profile_id.toLowerCase()

      return (
        fullName.includes(search) ||
        email.includes(search) ||
        profileId.includes(search)
      )
    })
  }, [documentTypeFilter, profilesById, requests, searchQuery, statusFilter])

  useEffect(() => {
    if (!reviewDialogOpen || !selectedRequest) {
      setFrontPreviewUrl(null)
      setBackPreviewUrl(null)
      setPreviewError(null)
      return
    }

    let cancelled = false

    const loadPreviews = async () => {
      setPreviewLoading(true)
      setPreviewError(null)

      try {
        const frontResult = await dispatchClient.getVerificationDocumentSignedUrl(
          selectedRequest.front_storage_path,
          60 * 10,
        )

        if (frontResult.error) {
          throw new Error(frontResult.error.message)
        }

        if (!cancelled) {
          setFrontPreviewUrl(frontResult.data?.signedUrl ?? null)
        }

        if (!selectedRequest.back_storage_path) {
          if (!cancelled) {
            setBackPreviewUrl(null)
          }
          return
        }

        const backResult = await dispatchClient.getVerificationDocumentSignedUrl(
          selectedRequest.back_storage_path,
          60 * 10,
        )

        if (backResult.error) {
          throw new Error(backResult.error.message)
        }

        if (!cancelled) {
          setBackPreviewUrl(backResult.data?.signedUrl ?? null)
        }
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Failed to load previews"
        setPreviewError(message)
      } finally {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      }
    }

    void loadPreviews()

    return () => {
      cancelled = true
    }
  }, [dispatchClient, reviewDialogOpen, selectedRequest])

  const pageError = error ?? profilesError
  const pageLoading = loading || profilesLoading

  const openReviewDialog = (request: VerificationRequestRow) => {
    setSelectedRequest(request)
    setReviewNotes(request.review_notes ?? "")
    setReviewDialogOpen(true)
  }

  const closeReviewDialog = () => {
    if (isSubmittingReview) return
    setReviewDialogOpen(false)
    setSelectedRequest(null)
    setReviewNotes("")
    setFrontPreviewUrl(null)
    setBackPreviewUrl(null)
    setPreviewError(null)
  }

  const handleReview = async (decision: "approved" | "rejected") => {
    if (!selectedRequest) return
    if (selectedRequest.status !== "pending") return

    setIsSubmittingReview(true)

    try {
      const notes = reviewNotes.trim()
      const { error: reviewError } = await dispatchClient.reviewVerificationRequest(
        selectedRequest.id,
        decision,
        notes.length > 0 ? notes : null,
      )

      if (reviewError) {
        throw new Error(reviewError.message)
      }

      await Promise.all([refresh(), refreshProfiles()])
      closeReviewDialog()
      window.alert(
        decision === "approved"
          ? "Verification request approved successfully."
          : "Verification request rejected successfully.",
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to review request"
      window.alert(message)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const selectedProfile = selectedRequest ? profilesById.get(selectedRequest.profile_id) : null

  return (
    <>
      <Header title="Manual Verification" />

      <main className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manual Verification</h1>
          <p className="text-muted-foreground">
            Review user-submitted identity documents. Pending requests are shown by default.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Requests" value={counts.total} icon={<ShieldCheck className="h-4 w-4 text-blue-600" />} />
          <SummaryCard title="Pending" value={counts.pending} icon={<Clock3 className="h-4 w-4 text-yellow-600" />} />
          <SummaryCard title="Approved" value={counts.approved} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
          <SummaryCard title="Rejected" value={counts.rejected} icon={<XCircle className="h-4 w-4 text-red-600" />} />
        </div>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Verification Requests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Default filter is pending. Switch filters to inspect review history.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => void refresh()} disabled={pageLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, or profile ID"
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={documentTypeFilter}
                onValueChange={(value) => setDocumentTypeFilter(value as DocumentTypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All document types</SelectItem>
                  <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="postal_id">Postal ID</SelectItem>
                  <SelectItem value="umid">UMID</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pageError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {pageError}
              </div>
            ) : null}

            {pageLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading verification requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">No verification requests found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing filters or refresh the list.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const profile = profilesById.get(request.profile_id)
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="font-medium">{formatProfileName(profile, request.profile_id)}</div>
                            <div className="text-xs text-muted-foreground">{shortId(request.profile_id)}</div>
                          </TableCell>
                          <TableCell>{profile?.email ?? "—"}</TableCell>
                          <TableCell>{formatDocumentType(request.document_type)}</TableCell>
                          <TableCell>{formatDateTime(request.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.reviewed_at ? formatDateTime(request.reviewed_at) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openReviewDialog(request)}>
                              {request.status === "pending" ? "Review" : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={reviewDialogOpen} onOpenChange={(open) => (open ? undefined : closeReviewDialog())}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Verification Request Review</DialogTitle>
            <DialogDescription>
              Review submitted identity documents and decide whether to approve or reject the request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Requester</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {formatProfileName(selectedProfile, selectedRequest.profile_id)}</div>
                    <div><span className="font-medium">Email:</span> {selectedProfile?.email ?? "—"}</div>
                    <div><span className="font-medium">Profile ID:</span> {selectedRequest.profile_id}</div>
                    <div><span className="font-medium">Document:</span> {formatDocumentType(selectedRequest.document_type)}</div>
                    <div><span className="font-medium">Submitted:</span> {formatDateTime(selectedRequest.created_at)}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <PreviewCard
                    title="Front document"
                    signedUrl={frontPreviewUrl}
                    storagePath={selectedRequest.front_storage_path}
                    loading={previewLoading}
                    error={previewError}
                  />
                  <PreviewCard
                    title="Back document"
                    signedUrl={backPreviewUrl}
                    storagePath={selectedRequest.back_storage_path}
                    loading={previewLoading}
                    error={previewError}
                    emptyMessage="No back file provided"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Review Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      placeholder="Optional review notes"
                      rows={8}
                    />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Templates</p>
                      <div className="flex flex-wrap gap-2">
                        {REJECTION_NOTE_TEMPLATES.map((template) => (
                          <button
                            key={template}
                            type="button"
                            onClick={() => setReviewNotes(template)}
                            className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted"
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedRequest.status !== "pending" ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        This request has already been reviewed. Actions are disabled.
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button variant="outline" onClick={closeReviewDialog} disabled={isSubmittingReview}>
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => void handleReview("rejected")}
                        disabled={isSubmittingReview || selectedRequest.status !== "pending"}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => void handleReview("approved")}
                        disabled={isSubmittingReview || selectedRequest.status !== "pending"}
                      >
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function PreviewCard({
  title,
  signedUrl,
  storagePath,
  loading,
  error,
  emptyMessage = "No file provided",
}: {
  title: string
  signedUrl: string | null
  storagePath: string | null
  loading: boolean
  error: string | null
  emptyMessage?: string
}) {
  const isPdf = storagePath ? storagePath.toLowerCase().endsWith(".pdf") : false

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {signedUrl ? (
          <Button variant="outline" size="sm" onClick={() => window.open(signedUrl, "_blank", "noopener,noreferrer")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {!storagePath ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : loading ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Loading preview...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : isPdf ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            PDF preview fallback: open the file in a new tab.
          </div>
        ) : signedUrl ? (
          <div className="overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signedUrl} alt={title} className="h-[320px] w-full object-contain bg-white" />
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Preview unavailable.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatProfileName(
  profile:
    | {
        first_name: string | null
        middle_name: string | null
        last_name: string | null
      }
    | null
    | undefined,
  fallbackId: string,
) {
  const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")

  return fullName || fallbackId
}

function formatDocumentType(documentType: VerificationDocumentType) {
  switch (documentType) {
    case "drivers_license":
      return "Driver's License"
    case "postal_id":
      return "Postal ID"
    case "passport":
      return "Passport"
    case "umid":
      return "UMID"
    default:
      return "Other"
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString()
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}...` : id
}

function getStatusBadge(status: VerificationRequestStatus) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Approved</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="warning">Pending</Badge>
  }
}
