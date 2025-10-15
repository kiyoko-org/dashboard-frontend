"use client"

import { getDispatchClient, useOfficers } from "dispatch-lib"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useEffect, useState, useRef } from "react"
import { useForm } from '@tanstack/react-form'
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { uppercaseFirstLetter } from "@/lib/utils"
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
	middle_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function OfficersPage() {
	const [addOpen, setAddOpen] = useState(false)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [rankSearch, setRankSearch] = useState("")
	const [showRankDropdown, setShowRankDropdown] = useState(false)
	const rankDropdownRef = useRef<HTMLDivElement>(null)

	const { officers, loading } = useOfficers()

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
			password: "",
		},
		validators: {
			onSubmit: officerSchema
		},
		onSubmit: async ({ value }) => {
			try {
				setErrorMessage(null)
				setSuccessMessage(null)

				const client = getDispatchClient()
				const result = await client.createOfficer(
					value.badge_number,
					value.email,
					value.rank,
					value.first_name,
					value.middle_name,
					value.last_name,
					value.password
				)

				console.log(value)

				if (result.error) {
					console.error("something happened", result.error)
					setErrorMessage(result.error.message)
					return
				}

				setSuccessMessage(`Officer ${value.first_name} ${value.last_name} created successfully!`)
				setAddOpen(false)
				addForm.reset()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : "Failed to create officer")
			}
		}
	})

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
												<FieldLabel htmlFor={field.name}>Middle Name *</FieldLabel>
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

							{/* Password field */}
							<addForm.Field
								name="password"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)} *</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="password"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="••••••••"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							{errorMessage && (
								<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
									{errorMessage}
								</div>
							)}

							<Button type="submit">Create Officer</Button>
						</FieldGroup>
					</form>

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
										<TableHead>Last Name</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{officers.map((officer) => (
										<TableRow key={officer.id}>
											<TableCell>{officer.badge_number || 'N/A'}</TableCell>
											<TableCell>{officer.first_name || 'N/A'}</TableCell>
											<TableCell>{officer.last_name || 'N/A'}</TableCell>
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
