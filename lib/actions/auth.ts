"use server"

import { createServerClient } from "@supabase/ssr"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { cookies } from "next/headers"

import { normalizePhone } from "@/lib/normalize-phone"

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function requestOtp(emailOrPhone: string) {
  try {
    console.log("[v0] requestOtp called with:", emailOrPhone)

    const serviceClient = getServiceRoleClient()
    const isEmail = emailOrPhone.includes("@")

    if (!emailOrPhone || emailOrPhone.trim().length === 0) {
      return {
        success: false,
        message: "אנא הזן דוא״ל או מספר טלפון",
      }
    }

    // 1. Get or Create Supabase Auth User (Shadow User)
    const cleanContact = isEmail ? emailOrPhone : normalizePhone(emailOrPhone)
    const shadowEmail = isEmail ? emailOrPhone : `${cleanContact}@autotrust-demo.com`
    const shadowPassword = `AutoTrust_Secret_${cleanContact}!`

    // Check if auth user exists
    // Note: listUsers is not efficient for large bases but fine for beta/demo. 
    // Ideally getUserByEmail if available in admin API.
    const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers()
    let authUser = authUsers.find(u => u.email === shadowEmail)

    if (!authUser) {
      console.log("[v0] Creating new Supabase Auth user:", shadowEmail)
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: shadowEmail,
        password: shadowPassword,
        email_confirm: true,
        user_metadata: { original_contact: emailOrPhone }
      })

      if (createError) {
        console.error("Auth creation error:", createError)
        throw createError
      }
      authUser = newUser.user
    }

    if (!authUser) throw new Error("Failed to resolve Auth User")

    // 2. Ensure Profile Exists
    // Now we have a valid ID to link the profile
    const profileData: any = {
      email: shadowEmail, // Satisfy NOT NULL constraint
      full_name: "New User", // Satisfy NOT NULL constraint
    }
    if (!isEmail) {
      profileData.phone = normalizePhone(emailOrPhone)
    }

    // We use ignoreDuplicates: true so we don't overwrite existing profile data (like real name)
    // if the user already exists. We only want to ensure a row exists.
    const { data: user, error: userError } = await (serviceClient
      .from("profiles") as any)
      .upsert({
        id: authUser.id,
        ...profileData
      }, { onConflict: "id", ignoreDuplicates: true })
      .select()
      .maybeSingle()

    // Actually, forcing update is better to ensure sync
    if (!isEmail && cleanContact) {
      await (serviceClient.from("profiles") as any)
        .update({ phone: cleanContact })
        .eq("id", authUser.id)
    }

    if (userError) {
      console.error("[v0] Profile error:", userError)
      throw userError
    }

    // 3. Generate and Store OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const { error: otpError } = await serviceClient.from("otp_codes").insert([
      {
        user_id: authUser.id, // Link to the Auth User ID (which is also Profile ID)
        channel: isEmail ? "email" : "sms",
        code,
        expires_at: expiresAt.toISOString(),
      },
    ] as any)

    if (otpError) {
      console.error("[v0] OTP error:", otpError)
      throw otpError
    }

    console.log("[v0] OTP created successfully. Code:", code)
    // Dev only: Log OTP
    console.log(`OTP for ${emailOrPhone}: ${code}`)

    return {
      success: true,
      message: isEmail ? "קוד אימות נשלח לדוא״ל שלך" : "קוד אימות נשלח בהודעת SMS",
      channel: isEmail ? "email" : "sms",
    }
  } catch (error) {
    console.error("[v0] Error requesting OTP:", error)
    return {
      success: false,
      message: "שגיאה בהוצאת קוד אימות. אנא נסה שוב.",
    }
  }
}

