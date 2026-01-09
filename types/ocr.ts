export type OCRField = {
    value: string | null
    confidence: number
}

export type OCRResult = {
    rawText: string
    meanConfidence: number
    documentType: "id_card" | "driving_license" | "vehicle_registration" | "unknown"
    fields: Record<string, OCRField>
    fraudSignals: string[]
    storagePath: string
}
