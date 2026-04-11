export type IncidentSummarySource = {
	what_happened?: string | null
	description?: string | null
	brief_description?: string | null
}

type IncidentSummaryOptions = {
	fallback?: string
	maxLength?: number
	collapseWhitespace?: boolean
}

const DEFAULT_INCIDENT_SUMMARY_FALLBACK = "No description provided"

const normalizeSummaryCandidate = (
	value: string | null | undefined,
	collapseWhitespace: boolean,
): string | null => {
	if (typeof value !== "string") return null

	const trimmed = value.trim()
	if (!trimmed) return null
	if (!collapseWhitespace) return trimmed

	return trimmed.replace(/\s+/g, " ")
}

const truncateWithEllipsis = (value: string, maxLength: number): string => {
	if (maxLength <= 0) return ""
	if (value.length <= maxLength) return value
	if (maxLength === 1) return "…"

	return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export const getIncidentSummary = (
	source: IncidentSummarySource | null | undefined,
	options: IncidentSummaryOptions = {},
): string => {
	const fallback = options.fallback?.trim() || DEFAULT_INCIDENT_SUMMARY_FALLBACK
	const collapseWhitespace = options.collapseWhitespace ?? false

	const summary =
		normalizeSummaryCandidate(source?.what_happened, collapseWhitespace) ??
		normalizeSummaryCandidate(source?.description, collapseWhitespace) ??
		normalizeSummaryCandidate(source?.brief_description, collapseWhitespace) ??
		fallback

	if (!Number.isFinite(options.maxLength)) return summary

	return truncateWithEllipsis(summary, Math.floor(options.maxLength ?? summary.length))
}
