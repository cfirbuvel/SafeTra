import { NextResponse } from "next/server"
import { uploadPrivateDocument } from "@/lib/supabase/storage"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Auth check
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user ? user.id : "guest_user"

        // Storage upload
        const path = await uploadPrivateDocument(file, userId)

        // Public URL
        const { data } = supabase.storage
            .from("documents")
            .getPublicUrl(path)

        const publicUrl = data?.publicUrl || `/uploads/${path}`

        return NextResponse.json({ url: publicUrl, path })
    } catch (error: any) {
        console.error("API /api/upload Error:", error)
        return NextResponse.json(
            { error: error?.message || "Failed to upload document" },
            { status: 500 }
        )
    }
}
