import { NextResponse } from "next/server"
import { NO_STORE_HEADERS, requireDashboardAdmin } from "@/lib/server/auth"

export const dynamic = "force-dynamic"

type UpdateTrustScoreRequest = {
	userId: string
	trustScore: number
}

function createErrorResponse(status: number, message: string) {
	return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
}

function isUpdateTrustScoreRequest(value: unknown): value is UpdateTrustScoreRequest {
	if (!value || typeof value !== "object") return false

	const candidate = value as Record<string, unknown>
	return (
		typeof candidate.userId === "string" &&
		candidate.userId.length > 0 &&
		typeof candidate.trustScore === "number" &&
		Number.isFinite(candidate.trustScore)
	)
}

export async function GET(request: Request) {
	const authResult = await requireDashboardAdmin(request)
	if ("response" in authResult) {
		return authResult.response
	}

	try {
		const { data, error } = await authResult.serviceClient.rpc("get_profiles_with_emails")
		if (error) {
			console.error("Profiles API error:", error)
			return createErrorResponse(500, error.message)
		}

		return NextResponse.json(data ?? [], { headers: NO_STORE_HEADERS })
	} catch (error) {
		console.error("Profiles API exception:", error)
		const message = error instanceof Error ? error.message : "Failed to fetch profiles"
		return createErrorResponse(500, message)
	}
}

export async function PATCH(request: Request) {
	const authResult = await requireDashboardAdmin(request)
	if ("response" in authResult) {
		return authResult.response
	}

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return createErrorResponse(400, "Invalid JSON body")
	}

	if (!isUpdateTrustScoreRequest(body)) {
		return createErrorResponse(400, "Missing userId or trustScore")
	}

	const validatedTrustScore = Math.max(0, Math.min(3, Math.round(body.trustScore)))

	try {
		const { data, error } = await authResult.serviceClient
			.from("profiles")
			.update({
				trust_score: validatedTrustScore,
				updated_at: new Date().toISOString(),
			})
			.eq("id", body.userId)
			.select()
			.maybeSingle()

		if (error) {
			console.error("Update Trust Score error:", error)
			return createErrorResponse(500, error.message)
		}

		if (!data) {
			return createErrorResponse(404, "Profile not found")
		}

		return NextResponse.json(data, { headers: NO_STORE_HEADERS })
	} catch (error) {
		console.error("Update Trust Score exception:", error)
		const message = error instanceof Error ? error.message : "Failed to update trust score"
		return createErrorResponse(500, message)
	}
}
