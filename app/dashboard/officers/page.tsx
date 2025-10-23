"use client"

import { getDispatchClient, useOfficers } from "dispatch-lib"
import { Pencil, Trash2, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogPortal,
	DialogOverlay,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { useForm } from '@tanstack/react-form'
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { uppercaseFirstLetter, generatePassword } from "@/lib/utils"
import { Header } from "@/components/layout/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { z } from "zod"

// Philippine Police Ranks (PNP) - from highest to lowest
const PHILIPPINE_POLICE_RANKS = [
	// Commissioned Officers
	"Police General (PGen)",
	"Police Lieutenant General (PLtGen)",
	"Police Major General (PMGen)",
	"Police Brigadier General (PBGen)",
	"Police Colonel (PCol)",
	"Police Lieutenant Colonel (PLtCol)",
	"Police Major (PMaj)",
	"Police Captain (PCpt)",
	"Police Lieutenant (PLt)",
	// Non-Commissioned Officers
	"Police Executive Master Sergeant (PEMS)",
	"Police Chief Master Sergeant (PCMS)",
	"Police Senior Master Sergeant (PSMS)",
	"Police Master Sergeant (PMSg)",
	"Police Staff Sergeant (PSSg)",
	"Police Corporal (PCpl)",
	"Patrolman/Patrolwoman (Pat)",
]

const officerSchema = z.object({
	badge_number: z.string().regex(/^\d+$/, {
		message: 'String must contain only digits (0-9).',
	}).min(6, "Badge number is required").max(6, "Badge number must be 6 digits"),
	rank: z.string().min(1, "Rank is required"),
	email: z.string().email("Invalid email address"),
	first_name: z.string().min(1, "First name is required"),
	middle_name: z.string(),
	last_name: z.string().min(1, "Last name is required"),
}) as any

const editOfficerSchema = z.object({
	badge_number: z.string().regex(/^\d+$/, {
		message: 'String must contain only digits (0-9).',
	}).min(6, "Badge number is required").max(6, "Badge number must be 6 digits"),
	first_name: z.string().min(1, "First name is required"),
	middle_name: z.string(),
	last_name: z.string().min(1, "Last name is required"),
}) as any

export default function OfficersPage() {
	const [addOpen, setAddOpen] = useState(false)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [rankSearch, setRankSearch] = useState("")
	const [showRankDropdown, setShowRankDropdown] = useState(false)
	const rankDropdownRef = useRef<HTMLDivElement>(null)
	const [editOpen, setEditOpen] = useState(false)
	const [editingOfficer, setEditingOfficer] = useState<any>(null)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [deletingOfficer, setDeletingOfficer] = useState<any>(null)
	const [signingOutOfficerId, setSigningOutOfficerId] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)

	const { officers, loading, updateOfficer, deleteOfficer } = useOfficers()

	useEffect(() => {
		console.log(officers)
	}, [officers])

	// Filter ranks based on search
	const filteredRanks = PHILIPPINE_POLICE_RANKS.filter(rank =>
		rank.toLowerCase().includes(rankSearch.toLowerCase())
	)

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (rankDropdownRef.current && !rankDropdownRef.current.contains(event.target as Node)) {
				setShowRankDropdown(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const addForm = useForm({
		defaultValues: {
			badge_number: "",
			email: "",
			rank: "",
			first_name: "",
			middle_name: "",
			last_name: "",
		},
		validators: {
			onSubmit: officerSchema as any
		},
		onSubmit: async ({ value }) => {
			try {
				setIsCreating(true)
				setErrorMessage(null)
				setSuccessMessage(null)

				const generatedPassword = generatePassword(6)

				const client = getDispatchClient()
				const result = await client.createOfficer(
					value.badge_number,
					value.email,
					value.rank,
					value.first_name,
					value.middle_name,
					value.last_name,
					generatedPassword
				)

				console.log(value)

				if (result.error) {
					console.error("something happened", result.error)
					setErrorMessage(result.error.message)
					setIsCreating(false)
					return
				}

				await fetch("/api/send-officer-email", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: value.email,
						firstName: value.first_name,
						lastName: value.last_name,
						badgeNumber: value.badge_number,
						rank: value.rank,
						password: generatedPassword,
					}),
				}).catch((err) => console.error("Failed to send email:", err))

				setSuccessMessage(`Officer ${value.first_name} ${value.last_name} created successfully!`)
				setAddOpen(false)
				addForm.reset()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : "Failed to create officer")
			} finally {
				setIsCreating(false)
			}
		}
	})

	const editForm = useForm({
		defaultValues: {
			badge_number: editingOfficer?.badge_number || "",
			first_name: editingOfficer?.first_name || "",
			middle_name: editingOfficer?.middle_name || "",
			last_name: editingOfficer?.last_name || "",
		},
		validators: {
			onSubmit: editOfficerSchema as any
		},
		onSubmit: async ({ value }) => {
			try {
				setErrorMessage(null)
				setSuccessMessage(null)

				const result = await updateOfficer(editingOfficer.id, {
					badge_number: value.badge_number,
					first_name: value.first_name,
					middle_name: value.middle_name,
					last_name: value.last_name
				})

				if (result.error) {
					console.error("something happened", result.error)
					setErrorMessage(result.error.message)
					return
				}

				setSuccessMessage(`Officer ${value.first_name} ${value.last_name} updated successfully!`)
				setEditOpen(false)
				setEditingOfficer(null)
				editForm.reset()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : "Failed to update officer")
			}
		}
	})

	useEffect(() => {
		if (editingOfficer) {
			editForm.reset({
				badge_number: editingOfficer.badge_number || "",
				first_name: editingOfficer.first_name || "",
				middle_name: editingOfficer.middle_name || "",
				last_name: editingOfficer.last_name || "",
			})
		}
	}, [editingOfficer, editForm])

	const handleSignOut = async (userId: string) => {
		setSigningOutOfficerId(userId)
		try {
			const client = getDispatchClient()
			const { data, error } = await client.supabaseClient.rpc('signout_user', { user_uuid: userId })
			if (error) {
				console.error("Failed to sign out officer:", error)
				alert("Failed to sign out officer: " + error.message)
			} else {
				alert("Officer signed out successfully")
			}
		} finally {
			setSigningOutOfficerId(null)
		}
	}

	const handleDeleteOfficer = async () => {
		if (!deletingOfficer) return

		try {
			setErrorMessage(null)
			setSuccessMessage(null)

			const result = await deleteOfficer(deletingOfficer.id)

			if (result.error) {
				console.error("Error deleting officer:", result.error)
				setErrorMessage(result.error.message)
				return
			}

			setSuccessMessage(`Officer ${deletingOfficer.first_name} ${deletingOfficer.last_name} deleted successfully!`)
			setDeleteOpen(false)
			setDeletingOfficer(null)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Failed to delete officer")
		}
	}

	return (
		<>
			<Header title="Officers Management" />

			<Dialog open={addOpen} onOpenChange={(open) => {
				setAddOpen(open)
				if (!open) {
					addForm.reset()
					setErrorMessage(null)
					setRankSearch("")
					setShowRankDropdown(false)
				}
			}}>
				<DialogContent className="sm:max-w-2xl">
					{isCreating && (
						<div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
							<div className="flex flex-col items-center gap-2">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								<div className="text-sm text-muted-foreground">
									Creating officer and sending email...
								</div>
							</div>
						</div>
					)}
					<DialogHeader>
						<DialogTitle>Add Officer</DialogTitle>
						<DialogDescription>
							Create a new officer account
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							addForm.handleSubmit()
						}}
					>
						<FieldGroup className="space-y-4">
							{/* Badge Number and Rank in the same row */}
							<div className="grid grid-cols-2 gap-4">
								<addForm.Field
									name="badge_number"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Badge Number *</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													type="number"
													aria-invalid={isInvalid}
													placeholder="12345"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>

								<addForm.Field
									name="rank"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)} *</FieldLabel>
												<div className="relative" ref={rankDropdownRef}>
													<Input
														id={field.name}
														name={field.name}
														value={rankSearch || field.state.value}
														onChange={(e) => {
															setRankSearch(e.target.value)
															field.handleChange(e.target.value)
															setShowRankDropdown(true)
														}}
														onFocus={() => setShowRankDropdown(true)}
														aria-invalid={isInvalid}
														placeholder="Type to search ranks..."
														autoComplete="off"
													/>
													{showRankDropdown && (
														<div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
															{filteredRanks.length > 0 ? (
																filteredRanks.map((rank) => (
																	<div
																		key={rank}
																		className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
																		onClick={() => {
																			field.handleChange(rank)
																			setRankSearch(rank)
																			setShowRankDropdown(false)
																		}}
																	>
																		{rank}
																	</div>
																))
															) : (
																<div className="px-3 py-2 text-sm text-gray-500">
																	No ranks found
																</div>
															)}
														</div>
													)}
												</div>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>
							</div>

							{/* Email field */}
							<addForm.Field
								name="email"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)}</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="example@gmail.com"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							{/* First Name, Middle Name, and Last Name in the same row */}
							<div className="grid grid-cols-3 gap-4">
								<addForm.Field
									name="first_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>First Name *</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="John"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>

								<addForm.Field
									name="middle_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Middle Name</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Doe"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>

								<addForm.Field
									name="last_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Last Name *</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Doe"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>
							</div>

							{errorMessage && (
								<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
									{errorMessage}
								</div>
							)}

							<Button type="submit" disabled={isCreating}>
								{isCreating ? "Creating..." : "Create Officer"}
							</Button>
						</FieldGroup>
					</form>

				</DialogContent>
			</Dialog>

			<Dialog open={editOpen} onOpenChange={(open) => {
				setEditOpen(open)
				if (!open) {
					editForm.reset()
					setErrorMessage(null)
					setEditingOfficer(null)
				}
			}}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Officer</DialogTitle>
						<DialogDescription>
							Update officer information
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							editForm.handleSubmit()
						}}
					>
						<FieldGroup className="space-y-4">
							{/* Badge Number field */}
							<editForm.Field
								name="badge_number"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Badge Number *</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												type="number"
												aria-invalid={isInvalid}
												placeholder="12345"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							{/* First Name, Middle Name, and Last Name in the same row */}
							<div className="grid grid-cols-3 gap-4">
								<editForm.Field
									name="first_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>First Name *</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="John"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>

								<editForm.Field
									name="middle_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Middle Name</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Doe"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>

								<editForm.Field
									name="last_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Last Name *</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Doe"
													autoComplete="off"
												/>
												{isInvalid && <FieldError errors={field.state.meta.errors} />}
											</Field>
										)
									}}
								/>
							</div>

							{errorMessage && (
								<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
									{errorMessage}
								</div>
							)}

							<Button type="submit">Update Officer</Button>
						</FieldGroup>
					</form>

				</DialogContent>
			</Dialog>

			<Dialog open={deleteOpen} onOpenChange={(open) => {
				setDeleteOpen(open)
				if (!open) {
					setDeletingOfficer(null)
					setErrorMessage(null)
				}
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Officer</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this officer? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					{deletingOfficer && (
						<div className="py-4">
							<div className="bg-gray-50 p-4 rounded-lg">
								<p className="font-medium">Officer Details:</p>
								<p className="text-sm text-gray-600">
									{deletingOfficer.first_name} {deletingOfficer.middle_name} {deletingOfficer.last_name}
								</p>
								<p className="text-sm text-gray-600">
									Badge: {deletingOfficer.badge_number}
								</p>
							</div>
						</div>
					)}

					{errorMessage && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
							{errorMessage}
						</div>
					)}

					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => setDeleteOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteOfficer}
						>
							Delete Officer
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<div className="flex-1 space-y-6 p-6">
				{successMessage && (
					<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
						{successMessage}
					</div>
				)}

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Officers</CardTitle>
						<Button onClick={() => setAddOpen(true)}>
							Add Officer
						</Button>
					</CardHeader>
					<CardContent>
						{loading ? (
							<p className="text-sm text-muted-foreground">Loading officers...</p>
						) : officers && Array.isArray(officers) && officers.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Badge Number</TableHead>
										<TableHead>First Name</TableHead>
										<TableHead>Middle Name</TableHead>
										<TableHead>Last Name</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{officers.map((officer) => (
										<TableRow key={officer.id}>
											<TableCell>{officer.badge_number || 'N/A'}</TableCell>
											<TableCell>{officer.first_name || 'N/A'}</TableCell>
											<TableCell>{officer.middle_name || 'N/A'}</TableCell>
											<TableCell>{officer.last_name || 'N/A'}</TableCell>
											<TableCell>
												<div className="flex space-x-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditingOfficer(officer)
															setEditOpen(true)
														}}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleSignOut(officer.id)}
														disabled={signingOutOfficerId === officer.id}
													>
														<LogOut className="h-4 w-4" />
														{signingOutOfficerId === officer.id && " ..."}
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => {
															setDeletingOfficer(officer)
															setDeleteOpen(true)
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<p className="text-sm text-muted-foreground">No officers found. Use the "Add Officer" button to create one.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}
