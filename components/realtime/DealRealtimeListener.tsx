"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const statusHebrewMap: Record<string, string> = {
    DRAFT: "טיוטה - ממתין לקונה",
    SUBMITTED: "הוגשה - בבדיקת עו״ד",
    UNDER_REVIEW: "בבדיקת עו״ד מקצועית",
    AWAITING_PAYMENT: "מאושרת - ממתינה להפקדה בבנק",
    PAYMENT_VERIFICATION: "אימות אסמכתת תשלום בנאמנות",
    OWNERSHIP_TRANSFER_PENDING: "כספים נעולים בנאמנות - ממתין למסירה",
    COMPLETED: "הושלמה בהצלחה 💸",
    CANCELLED: "בוטלה ❌",
}

interface DealRealtimeListenerProps {
    dealId: string
    currentStatus?: string
}

export function DealRealtimeListener({ dealId, currentStatus }: DealRealtimeListenerProps) {
    const router = useRouter()

    useEffect(() => {
        if (!dealId) return

        const supabase = createSupabaseClient()
        let isSubscribed = true

        const setupListener = async () => {
            try {
                // Ensure JWT auth token is set on WebSocket
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.access_token) {
                    supabase.realtime.setAuth(session.access_token)
                }

                console.log(`[DealRealtimeListener] Subscribing to live room: deal-room-${dealId}`)

                const channel = supabase
                    .channel(`deal-room-${dealId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "deals",
                            filter: `id=eq.${dealId}`,
                        },
                        (payload) => {
                            if (!isSubscribed) return
                            const newDeal = payload.new as any
                            console.log("[DealRealtimeListener] ⚡ Event received:", payload.eventType, newDeal)

                            if (newDeal?.status) {
                                const hebrewStatus = statusHebrewMap[newDeal.status] || newDeal.status
                                toast.success("עדכון חי בעסקה ⚡", {
                                    description: `הסטטוס השתנה ל: ${hebrewStatus}`,
                                    duration: 5000,
                                })
                            }

                            // Trigger instant page refresh
                            router.refresh()

                            // If status actually changed, force full reload to ensure RSC Server Components re-render
                            if (newDeal?.status && newDeal.status !== currentStatus) {
                                setTimeout(() => {
                                    window.location.reload()
                                }, 400)
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log(`[DealRealtimeListener] Channel Status:`, status)
                    })

                return () => {
                    supabase.removeChannel(channel)
                }
            } catch (err) {
                console.error("[DealRealtimeListener Error]:", err)
            }
        }

        let cleanup: any = null
        setupListener().then((clean) => { cleanup = clean })

        return () => {
            isSubscribed = false
            if (cleanup) cleanup()
        }
    }, [dealId, currentStatus, router])

    return null
}
