export type OCRField = {
    value: string | null
    confidence: number
}

export type DocumentType = "id_card" | "driving_license" | "vehicle_registration" | "unknown"

export type OCRResult = {
    rawText: string
    meanConfidence: number
    documentType: DocumentType
    fields: Record<string, OCRField>
    fraudSignals: string[]
    storagePath: string
}
