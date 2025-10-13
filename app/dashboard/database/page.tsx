"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useForm } from "@tanstack/react-form"
import { Database, X, Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { FieldGroup, FieldLabel, FieldError, Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { uppercaseFirstLetter } from "@/lib/utils"
import { useCategories } from "dispatch-lib"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type tableType = "categories"

export default function DatabasePage() {

	const categoriesForm = useForm({
		defaultValues: {
			name: ""
		},
		onSubmit: async ({ value }) => {
			await addCategory({
				name: value.name,
				sub_categories: subcategories.length > 0 ? subcategories : []
			})
			categoriesForm.reset()
			setSubcategories([])
		}
	})

	const { categories, loading, addCategory, updateCategory } = useCategories()

	useEffect(() => {
		console.log(categories)
	}, [categories])


	const addSubcategory = () => {
		if (subcategoryInput.trim()) {
			setSubcategories([...subcategories, subcategoryInput.trim()])
			setSubcategoryInput("")
		}
	}

	const removeSubcategory = (index: number) => {
		setSubcategories(subcategories.filter((_, i) => i !== index))
	}

	const addEditSubcategory = () => {
		if (editSubcategoryInput.trim()) {
			setEditSubcategories([...editSubcategories, editSubcategoryInput.trim()])
			setEditSubcategoryInput("")
		}
	}

	const removeEditSubcategory = (index: number) => {
		setEditSubcategories(editSubcategories.filter((_, i) => i !== index))
	}

	const editForm = useForm({
		defaultValues: {
			name: ""
		},
		onSubmit: async ({ value }) => {

			console.log(value)
			console.log(editSubcategories)

			if (editingCategory) {
				await updateCategory(Number(editingCategory.id), {
					name: value.name,
					sub_categories: editSubcategories.length > 0 ? editSubcategories : []
				})
				setIsEditDialogOpen(false)
				setEditingCategory(null)
				setEditSubcategories([])
				editForm.reset()
			}
		}
	})

	const openEditDialog = (category: { id: number; name: string; sub_categories: string[] | null }) => {
		setEditingCategory(category)
		setEditSubcategories(category.sub_categories || [])
		editForm.setFieldValue("name", category.name)
		setIsEditDialogOpen(true)
	}

	const [selectedTable, setSelectedTable] = useState<tableType>("categories")
	const [subcategories, setSubcategories] = useState<string[]>([])
	const [subcategoryInput, setSubcategoryInput] = useState("")
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; sub_categories: string[] | null } | null>(null)
	const [editSubcategories, setEditSubcategories] = useState<string[]>([])
	const [editSubcategoryInput, setEditSubcategoryInput] = useState("")

	return (
		<>
			<Header title="Database" />

			<div className="p-4">

				<Card>
					<CardHeader>
						<CardTitle>
							<Database className="inline-block mr-2 mb-1" />
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
									onSubmit={(e) => {
										e.preventDefault()
										categoriesForm.handleSubmit()
									}}
								>
									<FieldGroup>
										<categoriesForm.Field
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
															placeholder="Fire"
															autoComplete="off"
															required
														/>
														{isInvalid && <FieldError errors={field.state.meta.errors} />}
													</Field>
												)
											}}
										/>

										<Field>
											<FieldLabel>Subcategories</FieldLabel>
											<div className="flex gap-2">
												<Input
													value={subcategoryInput}
													onChange={(e) => setSubcategoryInput(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault()
															addSubcategory()
														}
													}}
													placeholder="House Fire"
													autoComplete="off"
												/>
												<Button
													type="button"
													onClick={addSubcategory}
												>
													Add
												</Button>
											</div>
											{subcategories.length > 0 && (
												<div className="mt-2 flex flex-wrap gap-2">
													{subcategories.map((sub, index) => (
														<div
															key={index}
															className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
														>
															<span>{sub}</span>
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

				{selectedTable === "categories" && categories && categories.length > 0 && (
					<Card className="mt-4">
						<CardHeader>
							<CardTitle>
								<Database className="inline-block mr-2 mb-1" />
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
									{categories.map((category) => (
										<TableRow key={category.id}>
											<TableCell>{category.name}</TableCell>
											<TableCell>
												{category.sub_categories && category.sub_categories.length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{category.sub_categories.map((sub: string, index: number) => (
															<span
																key={index}
																className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
															>
																{sub}
															</span>
														))}
													</div>
												) : (
													<span className="text-muted-foreground">None</span>
												)}
											</TableCell>
											<TableCell>
												<Button
													variant="outline"
													size="sm"
													onClick={() => openEditDialog(category)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

			</div >

			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
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
												placeholder="Fire"
												autoComplete="off"
												required
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							<Field>
								<FieldLabel>Subcategories</FieldLabel>
								<div className="flex gap-2">
									<Input
										value={editSubcategoryInput}
										onChange={(e) => setEditSubcategoryInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addEditSubcategory()
											}
										}}
										placeholder="House Fire"
										autoComplete="off"
									/>
									<Button
										type="button"
										onClick={addEditSubcategory}
									>
										Add
									</Button>
								</div>
								{editSubcategories.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-2">
										{editSubcategories.map((sub, index) => (
											<div
												key={index}
												className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
											>
												<span>{sub}</span>
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
		</>
	)
}