export async function verifyOtp(emailOrPhone: string, otpCode: string) {
  try {
    console.log("[v0] verifyOtp called with contact:", emailOrPhone, "code:", otpCode)

    const serviceClient = getServiceRoleClient()
    const isEmail = emailOrPhone.includes("@")
    const field = isEmail ? "email" : "phone"

    // 1. Find User ID via Profile
    const normalizedContact = isEmail ? emailOrPhone : normalizePhone(emailOrPhone)

    let { data: profile, error: profileError } = await (serviceClient
      .from("profiles") as any)
      .select("id")
      .eq(field, normalizedContact)
      .maybeSingle()

    // Fallback 1: search for raw input if normalized didn't work (for legacy data)
    if (!profile && !isEmail && normalizedContact !== emailOrPhone) {
      const { data: fallbackProfile } = await (serviceClient
        .from("profiles") as any)
        .select("id")
        .eq(field, emailOrPhone)
        .maybeSingle()
      if (fallbackProfile) profile = fallbackProfile
    }

    // Fallback 2: search by Shadow Email (if phone lookup failed but user exists)
    if (!profile && !isEmail) {
      const shadowEmail = `${normalizedContact}@autotrust-demo.com`
      const { data: shadowProfile } = await (serviceClient
        .from("profiles") as any)
        .select("id")
        .eq("email", shadowEmail)
        .maybeSingle()
      if (shadowProfile) profile = shadowProfile
    }

    if (profileError || !profile) {
      return { success: false, message: "משתמש לא נמצא" }
    }
    const userId = profile.id

    // 2. Validate OTP
    const { data: otpData, error: otpError } = await serviceClient
      .from("otp_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", otpCode)
      .gt("expires_at", new Date().toISOString())
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1) as any

    if (otpError || !otpData || otpData.length === 0) {
      return { success: false, message: "קוד אימות לא תקין או פג תוקף" }
    }

    // Mark OTP as used
    await (serviceClient.from("otp_codes") as any).update({ used: true }).eq("id", otpData[0].id)

    // 3. Sign In via Native Auth (using Shadow Password)
    const cleanContact = isEmail ? emailOrPhone : normalizePhone(emailOrPhone)
    const shadowEmail = isEmail ? emailOrPhone : `${cleanContact}@autotrust-demo.com`
    const shadowPassword = `AutoTrust_Secret_${cleanContact}!`

    const supabase = await getSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: shadowEmail,
      password: shadowPassword
    })

    if (signInError) {
      console.error("Sign in error:", signInError)
      // Fallback: If password changed or something, maybe reset it?
      // For now, assume it works as we set it in requestOtp if needed (or we assume it's static).
      return { success: false, message: "שגיאה ביצירת התחברות" }
    }

    console.log("[v0] Verification Successful. Native Session Created.")
    return {
      success: true,
      message: "התחברת בהצלחה",
      userId: userId,
    }

  } catch (error) {
    console.error("[v0] Error verifying OTP:", error)
    return {
      success: false,
      message: "שגיאה בלתי צפויה. אנא נסה שוב.",
    }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) return null

    // Always fetch profile to get real email/name if completed
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle()

    if (!profile) return authUser

    // Check if the current email is a shadow email
    const isShadowEmail = profile.email?.endsWith("@autotrust-demo.com")

    // Extract avatar URL: Prioritize persistent DB URL, then session metadata
    const image = profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null

    // Return a merged object
    return {
      ...authUser,
      ...profile,
      image,
      // Ensure we flag it if it's a shadow email so the UI can handle it
      isShadowEmail,
    }
  } catch (error: any) {
    // Rethrow dynamic server usage errors so Next.js can handle them during build
    if (error.digest === 'DYNAMIC_SERVER_USAGE' || error.message?.includes('Dynamic server usage')) {
      throw error
    }
    console.error("Error getting current user:", error)
    return null
  }
}

export async function logout() {
  try {
    const supabase = await getSupabaseClient()
    await supabase.auth.signOut()

    // Clean up legacy cookies
    const cookieStore = await cookies()
    cookieStore.delete("session_token")

    return { success: true }
  } catch (error) {
    console.error("Error logging out:", error)
    return { success: false }
  }
}
export async function sendProfileVerificationCode(contact: string) {
  try {
    const isEmail = contact.includes("@")
    const supabase = await getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) throw new Error("Unauthorized")

    // Generate a code (in a real app, this would use Supabase Auth or a 3rd party SMS/Email service)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const serviceClient = getServiceRoleClient()

    // Store the verification code in otp_codes
    // We use a special channel prefixed with 'verify_' to distinguish these from login codes
    const { error: otpError } = await serviceClient.from("otp_codes").insert([
      {
        user_id: user.id,
        channel: isEmail ? "verify_email" : "verify_sms",
        code,
        expires_at: expiresAt.toISOString(),
      },
    ] as any)

    if (otpError) throw otpError

    console.log(`[VERIFICATION CODE for ${contact}]: ${code}`)

    return {
      success: true,
      message: isEmail ? "קוד אימות נשלח לדוא״ל שלך" : "קוד אימות נשלח בהודעת SMS",
    }
  } catch (error: any) {
    console.error("Error sending verification code:", error)
    return { success: false, message: "שגיאה בשליחת הקוד" }
  }
}

export async function verifyProfileContact(contact: string, code: string) {
  try {
    const isEmail = contact.includes("@")
    const supabase = await getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) throw new Error("Unauthorized")

    const serviceClient = getServiceRoleClient()

    const { data: otpData, error: otpError } = await serviceClient
      .from("otp_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code)
      .eq("channel", isEmail ? "verify_email" : "verify_sms")
      .gt("expires_at", new Date().toISOString())
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1) as any

    if (otpError || !otpData || otpData.length === 0) {
      return { success: false, message: "קוד אימות לא תקין או פג תוקף" }
    }

    // Mark as used
    await (serviceClient.from("otp_codes") as any).update({ used: true }).eq("id", otpData[0].id)

    return { success: true, message: "האימות הושלם" }
  } catch (error: any) {
    console.error("Error verifying contact:", error)
    return { success: false, message: "שגיאה באימות הקוד" }
  }
}
