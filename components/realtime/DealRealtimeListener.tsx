"use client"

import { useEffect, useMemo } from "react"
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
    const supabase = useMemo(() => createSupabaseClient(), [])

    useEffect(() => {
        if (!dealId) return

        console.log("[Deal Realtime] Subscribing to live updates for deal:", dealId)

        const channel = supabase
            .channel(`deal-room-${dealId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "deals",
                    filter: `id=eq.${dealId}`,
                },
                (payload) => {
                    const newDeal = payload.new as any
                    console.log("[Deal Live Update Detected]:", newDeal.status)

                    const hebrewStatus = statusHebrewMap[newDeal.status] || newDeal.status
                    toast.success("עדכון חי בעסקה ⚡", {
                        description: `הסטטוס השתנה ל: ${hebrewStatus}`,
                        duration: 5000,
                    })

                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [dealId, supabase, router])

    return null
}
