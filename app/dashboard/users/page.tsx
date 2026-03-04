"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Search,
	CheckCircle,
	User,
	Mail,
	Calendar,
	LogOut,
	Copy,
	Shield,
	ShieldAlert,
	ShieldCheck,
	TrendingUp,
} from "lucide-react"
import { useTrustScores, getDispatchClient } from "dispatch-lib"

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
	trust_score: number
	trust_factors?: any
}

export default function UsersPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [roleFilter, setRoleFilter] = useState("all")
	const [trustFilter, setTrustFilter] = useState("all")
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
	const [userToLogout, setUserToLogout] = useState<UserData | null>(null)
	const [signingOutUserId, setSigningOutUserId] = useState<string | null>(null)

	const [editTrustOpen, setEditOpen] = useState(false)
	const [editingUser, setEditingUser] = useState<UserData | null>(null)
	const [newTrustScore, setNewTrustScore] = useState<number>(3)
	const [isUpdatingTrust, setIsUpdatingTrust] = useState(false)

	const { users: profiles, loading, error, updateScore } = useTrustScores()

	const handleUpdateTrust = async () => {
		if (!editingUser) return
		setIsUpdatingTrust(true)
		try {
			await updateScore(editingUser.id, newTrustScore)
			setEditOpen(false)
			setEditingUser(null)
		} catch (err) {
			alert("Failed to update trust score")
		} finally {
			setIsUpdatingTrust(false)
		}
	}

	const openTrustDialog = (user: UserData) => {
		setEditingUser(user)
		setNewTrustScore(user.trust_score)
		setEditOpen(true)
	}

	const handleSignOut = async () => {
		if (!userToLogout) return

		setSigningOutUserId(userToLogout.id)
		try {
			const client = getDispatchClient()
			const { data, error } = await client.supabaseClient.rpc('signout_user', { user_uuid: userToLogout.id })
			if (error) {
				console.error("Failed to sign out user:", error)
				alert("Failed to sign out user: " + error.message)
			} else {
				alert("User signed out successfully")
			}
		} finally {
			setSigningOutUserId(null)
			setLogoutDialogOpen(false)
			setUserToLogout(null)
		}
	}

	const openLogoutDialog = (user: UserData) => {
		setUserToLogout(user)
		setLogoutDialogOpen(true)
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

	const users: UserData[] = (profiles as any[] ?? []).map((p) => {
		const fullName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")
		const email = p.email ?? ""
		return {
			id: p.id,
			name: fullName || p.id,
			email,
			phone: "", // not present on profiles by default
			role: p.role || "citizen",
			status: "active",
			verified: false,
			reportsCount: p.reports_count || 0,
			joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
			lastActive: p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleString() : "",
			fcm_token: p.fcm_token || "",
			trust_score: p.trust_score ?? 3,
			trust_factors: p.trust_factors,
		}
	})

	const getTrustBadge = (score: number) => {
		const levels = ['Untrusted', 'Low Trust', 'Trusted', 'Highly Trusted']
		const variants: ("destructive" | "warning" | "default" | "success")[] = ['destructive', 'warning', 'default', 'success']
		const icons = [ShieldAlert, Shield, ShieldCheck, ShieldCheck]
		const Icon = icons[score] || Shield

		return (
			<Badge variant={variants[score] || 'default'} className="flex items-center gap-1">
				<Icon className="h-3 w-3" />
				{levels[score] || 'Unknown'}
			</Badge>
		)
	}

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
		const matchesTrust = trustFilter === "all" || user.trust_score.toString() === trustFilter

		return matchesSearch && matchesRole && matchesTrust
	})

	const stats = {
		total: users.length,
		verified: users.filter((u) => u.verified).length,
		highlyTrusted: users.filter((u) => u.trust_score === 3).length,
	}

	return (
		<div className="flex flex-col">
			<Header title="User Management" />

			{/* Trust Score Edit Dialog */}
			<Dialog open={editTrustOpen} onOpenChange={(open) => {
				setEditOpen(open)
				if (!open) setEditingUser(null)
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit Trust Score</DialogTitle>
						<DialogDescription>
							Manually adjust the trust level for {editingUser?.name}.
						</DialogDescription>
					</DialogHeader>

					{editingUser && (
						<div className="py-6 space-y-6">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Select Trust Level</label>
								<div className="grid grid-cols-2 gap-2">
									{[0, 1, 2, 3].map((score) => (
										<Button
											key={score}
											variant={newTrustScore === score ? "default" : "outline"}
											onClick={() => setNewTrustScore(score)}
											className="justify-start gap-2"
										>
											{getTrustBadge(score)}
										</Button>
									))}
								</div>
							</div>

							{editingUser.trust_factors && (
								<div className="bg-slate-50 p-4 rounded-lg space-y-2">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<TrendingUp className="h-4 w-4" />
										Trust Factors
									</h4>
									<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
										<div className="text-slate-500">Total Reports:</div>
										<div className="font-medium">{editingUser.trust_factors.total_reports || 0}</div>
										<div className="text-slate-500">Verified:</div>
										<div className="font-medium text-green-600">{editingUser.trust_factors.verified_reports || 0}</div>
										<div className="text-slate-500">False Reports:</div>
										<div className="font-medium text-red-600">{editingUser.trust_factors.false_reports || 0}</div>
										<div className="text-slate-500">Avg Response:</div>
										<div className="font-medium">
											{editingUser.trust_factors.avg_response_time_minutes ? `${editingUser.trust_factors.avg_response_time_minutes}m` : 'N/A'}
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setEditOpen(false)}
							disabled={isUpdatingTrust}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateTrust}
							disabled={isUpdatingTrust}
						>
							{isUpdatingTrust ? "Updating..." : "Save Changes"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={logoutDialogOpen} onOpenChange={(open) => {
				setLogoutDialogOpen(open)
				if (!open) {
					setUserToLogout(null)
				}
			}}>
				<DialogContent className="sm:max-w-md">
					{signingOutUserId === userToLogout?.id && (
						<div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
							<div className="flex flex-col items-center gap-2">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								<div className="text-sm text-muted-foreground">
									Logging out user...
								</div>
							</div>
						</div>
					)}
					<DialogHeader>
						<DialogTitle>Confirm Logout</DialogTitle>
						<DialogDescription>
							Are you sure you want to log out this user? They will need to sign in again to access their account.
						</DialogDescription>
					</DialogHeader>

					{userToLogout && (
						<div className="py-4">
							<div className="bg-gray-50 p-4 rounded-lg">
								<p className="font-medium">User Details:</p>
								<p className="text-sm text-gray-600">
									{userToLogout.name}
								</p>
								<p className="text-sm text-gray-600">
									{userToLogout.email}
								</p>
							</div>
						</div>
					)}

					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setLogoutDialogOpen(false)}
							disabled={!!signingOutUserId}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleSignOut}
							disabled={!!signingOutUserId}
						>
							{signingOutUserId ? "Logging out..." : "Logout User"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<div className="flex-1 space-y-6 p-6">
				{/* Stats Cards */}
				<div className="grid gap-4 md:grid-cols-3">
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

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Highly Trusted
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">
								{stats.highlyTrusted}
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
							<div className="flex flex-1 gap-4">
								{/* Search */}
								<div className="relative flex-1 max-w-sm">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Search users..."
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
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="All Roles" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Roles</SelectItem>
										<SelectItem value="citizen">Citizen</SelectItem>
										<SelectItem value="officer">Officer</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
									</SelectContent>
								</Select>

								{/* Trust Filter */}
								<Select
									value={trustFilter}
									onValueChange={setTrustFilter}
								>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="All Trust Levels" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Trust Levels</SelectItem>
										<SelectItem value="3">Highly Trusted</SelectItem>
										<SelectItem value="2">Trusted</SelectItem>
										<SelectItem value="1">Low Trust</SelectItem>
										<SelectItem value="0">Untrusted</SelectItem>
									</SelectContent>
								</Select>
							</div>
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
									<TableHead>Trust Level</TableHead>
									<TableHead>Reports</TableHead>
									<TableHead>Joined</TableHead>
									<TableHead>Last Active</TableHead>
									<TableHead className="text-right">Actions</TableHead>
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
										<TableCell>
											<button
												onClick={() => openTrustDialog(user)}
												className="hover:opacity-80 transition-opacity"
												title="Click to adjust trust score"
											>
												{getTrustBadge(user.trust_score)}
											</button>
										</TableCell>
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
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => openTrustDialog(user)}
												>
													<Shield className="mr-2 h-4 w-4" />
													Trust
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => openLogoutDialog(user)}
												>
													<LogOut className="mr-2 h-4 w-4" />
													Sign Out
												</Button>
											</div>
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

