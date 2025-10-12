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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { DialogClose } from "@radix-ui/react-dialog"

export default function HotlinesPage() {
	const { hotlines, addHotline, updateHotline, deleteHotline } = useHotlines()

	const [editingHotline, setEditingHotline] = useState<number | null>(null)

	const getHotline = (id: number) => {
		return hotlines.find(h => h.id === id)
	}

	return (
		<>

			<Dialog open={editingHotline !== null} onOpenChange={(open) => {
				if (!open) {
					setEditingHotline(null)
				}
			}}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editingHotline ? "Edit Hotline" : "Add Hotline"}</DialogTitle>
						<DialogDescription>
							{editingHotline ? `Editing hotline: ${getHotline(editingHotline)?.name}` : "Add a new hotline"}
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>

			<Card className="m-4">
				<CardHeader>
					<CardTitle>
						Hotlines {hotlines.length > 0 ? `(${hotlines.length})` : ""}
					</CardTitle>
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

