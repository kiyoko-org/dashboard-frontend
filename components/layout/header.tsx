"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/providers/sidebar-provider"

interface HeaderProps {
	title: string
}

export function Header({ title }: HeaderProps) {
	const { toggleSidebar } = useSidebar()

	return (
		<header className="flex h-16 items-center justify-between border-b bg-white px-6">
			<div className="flex items-center gap-4">
				{/* Mobile menu button */}
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleSidebar}
					className="lg:hidden"
				>
					<Menu className="h-5 w-5" />
				</Button>
				<h2 className="text-2xl font-bold text-slate-900">{title}</h2>
			</div>

		<div className="flex items-center gap-4"></div>
		</header>
	)
}

