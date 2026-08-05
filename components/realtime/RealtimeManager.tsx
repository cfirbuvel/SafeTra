"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface RealtimeManagerProps {
    userId?: string
    role?: string
}

export function RealtimeManager({ userId, role }: RealtimeManagerProps) {
    const router = useRouter()
    const [status, setStatus] = useState<string>("CONNECTING")

    useEffect(() => {
        if (!userId) return

        const supabase = createSupabaseClient()
        let isSubscribed = true

        const setupRealtime = async () => {
            try {
                // 1. Obtain Auth Session Access Token for Realtime WebSocket JWT
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.access_token) {
                    console.log("[RealtimeManager] Setting JWT auth token for WebSocket connection...")
                    supabase.realtime.setAuth(session.access_token)
                }

                // 2. Notifications Channel
                const notifChannel = supabase.channel(`notifs-${userId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "notifications",
                            filter: `user_id=eq.${userId}`,
                        },
                        (payload) => {
                            if (!isSubscribed) return
                            const newNotif = payload.new as any
                            console.log("[RealtimeManager] 🔔 Notification received:", newNotif)

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

                            window.dispatchEvent(new CustomEvent("safetra-notification-received", { detail: newNotif }))
                            router.refresh()
                        }
                    )
                    .subscribe((stat) => {
                        console.log(`[RealtimeManager] Notifs Channel Status:`, stat)
                    })

                // 3. Deals Table Channel (Broadcasts all updates/inserts)
                const dealsChannel = supabase.channel(`deals-live-stream-${userId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "deals",
                        },
                        (payload) => {
                            if (!isSubscribed) return
                            console.log("[RealtimeManager] 🚗 Deals event received:", payload.eventType, payload.new)

                            const deal = payload.new as any
                            if (deal?.title || deal?.vehicle_make) {
                                const title = deal.title || `${deal.vehicle_make} ${deal.vehicle_model || ""}`
                                toast.info("עדכון חי בעסקה ⚡", {
                                    description: `${title} - סטטוס: ${deal.status || "מעודכן"}`,
                                    duration: 5000,
                                })
                            }

                            window.dispatchEvent(new CustomEvent("safetra-deal-updated", { detail: payload }))
                            router.refresh()

                            // Auto-refresh dynamic views (/dashboard, /deals, /lawyer)
                            if (typeof window !== "undefined" && ["/dashboard", "/deals", "/lawyer"].includes(window.location.pathname)) {
                                setTimeout(() => {
                                    window.location.reload()
                                }, 300)
                            }
                        }
                    )
                    .subscribe((stat) => {
                        console.log(`[RealtimeManager] Deals Channel Status:`, stat)
                        if (isSubscribed) setStatus(stat)
                    })

                // 4. Deal Invitations Channel
                const invitationsChannel = supabase.channel(`invites-live-stream-${userId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "deal_invitations",
                        },
                        (payload) => {
                            if (!isSubscribed) return
                            console.log("[RealtimeManager] 📩 Invitation event received:", payload.eventType, payload.new)

                            window.dispatchEvent(new CustomEvent("safetra-invitation-updated", { detail: payload }))
                            router.refresh()

                            if (typeof window !== "undefined" && ["/dashboard", "/deals", "/lawyer"].includes(window.location.pathname)) {
                                setTimeout(() => {
                                    window.location.reload()
                                }, 300)
                            }
                        }
                    )
                    .subscribe((stat) => {
                        console.log(`[RealtimeManager] Invitations Channel Status:`, stat)
                    })

                return () => {
                    isSubscribed = false
                    supabase.removeChannel(notifChannel)
                    supabase.removeChannel(dealsChannel)
                    supabase.removeChannel(invitationsChannel)
                }
            } catch (err) {
                console.error("[RealtimeManager Error]:", err)
            }
        }

        setupRealtime()
    }, [userId, role, router])

    return null
}
