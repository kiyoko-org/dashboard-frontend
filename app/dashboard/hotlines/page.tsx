"use client"

import { useHotlines } from "dispatch-lib"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { uppercaseFirstLetter } from "@/lib/utils"
import { Header } from "@/components/layout/header"
import { z } from "zod"

const HOTLINE_NAME_MAX_LENGTH = 60
const HOTLINE_DESCRIPTION_MAX_LENGTH = 160
const HOTLINE_PHONE_MAX_LENGTH = 11

const normalizeInlineText = (value: string) => value.replace(/\s+/g, " ").trim()
const normalizeDescription = (value: string) => value.trim()
const sanitizeDigits = (value: string, maxLength: number) => value.replace(/\D/g, "").slice(0, maxLength)

const hotlineSchema = z.object({
	name: z
		.string()
		.transform(normalizeInlineText)
		.pipe(z.string().min(1, "Name is required").max(HOTLINE_NAME_MAX_LENGTH, `Name must be ${HOTLINE_NAME_MAX_LENGTH} characters or less`)),
	description: z
		.string()
		.max(HOTLINE_DESCRIPTION_MAX_LENGTH, `Description must be ${HOTLINE_DESCRIPTION_MAX_LENGTH} characters or less`)
		.transform((value) => {
			const normalized = normalizeDescription(value)
			return normalized === "" ? null : normalized
		}),
	phone_number: z
		.string()
		.regex(/^\d+$/, "Phone number must contain only digits")
		.min(3, "Phone number must be at least 3 digits")
		.max(HOTLINE_PHONE_MAX_LENGTH, `Phone number must be at most ${HOTLINE_PHONE_MAX_LENGTH} digits`),
})

