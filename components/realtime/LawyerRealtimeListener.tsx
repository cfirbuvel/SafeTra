"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function LawyerRealtimeListener() {
    const router = useRouter()

    useEffect(() => {
        const supabase = createSupabaseClient()
        let isSubscribed = true

        // 1. Active Poll for Lawyer Console (Every 4 seconds)
        const pollInterval = setInterval(() => {
            if (!isSubscribed) return
            router.refresh()
        }, 4000)

        // 2. Realtime WebSocket Stream
        const setupLawyerChannel = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.access_token) {
                    supabase.realtime.setAuth(session.access_token)
                }

                const channel = supabase
                    .channel("lawyer-live-queue")
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "deals",
                        },
                        (payload: any) => {
                            if (!isSubscribed) return
                            const newDeal = payload.new as any
                            console.log("[Lawyer Realtime Event]:", payload.eventType, newDeal)

                            if (payload.eventType === "INSERT") {
                                toast.info("⚖️ עסקה חדשה במערכת!", {
                                    description: `${newDeal.vehicle_make || "רכב"} ${newDeal.vehicle_model || ""} - ₪${Number(newDeal.price_ils || 0).toLocaleString("he-IL")}`,
                                    duration: 6000,
                                })
                            } else if (payload.eventType === "UPDATE") {
                                toast.info("⚖️ עדכון בתור עסקאות", {
                                    description: `סטטוס: ${newDeal.status}`,
                                    duration: 4000,
                                })
                            }

                            router.refresh()
                            setTimeout(() => {
                                if (typeof window !== "undefined" && window.location.pathname === "/lawyer") {
                                    window.location.reload()
                                }
                            }, 300)
                        }
                    )
                    .subscribe()

                return () => {
                    supabase.removeChannel(channel)
                }
            } catch (err) {
                console.error("[LawyerRealtimeListener Error]:", err)
            }
        }

        let cleanup: any = null
        setupLawyerChannel().then((clean) => { cleanup = clean })

        return () => {
            isSubscribed = false
            clearInterval(pollInterval)
            if (cleanup) cleanup()
        }
    }, [router])

    return null
}
