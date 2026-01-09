"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { requestOtp } from "@/lib/actions/auth"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Password Login State
  const [passwordEmail, setPasswordEmail] = useState("")
  const [password, setPassword] = useState("")

  const supabase = createSupabaseClient()

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const result = await requestOtp(emailOrPhone)
      if (result.success) {
        setSuccess(result.message)
        setSubmitted(true)
        setTimeout(() => {
          const verifyUrl = `/auth/verify?contact=${encodeURIComponent(emailOrPhone)}&next=${encodeURIComponent(next)}`
          window.location.href = verifyUrl
        }, 1000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("שגיאה בלתי צפויה. אנא נסה שוב.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSocialLogin(provider: "google" | "apple") {
    setIsLoading(true)
    setError("")

    // Construct the redirect URL with the 'next' parameter
    const redirectTo = new URL(`${location.origin}/auth/callback`)
    if (next) {
      redirectTo.searchParams.set("next", next)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo.toString(),
      },
    })
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email: passwordEmail,
      password: password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      window.location.href = next
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">כניסה ל-AutoTrust</CardTitle>
          <CardDescription className="text-base mt-2">התחבר למערכת העברת הבעלות</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
              className="h-10 rounded-[20px] font-sans border-[#747775] w-full flex items-center justify-center gap-2"
              dir="rtl"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4.5 w-4.5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              המשך באמצעות Google
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin("apple")}
              disabled={isLoading}
              className="h-10 rounded-[20px] font-sans border-[#747775] w-full flex items-center justify-center gap-2"
            >
              <svg className="h-4.5 w-4.5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.1-42.9.6-82.7 25-104.7 63.9-44 77.6-11.3 192.6 31 254.1 20.8 29.9 45.3 63.4 77.3 62.2 30.3-1.1 41.7-19.1 78.4-19.1 36.7 0 47.2 19.1 78.4 18.5 32.2-.6 53.4-30.3 73.3-60.1 22.9-33.1 32.5-65.1 33-66.7-1-.5-64.2-24.7-64.6-99.2zM218.4 82c23.2-28.1 38.6-67.4 34.3-106.8-33.6 1.3-74.4 22.4-98.5 50.7-21.7 25.1-40.7 65.4-35.6 103.6 37.8 2.9 76.5-19.4 99.8-47.5z"></path>
              </svg>
              המשך באמצעות Apple
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">או</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200 mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="otp" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="otp">קוד חד פעמי</TabsTrigger>
              <TabsTrigger value="password">סיסמה (משתמש קיים)</TabsTrigger>
            </TabsList>

            <TabsContent value="otp">
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">דוא״ל או טלפון</label>
                  <Input
                    type="text"
                    placeholder="example@email.com או 050..."
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    disabled={isLoading || submitted}
                    className="text-right"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!emailOrPhone || isLoading}>
                  {isLoading ? "שולח..." : "קבל קוד אימות"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  למשתמשים חדשים או קיימים ללא סיסמה
                </p>
              </form>
            </TabsContent>

            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">דוא״ל</label>
                  <Input
                    type="email"
                    value={passwordEmail}
                    onChange={(e) => setPasswordEmail(e.target.value)}
                    disabled={isLoading}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">סיסמה</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="text-right"
                  />
                </div>
                <Button type="submit" variant="default" className="w-full" disabled={!passwordEmail || !password || isLoading}>
                  {isLoading ? "מתחבר..." : "התחבר"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <LoginForm />
    </Suspense>
  )
}
