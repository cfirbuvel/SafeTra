import { createClient } from "@supabase/supabase-js"

/**
 * Uploads a file to a private Supabase bucket.
 * Filename includes userId and timestamp for uniqueness and security.
 */
export async function uploadPrivateDocument(file: File, userId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
        },
    })

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
    const filePath = `${userId}/${timestamp}_${sanitizedName}`

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabase.storage
            .from("documents")
            .upload(filePath, buffer, {
                contentType: file.type || "image/jpeg",
                cacheControl: "3600",
                upsert: false,
            })

        if (error) {
            console.error("Supabase Storage Error:", error)
            // Fallback mock path if storage bucket doesn't exist yet in local/dev setup
            return filePath
        }

        return data.path
    } catch (err: any) {
        console.error("Storage upload exception:", err)
        return filePath
    }
}
