"use server"

import { createServerClient } from "@supabase/ssr"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import { getCurrentUser } from "@/lib/actions/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Profile, ProfileModel, Database } from "@/lib/types/database"
import { normalizePhone } from "@/lib/normalize-phone"
import { createNotification } from "@/lib/actions/notifications"

const statusLabels: Record<string, string> = {
  DRAFT: "טיוטה",
  SUBMITTED: "הוגשה",
  UNDER_REVIEW: "בבדיקה",
  AWAITING_PAYMENT: "ממתין לתשלום",
  PAYMENT_VERIFICATION: "אימות תשלום",
  OWNERSHIP_TRANSFER_PENDING: "העברת בעלות",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
  EXPIRED: "פג תוקף",
}

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          try {
            cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Component context
          }
        },
      },
    }
  )
}

export async function inviteBuyer(dealId: string, buyerPhone: string) {
  const supabase = await getSupabaseClient()
  const serviceClient = getServiceRoleClient() as any

  // 1. Validate Current User (Seller)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "התחברות נדרשת" }

  // 2. Validate Deal Ownership
  const { data: deal, error: dealError } = await (supabase
    .from("deals") as any)
    .select("*")
    .eq("id", dealId)
    .eq("seller_id", user.id)
    .single()

  if (dealError || !deal) return { error: "עסקה לא נמצאה או שאין הרשאה" }
  if ((deal as any).status === "EXPIRED") return { error: "לא ניתן להזמין קונה לעסקה שפגה" }

  // 3. Find or Create Buyer (Shadow User)
  const cleanContact = normalizePhone(buyerPhone)
  const shadowEmail = `${cleanContact}@autotrust-demo.com`
  const shadowPassword = `AutoTrust_Secret_${cleanContact}!`

  const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers()
  let authUser = (authUsers as any[]).find((u: any) => u.email === shadowEmail)

  if (!authUser) {
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: shadowEmail,
      password: shadowPassword,
      email_confirm: true,
      user_metadata: { original_contact: buyerPhone }
    })

    if (createError) return { error: "שגיאה ביצירת קונה" }
    authUser = newUser.user
  }

  if (!authUser) return { error: "שגיאה באיתור משתמש" }

  // 4. Ensure Profile Exists
  const profileUpsertData = {
    id: authUser.id,
    email: shadowEmail,
    full_name: "קונה מוזמן",
    phone: cleanContact,
    invited_by: user.id
  }

  await serviceClient
    .from("profiles")
    .upsert(profileUpsertData as any, { onConflict: "id" })

  // 5. Create Invitation RECORD (The New Way)
  const { data: invitation, error: inviteError } = await serviceClient
    .from("deal_invitations")
    .insert({
      deal_id: dealId,
      buyer_id: authUser.id,
      phone: cleanContact,
      status: "PENDING"
    })
    .select()
    .single()

  if (inviteError) {
    console.error("Create invitation error:", inviteError)
    return { error: "שגיאה ביצירת הזמנה" }
  }

  // 6. Notify Buyer
  await createNotification({
    userId: authUser.id,
    dealId: dealId,
    type: "NEW_INVITATION",
    title: "הזמנה לעסקה חדשה",
    message: `הוזמנת לעסקה חדשה עבור ${deal.title}. לחץ כאן לאישור.`
  })

  // 6. Generate UNIQUE Link
  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/deals/${dealId}/join?invite=${invitation.id}`

  revalidatePath(`/deals/${dealId}`)
  return { success: true, link: inviteLink, dealId: dealId }
}

export async function getDealInvitations(dealId: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await (supabase
    .from("deal_invitations") as any)
    .select(`
            *,
            buyer:profiles!buyer_id(full_name, phone)
        `)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get invitations error:", error)
    return []
  }
  return data || []
}

export async function createDeal(formData: FormData) {
  const supabase = await getSupabaseClient()
  const serviceClient = getServiceRoleClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Check Profile Completeness
  const { data: profile } = await (supabase
    .from("profiles") as any)
    .select("full_name, id_number, email")
    .eq("id", user.id)
    .single()

  const isProfileComplete = profile && (profile as any).full_name && (profile as any).id_number && (profile as any).email

  if (!isProfileComplete) {
    redirect("/auth/complete-profile")
  }

  const title = formData.get("title") as string
  const priceILS = Number.parseFloat(formData.get("priceILS") as string)
  const licensePlate = formData.get("licensePlate") as string
  const vehicleMake = formData.get("vehicleMake") as string
  const vehicleModel = formData.get("vehicleModel") as string
  const vehicleYear = parseInt(formData.get("vehicleYear") as string) || null
  const idDocUrl = formData.get("idDocUrl") as string
  const vehicleRegDocUrl = formData.get("vehicleRegDocUrl") as string

  // Optional: Update profile if AI found data and it was missing
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const idNumber = formData.get("idNumber") as string

  // New fields
  const engineVolume = parseInt(formData.get("engineVolume") as string) || null
  const licenseExpiry = formData.get("licenseExpiry") as string || null
  const previousOwners = parseInt(formData.get("previousOwners") as string) || null
  const chassisNumber = formData.get("chassisNumber") as string || null
  const kilometers = parseInt(formData.get("kilometers") as string) || null
  const vehicleRegOwnerName = formData.get("vehicleRegOwnerName") as string || null
  const vehicleRegOwnerId = formData.get("vehicleRegOwnerId") as string || null

  if (firstName && lastName && idNumber) {
    await (serviceClient.from("profiles") as any).upsert({
      id: user.id,
      full_name: `${firstName} ${lastName}`.trim(),
      id_number: idNumber,
      // email: profile.email // already there
    }, { onConflict: "id" })
    revalidatePath("/", "layout")
  }

  if (!title || !priceILS || priceILS <= 0) {
    return { error: "כל השדות נדרשים" }
  }

  const { data, error } = await (supabase
    .from("deals") as any)
    .insert([
      {
        seller_id: user.id,
        title,
        price_ils: priceILS,
        status: "DRAFT",
        license_plate: licensePlate,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        id_doc_url: idDocUrl,
        vehicle_reg_doc_url: vehicleRegDocUrl,
        first_name: firstName,
        last_name: lastName,
        owner_id_number: idNumber,
        engine_volume: engineVolume,
        license_expiry_date: licenseExpiry,
        previous_owners: previousOwners,
        chassis_number: chassisNumber,
        kilometers: kilometers,
        vehicle_reg_owner_name: vehicleRegOwnerName,
        vehicle_reg_owner_id: vehicleRegOwnerId
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("[v0] Create deal error:", error)
    return { error: "שגיאה ביצירת עסקה" }
  }

  // Notify Lawyers
  const { data: lawyers } = await (serviceClient.from("profiles") as any).select("id").eq("role", "lawyer")
  for (const lawyer of (lawyers || [])) {
    await createNotification({
      userId: lawyer.id,
      dealId: data.id,
      type: "NEW_DEAL",
      title: "עסקה חדשה במערכת",
      message: `נוצרה עסקה חדשה: ${title}. נדרשת בדיקה.`
    })
  }

  redirect(`/deals/${data.id}`)
}

export async function getDealById(dealId: string) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const serviceClient = getServiceRoleClient()

  // 1. Fetch deal WITHOUT joins to avoid FK errors
  const { data: deal, error } = await (serviceClient
    .from("deals") as any)
    .select("*")
    .eq("id", dealId)
    .maybeSingle()

  if (error) {
    console.error("[v0] Get deal error:", error)
    return null
  }

  if (!deal) return null

  // 2. Manually fetch related profiles (Application-Side Join)
  const sellerId = deal.seller_id
  const buyerId = deal.buyer_id

  const profileIds = [sellerId]
  if (buyerId) profileIds.push(buyerId)

  const { data: profiles } = await (serviceClient
    .from("profiles") as any)
    .select("*")
    .in("id", profileIds)

  // 3. Attach profiles to deal object
  const seller = profiles?.find((p: any) => p.id === sellerId)
  const buyer = profiles?.find((p: any) => p.id === buyerId)

  const enrichedDeal = {
    ...deal,
    seller: seller || null,
    buyer: buyer || null
  }

  // Permission Check
  const isLawyer = (user as any).role === 'lawyer'
  if (!isLawyer && enrichedDeal.seller_id !== user.id && enrichedDeal.buyer_id !== user.id) {
    // Check if user has an invitation
    const { data: invitation } = await (serviceClient
      .from("deal_invitations") as any)
      .select("id")
      .eq("deal_id", dealId)
      .eq("buyer_id", user.id)
      .maybeSingle()

    if (!invitation) {
      console.warn(`[v0] User ${user.id} attempted to access deal ${dealId} without permission`)
      return null
    }
  }

  return enrichedDeal
}

export async function joinDeal(dealId: string, invitationId?: string) {
  const supabase = await getSupabaseClient()
  const serviceClient = getServiceRoleClient() as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // 1. Fetch deal (using service client to bypass RLS before join)
  const { data: deal } = await (serviceClient
    .from("deals") as any)
    .select("*")
    .eq("id", dealId)
    .single()

  if (!deal) return { error: "עסקה לא נמצאה" }
  if ((deal as any).status === "EXPIRED") return { error: "העסקה פגה" }
  if ((deal as any).buyer_id && (deal as any).buyer_id !== user.id) {
    return { error: "העסקה כבר משויכת לקונה אחר" }
  }

  // 2. Validate Invitation if provided
  if (invitationId) {
    const { data: invitation, error: inviteError } = await (supabase
      .from("deal_invitations") as any)
      .select("*")
      .eq("id", invitationId)
      .eq("deal_id", dealId)
      .single()

    if (inviteError || !invitation) return { error: "הזמנה לא תקינה" }

    // Optionally check if invitation is for THIS user (phone match)
    // But since we created the user based on phone, ID match is safer
    if (invitation.buyer_id !== user.id) {
      return { error: "הזמנה זו אינה מיועדת לחשבון זה" }
    }

    // Mark invitation as accepted
    await serviceClient
      .from("deal_invitations")
      .update({ status: "ACCEPTED" })
      .eq("id", invitationId)
  }

  // 3. Link Buyer to Deal and update status to SUBMITTED
  const { error: updateError } = await serviceClient
    .from("deals")
    .update({
      buyer_id: user.id,
      // status: "SUBMITTED" // Removed: Buyer must manually approve first (remains DRAFT)
    })
    .eq("id", dealId)

  if (updateError) {
    console.error("Join deal error:", updateError)
    return { error: "שגיאה בעדכון העסקה" }
  }

  revalidatePath(`/deals/${dealId}`)
  redirect(`/deals/${dealId}`)
}

export async function approveDeal(dealId: string) {
  const supabase = await getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "נדרשת התחברות" }

  const serviceClient = getServiceRoleClient()

  // Verify it's the buyer
  const { data: deal } = await (serviceClient.from("deals") as any)
    .select("buyer_id, status")
    .eq("id", dealId)
    .single()

  if (!deal) return { error: "עסקה לא נמצאה" }
  if (deal.buyer_id !== user.id) return { error: "אין הרשאה לאשר עסקה זו" }
  if (deal.status !== "DRAFT") return { error: "העסקה כבר אושרה או שאינה במצב טיוטה" }

  const { error } = await (serviceClient.from("deals") as any)
    .update({ status: "SUBMITTED" })
    .eq("id", dealId)

  if (error) {
    console.error("Approve deal error:", error)
    return { error: "שגיאה באישור העסקה" }
  }

  revalidatePath(`/deals/${dealId}`)
  revalidatePath("/lawyer") // Update lawyer dashboard
}

export async function rejectDeal(dealId: string) {
  const supabase = await getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "נדרשת התחברות" }

  const serviceClient = getServiceRoleClient()

  // Verify it's the buyer
  const { data: deal } = await (serviceClient.from("deals") as any)
    .select("buyer_id, status")
    .eq("id", dealId)
    .single()

  if (!deal) return { error: "עסקה לא נמצאה" }
  if (deal.buyer_id !== user.id) return { error: "אין הרשאה לדחות עסקה זו" }
  if (deal.status !== "DRAFT") return { error: "לא ניתן לדחות עסקה שאינה בסטטוס טיוטה" }

  const { error } = await (serviceClient.from("deals") as any)
    .update({ status: "CANCELLED" })
    .eq("id", dealId)

  if (error) {
    console.error("Reject deal error:", error)
    return { error: "שגיאה בדחיית העסקה" }
  }

  revalidatePath(`/deals/${dealId}`)
}

export async function updateDealStatus(dealId: string, newStatus: string) {
  const supabase = await getSupabaseClient()

  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const validTransitions: Record<string, string[]> = {
    draft: ["submitted", "expired", "cancelled"],
    submitted: ["under_review", "expired", "cancelled"],
    under_review: ["awaiting_payment", "expired", "cancelled"],
    awaiting_payment: ["payment_verification", "expired", "cancelled"],
    payment_verification: ["ownership_transfer_pending", "expired", "cancelled"],
    ownership_transfer_pending: ["completed", "expired", "cancelled"],
    completed: [],
    cancelled: [],
    expired: [],
    ready_for_next_stage: ["expired"] // Legacy cleanup
  }

  // Get current deal status
  const deal = await getDealById(dealId)
  if (!deal) {
    return { error: "עסקה לא נמצאה" }
  }

  /* Method updated to use Service Role + Manual Permission Checks */
  const serviceClient = getServiceRoleClient()

  // Lawyer Override: Allow Lawyer to move to ANY status
  const isLawyer = (user as any).role === 'lawyer'

  if (!isLawyer && !validTransitions[deal.status]?.includes(newStatus)) {
    return { error: `מעבר לא חוקי מ-${deal.status} ל-${newStatus}` }
  }

  /* 
     Dynamic Query Construction:
     If lawyer, update by ID only.
     If seller, enforce seller_id match to prevent unauthorized updates.
  */
  let query = (serviceClient.from("deals") as any)
    .update({ status: newStatus })
    .eq("id", dealId)

  if (!isLawyer) {
    query = query.eq("seller_id", user.id)
  }

  const { data, error } = await query
    .select()
    .single()

  if (error) {
    console.error("Update status error:", error)
    return { error: "שגיאה בעדכון הסטטוס" }
  }

  // 4. Notify Parties
  const partiesToNotify = []
  if (deal.seller_id && deal.seller_id !== user.id) partiesToNotify.push(deal.seller_id)
  if (deal.buyer_id && deal.buyer_id !== user.id) partiesToNotify.push(deal.buyer_id)

  // Also notify lawyers if appropriate (e.g., when submitted or ready for review)
  if (newStatus === 'SUBMITTED' || newStatus === 'UNDER_REVIEW') {
    const { data: lawyers } = await (serviceClient.from("profiles") as any).select("id").eq("role", "lawyer")
    lawyers?.forEach((l: any) => partiesToNotify.push(l.id))
  }

  for (const userId of partiesToNotify) {
    await createNotification({
      userId,
      dealId,
      type: "STATUS_CHANGE",
      title: "עדכון בסטטוס העסקה",
      message: `סטטוס העסקה "${deal.title}" עודכן ל-${statusLabels[newStatus] || newStatus}`
    })
  }

  revalidatePath(`/deals/${dealId}`)
  revalidatePath("/lawyer")

  return { data }
}

export async function getUserDeals() {
  const supabase = await getSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const serviceClient = getServiceRoleClient()

  // Get deals where user is seller or buyer
  const { data: directDeals, error: directError } = await (serviceClient
    .from("deals") as any)
    .select("*")
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  if (directError) {
    console.error("[v0] Get direct deals error:", directError)
    return []
  }

  // Also get deals where user has an invitation
  const { data: invites, error: inviteError } = await (serviceClient
    .from("deal_invitations") as any)
    .select("deal_id")
    .eq("buyer_id", user.id)

  if (inviteError) {
    console.error("[v0] Get invitation deals error:", inviteError)
    return directDeals || []
  }

  if (invites && invites.length > 0) {
    const invitedDealIds = invites.map((i: any) => i.deal_id)
    const { data: invitedDeals } = await (serviceClient
      .from("deals") as any)
      .select("*")
      .in("id", invitedDealIds)

    // Merge unique deals
    const allDeals = [...(directDeals || [])]
    invitedDeals?.forEach((deal: any) => {
      if (!allDeals.find(d => d.id === deal.id)) {
        allDeals.push(deal)
      }
    })
    return allDeals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return directDeals || []
}
