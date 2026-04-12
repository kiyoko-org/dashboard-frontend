"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useAuthContext } from "dispatch-lib"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

const LOGIN_EMAIL_MAX_LENGTH = 254
const LOGIN_PASSWORD_MAX_LENGTH = 128

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(LOGIN_EMAIL_MAX_LENGTH, `Email must be ${LOGIN_EMAIL_MAX_LENGTH} characters or less`)
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(LOGIN_PASSWORD_MAX_LENGTH, `Password must be ${LOGIN_PASSWORD_MAX_LENGTH} characters or less`),
})

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuthContext()
  const router = useRouter()

  const emailValidation = loginSchema.shape.email.safeParse(email)
  const passwordValidation = loginSchema.shape.password.safeParse(password)
  const showEmailError = (emailTouched || showFieldErrors) && !emailValidation.success
  const showPasswordError = (passwordTouched || showFieldErrors) && !passwordValidation.success

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setShowFieldErrors(true)
    setEmailTouched(true)
    setPasswordTouched(true)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      return
    }

    setIsLoading(true)

    const normalizedEmail = parsed.data.email.toLowerCase()
    const result = await signIn(normalizedEmail, parsed.data.password)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Dispatch Admin</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <FieldGroup className="space-y-4">
            <Field data-invalid={showEmailError}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setError(null)
                  setEmailTouched(true)
                  setEmail(e.target.value.slice(0, LOGIN_EMAIL_MAX_LENGTH))
                }}
                onBlur={() => setEmailTouched(true)}
                required
                className="mt-1"
                placeholder="admin@example.com"
                maxLength={LOGIN_EMAIL_MAX_LENGTH}
                autoComplete="email"
                aria-invalid={showEmailError}
              />
              {showEmailError ? (
                <FieldError errors={[{ message: emailValidation.error.issues[0]?.message }]} />
              ) : null}
            </Field>

            <Field data-invalid={showPasswordError}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setError(null)
                  setPasswordTouched(true)
                  setPassword(e.target.value.slice(0, LOGIN_PASSWORD_MAX_LENGTH))
                }}
                onBlur={() => setPasswordTouched(true)}
                required
                className="mt-1"
                placeholder="••••••••"
                autoComplete="current-password"
                maxLength={LOGIN_PASSWORD_MAX_LENGTH}
                aria-invalid={showPasswordError}
              />
              {showPasswordError ? (
                <FieldError errors={[{ message: passwordValidation.error.issues[0]?.message }]} />
              ) : null}
            </Field>
          </FieldGroup>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  )
}
