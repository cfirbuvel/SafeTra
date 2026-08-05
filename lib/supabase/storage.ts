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

        // Ensure "documents" storage bucket exists
        try {
            const { data: buckets } = await supabase.storage.listBuckets()
            const exists = buckets?.some((b: any) => b.name === "documents")
            if (!exists) {
                await supabase.storage.createBucket("documents", {
                    public: true,
                    fileSizeLimit: 10485760, // 10MB
                })
            }
        } catch (bucketErr) {
            console.warn("Storage bucket check warning:", bucketErr)
        }

        const { data, error } = await supabase.storage
            .from("documents")
            .upload(filePath, buffer, {
                contentType: file.type || "image/jpeg",
                cacheControl: "3600",
                upsert: true,
            })

        if (error) {
            console.error("Supabase Storage Error:", error)
            // If bucket 404 occurs, create bucket explicitly and retry once
            if (error.message?.includes("Bucket not found") || (error as any).statusCode === "404" || (error as any).status === 400) {
                try {
                    await supabase.storage.createBucket("documents", { public: true })
                    const retry = await supabase.storage.from("documents").upload(filePath, buffer, {
                        contentType: file.type || "image/jpeg",
                        upsert: true,
                    })
                    if (retry.data?.path) return retry.data.path
                } catch (retryErr) {
                    console.error("Storage bucket retry failed:", retryErr)
                }
            }
            return filePath
        }

        return data?.path || filePath
    } catch (err: any) {
        console.error("Storage upload exception:", err)
        return filePath
    }
}
