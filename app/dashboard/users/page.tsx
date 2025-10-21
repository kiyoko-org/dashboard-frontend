"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
	CheckCircle,
	User,
	Mail,
	Calendar,
	LogOut,
	Copy,
} from "lucide-react"
import { useProfiles, getDispatchClient } from "dispatch-lib"

interface UserData {
	id: string
	name: string
	email: string
	phone: string
	role: string
	status: string
	verified: boolean
	reportsCount: number
	joinedDate: string
	lastActive: string
	fcm_token: string
}

export default function UsersPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [roleFilter, setRoleFilter] = useState("all")

	const { profiles, loading, error } = useProfiles()

	const handleSignOut = async (userId: string) => {
		const client = getDispatchClient()
		const { data, error } = await client.supabaseClient.rpc('signout_user', { user_uuid: userId })
		if (error) {
			console.error("Failed to sign out user:", error)
			alert("Failed to sign out user: " + error.message)
		} else {
			alert("User signed out successfully")
		}
	}

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			alert("Copied to clipboard!")
		} catch (err) {
			console.error("Failed to copy: ", err)
			alert("Failed to copy to clipboard")
		}
	}

	const truncateText = (text: string, maxLength: number = 8) => {
		return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
	}

	const users: UserData[] = (profiles ?? []).map((p) => {
		const fullName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")
		const email = p.email ?? ""
		return {
			id: p.id,
			name: fullName || p.id,
			email,
			phone: "", // not present on profiles by default
			role: "citizen", // default; extend db if you have role
			status: "active",
			verified: false,
			reportsCount: p.reports_count || 0,
			joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
			lastActive: p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleString() : "",
			fcm_token: p.fcm_token || "",
		}
	})

	const getRoleBadge = (role: string) => {
		const variants: Record<string, { variant: "default" | "success" | "warning" | "destructive", label: string }> = {
			citizen: { variant: "default", label: "Citizen" },
			verified_citizen: { variant: "success", label: "Verified Citizen" },
			moderator: { variant: "warning", label: "Moderator" },
			admin: { variant: "destructive", label: "Admin" },
		}
		const config = variants[role] || variants.citizen
		return <Badge variant={config.variant}>{config.label}</Badge>
	}



	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.phone.includes(searchQuery)

		const matchesRole = roleFilter === "all" || user.role === roleFilter

		return matchesSearch && matchesRole
	})

	const stats = {
		total: users.length,
		verified: users.filter((u) => u.verified).length,
	}

	return (
		<div className="flex flex-col">
			<Header title="User Management" />

			<div className="flex-1 space-y-6 p-6">
				{/* Stats Cards */}
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Verified Users
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-blue-600">
								{stats.verified}
							</div>
						</CardContent>
					</Card>
				</div>

				{loading && <div className="p-4 text-sm text-muted-foreground">Loading users…</div>}
				{error && <div className="p-4 text-sm text-red-500">Failed to load users: {String(error)}</div>}

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

								{/* Role Filter */}
								<Select
									value={roleFilter}
									onValueChange={setRoleFilter}
								>
								</Select>


							</div>

							{/* Export Button */}
							<Button variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Export
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<CardTitle>Users ({filteredUsers.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Reports</TableHead>
									<TableHead>Joined</TableHead>
									<TableHead>Last Active</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
													<User className="h-5 w-5 text-slate-600" />
												</div>
												<div>
													<div className="flex items-center gap-2">
														<span className="font-medium">{user.name}</span>
														{user.verified && (
															<CheckCircle className="h-4 w-4 text-blue-500" />
														)}
													</div>
													<div className="text-xs text-muted-foreground flex items-center gap-1">
													ID: {truncateText(user.id)}
													 <button
													  onClick={() => copyToClipboard(user.id)}
													 className="text-muted-foreground hover:text-foreground"
													 >
													<Copy className="h-3 w-3" />
												</button>
											</div>
											<div className="text-xs text-muted-foreground flex items-center gap-1">
												FCM: {truncateText(user.fcm_token)}
												<button
													onClick={() => copyToClipboard(user.fcm_token)}
													className="text-muted-foreground hover:text-foreground"
												>
													<Copy className="h-3 w-3" />
												</button>
											</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												<div className="flex items-center gap-1 text-sm">
													<Mail className="h-3 w-3 text-muted-foreground" />
													{user.email}
												</div>
											</div>
										</TableCell>
										<TableCell>{getRoleBadge(user.role)}</TableCell>
										<TableCell>
											<span className="font-medium">{user.reportsCount}</span>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-sm">
												<Calendar className="h-3 w-3 text-muted-foreground" />
												{user.joinedDate}
											</div>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{user.lastActive}
										</TableCell>
										<TableCell>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleSignOut(user.id)}
											>
												<LogOut className="mr-2 h-4 w-4" />
												Sign Out
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

