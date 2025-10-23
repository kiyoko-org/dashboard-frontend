import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.GMAIL_USER,
		pass: process.env.GMAIL_PASS,
	},
});

export async function sendMail(email: string, subject: string, body: string) {
	const info = await transporter.sendMail({
		from: `"kiyoko-org@dispatch" <${process.env.GMAIL_USER}>`,
		to: email,
		subject,
		text: body,
	});

	console.log("Message sent:", info.messageId);
	return info;
}
