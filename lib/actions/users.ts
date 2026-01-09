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
