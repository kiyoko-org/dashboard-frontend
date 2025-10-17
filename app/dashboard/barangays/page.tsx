"use client"

import { useBarangays } from "dispatch-lib"
import { Pencil, Trash2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useForm } from '@tanstack/react-form'
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { z } from "zod"

const barangaySchema = z.object({
	name: z.string().min(1, "Barangay name is required"),
})

export default function BarangaysPage() {
	const [addOpen, setAddOpen] = useState(false)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [editOpen, setEditOpen] = useState(false)
	const [editingBarangay, setEditingBarangay] = useState<any>(null)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [deletingBarangay, setDeletingBarangay] = useState<any>(null)
	const [uploadOpen, setUploadOpen] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [uploadResults, setUploadResults] = useState<{ added: number; skipped: number; failed: number } | null>(null)

	const { barangays, loading, addBarangay, updateBarangay, deleteBarangay } = useBarangays()

	const addForm = useForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onSubmit: barangaySchema
		},
		onSubmit: async ({ value }) => {
			try {
				setErrorMessage(null)
				setSuccessMessage(null)

				const result = await addBarangay({
					name: value.name
				})

				if (result.error) {
					console.error("Error adding barangay", result.error)
					setErrorMessage(result.error.message)
					return
				}

				setSuccessMessage(`Barangay ${value.name} created successfully!`)
				setAddOpen(false)
				addForm.reset()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : "Failed to create barangay")
			}
		}
	})

	const editForm = useForm({
		defaultValues: {
			name: editingBarangay?.name || "",
		},
		validators: {
			onSubmit: barangaySchema
		},
		onSubmit: async ({ value }) => {
			try {
				setErrorMessage(null)
				setSuccessMessage(null)

				const result = await updateBarangay(editingBarangay.id, {
					name: value.name
				})

				if (result.error) {
					console.error("Error updating barangay", result.error)
					setErrorMessage(result.error.message)
					return
				}

				setSuccessMessage(`Barangay ${value.name} updated successfully!`)
				setEditOpen(false)
				setEditingBarangay(null)
				editForm.reset()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : "Failed to update barangay")
			}
		}
	})

	const handleDeleteBarangay = async () => {
		if (!deletingBarangay) return

		try {
			setErrorMessage(null)
			setSuccessMessage(null)

			const result = await deleteBarangay(deletingBarangay.id)

			if (result.error) {
				console.error("Error deleting barangay:", result.error)
				setErrorMessage(result.error.message)
				return
			}

			setSuccessMessage(`Barangay ${deletingBarangay.name} deleted successfully!`)
			setDeleteOpen(false)
			setDeletingBarangay(null)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Failed to delete barangay")
		}
	}

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setUploading(true)
		setErrorMessage(null)
		setUploadResults(null)

		try {
			const text = await file.text()
			const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

			const existingNames = new Set(barangays.map(b => b.name.toLowerCase()))
			let added = 0
			let skipped = 0
			let failed = 0

			for (const line of lines) {
				if (existingNames.has(line.toLowerCase())) {
					skipped++
					continue
				}

				const result = await addBarangay({ name: line })
				if (result.error) {
					failed++
				} else {
					added++
					existingNames.add(line.toLowerCase())
				}
			}

			setUploadResults({ added, skipped, failed })
			setSuccessMessage(`Upload complete: ${added} added, ${skipped} skipped, ${failed} failed`)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Failed to process file")
		} finally {
			setUploading(false)
			event.target.value = ''
		}
	}

	return (
		<>
			<Header title="Barangays Management" />

			<Dialog open={addOpen} onOpenChange={(open) => {
				setAddOpen(open)
				if (!open) {
					addForm.reset()
					setErrorMessage(null)
				}
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Add Barangay</DialogTitle>
						<DialogDescription>
							Create a new barangay
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							addForm.handleSubmit()
						}}
					>
						<FieldGroup className="space-y-4">
							<addForm.Field
								name="name"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Barangay Name *</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Enter barangay name"
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

							<Button type="submit">Create Barangay</Button>
						</FieldGroup>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={editOpen} onOpenChange={(open) => {
				setEditOpen(open)
				if (!open) {
					editForm.reset()
					setErrorMessage(null)
					setEditingBarangay(null)
				} else if (editingBarangay) {
					editForm.setFieldValue("name", editingBarangay.name)
				}
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit Barangay</DialogTitle>
						<DialogDescription>
							Update barangay information
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							editForm.handleSubmit()
						}}
					>
						<FieldGroup className="space-y-4">
							<editForm.Field
								name="name"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Barangay Name *</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Enter barangay name"
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

							<Button type="submit">Update Barangay</Button>
						</FieldGroup>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteOpen} onOpenChange={(open) => {
				setDeleteOpen(open)
				if (!open) {
					setDeletingBarangay(null)
					setErrorMessage(null)
				}
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Barangay</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this barangay? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					{deletingBarangay && (
						<div className="py-4">
							<div className="bg-gray-50 p-4 rounded-lg">
								<p className="font-medium">Barangay Details:</p>
								<p className="text-sm text-gray-600">
									{deletingBarangay.name}
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
							onClick={handleDeleteBarangay}
						>
							Delete Barangay
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={uploadOpen} onOpenChange={(open) => {
				setUploadOpen(open)
				if (!open) {
					setUploadResults(null)
					setErrorMessage(null)
				}
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Batch Upload Barangays</DialogTitle>
						<DialogDescription>
							Upload a text file with one barangay name per line
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Input
								type="file"
								accept=".txt"
								onChange={handleFileUpload}
								disabled={uploading}
							/>
							<p className="text-xs text-gray-500 mt-2">
								Format: One barangay name per line. Duplicates will be skipped.
							</p>
						</div>

						{uploading && (
							<div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
								Processing file...
							</div>
						)}

						{uploadResults && (
							<div className="text-sm bg-gray-50 p-3 rounded space-y-1">
								<p><strong>Added:</strong> {uploadResults.added}</p>
								<p><strong>Skipped (duplicates):</strong> {uploadResults.skipped}</p>
								<p><strong>Failed:</strong> {uploadResults.failed}</p>
							</div>
						)}

						{errorMessage && (
							<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
								{errorMessage}
							</div>
						)}
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
						<CardTitle>Barangays</CardTitle>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setUploadOpen(true)}>
								<Upload className="h-4 w-4 mr-2" />
								Batch Upload
							</Button>
							<Button onClick={() => setAddOpen(true)}>
								Add Barangay
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<p className="text-sm text-muted-foreground">Loading barangays...</p>
						) : barangays && Array.isArray(barangays) && barangays.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{barangays.map((barangay) => (
										<TableRow key={barangay.id}>
											<TableCell>{barangay.id}</TableCell>
											<TableCell>{barangay.name}</TableCell>
											<TableCell>
												<div className="flex space-x-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setEditingBarangay(barangay)
															setEditOpen(true)
														}}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => {
															setDeletingBarangay(barangay)
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
							<p className="text-sm text-muted-foreground">No barangays found. Use the "Add Barangay" button to create one.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}
