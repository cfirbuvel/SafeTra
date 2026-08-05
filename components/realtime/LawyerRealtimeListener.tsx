"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function LawyerRealtimeListener() {
    const router = useRouter()
    const supabase = useMemo(() => createSupabaseClient(), [])

    useEffect(() => {
        console.log("[Lawyer Realtime] Subscribing to escrow queue live changes...")

        const channel = supabase
            .channel("lawyer-live-queue")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "deals",
                },
                (payload) => {
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
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router])

    return null
}
