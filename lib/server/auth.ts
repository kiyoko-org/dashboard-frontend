import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "dispatch-lib/database.types"
import {
	createAnonServerSupabaseClient,
	createServiceRoleServerSupabaseClient,
} from "@/lib/server/supabase"

export const NO_STORE_HEADERS = {
	"Cache-Control": "no-store",
}

type AdminRouteContext = {
	userId: string
	serviceClient: SupabaseClient<Database>
}

type AdminRouteAuthResult = AdminRouteContext | { response: NextResponse }

const DASHBOARD_ALLOWED_ROLES = new Set<Database["public"]["Tables"]["profiles"]["Row"]["role"]>([
	"admin",
])

function createErrorResponse(status: number, message: string) {
	return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
}

function getBearerToken(request: Request): string | null {
	const authorizationHeader = request.headers.get("authorization")
	if (!authorizationHeader) return null

	const match = authorizationHeader.match(/^Bearer\s+(.+)$/i)
	if (!match?.[1]) return null

	const accessToken = match[1].trim()
	return accessToken.length > 0 ? accessToken : null
}

export async function requireDashboardAdmin(request: Request): Promise<AdminRouteAuthResult> {
	const accessToken = getBearerToken(request)
	if (!accessToken) {
		return { response: createErrorResponse(401, "Unauthorized") }
	}

	const authClient = createAnonServerSupabaseClient()
	const {
		data: { user },
		error: userError,
	} = await authClient.auth.getUser(accessToken)

	if (userError || !user) {
		return { response: createErrorResponse(401, "Unauthorized") }
	}

	const serviceClient = createServiceRoleServerSupabaseClient()
	const { data: profile, error: profileError } = await serviceClient
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.maybeSingle()

	if (profileError) {
		console.error("Admin profile lookup error:", profileError)
		return { response: createErrorResponse(500, profileError.message) }
	}

	if (!profile || !DASHBOARD_ALLOWED_ROLES.has(profile.role)) {
		return { response: createErrorResponse(403, "Forbidden") }
	}

	return {
		userId: user.id,
		serviceClient,
	}
}
