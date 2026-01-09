import { redirect } from "next/navigation"
import { getDealById, updateDealStatus, approveDeal, rejectDeal } from "@/lib/actions/deals"
import { InviteBuyerForm } from "./InviteBuyerForm"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { he } from "date-fns/locale"

export const metadata = {
  title: "פרטי עסקה - AutoTrust",
  description: "צפייה בפרטי עסקה וניהול סטטוס",
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

interface DealPageProps {
  params: Promise<{ id: string }>
}

import { BackButton } from "@/components/BackButton"

import { getCurrentUser } from "@/lib/actions/auth"
import { Navbar } from "@/components/Navbar"

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params
  const [deal, user] = await Promise.all([
    getDealById(id),
    getCurrentUser()
  ])

  if (user?.role === "lawyer") {
    redirect(`/lawyer/${id}`)
  }

  if (!deal) {
    return (
      <>
        <Navbar user={user} />
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <Card className="w-full max-w-md p-6 text-center">
            <h1 className="text-xl font-bold text-foreground">עסקה לא נמצאה</h1>
            <BackButton href="/deals" label="חזור לעסקאות שלי" className="mt-4 mx-auto" />
          </Card>
        </div>
      </>
    )
  }

  // ... (transitions logic stays the same)

  const validTransitions: Record<string, string[]> = {
    DRAFT: ["SUBMITTED", "EXPIRED"],
    SUBMITTED: ["UNDER_REVIEW", "EXPIRED"],
    UNDER_REVIEW: ["READY_FOR_NEXT_STAGE", "EXPIRED"],
    READY_FOR_NEXT_STAGE: ["EXPIRED"],
    EXPIRED: [],
  }

  const availableTransitions = validTransitions[deal.status] || []

  return (
    <>
      <Navbar user={user} />
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <BackButton href="/deals" className="mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-bold text-foreground mb-4">{deal.title}</h1>
            <Badge className={`${statusColors[deal.status] || "bg-gray-500"} text-white`}>{statusLabels[deal.status] || deal.status}</Badge>
          </div>

          {/* ... Profile / Deal Details Card ... */}
          <Card className="p-6 mb-6">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground">מחיר</h2>
                  <p className="text-3xl font-bold text-foreground">₪{Number(deal.price_ils).toLocaleString("he-IL")}</p>
                </div>
                <div className="text-left font-mono text-sm bg-muted p-2 rounded">
                  <p className="text-muted-foreground mb-1 text-xs">מספר רכב</p>
                  <p className="font-bold">{deal.license_plate}</p>
                </div>
              </div>

              {/* Seller Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-1">מוכר</h2>
                  <p className="text-lg font-semibold text-foreground">
                    {deal.first_name} {deal.last_name || ""}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-1">סטטוס עסקה</h2>
                  <p className="text-lg font-semibold text-foreground">{statusLabels[deal.status] || deal.status}</p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 pt-4 border-t">
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground">יצרן</h2>
                  <p className="text-sm font-semibold text-foreground">{deal.vehicle_make}</p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground">דגם</h2>
                  <p className="text-sm font-semibold text-foreground">{deal.vehicle_model}</p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground">שנת יצור</h2>
                  <p className="text-sm font-semibold text-foreground">{deal.vehicle_year}</p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground">קילומטראז'</h2>
                  <p className="text-sm font-semibold text-foreground">{deal.kilometers ? `${Number(deal.kilometers).toLocaleString()} ק"מ` : 'לא צוין'}</p>
                </div>
                <div className="col-span-2">
                  <h2 className="text-xs font-medium text-muted-foreground">מספר שלדה (VIN)</h2>
                  <p className="text-sm font-mono font-semibold text-foreground">{deal.chassis_number}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-muted-foreground">
                <div>
                  <p>נוצקה ב: {format(new Date(deal.created_at || Date.now()), "dd/MM/yyyy HH:mm", { locale: he })}</p>
                </div>
                <div className="text-left">
                  <p>עודכנה ב: {format(new Date(deal.updated_at || Date.now()), "dd/MM/yyyy HH:mm", { locale: he })}</p>
                </div>
              </div>
            </div>
          </Card>

          {!["EXPIRED", "COMPLETED", "CANCELLED"].includes(deal.status) && user?.id === deal.seller_id && (
            <InviteBuyerForm dealId={deal.id} />
          )}

          {/* ... Transitions Card ... */}
          {availableTransitions.length > 0 && user?.id === deal.seller_id && (
            <Card className="p-6 mt-6">
              <h2 className="text-lg font-bold text-foreground mb-4">שינוי סטטוס (בדיקה)</h2>
              <div className="space-y-2">
                {availableTransitions.map((transition) => (
                  <form
                    key={transition}
                    action={async () => {
                      "use server"
                      await updateDealStatus(deal.id, transition)
                    }}
                    className="flex justify-end"
                  >
                    <Button type="submit" variant="outline" className="w-full bg-transparent">
                      עדכן ל{statusLabels[transition]}
                    </Button>
                  </form>
                ))}
              </div>
            </Card>
          )}

          {/* Buyer Approval Section */}
          {deal.status === "DRAFT" && user?.id === deal.buyer_id && (
            <Card className="p-6 mt-6 border-blue-200 bg-blue-50/50">
              <h2 className="text-lg font-bold text-foreground mb-2">אישור הצעה</h2>
              <p className="text-muted-foreground mb-4">
                המוכר הזמין אותך לעסקה זו. אנא עיין בפרטים ואשר את ההצעה כדי להמשיך לתהליך העברת הבעלות מול עורך הדין.
              </p>
              <div className="flex gap-4">
                <form action={async () => {
                  "use server"
                  await approveDeal(deal.id)
                }}>
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    אשר הצעה והתחל תהליך
                  </Button>
                </form>

                <form action={async () => {
                  "use server"
                  await rejectDeal(deal.id)
                }}>
                  <Button type="submit" variant="destructive" size="lg">
                    דחה הצעה
                  </Button>
                </form>
              </div>
            </Card>
          )}

        </div>
      </div>
    </>
  )
}
