import { NextResponse } from "next/server"
import { runOCR } from "@/lib/ocr/tesseract"
import { classifyDocument } from "@/lib/ocr/classify"
import { extractFields } from "@/lib/ocr/extract"
import { detectFraud } from "@/lib/ocr/fraud"
import { uploadPrivateDocument } from "@/lib/supabase/storage"
import { OCRResult, DocumentType } from "@/types/ocr"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File
        const targetDocType = (formData.get("docType") as DocumentType) || null

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
        const userId = user ? user.id : "anonymous_user"

        // File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // OCR Execution
        const { text, confidence } = await runOCR(buffer)
        console.log("--- OCR RAW START ---")
        console.log(text)
        console.log("--- OCR RAW END ---")

        // Document Classification (Auto-detect type based on image text)
        const autoDetectedType = classifyDocument(text) as DocumentType
        let docType: DocumentType = autoDetectedType !== "unknown" ? autoDetectedType : (targetDocType || "id_card")
        
        const fileName = (file.name || "").toLowerCase()
        if (docType === "unknown" && (fileName.includes("car") || fileName.includes("reg") || fileName.includes("vehicle") || fileName.includes("רישיון"))) {
            docType = "vehicle_registration"
        }

        // Run extraction with final docType based strictly on actual document text
        const fields = extractFields(text, docType)

        const fraudSignals = detectFraud({
            rawText: text,
            meanConfidence: confidence,
            documentType: docType,
            fields
        })

        // Storage upload
        const storagePath = await uploadPrivateDocument(file, userId)

        const result: OCRResult = {
            rawText: text,
            meanConfidence: confidence,
            documentType: docType,
            fields,
            fraudSignals,
            storagePath
        }

        return NextResponse.json({ data: result })
    } catch (error: any) {
        console.error("API /api/ocr Error:", error)
        return NextResponse.json(
            { error: error?.message || "Failed to process document" },
            { status: 500 }
        )
    }
}
