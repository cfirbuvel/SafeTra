"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyOtp } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createSupabaseClient } from "@/lib/supabase/client"

function VerifyForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const contact = searchParams.get("contact") || ""
  const next = searchParams.get("next") || "/dashboard"

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createSupabaseClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push(next)
      }
    }
    checkSession()
  }, [router, next])

  useEffect(() => {
    if (!contact) {
      router.push("/auth/login")
    }
  }, [contact, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const result = await verifyOtp(contact, otpCode)
      if (result.success) {
        setSuccess(result.message)
        router.push(next)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("שגיאה בלתי צפויה. אנא נסה שוב.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">אימות הקוד</CardTitle>
          <CardDescription className="text-base mt-2">הזן את קוד האימות שנשלח אליך</CardDescription>
          <p className="text-sm text-muted-foreground mt-2">{contact}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">קוד אימות (6 ספרות)</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={otpCode.length !== 6 || isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? "מאמת..." : "אמת קוד"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push("/auth/login")}
              disabled={isLoading}
            >
              חזור לכניסה
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">הקוד תוקף למשך 5 דקות</p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <VerifyForm />
    </Suspense>
  )
}
