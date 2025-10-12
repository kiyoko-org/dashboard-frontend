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
import { MoreHorizontal, Plus } from "lucide-react"
import { useState } from "react"

import { useForm } from '@tanstack/react-form'
import { FieldGroup, FieldLabel, FieldError, Field, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { uppercaseFirstLetter } from "@/lib/utils"

export default function HotlinesPage() {
	const { hotlines, deleteHotline, addHotline, updateHotline } = useHotlines()

	const [editingHotline, setEditingHotline] = useState<number | null>(null)
	const [addOpen, setAddOpen] = useState(false)

	const getHotline = (id: number) => {
		return hotlines.find(h => h.id === id)
	}

	const hotlineForm = useForm({
		defaultValues: {
			name: "",
			description: undefined as string | undefined,
			phone_number: "",
			available: true
		},
		validators: {
			onSubmit: hotlineSchema
		},
		onSubmit: async ({ value }) => {
			if (editingHotline && editingHotline > 0) {
				await updateHotline(editingHotline, value as any)
			} else await addHotline(value as any)

			closeDialog()
		}
	})

	const closeDialog = () => {
		setEditingHotline(null)
		hotlineForm.reset()
	}

	return (
		<>
			<Dialog open={editingHotline !== null} onOpenChange={(open) => {
				if (!open) {
					closeDialog()
				} else if (editingHotline && editingHotline > 0) {
					const hotline = getHotline(editingHotline)
					if (hotline) {
						hotlineForm.setFieldValue('name', hotline.name)
						hotlineForm.setFieldValue('description', hotline.description ?? undefined)
						hotlineForm.setFieldValue('phone_number', hotline.phone_number)
						hotlineForm.setFieldValue('available', hotline.available ?? true)
					}
				} else {
					hotlineForm.setFieldValue('name', '')
					hotlineForm.setFieldValue('description', undefined)
					hotlineForm.setFieldValue('phone_number', '')
					hotlineForm.setFieldValue('available', true)
				}
			}}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editingHotline && editingHotline > 0 ? "Edit Hotline" : "Add Hotline"}</DialogTitle>
						<DialogDescription>
							{editingHotline && editingHotline > 0 ? `Editing hotline: ${getHotline(editingHotline)?.name}` : "Add a new hotline"}
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							hotlineForm.handleSubmit()
						}}
					>
						<FieldGroup>
							<hotlineForm.Field
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


							<hotlineForm.Field
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


							<hotlineForm.Field
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

							<hotlineForm.Field
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
					<Button onClick={() => setEditingHotline(0)}>
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
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</>
	)
}

