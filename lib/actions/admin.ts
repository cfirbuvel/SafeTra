"use server"

import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { getCurrentUser } from "@/lib/actions/auth"
import { revalidatePath } from "next/cache"

/**
 * Checks if the current user is an admin.
 */
async function checkAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin role required")
  }
  return user
}

/**
 * Get overall system statistics for the admin dashboard.
 */
export async function getAdminStats() {
  await checkAdmin()
  const serviceClient = getServiceRoleClient()

  // 1. Fetch profiles stats
  const { data: profiles, error: pError } = await serviceClient
    .from("profiles")
    .select("role")

  if (pError) console.error("Error fetching profiles stats:", pError)

  const totalUsers = profiles?.length || 0
  const adminCount = profiles?.filter((p: any) => p.role === "admin").length || 0
  const lawyerCount = profiles?.filter((p: any) => p.role === "lawyer").length || 0
  const clientCount = totalUsers - adminCount - lawyerCount

  // 2. Fetch deals stats
  const { data: deals, error: dError } = await serviceClient
    .from("deals")
    .select("status, price_ils")

  if (dError) console.error("Error fetching deals stats:", dError)

  const totalDeals = deals?.length || 0
  const activeDeals = deals?.filter((d: any) => d.status !== "COMPLETED" && d.status !== "CANCELLED" && d.status !== "EXPIRED" && d.status !== "DRAFT").length || 0
  const completedDeals = deals?.filter((d: any) => d.status === "COMPLETED").length || 0
  const cancelledDeals = deals?.filter((d: any) => d.status === "CANCELLED").length || 0

  const totalVolume = deals
    ?.filter((d: any) => d.status !== "CANCELLED" && d.status !== "EXPIRED")
    .reduce((sum: number, d: any) => sum + Number(d.price_ils || 0), 0) || 0

  return {
    totalUsers,
    adminCount,
    lawyerCount,
    clientCount,
    totalDeals,
    activeDeals,
    completedDeals,
    cancelledDeals,
    totalVolume,
  }
}

/**
 * Get all profiles in the system.
 */
export async function getUsersList() {
  await checkAdmin()
  const serviceClient = getServiceRoleClient()

  const { data: profiles, error } = await serviceClient
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error listing profiles:", error)
    return []
  }

  return profiles || []
}

/**
 * Update a user's role.
 */
export async function updateUserRole(profileId: string, newRole: "admin" | "lawyer" | "user") {
  await checkAdmin()
  const serviceClient = getServiceRoleClient()

  const { data, error } = await (serviceClient
    .from("profiles") as any)
    .update({ role: newRole })
    .eq("id", profileId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user role:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath("/lawyer")
  return { success: true, profile: data }
}

/**
 * Get recent system audit events simulated from deals and profiles updates.
 */
export async function getSystemAuditLogs() {
  await checkAdmin()
  const serviceClient = getServiceRoleClient()

  // We can query deals that changed recently as audit items
  const { data: recentDeals, error: dError } = await serviceClient
    .from("deals")
    .select("id, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10)

  if (dError) {
    console.error("Error fetching audit logs from deals:", dError)
    return []
  }

  return (recentDeals || []).map((deal: any) => ({
    id: deal.id,
    type: "DEAL_UPDATE",
    message: `Deal "${deal.title}" status updated to ${deal.status}`,
    timestamp: deal.updated_at || new Date().toISOString(),
  }))
}
