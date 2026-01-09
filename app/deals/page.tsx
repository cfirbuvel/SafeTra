import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { getUserDeals } from "@/lib/actions/deals"
import { BackButton } from "@/components/BackButton"

export const metadata = {
  title: "העסקאות שלי - AutoTrust",
  description: "ניהול העסקאות שלך",
}

interface Deal {
  id: string
  title: string
  price_ils: number
  status: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  DRAFT: "טיוטה",
  SUBMITTED: "הוגשה",
  UNDER_REVIEW: "בבדיקה",
  AWAITING_PAYMENT: "ממתין לתשלום",
  PAYMENT_VERIFICATION: "אימות תשלום",
  OWNERSHIP_TRANSFER_PENDING: "העברת בעלות",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
  EXPIRED: "פג תוקף",
  READY_FOR_NEXT_STAGE: "מוכנה לשלב הבא", // Keeping legacy just in case
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  UNDER_REVIEW: "bg-yellow-500",
  AWAITING_PAYMENT: "bg-purple-500",
  PAYMENT_VERIFICATION: "bg-orange-500",
  OWNERSHIP_TRANSFER_PENDING: "bg-teal-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
  EXPIRED: "bg-gray-700",
  READY_FOR_NEXT_STAGE: "bg-green-500",
}

import { Navbar } from "@/components/Navbar"

export default async function DealsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (user.role === "lawyer") {
    redirect("/lawyer")
  }

  const deals = await getUserDeals()
  const userDeals = (deals || []) as Deal[]

  return (
    <>
      <Navbar user={user} />
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <BackButton href="/dashboard" className="mb-4" />
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">העסקאות שלי</h1>
              <p className="text-muted-foreground mt-2">ניהול וצפייה בכל העסקאות שלך</p>
            </div>
            <Link href="/deals/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">צור עסקה חדשה</Button>
            </Link>
          </div>

          {userDeals.length === 0 ? (
            <Card className="p-12 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">אין עסקאות עדיין</h2>
              <p className="text-muted-foreground mb-6">ההתחל בעסקה חדשה עכשיו</p>
              <Link href="/deals/new">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">צור עסקה ראשונה</Button>
              </Link>
            </Card>
          ) : (
            /* Deals list grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDeals.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-foreground flex-1 line-clamp-2">{deal.title}</h3>
                      <Badge className={`${statusColors[deal.status] || "bg-gray-500"} text-white ms-2 flex-shrink-0`}>
                        {statusLabels[deal.status] || deal.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">מחיר</p>
                        <p className="text-xl font-bold text-foreground">
                          ₪{Number(deal.price_ils).toLocaleString("he-IL")}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">נוצרה ב</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(deal.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
