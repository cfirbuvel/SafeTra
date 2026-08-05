"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface GlobalRealtimeListenerProps {
    userId?: string
    role?: string
}

export function GlobalRealtimeListener({ userId, role }: GlobalRealtimeListenerProps) {
    const router = useRouter()
    const supabase = useMemo(() => createSupabaseClient(), [])

    useEffect(() => {
        if (!userId) return

        console.log("[Global Realtime] Initializing live subscriptions for user:", userId, "Role:", role)

        // 1. Notification Realtime Channel
        const notifChannel = supabase
            .channel(`global-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotif = payload.new as any
                    console.log("[Realtime Notification Received]:", newNotif)

                    toast.success(newNotif.title || "התראה חדשה 🔔", {
                        description: newNotif.message || "",
                        action: newNotif.deal_id
                            ? {
                                label: "צפה בעסקה",
                                onClick: () => router.push(`/deals/${newNotif.deal_id}`),
                            }
                            : undefined,
                        duration: 6000,
                    })

                    router.refresh()
                }
            )
            .subscribe()

        // 2. User Deals Status Realtime Channel (for Buyer / Seller)
        const dealsChannel = supabase
            .channel(`global-deals-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "deals",
                },
                (payload) => {
                    const updatedDeal = payload.new as any
                    const isRelevant =
                        updatedDeal.seller_id === userId ||
                        updatedDeal.buyer_id === userId ||
                        role === "lawyer" ||
                        role === "admin"

                    if (isRelevant) {
                        console.log("[Realtime Deal Update]:", updatedDeal.id, updatedDeal.status)
                        toast.info("סטטוס העסקה עודכן בלייב! ⚡", {
                            description: `עסקה #${updatedDeal.id.slice(0, 8).toUpperCase()}`,
                            duration: 4000,
                        })
                        router.refresh()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(notifChannel)
            supabase.removeChannel(dealsChannel)
        }
    }, [userId, role, supabase, router])

    return null
}
