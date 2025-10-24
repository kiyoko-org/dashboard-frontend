"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { useEmergencies } from "dispatch-lib"

export default function EmergencyPage() {
	const { emergencies, loading, error } = useEmergencies()
	const sortedEmergencies = [...emergencies].sort((a, b) => {
		const aTime = a.call_timestamp ? new Date(a.call_timestamp).getTime() : 0
		const bTime = b.call_timestamp ? new Date(b.call_timestamp).getTime() : 0
		return bTime - aTime
	})

	return (
		<div className="flex flex-col">
			<Header title="Emergency Response Coordination" />

			<div className="flex-1 space-y-6 p-6">
				<Card>
					<CardHeader>
						<CardTitle>Real-Time Emergency Monitoring</CardTitle>
					</CardHeader>
					<CardContent>
						{loading && <p>Loading emergencies...</p>}
						{error && (
							<p className="text-sm text-destructive">
								Failed to load emergencies: {error.message}
							</p>
						)}
						{!loading && !error && emergencies.length === 0 && (
							<p>No emergencies logged yet.</p>
						)}
						{emergencies.length > 0 && (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>User ID</TableHead>
											<TableHead>Called Number</TableHead>
											<TableHead>Call Time</TableHead>
											<TableHead>Location (lat, lon)</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{sortedEmergencies.map((emergency) => {
											const { location_lat: lat, location_lng: lon } = emergency
											const callTime = emergency.call_timestamp
												? new Date(emergency.call_timestamp).toLocaleString()
												: "Unknown"

											const hasLocation = typeof lat === "number" && typeof lon === "number"

											return (
												<TableRow key={emergency.id}>
													<TableCell>{emergency.user_id}</TableCell>
													<TableCell>{emergency.called_number}</TableCell>
													<TableCell>{callTime}</TableCell>
													<TableCell>
														{hasLocation ? (
															<Dialog>
																<DialogTrigger asChild>
																	<Button variant="link" className="h-auto p-0 font-normal">
																		{lat.toFixed(4)}, {lon.toFixed(4)}
																	</Button>
																</DialogTrigger>
																<DialogContent className="sm:max-w-[640px]">
																	<DialogHeader>
																		<DialogTitle>Emergency Location</DialogTitle>
																	</DialogHeader>
																	<div className="mt-4 aspect-video">
																		<iframe
																			title={`Emergency location ${emergency.id}`}
																			src={`https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`}
																			allowFullScreen
																			referrerPolicy="no-referrer-when-downgrade"
																			className="h-full w-full rounded-md border-0"
																		/>
																	</div>
																</DialogContent>
															</Dialog>
														) : (
															<span className="text-muted-foreground">No location data</span>
														)}
													</TableCell>
												</TableRow>
											)
										})}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
