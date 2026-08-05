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

        // 1. Active 3-Second Live Poll (Guarantees 100% live update accuracy across all devices)
        const pollInterval = setInterval(async () => {
            if (!isSubscribed) return
            try {
                const { data } = await supabase.from("deals").select("status").eq("id", dealId).single()
                if (data?.status && data.status !== currentStatus) {
                    console.log(`[DealRealtimeListener Poll] Live status change detected: ${currentStatus} -> ${data.status}`)
                    const hebrewStatus = statusHebrewMap[data.status] || data.status
                    toast.success("עדכון חי בעסקה ⚡", {
                        description: `הסטטוס השתנה ל: ${hebrewStatus}`,
                        duration: 5000,
                    })
                    router.refresh()
                    setTimeout(() => window.location.reload(), 200)
                }
            } catch (pollErr) {
                // Ignore silent network glitches during poll
            }
        }, 3000)

        // 2. Realtime WebSocket Listener (0ms instant broadcast)
        const setupListener = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.access_token) {
                    supabase.realtime.setAuth(session.access_token)
                }

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
                        (payload: any) => {
                            if (!isSubscribed) return
                            const newDeal = payload.new as any
                            console.log("[DealRealtimeListener] ⚡ Realtime Event received:", payload.eventType, newDeal)

                            if (newDeal?.status && newDeal.status !== currentStatus) {
                                const hebrewStatus = statusHebrewMap[newDeal.status] || newDeal.status
                                toast.success("עדכון חי בעסקה ⚡", {
                                    description: `הסטטוס השתנה ל: ${hebrewStatus}`,
                                    duration: 5000,
                                })
                                router.refresh()
                                setTimeout(() => window.location.reload(), 200)
                            }
                        }
                    )
                    .subscribe()

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
            clearInterval(pollInterval)
            if (cleanup) cleanup()
        }
    }, [dealId, currentStatus, router])

    return null
}
