"use server"

import { runOCR } from "@/lib/ocr/tesseract"
import { classifyDocument } from "@/lib/ocr/classify"
import { extractFields } from "@/lib/ocr/extract"
import { detectFraud } from "@/lib/ocr/fraud"
import { uploadPrivateDocument } from "@/lib/supabase/storage"
import { OCRResult } from "@/types/ocr"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Main Server Action for OCR processing.
 */
export async function processDocumentAction(formData: FormData): Promise<{ data?: OCRResult; error?: string }> {
    try {
        const file = formData.get("file") as File
        if (!file) return { error: "No file provided" }

        // 1. Auth check
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
        const userId = user ? user.id : "anonymous_user"

        // 2. Conversion & OCR
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { text, confidence } = await runOCR(buffer)
        console.log("--- OCR RAW START ---")
        console.log(text)
        console.log("--- OCR RAW END ---")

        // 3. Classification
        const docType = classifyDocument(text)

        // 4. Extraction
        const fields = extractFields(text, docType)

        // 5. Fraud Detection
        const fraudSignals = detectFraud({
            rawText: text,
            meanConfidence: confidence,
            documentType: docType,
            fields
        })

        // 6. Security: Private Storage upload
        const storagePath = await uploadPrivateDocument(file, userId)

        const result: OCRResult = {
            rawText: text,
            meanConfidence: confidence,
            documentType: docType,
            fields,
            fraudSignals,
            storagePath
        }

        return { data: result }

    } catch (e: any) {
        console.error("OCR Server Action Error:", e)
        return { error: e.message || "Failed to process document" }
    }
}

/**
 * Server Action to upload a document to private storage using service role client, returning the public URL.
 */
export async function uploadDocumentAction(formData: FormData): Promise<{ url?: string; error?: string }> {
    try {
        const file = formData.get("file") as File
        if (!file) return { error: "No file provided" }

        // 1. Auth check
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

        // 2. Upload using private/service role client
        const path = await uploadPrivateDocument(file, userId)

        // Get public URL
        const { data } = supabase.storage
            .from("documents")
            .getPublicUrl(path)

        return { url: data?.publicUrl || `/uploads/${path}` }
    } catch (e: any) {
        console.error("Upload Server Action Error:", e)
        return { error: e.message || "Failed to upload document" }
    }
}
