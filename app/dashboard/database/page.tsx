"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useForm } from "@tanstack/react-form"
import { Database, X, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { uppercaseFirstLetter } from "@/lib/utils"
import { useCategories } from "dispatch-lib"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { z } from "zod"

type TableType = "categories"
type CategoryRow = { id: number; name: string; sub_categories: string[] | null }

const CATEGORY_MAX_LENGTH = 40

const normalizeInlineText = (value: string) => value.replace(/\s+/g, " ").trim()
const normalizeComparableText = (value: string) => normalizeInlineText(value).toLowerCase()

const categoryNameSchema = z
	.string()
	.transform(normalizeInlineText)
	.pipe(z.string().min(1, "Name is required").max(CATEGORY_MAX_LENGTH, `Name must be ${CATEGORY_MAX_LENGTH} characters or less`))

const subcategoryNameSchema = z
	.string()
	.transform(normalizeInlineText)
	.pipe(z.string().min(1, "Subcategory is required").max(CATEGORY_MAX_LENGTH, `Subcategory must be ${CATEGORY_MAX_LENGTH} characters or less`))

const hasDuplicateValue = (values: string[], candidate: string) => {
	const normalizedCandidate = normalizeComparableText(candidate)
	return values.some((value) => normalizeComparableText(value) === normalizedCandidate)
}

export default function DatabasePage() {
	const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
	const [selectedTable] = useState<TableType>("categories")
	const [subcategories, setSubcategories] = useState<string[]>([])
	const [subcategoryInput, setSubcategoryInput] = useState("")
	const [subcategoryError, setSubcategoryError] = useState<string | null>(null)
	const [categoryError, setCategoryError] = useState<string | null>(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
	const [editSubcategories, setEditSubcategories] = useState<string[]>([])
	const [editSubcategoryInput, setEditSubcategoryInput] = useState("")
	const [editSubcategoryError, setEditSubcategoryError] = useState<string | null>(null)
	const [editCategoryError, setEditCategoryError] = useState<string | null>(null)
	const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<CategoryRow | null>(null)
	const [deletedCategory, setDeletedCategory] = useState<CategoryRow | null>(null)
	const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null)

	const categoriesForm = useForm({
		defaultValues: {
			name: "",
		},
		onSubmit: async ({ value }) => {
			setCategoryError(null)
			const parsed = categoryNameSchema.safeParse(value.name)
			if (!parsed.success) {
				setCategoryError(parsed.error.issues[0]?.message ?? "Invalid category name")
				return
			}

			const normalizedName = parsed.data
			const categoryExists = categories.some(
				(category) => normalizeComparableText(category.name) === normalizeComparableText(normalizedName),
			)
			if (categoryExists) {
				setCategoryError("Category already exists")
				return
			}

			await addCategory({
				name: normalizedName,
				sub_categories: subcategories.length > 0 ? subcategories : [],
			})
			categoriesForm.reset()
			setSubcategories([])
			setSubcategoryInput("")
			setSubcategoryError(null)
		}
	})

	const editForm = useForm({
		defaultValues: {
			name: "",
		},
		onSubmit: async ({ value }) => {
			if (!editingCategory) return

			setEditCategoryError(null)
			const parsed = categoryNameSchema.safeParse(value.name)
			if (!parsed.success) {
				setEditCategoryError(parsed.error.issues[0]?.message ?? "Invalid category name")
				return
			}

			const normalizedName = parsed.data
			const categoryExists = categories.some((category) => {
				if (category.id === editingCategory.id) return false
				return normalizeComparableText(category.name) === normalizeComparableText(normalizedName)
			})
			if (categoryExists) {
				setEditCategoryError("Category already exists")
				return
			}

			await updateCategory(editingCategory.id, {
				name: normalizedName,
				sub_categories: editSubcategories.length > 0 ? editSubcategories : [],
			})
			setIsEditDialogOpen(false)
			setEditingCategory(null)
			setEditSubcategories([])
			setEditSubcategoryInput("")
			setEditSubcategoryError(null)
			editForm.reset()
		}
	})

	const addSubcategory = () => {
		setSubcategoryError(null)
		const parsed = subcategoryNameSchema.safeParse(subcategoryInput)
		if (!parsed.success) {
			setSubcategoryError(parsed.error.issues[0]?.message ?? "Invalid subcategory")
			return
		}

		const normalizedValue = parsed.data
		if (hasDuplicateValue(subcategories, normalizedValue)) {
			setSubcategoryError("Subcategory already added")
			return
		}

		setSubcategories((current) => [...current, normalizedValue])
		setSubcategoryInput("")
	}

	const removeSubcategory = (index: number) => {
		setSubcategories((current) => current.filter((_, currentIndex) => currentIndex !== index))
	}

	const addEditSubcategory = () => {
		setEditSubcategoryError(null)
		const parsed = subcategoryNameSchema.safeParse(editSubcategoryInput)
		if (!parsed.success) {
			setEditSubcategoryError(parsed.error.issues[0]?.message ?? "Invalid subcategory")
			return
		}

		const normalizedValue = parsed.data
		if (hasDuplicateValue(editSubcategories, normalizedValue)) {
			setEditSubcategoryError("Subcategory already added")
			return
		}

		setEditSubcategories((current) => [...current, normalizedValue])
		setEditSubcategoryInput("")
	}

	const removeEditSubcategory = (index: number) => {
		setEditSubcategories((current) => current.filter((_, currentIndex) => currentIndex !== index))
	}

	const openEditDialog = (category: CategoryRow) => {
		setEditingCategory(category)
		setEditSubcategories((category.sub_categories ?? []).map(normalizeInlineText))
		setEditSubcategoryInput("")
		setEditSubcategoryError(null)
		setEditCategoryError(null)
		editForm.setFieldValue("name", category.name)
		setIsEditDialogOpen(true)
	}

	const handleDelete = (category: CategoryRow) => {
		setDeletedCategory(category)
		const timer = setTimeout(async () => {
			await deleteCategory(category.id)
			setDeletedCategory(null)
		}, 5000)
		setUndoTimer(timer)
	}

	return (
		<>
			<Header title="Database" />

			<div className="p-4">
				<Card>
					<CardHeader>
						<CardTitle>
							<Database className="mr-2 mb-1 inline-block" />
							Add a new item
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div>
							<SelectGroup>
								Select Table
								<Select>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder={selectedTable} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="categories">Categories</SelectItem>
									</SelectContent>
								</Select>
							</SelectGroup>

							<Separator className="my-4" />

							{selectedTable === "categories" && (
								<form
									onSubmit={(event) => {
										event.preventDefault()
										void categoriesForm.handleSubmit()
									}}
								>
									<FieldGroup>
										<categoriesForm.Field
											name="name"
											children={(field) => {
												const fieldError = categoryError
												const isInvalid = Boolean(fieldError)
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
															onChange={(event) => {
																setCategoryError(null)
																field.handleChange(event.target.value)
															}}
															aria-invalid={isInvalid}
															placeholder="Fire"
															autoComplete="off"
															maxLength={CATEGORY_MAX_LENGTH}
															required
														/>
														{fieldError ? <FieldError errors={[{ message: fieldError }]} /> : null}
													</Field>
												)
											}}
										/>

										<Field data-invalid={Boolean(subcategoryError)}>
											<FieldLabel>Subcategories</FieldLabel>
											<div className="flex gap-2">
												<Input
													value={subcategoryInput}
													onChange={(event) => {
														setSubcategoryError(null)
														setSubcategoryInput(event.target.value)
													}}
													onBlur={() => setSubcategoryInput((current) => normalizeInlineText(current))}
													onKeyDown={(event) => {
														if (event.key !== "Enter") return
														event.preventDefault()
														addSubcategory()
													}}
													placeholder="House Fire"
													autoComplete="off"
													maxLength={CATEGORY_MAX_LENGTH}
													aria-invalid={Boolean(subcategoryError)}
												/>
												<Button type="button" onClick={addSubcategory}>
													Add
												</Button>
											</div>
											{subcategoryError ? <FieldError errors={[{ message: subcategoryError }]} /> : null}
											{subcategories.length > 0 && (
												<div className="mt-2 flex flex-wrap gap-2">
													{subcategories.map((subcategory, index) => (
														<div
															key={index}
															className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-secondary-foreground"
														>
															<span>{subcategory}</span>
															<button
																type="button"
																onClick={() => removeSubcategory(index)}
																className="ml-1 hover:text-destructive"
															>
																<X className="h-4 w-4" />
															</button>
														</div>
													))}
												</div>
											)}
										</Field>

										<Button type="submit">Submit</Button>
									</FieldGroup>
								</form>
							)}
						</div>
					</CardContent>
				</Card>

				{selectedTable === "categories" && categories.length > 0 && (
					<Card className="mt-4">
						<CardHeader>
							<CardTitle>
								<Database className="mr-2 mb-1 inline-block" />
								Categories
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Subcategories</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{categories
										.filter((category) => category.id !== deletedCategory?.id)
										.map((category) => (
											<TableRow key={category.id}>
												<TableCell>{category.name}</TableCell>
												<TableCell>
													{category.sub_categories && category.sub_categories.length > 0 ? (
														<div className="flex flex-wrap gap-1">
															{category.sub_categories.map((subcategory: string, index: number) => (
																<span
																	key={index}
																	className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
																>
																	{subcategory}
																</span>
															))}
														</div>
													) : (
														<span className="text-muted-foreground">None</span>
													)}
												</TableCell>
												<TableCell>
													<div className="flex gap-2">
														<Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
															<Pencil className="h-4 w-4" />
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => setConfirmDeleteCategory(category)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</div>

			{deletedCategory && (
				<div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-destructive p-4 text-destructive-foreground shadow-lg">
					<span>Category "{deletedCategory.name}" deleted.</span>
					<Button
						variant="outline"
						size="sm"
						className="bg-background text-foreground hover:bg-accent"
						onClick={() => {
							if (undoTimer) clearTimeout(undoTimer)
							setDeletedCategory(null)
							setUndoTimer(null)
						}}
					>
						Undo
					</Button>
				</div>
			)}

			<Dialog
				open={isEditDialogOpen}
				onOpenChange={(open) => {
					setIsEditDialogOpen(open)
					if (open) return
					setEditingCategory(null)
					setEditSubcategories([])
					setEditSubcategoryInput("")
					setEditSubcategoryError(null)
					setEditCategoryError(null)
					editForm.reset()
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(event) => {
							event.preventDefault()
							void editForm.handleSubmit()
						}}
					>
						<FieldGroup>
							<editForm.Field
								name="name"
								children={(field) => {
									const fieldError = editCategoryError
									const isInvalid = Boolean(fieldError)
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
												onChange={(event) => {
													setEditCategoryError(null)
													field.handleChange(event.target.value)
												}}
												aria-invalid={isInvalid}
												placeholder="Fire"
												autoComplete="off"
												maxLength={CATEGORY_MAX_LENGTH}
												required
											/>
											{fieldError ? <FieldError errors={[{ message: fieldError }]} /> : null}
										</Field>
									)
								}}
							/>

							<Field data-invalid={Boolean(editSubcategoryError)}>
								<FieldLabel>Subcategories</FieldLabel>
								<div className="flex gap-2">
									<Input
										value={editSubcategoryInput}
										onChange={(event) => {
											setEditSubcategoryError(null)
											setEditSubcategoryInput(event.target.value)
										}}
										onBlur={() => setEditSubcategoryInput((current) => normalizeInlineText(current))}
										onKeyDown={(event) => {
											if (event.key !== "Enter") return
											event.preventDefault()
											addEditSubcategory()
										}}
										placeholder="House Fire"
										autoComplete="off"
										maxLength={CATEGORY_MAX_LENGTH}
										aria-invalid={Boolean(editSubcategoryError)}
									/>
									<Button type="button" onClick={addEditSubcategory}>
										Add
									</Button>
								</div>
								{editSubcategoryError ? <FieldError errors={[{ message: editSubcategoryError }]} /> : null}
								{editSubcategories.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-2">
										{editSubcategories.map((subcategory, index) => (
											<div
												key={index}
												className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-secondary-foreground"
											>
												<span>{subcategory}</span>
												<button
													type="button"
													onClick={() => removeEditSubcategory(index)}
													className="ml-1 hover:text-destructive"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
										))}
									</div>
								)}
							</Field>

							<Button type="submit">Update</Button>
						</FieldGroup>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={!!confirmDeleteCategory} onOpenChange={(open) => !open && setConfirmDeleteCategory(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Category</DialogTitle>
					</DialogHeader>
					<p>Are you sure you want to delete "{confirmDeleteCategory?.name}"? You can undo the deletion within 5 seconds.</p>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setConfirmDeleteCategory(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!confirmDeleteCategory) return
								handleDelete(confirmDeleteCategory)
								setConfirmDeleteCategory(null)
							}}
						>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
