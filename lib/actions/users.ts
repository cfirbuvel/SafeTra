"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getServiceRoleClient } from "@/lib/supabase/service-role"

async function getSupabaseClient() {
    const cookieStore = await cookies()
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookies) => {
                cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            },
        },
    })
}

export async function completeProfile(formData: FormData) {
    const supabase = await getSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect("/auth/login")
    }

    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const teudatZehut = formData.get("teudatZehut") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const next = (formData.get("next") as string) || "/dashboard"

    if (!firstName || !lastName || !teudatZehut) {
        return { error: "כל השדות נדרשים" }
    }

    const serviceClient = getServiceRoleClient()

    // 1. Gather all contact info to avoid NOT NULL violations on new rows
    // Use session email as fallback if not in form (for phone signups, this is the shadow email)
    const finalEmail = email || user.email
    const finalPhone = phone || user.user_metadata?.phone || (user as any).phone
    const finalAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

    // Upsert public.profiles (using service client to ensure record exists and bypass RLS)
    const profileUpdate: any = {
        id: user.id,
        full_name: `${firstName} ${lastName}`.trim(),
        id_number: teudatZehut,
        email: finalEmail,
    }

    if (finalPhone) profileUpdate.phone = finalPhone
    if (finalAvatarUrl) profileUpdate.avatar_url = finalAvatarUrl

    const { error } = await (serviceClient
        .from("profiles") as any)
        .upsert(profileUpdate, { onConflict: "id" })

    if (error) {
        console.error("Error updating profile:", error)
        return { error: "שגיאה בעדכון הפרופיל" }
    }

    revalidatePath("/", "layout")
    return { success: true, next }
}

export async function updateUserProfile(data: {
    fullName?: string
    avatarUrl?: string
    teudatZehut?: string
    email?: string
    phone?: string
}) {
    const supabase = await getSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: "משתמש לא מחובר" }
    }

    const serviceClient = getServiceRoleClient()

    // Fetch existing profile to check locked fields
    const { data: existingProfile } = await (serviceClient
        .from("profiles") as any)
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    const updates: any = {}

    if (data.fullName && data.fullName.trim()) {
        updates.full_name = data.fullName.trim()
    }

    if (data.avatarUrl) {
        updates.avatar_url = data.avatarUrl
    }

    if (data.email && data.email.trim()) {
        updates.email = data.email.trim()
    }

    if (data.phone && data.phone.trim()) {
        updates.phone = data.phone.trim()
    }

    // Only set id_number if not already saved (locked once saved)
    const currentId = existingProfile?.id_number || existingProfile?.teudat_zehut
    if (!currentId && data.teudatZehut && data.teudatZehut.trim()) {
        updates.id_number = data.teudatZehut.trim()
    }

    if (Object.keys(updates).length === 0) {
        return { success: true }
    }

    const { error } = await (serviceClient
        .from("profiles") as any)
        .update(updates)
        .eq("id", user.id)

    if (error) {
        console.error("Error updating user profile:", error)
        return { error: "שגיאה בעדכון הפרטים" }
    }

    revalidatePath("/", "layout")
    return { success: true }
}

export async function getUserDealStats(userId: string) {
    try {
        const serviceClient = getServiceRoleClient()

        const { data: deals, error } = await (serviceClient
            .from("deals") as any)
            .select("id, status, seller_id, buyer_id")
            .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)

        if (error || !deals) {
            return { totalDeals: 0, activeDeals: 0, completedDeals: 0 }
        }

        const totalDeals = deals.length
        const completedDeals = deals.filter((d: any) => d.status === "COMPLETED").length
        const activeDeals = deals.filter((d: any) => d.status !== "COMPLETED" && d.status !== "CANCELLED" && d.status !== "EXPIRED").length

        return { totalDeals, activeDeals, completedDeals }
    } catch (err) {
        console.error("Error fetching deal stats:", err)
        return { totalDeals: 0, activeDeals: 0, completedDeals: 0 }
    }
}

