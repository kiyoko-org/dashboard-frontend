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
import { MoreHorizontal, } from "lucide-react"
import { useState } from "react"

import { useForm } from '@tanstack/react-form'
import { FieldGroup, FieldLabel, FieldError, Field, } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { uppercaseFirstLetter } from "@/lib/utils"
import { Header } from "@/components/layout/header"
import { z } from "zod"

const hotlineSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	phone_number: z.string().regex(/^\d+$/, "Phone number must contain only digits").min(3, "Phone number must be at least 3 digits").max(11, "Phone number must be at most 11 digits")
})

export default function HotlinesPage() {
	const { hotlines, deleteHotline, addHotline, updateHotline } = useHotlines()

	const [editingHotline, setEditingHotline] = useState<number | null>(null)
	const [addOpen, setAddOpen] = useState(false)
	const [confirmDeleteHotline, setConfirmDeleteHotline] = useState<{ id: number; name: string } | null>(null)

	const getHotline = (id: number) => {
		return hotlines.find(h => h.id === id)
	}

	const editForm = useForm({
		defaultValues: {
			name: "",
			description: undefined as string | undefined,
			phone_number: ""
		},
		validators: {
			onSubmit: hotlineSchema
		},
		onSubmit: async ({ value }) => {
			if (editingHotline) {
				await updateHotline(editingHotline, value as any)
			}
			setEditingHotline(null)
			editForm.reset()
		}
	})

	const addForm = useForm({
		defaultValues: {
			name: "",
			description: undefined as string | undefined,
			phone_number: ""
		},
		validators: {
			onSubmit: hotlineSchema
		},
		onSubmit: async ({ value }) => {
			await addHotline(value as any)
			setAddOpen(false)
			addForm.reset()
		}
	})

	return (
		<>

			<Header title="Hotlines" />

			<Dialog open={editingHotline !== null} onOpenChange={(open) => {
				if (!open) {
					setEditingHotline(null)
					editForm.reset()
				} else if (editingHotline) {
					const hotline = getHotline(editingHotline)
					if (hotline) {
						editForm.setFieldValue('name', hotline.name)
						editForm.setFieldValue('description', hotline.description ?? undefined)
						editForm.setFieldValue('phone_number', hotline.phone_number)
					}
				}
			}}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Hotline</DialogTitle>
						<DialogDescription>
							Editing hotline: {getHotline(editingHotline!)?.name}
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							editForm.handleSubmit()
						}}
					>
						<FieldGroup>
							<editForm.Field
								name="name"
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
												placeholder="Support Line"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>


							<editForm.Field
								name="phone_number"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
												aria-invalid={isInvalid}
												placeholder="639123"
												autoComplete="off"
												type="tel"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>


							<editForm.Field
								name="description"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Optional description"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							<Button type="submit">Submit</Button>
						</FieldGroup>
					</form>

				</DialogContent>
			</Dialog>

			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Hotline</DialogTitle>
						<DialogDescription>
							Add a new hotline
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
								name="name"
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
												placeholder="Support Line"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>


							<addForm.Field
								name="phone_number"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
												aria-invalid={isInvalid}
												placeholder="639123"
												autoComplete="off"
												type="tel"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>


							<addForm.Field
								name="description"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Optional description"
												autoComplete="off"
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
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
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => setConfirmDeleteHotline(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={() => {
							if (confirmDeleteHotline) {
								deleteHotline(confirmDeleteHotline.id)
								setConfirmDeleteHotline(null)
							}
						}}>
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
					<Button onClick={() => setAddOpen(true)}>
						Add Hotline
					</Button>
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
							{hotlines.map((hotline) => {
								return <TableRow key={hotline.id}>
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
												<DropdownMenuItem onClick={() => {
													const h = hotlines.find(h => h.id === hotline.id)
													if (h) {
														editForm.setFieldValue('name', h.name)
														editForm.setFieldValue('description', h.description ?? undefined)
														editForm.setFieldValue('phone_number', h.phone_number)
													}
													setEditingHotline(hotline.id)
												}}>
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => {
													setConfirmDeleteHotline({ id: hotline.id, name: hotline.name })
												}}>Delete</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							})}
							{hotlines.length === 0 && <TableRow>
								<TableCell colSpan={5} className="text-center">
									No hotlines found.
								</TableCell>
							</TableRow>}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</>
	)
}

