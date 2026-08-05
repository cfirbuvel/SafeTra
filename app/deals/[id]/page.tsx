import { redirect } from "next/navigation"
import { getDealById, updateDealStatus, approveDeal, rejectDeal } from "@/lib/actions/deals"
import { InviteBuyerForm } from "./InviteBuyerForm"
import { EscrowVaultWidget } from "@/components/EscrowVaultWidget"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { he } from "date-fns/locale"

import { Handshake, CheckCircle2, XCircle, ShieldCheck, Camera } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

import { getCurrentUser } from "@/lib/actions/auth"
import { Navbar } from "@/components/Navbar"
import { BackButton } from "@/components/BackButton"
import { DealRealtimeListener } from "@/components/realtime/DealRealtimeListener"

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params
  const [deal, user] = await Promise.all([
    getDealById(id),
    getCurrentUser()
  ])

  if (user?.role === "lawyer" || user?.role === "admin") {
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
    SUBMITTED: ["UNDER_REVIEW", "AWAITING_PAYMENT", "EXPIRED"],
    UNDER_REVIEW: ["AWAITING_PAYMENT", "EXPIRED"],
    AWAITING_PAYMENT: ["PAYMENT_VERIFICATION"],
    PAYMENT_VERIFICATION: ["OWNERSHIP_TRANSFER_PENDING"],
    OWNERSHIP_TRANSFER_PENDING: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
    EXPIRED: [],
  }

  const availableTransitions = validTransitions[deal.status] || []

  return (
    <>
      <Navbar user={user} />
      <DealRealtimeListener dealId={deal.id} currentStatus={deal.status} />
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
              {/* Vehicle Hero Image & Photo Gallery */}
              {(() => {
                const heroImg = deal.thumbnail_url || (deal.vehicle_images && deal.vehicle_images.length > 0 ? deal.vehicle_images[0] : null)
                const allImages: string[] = deal.vehicle_images && deal.vehicle_images.length > 0
                  ? deal.vehicle_images
                  : (deal.thumbnail_url ? [deal.thumbnail_url] : [])

                if (!heroImg) return null

                return (
                  <div className="space-y-3 pb-4 border-b border-white/10">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
                      <img src={heroImg} alt={deal.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        <span>תמונות הרכב ({allImages.length})</span>
                      </div>
                    </div>

                    {allImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {allImages.map((imgUrl: string, iIdx: number) => (
                          <div key={iIdx} className="aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-primary transition-all">
                            <img src={imgUrl} alt={`תמונת רכב ${iIdx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

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

          <EscrowVaultWidget deal={deal} currentUserId={user.id} />

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
            <Card className="glass-card p-6 mt-6 rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-2xl text-right shadow-[0_0_35px_rgba(16,185,129,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-on-surface">אישור הצעת רכישה 🤝</h2>
                    <p className="text-xs text-on-surface-variant">הזמנה רשמית מהמוכר לעסקת SafeTra</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-bold text-xs px-3 py-1">
                  ממתין לאישורך
                </Badge>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed my-4">
                המוכר הזמין אותך לעסקה זו. אנא עיין בקפדנות בפרטי הרכב והמחיר, ולאחר מכן אישר את ההצעה כדי להעביר את העסקה לבדיקת עורך הדין ופתיחת הפקדת הנאמנות.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <form action={async () => {
                  "use server"
                  await approveDeal(deal.id)
                }} className="flex-1">
                  <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary-fixed-dim text-on-primary shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex items-center gap-2 justify-center cursor-pointer">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>אשר הצעה והתחל תהליך</span>
                  </Button>
                </form>

                <form action={async () => {
                  "use server"
                  await rejectDeal(deal.id)
                }} className="sm:w-auto">
                  <Button type="submit" variant="ghost" className="w-full h-12 px-6 rounded-xl font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center gap-2 justify-center cursor-pointer">
                    <XCircle className="h-5 w-5" />
                    <span>דחה הצעה</span>
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
