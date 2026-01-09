import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"

export const metadata = {
  title: "דשבורד - AutoTrust",
  description: "דשבורד משתמש",
}

import { Navbar } from "@/components/Navbar"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/auth/login")
  if (user.role === "lawyer") redirect("/lawyer")

  return (
    <>
      <Navbar user={user} />
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">לוח בקרה</h1>
            <p className="text-muted-foreground">ברוכה/ברוך הבאה ללוח הבקרה</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">צור עסקה חדשה</h2>
                <p className="text-muted-foreground mb-6">התחל עם עסקה חדשה וניהל את כל השלבים</p>
                <Link href="/deals/new">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">צור עסקה חדשה</Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">לכל העסקאות</h2>
                <p className="text-muted-foreground mb-6">צפה בכל העסקאות שלך וניהל אותן</p>
                <Link href="/deals">
                  <Button variant="outline" className="w-full bg-transparent">
                    לכל העסקאות
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
