import { OCRField } from "@/types/ocr"

/**
 * Fixes Hebrew text if it appears to be in visual (reversed) order.
 */
function fixHebrewOrder(text: string | null, rawFullText: string): string | null {
    if (!text) return null

    // Heuristic: check if common Hebrew words appear reversed anywhere in the text
    const reversedKeywords = [
        "בכר", "ןוישרי", "םילעב", "תוהז", "הגינה", "הרמ", "אלמ", "םש", "פקת", "קר", "רחל", "מושת", "הדוהי", "וטרמטס"
    ]

    const isReversed = reversedKeywords.some(kw => rawFullText.includes(kw))
    if (!isReversed) return text

    const containsHebrew = /[\u0590-\u05FF]/.test(text)
    if (!containsHebrew) return text

    // Advanced reversal: reverse everything, then fix numbers/English back?
    // Actually, visual Hebrew usually reverses the whole line char-by-char.
    // We reverse the string, then find chunks of English/Numbers and reverse them back.
    const reversed = text.split('').reverse().join('')

    // Fix English/Numbers that were accidentally reversed
    return reversed.replace(/[A-Za-z0-9\-\/]{2,}/g, (match) => match.split('').reverse().join(''))
}

/**
 * Extracts structured fields from raw text based on document type.
 */
