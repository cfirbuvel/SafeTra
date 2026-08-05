"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { getLatestDealStatus } from "@/lib/actions/deals"
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
    const [wsStatus, setWsStatus] = useState<string>("INITIALIZING")
    const [lastCheckTime, setLastCheckTime] = useState<string>("")
    const [dbStatus, setDbStatus] = useState<string>(currentStatus || "")

    useEffect(() => {
        if (!dealId) return

        const supabase = createSupabaseClient()
        let isSubscribed = true

        console.log("%c[DealRealtimeListener] 🚀 Mounted for deal:", "color: #00ffff; font-weight: bold", dealId, "UI Status:", currentStatus)

        // 1. Active Server Poll Loop (Bypasses browser RLS completely)
        const pollInterval = setInterval(async () => {
            if (!isSubscribed) return
            try {
                const now = new Date().toLocaleTimeString("he-IL")
                setLastCheckTime(now)

                const result = await getLatestDealStatus(dealId)
                console.log(`%c[DealRealtimePoll ${now}]`, "color: #ffaa00; font-weight: bold", {
                    dealId,
                    uiStatus: currentStatus,
                    dbStatus: result.status,
                    error: result.error,
                })

                if (result.status) {
                    setDbStatus(result.status)
                    if (currentStatus && result.status.toUpperCase() !== currentStatus.toUpperCase()) {
                        console.log("%c[DealRealtimePoll] ⚡ STATUS MISMATCH DETECTED! Triggering UI reload...", "color: #ff0055; font-weight: bold", {
                            from: currentStatus,
                            to: result.status
                        })

                        const hebrewStatus = statusHebrewMap[result.status] || result.status
                        toast.success("עדכון חי בעסקה ⚡", {
                            description: `הסטטוס השתנה ל: ${hebrewStatus}`,
                            duration: 5000,
                        })

                        router.refresh()
                        setTimeout(() => window.location.reload(), 200)
                    }
                }
            } catch (err) {
                console.error("[DealRealtimePoll Error]:", err)
            }
        }, 2500)

        // 2. Realtime WebSocket Listener (Instant 0ms broadcast)
        const setupWsListener = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.access_token) {
                    console.log("[DealRealtimeWS] Setting JWT auth token for WebSocket channel...")
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
                            console.log("%c[DealRealtimeWS ⚡ Event]", "color: #00ff00; font-weight: bold", payload.eventType, newDeal)

                            if (newDeal?.status && newDeal.status.toUpperCase() !== currentStatus?.toUpperCase()) {
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
                    .subscribe((status: string) => {
                        console.log("%c[DealRealtimeWS Channel Status]:", "color: #00aaff; font-weight: bold", status)
                        if (isSubscribed) setWsStatus(status)
                    })

                return () => {
                    supabase.removeChannel(channel)
                }
            } catch (err) {
                console.error("[DealRealtimeWS Error]:", err)
            }
        }

        let cleanup: any = null
        setupWsListener().then((clean) => { cleanup = clean })

        return () => {
            isSubscribed = false
            clearInterval(pollInterval)
            if (cleanup) cleanup()
        }
    }, [dealId, currentStatus, router])

    // Visual Realtime Floating Debug Badge (visible in bottom-left)
    return (
        <div className="fixed bottom-3 left-3 z-50 bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 rounded-full px-3 py-1.5 text-xs font-mono flex items-center gap-2 shadow-xl opacity-80 hover:opacity-100 transition-opacity" title="Realtime Deal Sync Engine Active">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Realtime: <strong className="text-white">{wsStatus}</strong></span>
            <span className="text-gray-500">|</span>
            <span>UI: <strong className="text-yellow-300">{currentStatus}</strong></span>
            {dbStatus && dbStatus.toUpperCase() !== currentStatus?.toUpperCase() && (
                <>
                    <span className="text-gray-500">|</span>
                    <span className="text-red-400 animate-pulse">DB: <strong>{dbStatus}</strong></span>
                </>
            )}
            {lastCheckTime && <span className="text-[10px] text-gray-400 font-sans">({lastCheckTime})</span>}
        </div>
    )
}
