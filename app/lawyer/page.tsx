import { getCurrentUser } from "@/lib/actions/auth"
import { Navbar } from "@/components/Navbar"
import { redirect } from "next/navigation"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { he } from "date-fns/locale"

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
}

export default async function LawyerDashboard() {
    const user = await getCurrentUser()

    if (!user || user.role !== "lawyer") {
        redirect("/")
    }

    // Fetch ALL deals using service role (bypass RLS for list view if policy fails, though we added policy)
    // For safety/easier iteration we can use service role here too.
    const serviceClient = getServiceRoleClient()
    // 1. Fetch Deals without join to avoid FK error
    const { data: rawDeals, error: dealsError } = await serviceClient
        .from("deals")
        .select("*")
        .neq("status", "DRAFT") // Only show deals that have been submitted/approved
        .order("created_at", { ascending: false })

    if (dealsError) {
        console.error("Lawyer Dashboard Error:", dealsError)
    }

    if (rawDeals) {
        console.log("DEBUG: Lawyer Dashboard Deals:", (rawDeals as any[]).map(d => ({ id: d.id, status: d.status })))
    }

    // 2. Manual Join for Profiles
    let deals = []
    if (rawDeals && rawDeals.length > 0) {
        const sellerIds = Array.from(new Set(rawDeals.map((d: any) => d.seller_id).filter(Boolean)))

        const { data: profiles } = await serviceClient
            .from("profiles")
            .select("id, full_name, phone, email")
            .in("id", sellerIds)

        deals = rawDeals.map((deal: any) => ({
            ...deal,
            profiles: profiles?.find((p: any) => p.id === deal.seller_id) || null
        }))
    }

    return (
        <>
            <Navbar user={user} />
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground mb-6">לוח בקרה - עו״ד / אדמין</h1>

                    <div className="grid gap-4">
                        {deals?.map((deal: any) => (
                            <Card key={deal.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-xl font-bold text-foreground">
                                            {deal.vehicle_make} {deal.vehicle_model} {deal.vehicle_year}
                                        </h2>
                                        <Badge className={`${statusColors[deal.status] || "bg-gray-500"} text-white`}>
                                            {statusLabels[deal.status] || deal.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex gap-4">
                                        <span>מוכר: {deal.profiles?.full_name || "לא ידוע"}</span>
                                        <span>מחיר: ₪{Number(deal.price_ils).toLocaleString()}</span>
                                        <span>
                                            נוצר: {format(new Date(deal.created_at), "dd/MM/yyyy HH:mm")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/lawyer/${deal.id}`}>
                                        <Button>בדוק עסקה</Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}

                        {(!deals || deals.length === 0) && (
                            <div className="text-center text-muted-foreground py-10">
                                אין עסקאות במערכת
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
