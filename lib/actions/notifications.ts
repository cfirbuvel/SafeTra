"use server"

import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { getCurrentUser } from "@/lib/actions/auth"
import { revalidatePath } from "next/cache"
import { Notification } from "@/lib/types/database"

/**
 * Internal helper to create a notification.
 * This skips RLS as it's typically called during other server actions.
 */
export async function createNotification(params: {
    userId: string
    dealId?: string
    type: string
    title: string
    message: string
}) {
    const serviceClient = getServiceRoleClient()

    const { data, error } = await (serviceClient
        .from("notifications") as any)
        .insert({
            user_id: params.userId,
            deal_id: params.dealId,
            type: params.type,
            title: params.title,
            message: params.message,
            is_read: false
        })
        .select()
        .single()

    if (error) {
        console.error("Failed to create notification:", error)
        return null
    }

    return data as Notification
}

/**
 * Fetch all notifications for the current authenticated user.
 */
export async function getNotifications() {
    const user = await getCurrentUser()
    if (!user) return []

    const serviceClient = getServiceRoleClient()

    const { data, error } = await (serviceClient
        .from("notifications") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

    if (error) {
        console.error("Failed to fetch notifications:", error)
        return []
    }

    return data as Notification[]
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId: string) {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const serviceClient = getServiceRoleClient()

    // Ensure the notification belongs to the user
    const { error } = await (serviceClient
        .from("notifications") as any)
        .update({ is_read: true })
        .match({ id: notificationId, user_id: user.id })

    if (error) {
        console.error("Failed to mark notification as read:", error)
        return { error: "Failed to update notification" }
    }

    revalidatePath("/") // Often needed if navbar is everywhere
    return { success: true }
}

/**
 * Mark all notifications for current user as read.
 */
export async function markAllAsRead() {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const serviceClient = getServiceRoleClient()

    const { error } = await (serviceClient
        .from("notifications") as any)
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

    if (error) {
        console.error("Failed to mark all notifications as read:", error)
        return { error: "Failed to update notifications" }
    }

    revalidatePath("/")
    return { success: true }
}
