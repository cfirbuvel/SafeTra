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

        console.log("[Global Realtime] Subscribing for user:", userId, "Role:", role)

        // 1. Notifications Channel
        const notifChannel = supabase
            .channel(`global-notifs-${userId}`)
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

        // 2. Deals Channel (INSERT and UPDATE)
        const dealsChannel = supabase
            .channel(`global-deals-all-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "deals",
                },
                (payload) => {
                    console.log("[Realtime Global Deals Event]:", payload.eventType, payload.new)
                    router.refresh()
                }
            )
            .subscribe()

        // 3. Invitations Channel
        const inviteChannel = supabase
            .channel(`global-invites-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "deal_invitations",
                },
                (payload) => {
                    console.log("[Realtime Invitations Event]:", payload.eventType, payload.new)
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(notifChannel)
            supabase.removeChannel(dealsChannel)
            supabase.removeChannel(inviteChannel)
        }
    }, [userId, role, supabase, router])

    return null
}
