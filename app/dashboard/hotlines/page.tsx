"use client"

import { hotlineSchema, useHotlines } from "dispatch-lib"

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

export default function HotlinesPage() {
	const { hotlines, deleteHotline, addHotline, updateHotline } = useHotlines()

	const [editingHotline, setEditingHotline] = useState<number | null>(null)
	const [addOpen, setAddOpen] = useState(false)

	const getHotline = (id: number) => {
		return hotlines.find(h => h.id === id)
	}

	const editForm = useForm({
		defaultValues: {
			name: "",
			description: undefined as string | undefined,
			phone_number: "",
			available: true
		},
		validators: {
			// @ts-ignore
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
			phone_number: "",
			available: true
		},
		validators: {
			// @ts-ignore
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
						editForm.setFieldValue('available', hotline.available ?? true)
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
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="+639123"
												autoComplete="off"
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

							<editForm.Field
								name="available"
								children={(field) => {
									return (
										<Field>
											<div className="flex items-center gap-2">
												<Switch
													id={field.name}
													name={field.name}
													checked={field.state.value}
													onCheckedChange={(checked) => field.handleChange(checked)}
												/>
												<FieldLabel htmlFor={field.name}>Available</FieldLabel>
											</div>
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
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="+639123"
												autoComplete="off"
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

							<addForm.Field
								name="available"
								children={(field) => {
									return (
										<Field>
											<div className="flex items-center gap-2">
												<Switch
													id={field.name}
													name={field.name}
													checked={field.state.value}
													onCheckedChange={(checked) => field.handleChange(checked)}
												/>
												<FieldLabel htmlFor={field.name}>Available</FieldLabel>
											</div>
										</Field>
									)
								}}
							/>

							<Button type="submit">Submit</Button>
						</FieldGroup>
					</form>

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
								<TableHead>Available</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{hotlines.map((hotline) => {
								return <TableRow key={hotline.id}>
									<TableCell className="font-medium">{hotline.name}</TableCell>
									<TableCell>{hotline.description}</TableCell>
									<TableCell>{hotline.phone_number}</TableCell>
									<TableCell>{hotline.available ? "Yes" : "No"}</TableCell>
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
														editForm.setFieldValue('available', h.available ?? true)
													}
													setEditingHotline(hotline.id)
												}}>
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => {
													deleteHotline(hotline.id)
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