export default function HotlinesPage() {
	const { hotlines, deleteHotline, addHotline, updateHotline } = useHotlines()
	const [editingHotline, setEditingHotline] = useState<number | null>(null)
	const [addOpen, setAddOpen] = useState(false)
	const [showEditFieldErrors, setShowEditFieldErrors] = useState(false)
	const [showAddFieldErrors, setShowAddFieldErrors] = useState(false)
	const [confirmDeleteHotline, setConfirmDeleteHotline] = useState<{ id: number; name: string } | null>(null)

	const getHotline = (id: number) => hotlines.find((hotline) => hotline.id === id)

	const editForm = useForm({
		defaultValues: {
			name: "",
			description: "",
			phone_number: "",
		},
		validators: {
			onChange: hotlineSchema,
			onSubmit: hotlineSchema,
		},
		onSubmit: async ({ value }) => {
			if (!editingHotline) return
			const parsed = hotlineSchema.parse(value)
			await updateHotline(editingHotline, parsed)
			setEditingHotline(null)
			setShowEditFieldErrors(false)
			editForm.reset()
		},
	})

	const addForm = useForm({
		defaultValues: {
			name: "",
			description: "",
			phone_number: "",
		},
		validators: {
			onChange: hotlineSchema,
			onSubmit: hotlineSchema,
		},
		onSubmit: async ({ value }) => {
			const parsed = hotlineSchema.parse(value)
			await addHotline({ ...parsed, available: true })
			setAddOpen(false)
			setShowAddFieldErrors(false)
			addForm.reset()
		},
	})

	return (
		<>
			<Header title="Hotlines" />

			<Dialog
				open={editingHotline !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditingHotline(null)
						editForm.reset()
						setShowEditFieldErrors(false)
						return
					}

					if (!editingHotline) return
					const hotline = getHotline(editingHotline)
					if (!hotline) return

					editForm.setFieldValue("name", hotline.name)
					editForm.setFieldValue("description", hotline.description ?? "")
					editForm.setFieldValue("phone_number", hotline.phone_number)
				}}
			>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Hotline</DialogTitle>
						<DialogDescription>
							Editing hotline: {editingHotline ? getHotline(editingHotline)?.name : ""}
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(event) => {
							event.preventDefault()
							setShowEditFieldErrors(true)
							void editForm.handleSubmit()
						}}
					>
						<FieldGroup>
							<editForm.Field
								name="name"
								children={(field) => {
									const isInvalid = (showEditFieldErrors || field.state.meta.isTouched) && ((field.state.meta.errors?.length ?? 0) > 0)
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)}</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={() => {
													field.handleChange(normalizeInlineText(field.state.value))
													field.handleBlur()
												}}
												onChange={(event) => field.handleChange(event.target.value)}
												aria-invalid={isInvalid}
												placeholder="Support Line"
												autoComplete="off"
												maxLength={HOTLINE_NAME_MAX_LENGTH}
											/>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
										</Field>
									)
								}}
							/>

							<editForm.Field
								name="phone_number"
								children={(field) => {
									const isInvalid = (showEditFieldErrors || field.state.meta.isTouched) && ((field.state.meta.errors?.length ?? 0) > 0)
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) => field.handleChange(sanitizeDigits(event.target.value, HOTLINE_PHONE_MAX_LENGTH))}
												aria-invalid={isInvalid}
												placeholder="639123"
												autoComplete="off"
												type="tel"
												inputMode="numeric"
												maxLength={HOTLINE_PHONE_MAX_LENGTH}
											/>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
										</Field>
									)
								}}
							/>

							<editForm.Field
								name="description"
								children={(field) => {
									const isInvalid = (showEditFieldErrors || field.state.meta.isTouched) && ((field.state.meta.errors?.length ?? 0) > 0)
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={() => {
													field.handleChange(normalizeDescription(field.state.value))
													field.handleBlur()
												}}
												onChange={(event) => field.handleChange(event.target.value)}
												aria-invalid={isInvalid}
												placeholder="Optional description"
												autoComplete="off"
												maxLength={HOTLINE_DESCRIPTION_MAX_LENGTH}
											/>
											<div className="text-right text-xs text-muted-foreground">
												{field.state.value.length}/{HOTLINE_DESCRIPTION_MAX_LENGTH}
											</div>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
										</Field>
									)
								}}
							/>

							<Button type="submit">Submit</Button>
						</FieldGroup>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={addOpen} onOpenChange={(open) => {
				setAddOpen(open)
				if (open) return
				setShowAddFieldErrors(false)
			}}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Hotline</DialogTitle>
						<DialogDescription>Add a new hotline</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(event) => {
							event.preventDefault()
							setShowAddFieldErrors(true)
							void addForm.handleSubmit()
						}}
					>
						<FieldGroup>
							<addForm.Field
								name="name"
								children={(field) => {
									const isInvalid = (showAddFieldErrors || field.state.meta.isTouched) && ((field.state.meta.errors?.length ?? 0) > 0)
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>{uppercaseFirstLetter(field.name)}</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={() => {
													field.handleChange(normalizeInlineText(field.state.value))
													field.handleBlur()
												}}
												onChange={(event) => field.handleChange(event.target.value)}
												aria-invalid={isInvalid}
												placeholder="Support Line"
												autoComplete="off"
												maxLength={HOTLINE_NAME_MAX_LENGTH}
											/>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
										</Field>
									)
								}}
							/>

							<addForm.Field
								name="phone_number"
								children={(field) => {
									const isInvalid = (showAddFieldErrors || field.state.meta.isTouched) && ((field.state.meta.errors?.length ?? 0) > 0)
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) => field.handleChange(sanitizeDigits(event.target.value, HOTLINE_PHONE_MAX_LENGTH))}
												aria-invalid={isInvalid}
												placeholder="639123"
												autoComplete="off"
												type="tel"
												inputMode="numeric"
												maxLength={HOTLINE_PHONE_MAX_LENGTH}
											/>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
										</Field>
									)
								}}
							/>

							<addForm.Field
								name="description"
								children={(field) => {
									const isInvalid = (showAddFieldErrors || field.state.meta.isTouched) && ((field.state.meta.errors?.length ?? 0) > 0)
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={() => {
													field.handleChange(normalizeDescription(field.state.value))
													field.handleBlur()
												}}
												onChange={(event) => field.handleChange(event.target.value)}
												aria-invalid={isInvalid}
												placeholder="Optional description"
												autoComplete="off"
												maxLength={HOTLINE_DESCRIPTION_MAX_LENGTH}
											/>
											<div className="text-right text-xs text-muted-foreground">
												{field.state.value.length}/{HOTLINE_DESCRIPTION_MAX_LENGTH}
											</div>
											{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
										</Field>
									)
								}}
							/>

							<Button type="submit">Submit</Button>
						</FieldGroup>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={!!confirmDeleteHotline} onOpenChange={(open) => !open && setConfirmDeleteHotline(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Hotline</DialogTitle>
					</DialogHeader>
					<p>Are you sure you want to delete "{confirmDeleteHotline?.name}"? This action cannot be undone.</p>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setConfirmDeleteHotline(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!confirmDeleteHotline) return
								deleteHotline(confirmDeleteHotline.id)
								setConfirmDeleteHotline(null)
							}}
						>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Card className="m-4">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>
						Hotlines {hotlines.length > 0 ? `(${hotlines.length})` : ""}
					</CardTitle>
					<Button onClick={() => setAddOpen(true)}>Add Hotline</Button>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[100px]">Name</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Number</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{hotlines.map((hotline) => (
								<TableRow key={hotline.id}>
									<TableCell className="font-medium">{hotline.name}</TableCell>
									<TableCell>{hotline.description}</TableCell>
									<TableCell>{hotline.phone_number}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" className="h-8 w-8 p-0">
													<span className="sr-only">Open menu</span>
													<MoreHorizontal />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem
													onClick={() => {
														const currentHotline = hotlines.find((item) => item.id === hotline.id)
														if (currentHotline) {
															editForm.setFieldValue("name", currentHotline.name)
															editForm.setFieldValue("description", currentHotline.description ?? "")
															editForm.setFieldValue("phone_number", currentHotline.phone_number)
														}
														setEditingHotline(hotline.id)
													}}
												>
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => setConfirmDeleteHotline({ id: hotline.id, name: hotline.name })}>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{hotlines.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center">
										No hotlines found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</>
	)
}
