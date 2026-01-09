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
        if (!user) return { error: "Unauthorized" }

        // 2. Conversion & OCR
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { text, confidence } = await runOCR(buffer)
        console.log("--- OCR RAW START ---")
        console.log(text)
        console.log("--- OCR RAW END ---")
        console.log(`[DEBUG] OCR Mean Confidence: ${confidence}%`)

        // 3. Classification
        const docType = classifyDocument(text)
        console.log(`[DEBUG] Detected Document Type: ${docType}`)

        // 4. Extraction
        const fields = extractFields(text, docType)
        console.log("[DEBUG] Extracted Fields:", JSON.stringify(fields, null, 2))

        // 5. Fraud Detection
        const fraudSignals = detectFraud({
            rawText: text,
            meanConfidence: confidence,
            documentType: docType,
            fields
        })

        // 6. Security: Private Storage upload
        const storagePath = await uploadPrivateDocument(file, user.id)

        const result: OCRResult = {
            rawText: text,
            meanConfidence: confidence,
            documentType: docType,
            fields,
            fraudSignals,
            storagePath
        }

        console.log("--- DOCUMENT INTELLIGENCE REPORT START ---")
        console.log(JSON.stringify(result, null, 2))
        console.log("--- DOCUMENT INTELLIGENCE REPORT END ---")

        return { data: result }

    } catch (e: any) {
        console.error("OCR Server Action Error:", e)
        return { error: e.message || "Failed to process document" }
    }
}
