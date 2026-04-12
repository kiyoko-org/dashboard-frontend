import { NextResponse } from "next/server"
import { z } from "zod"
import { NO_STORE_HEADERS, requireDashboardAdmin } from "@/lib/server/auth"

export const dynamic = "force-dynamic"

const createOfficerRequestSchema = z.object({
	email: z.string().trim().email("Invalid email address").max(254),
	password: z.string().min(1, "Password is required"),
	badge_number: z.string().regex(/^\d{6}$/, "Badge number must be exactly 6 digits"),
	rank: z.string().min(1, "Rank is required"),
	first_name: z.string().trim().min(2).max(20),
	middle_name: z.string().trim().max(20),
	last_name: z.string().trim().min(2).max(20),
})

function createErrorResponse(status: number, message: string) {
	return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
}

export async function POST(request: Request) {
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

	const parsedBody = createOfficerRequestSchema.safeParse(body)
	if (!parsedBody.success) {
		return createErrorResponse(400, parsedBody.error.issues[0]?.message ?? "Invalid officer payload")
	}

	const payload = parsedBody.data
	const { serviceClient } = authResult

	try {
		const createUserResult = await serviceClient.auth.admin.createUser({
			email: payload.email,
			password: payload.password,
			user_metadata: {
				first_name: payload.first_name,
				middle_name: payload.middle_name,
				last_name: payload.last_name,
				rank: payload.rank,
				badge_number: payload.badge_number,
				role: "officer",
			},
			email_confirm: true,
		})

		if (createUserResult.error) {
			console.error("Create officer auth user error:", createUserResult.error)
			return createErrorResponse(500, createUserResult.error.message)
		}

		const createdUserId = createUserResult.data.user?.id
		if (!createdUserId) {
			return createErrorResponse(500, "Officer account was created without a user id")
		}

		const insertOfficerResult = await serviceClient
			.from("officers")
			.insert({
				id: createdUserId,
				badge_number: payload.badge_number,
				rank: payload.rank,
				first_name: payload.first_name,
				middle_name: payload.middle_name,
				last_name: payload.last_name,
				role: "officer",
			})
			.select()
			.maybeSingle()

		if (insertOfficerResult.error) {
			console.error("Insert officer row error:", insertOfficerResult.error)
			await serviceClient.auth.admin.deleteUser(createdUserId)
			return createErrorResponse(500, insertOfficerResult.error.message)
		}

		return NextResponse.json(
			{
				success: true,
				userId: createdUserId,
				officer: insertOfficerResult.data,
			},
			{ headers: NO_STORE_HEADERS },
		)
	} catch (error) {
		console.error("Create officer API exception:", error)
		const message = error instanceof Error ? error.message : "Failed to create officer"
		return createErrorResponse(500, message)
	}
}
