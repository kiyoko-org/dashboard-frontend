import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function uppercaseFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

export function generatePassword(length: number = 6): string {
	const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const numbers = '0123456789'
	const allChars = letters + numbers
	
	let password = ''
	for (let i = 0; i < length; i++) {
		password += allChars.charAt(Math.floor(Math.random() * allChars.length))
	}
	
	return password
}
