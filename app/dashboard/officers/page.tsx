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
import { useEffect, useState } from "react"
import { useForm } from '@tanstack/react-form'
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { uppercaseFirstLetter } from "@/lib/utils"
import { Header } from "@/components/layout/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { z } from "zod"

const officerSchema = z.object({
	badge_number: z.string().min(1, "Badge number is required"),
	rank: z.string().min(1, "Rank is required"),
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function OfficersPage() {
	const [addOpen, setAddOpen] = useState(false)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const { officers, loading } = useOfficers()

	useEffect(() => {
		console.log(officers)
	}, [officers])

	const addForm = useForm({
		defaultValues: {
			badge_number: "",
			rank: "",
			first_name: "",
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
					value.rank,
					value.first_name,
					value.last_name,
					value.password
				)

				console.log(value)

				if (result.error) {
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
						<FieldGroup>
							<addForm.Field
								name="badge_number"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Badge Number</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
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
											<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)}</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Officer"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							<addForm.Field
								name="first_name"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>First Name</FieldLabel>
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
								name="last_name"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
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
								name="password"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)}</FieldLabel>
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
					) : officers && officers.length > 0 ? (
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
									<TableRow key={officer.badge_number}>
										<TableCell>{officer.badge_number}</TableCell>
										<TableCell>{officer.first_name}</TableCell>
										<TableCell>{officer.last_name}</TableCell>
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