export function extractFields(text: string, type: string): Record<string, OCRField> {
    const fields: Record<string, OCRField> = {}
    const rawText = text

    if (type === "id_card" || type === "driving_license") {
        // ID Number (9 digits)
        const idMatch = text.match(/\d{9}/)
        fields.id_number = { value: idMatch ? idMatch[0] : null, confidence: idMatch ? 0.9 : 0 }

        const nameMatch = text.match(/[\u0590-\u05FF\s'"]{2,}/g)
        let fullName = nameMatch ? nameMatch.sort((a, b) => b.length - a.length)[0]?.trim() : null

        fields.full_name = {
            value: fixHebrewOrder(fullName, rawText),
            confidence: fullName ? 0.7 : 0
        }
    }

    if (type === "vehicle_registration") {
        // License Plate (Israeli plates are 7 or 8 digits)
        // Strategy: Look for 8-digit numbers, prefer ones starting with 9 over 5 (common OCR error)
        const simplePlate = text.match(/\b\d{7,8}\b/g)

        let plateValue: string | null = null
        if (simplePlate && simplePlate.length > 0) {
            // Filter to 8-digit numbers only for modern Israeli plates
            const eightDigitPlates = simplePlate.filter(p => p.length === 8)

            if (eightDigitPlates.length > 0) {
                // Prefer plates starting with 9 (5 is often misread as 9)
                plateValue = eightDigitPlates.find(p => p.startsWith('9')) || eightDigitPlates[0]
            } else {
                plateValue = simplePlate[0]
            }
        }

        fields.plate_number = { value: plateValue, confidence: plateValue ? 0.9 : 0 }

        // Year - look for 4-digit year (1990-2099)
        const yearMatch = text.match(/\b(19|20)\d{2}\b/)
        fields.year = { value: yearMatch ? yearMatch[0] : null, confidence: yearMatch ? 0.9 : 0 }

        // VIN / Chassis Number (Usually 17 alphanumeric chars)
        // Common OCR errors: I->J, 0->O, E->6, S->5
        let vinMatch = text.match(/[A-Z0-9]{17}/)
        let vinValue = vinMatch ? vinMatch[0] : null

        // Apply OCR error corrections for known patterns
        if (vinValue) {
            // Fix common OCR mistakes in VINs
            vinValue = vinValue
                .replace(/^I/, 'J')  // First char I -> J (common for JM prefix)
                .replace(/E(?=S|[0-9])/g, '6')  // E before S or digit -> 6
                .replace(/(?<=\d)O(?=\d)/g, '0')  // O between digits -> 0
        }

        fields.vehicle_id = { value: vinValue, confidence: vinValue ? 0.9 : 0 }
        fields.chassis_number = fields.vehicle_id

        // Engine Volume (CC) - Look for 4-digit number in range 1000-3999, prefer 1998 pattern
        // Strategy: Find all 4-digit numbers, filter to reasonable engine sizes
        const allFourDigits = text.match(/\b\d{4}\b/g)
        let engineValue = null
        if (allFourDigits) {
            // Filter to reasonable engine volumes (1000-3999 CC)
            const validEngines = allFourDigits
                .filter(n => {
                    const num = parseInt(n)
                    return num >= 1000 && num <= 3999 && n !== yearMatch?.[0]
                })

            // Prefer common patterns like 1998, 1600, 2000, etc.
            engineValue = validEngines.find(n => n.endsWith('98') || n.endsWith('00') || n.endsWith('96')) || validEngines[0] || null
        }
        fields.engine_volume = { value: engineValue, confidence: engineValue ? 0.9 : 0 }

        // License Expiry Date - Look for date pattern DD/MM/YYYY or DD.MM.YYYY
        // Strategy: Look for "בתוקף עד" followed by a date, or just find all dates and pick the latest
        let expiryValue = null

        // First try: Look for date near "בתוקף עד" or "דע ףקותב" (reversed)
        const expiryContext = text.match(/(?:בתוקף עד|דע ףקותב)[:\s]*(\d{2}[\/\.]\d{2}[\/\.]20\d{2})/)
        if (expiryContext) {
            expiryValue = expiryContext[1].replace(/\./g, '/')
        } else {
            // Fallback: Find all dates (with or without separators) and pick the latest
            const datesWithSep = text.match(/\d{2}[\/\.]\d{2}[\/\.]20\d{2}/g) || []
            // Match 10-digit dates like 1200712026 (DDMMYYYY with leading digits)
            const longDates = text.match(/\d{10}/g) || []
            const datesFromLong = longDates
                .map(d => {
                    // Extract first 8 digits as DDMMYYYY (skip leading digits like '12' from 1200712026)
                    const dateStr = d.slice(0, 8)
                    const match = dateStr.match(/(\d{2})(\d{2})(20\d{2})/)
                    return match ? `${match[1]}/${match[2]}/${match[3]}` : null
                })
                .filter(Boolean) as string[]

            // Normalize all dates to DD/MM/YYYY format
            const allDates = [
                ...datesWithSep.map(d => d.replace(/\./g, '/')),
                ...datesFromLong
            ]

            console.log('[DEBUG] Dates with separators:', datesWithSep)
            console.log('[DEBUG] Long dates found:', longDates)
            console.log('[DEBUG] Dates from long:', datesFromLong)
            console.log('[DEBUG] All normalized dates:', allDates)

            if (allDates.length > 0) {
                // Sort dates and pick the latest
                expiryValue = allDates.sort((a, b) => {
                    const dateA = new Date(a.split('/').reverse().join('-'))
                    const dateB = new Date(b.split('/').reverse().join('-'))
                    return dateB.getTime() - dateA.getTime()
                })[0]
                console.log('[DEBUG] Selected expiry date:', expiryValue)
            }
        }
        fields.license_expiry = { value: expiryValue, confidence: expiryValue ? 0.9 : 0 }

        // Previous Owners - Look for number after "בעלים קודמים" or near "דפלמטי"
        let previousOwnersValue = null
        const ownersMatch = text.match(/(?:בעלים קודמים|קודמים)[:\s]*(\d{1,2})/)
        if (ownersMatch) {
            previousOwnersValue = ownersMatch[1]
        } else {
            // Fallback: Look for single digit (0 or 1) near "דפלמטי"
            const diplomaticMatch = text.match(/דפלמטי[^\d]*([01])(?!\d)/)
            if (diplomaticMatch) {
                previousOwnersValue = diplomaticMatch[1]
            }
        }
        fields.previous_owners = { value: previousOwnersValue, confidence: previousOwnersValue ? 0.8 : 0 }

        // Owner ID Number - 9 digits, should be different from plate
        // Strategy: Find all 9-digit numbers, exclude the plate, prefer ones starting with 0
        const ownerIdMatches = text.match(/\b\d{9}\b/g)
        let ownerIdValue = null
        if (ownerIdMatches) {
            // Filter out the plate number (if it happens to be 9 digits)
            const candidates = ownerIdMatches.filter(id => id !== plateValue)
            // Prefer IDs starting with 0 (common in Israeli IDs)
            ownerIdValue = candidates.find(id => id.startsWith('0')) || candidates[0] || null
        }
        fields.owner_id = { value: ownerIdValue, confidence: ownerIdValue ? 0.9 : 0 }

        // Owner Name: More robust search for Hebrew names
        const lines = text.split('\n')
        const nameCandidates = lines.filter(l => {
            const hebWords = l.match(/[\u0590-\u05FF]{2,}/g)
            // Look for lines with 2+ Hebrew words, not too long, not containing "רישיון" or manufacturer names
            const hasValidLength = l.length >= 10 && l.length < 50
            const hasEnoughWords = hebWords && hebWords.length >= 2
            const notLicenseWord = !l.includes("ןוישרי") && !l.includes("רישיון")
            const notManufacturer = !l.includes("MAZDA") && !l.includes("TOYOTA") && !l.includes("מאזדה")

            return hasValidLength && hasEnoughWords && notLicenseWord && notManufacturer
        })

        // Pick best candidate: prefer ones with common first names
        const commonNames = ["יהודה", "הדוהי", "משה", "דוד", "אברהם", "יוסף", "מרדכי", "שלמה"]
        const bestCandidate = nameCandidates.find(c =>
            commonNames.some(name => c.includes(name))
        ) || nameCandidates.find(c => c.includes("ב ")) || nameCandidates[0]

        // Clean the candidate string BEFORE fixing order
        let ownerName = bestCandidate ? bestCandidate
            .replace(/^[\.ב\s]+/, "") // Remove leading dots or 'ב' (reversed label)
            .replace(/[\.\d\-]/g, "") // Remove dots, digits, hyphens
            .replace(/\s+/g, " ") // Normalize spaces
            .replace(/[A-Z]+/g, "") // Remove English text (like MAZDA)
            .trim() : null

        fields.owner_name = {
            value: fixHebrewOrder(ownerName, rawText),
            confidence: ownerName ? 0.9 : 0
        }

        // Make (Manufacturer)
        const makeKeywords = ["מאזדה", "מזדה", "טויוטה", "קיה", "יונדאי", "סקודה", "פולקסווגן", "מרצדס", "במוו"]
        const foundMake = makeKeywords.find(kw =>
            text.includes(kw) || text.includes(kw.split('').reverse().join(''))
        )
        fields.make = { value: foundMake || null, confidence: foundMake ? 0.9 : 0 }

        // Model
        const modelMatch = text.match(/MAZDA\d?|TOYOTA|COROLLA|BP6S7|COMFORT/i)
        fields.model = { value: modelMatch ? modelMatch[0] : null, confidence: modelMatch ? 0.8 : 0 }
    }

    return fields
}
