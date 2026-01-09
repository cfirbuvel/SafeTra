import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Uploads a file to a private Supabase bucket.
 * Filename includes userId and timestamp for uniqueness and security.
 */
export async function uploadPrivateDocument(file: File, userId: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for private bucket access on server
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
    const filePath = `${userId}/${timestamp}_${sanitizedName}`

    const { data, error } = await supabase.storage
        .from("documents") // Expected private bucket
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        })

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
    }

    return data.path
}
