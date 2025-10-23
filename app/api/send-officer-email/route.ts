import { sendMail } from "@/lib/mail"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
	try {
		const { email, firstName, lastName, badgeNumber, rank, password } = await request.json()

		const emailBody = `Dear ${firstName} ${lastName},\n\nYour officer account has been created successfully.\n\nAccount Details:\nBadge Number: ${badgeNumber}\nRank: ${rank}\nPassword: ${password}\n\nPlease login with your email and password to access the dispatch system.\n\nBest regards,\nDispatch System`

		await sendMail(
			email,
			"Officer Account Created",
			emailBody
		)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error sending email:", error)
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500 }
		)
	}
}
