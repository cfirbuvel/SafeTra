"use server"

import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { getCurrentUser } from "@/lib/actions/auth"
import { revalidatePath } from "next/cache"
import { Notification } from "@/lib/types/database"

/**
 * Internal helper to create a notification.
 * Handles database schema variations (is_read/read, message/content).
 */
export async function createNotification(params: {
    userId: string
    dealId?: string
    type: string
    title: string
    message: string
}) {
    const serviceClient = getServiceRoleClient()

    // Primary attempt: standard schema with is_read & message
    let { data, error } = await (serviceClient
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

    // Fallback attempt: schema with read & content columns (PGRST204)
    if (error && (error.code === "PGRST204" || error.message?.includes("is_read") || error.message?.includes("message"))) {
        console.warn("[Notifications] Retrying with legacy schema columns (read/content)...")
        const fallbackRes = await (serviceClient
            .from("notifications") as any)
            .insert({
                user_id: params.userId,
                deal_id: params.dealId,
                type: params.type,
                title: params.title,
                content: params.message,
                read: false
            })
            .select()
            .single()
        
        data = fallbackRes.data
        error = fallbackRes.error
    }

    if (error) {
        console.error("Failed to create notification:", error)
        return null
    }

    // Normalize output object to match Notification interface
    if (data) {
        if (data.read !== undefined && data.is_read === undefined) {
            data.is_read = data.read
        }
        if (data.content !== undefined && data.message === undefined) {
            data.message = data.content
        }
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

    // Normalize items
    const normalized = (data || []).map((item: any) => ({
        ...item,
        is_read: item.is_read ?? item.read ?? false,
        message: item.message ?? item.content ?? ""
    }))

    return normalized as Notification[]
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId: string) {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const serviceClient = getServiceRoleClient()

    // Try updating is_read
    let { error } = await (serviceClient
        .from("notifications") as any)
        .update({ is_read: true })
        .match({ id: notificationId, user_id: user.id })

    // Fallback: update read column
    if (error && (error.code === "PGRST204" || error.message?.includes("is_read"))) {
        const res = await (serviceClient
            .from("notifications") as any)
            .update({ read: true })
            .match({ id: notificationId, user_id: user.id })
        error = res.error
    }

    if (error) {
        console.error("Failed to mark notification as read:", error)
        return { error: "Failed to update notification" }
    }

    revalidatePath("/")
    return { success: true }
}

/**
 * Mark all notifications for current user as read.
 */
export async function markAllAsRead() {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const serviceClient = getServiceRoleClient()

    let { error } = await (serviceClient
        .from("notifications") as any)
        .update({ is_read: true })
        .eq("user_id", user.id)

    if (error && (error.code === "PGRST204" || error.message?.includes("is_read"))) {
        const res = await (serviceClient
            .from("notifications") as any)
            .update({ read: true })
            .eq("user_id", user.id)
        error = res.error
    }

    if (error) {
        console.error("Failed to mark all notifications as read:", error)
        return { error: "Failed to update notifications" }
    }

    revalidatePath("/")
    return { success: true }
}
