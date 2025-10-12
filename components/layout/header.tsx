"use client"

import { Bell  } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
	title: string
}

export function Header({ title }: HeaderProps) {
	return (
		<header className="flex h-16 items-center justify-between border-b bg-white px-6">
			<div className="flex items-center gap-4">
				<h2 className="text-2xl font-bold text-slate-900">{title}</h2>
			</div>

			<div className="flex items-center gap-4">

				{/* Notifications */}
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					<span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
				</Button>
			</div>
		</header>
	)
}

