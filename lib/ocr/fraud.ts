import { OCRResult } from "@/types/ocr"

/**
 * Detects suspicious signals based on OCR results.
 */
export function detectFraud(result: Partial<OCRResult>): string[] {
    const signals: string[] = []

    // 1. Low Confidence
    if (result.meanConfidence && result.meanConfidence < 50) {
        signals.push("low_ocr_confidence")
    }

    // 2. Expiry Check
    if (result.fields?.expiry_date?.value) {
        const expiry = parseDate(result.fields.expiry_date.value)
        if (expiry && expiry < new Date()) {
            signals.push("expired_document")
        }
    }

    // 3. Missing Critical Fields
    if (result.documentType === "id_card" && !result.fields?.id_number?.value) {
        signals.push("missing_required_fields")
    }

    if (result.documentType === "vehicle_registration" && !result.fields?.plate_number?.value) {
        signals.push("missing_required_fields")
    }

    // 4. Manual Tampering Heuristics (Suspicious Keywords)
    const suspiciousKeywordsList = ["sample", "specimen", "void", "copy", "test"]
    const rawTextLower = (result.rawText || "").toLowerCase()
    if (suspiciousKeywordsList.some(kw => rawTextLower.includes(kw))) {
        signals.push("suspicious_keywords")
    }

    return signals
}

function parseDate(dateStr: string): Date | null {
    const parts = dateStr.split(/[\/\.]/)
    if (parts.length === 3) {
        const d = parseInt(parts[0])
        const m = parseInt(parts[1]) - 1
        const y = parseInt(parts[2])
        return new Date(y, m, d)
    }
    return null
}
