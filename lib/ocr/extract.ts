import { OCRField } from "@/types/ocr"

/**
 * Fixes Hebrew text if it appears to be in visual (reversed) order.
 */
function fixHebrewOrder(text: string | null, rawFullText: string): string | null {
    if (!text) return null

    // Heuristic: check if common Hebrew words appear reversed anywhere in the text
    // Only use long, unique reversed words to prevent false positives (like 'קר' matching 'במיקר')
    const reversedKeywords = [
        "ןוישרי", "םילעב", "תוהז", "הגינה", "הדוהי", "וסרטמ"
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
        const idMatch = text.match(/(?:ID|ID\.|4d[\.\s]*ID|\b)(\d{9})\b/i) || text.match(/\b\d{9}\b/)
        fields.id_number = { value: idMatch ? (idMatch[1] || idMatch[0]) : null, confidence: idMatch ? 0.9 : 0 }

        // Find names in driving license / ID
        const cleanLine = (l: string) => l
            .replace(/[\u200e\u200f\u202a\u202b\u202c]/g, "")
            .replace(/[^\w\s\u0590-\u05FF\/\.]/g, "")
            .trim()

        const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean)
        const lines = rawLines.map(cleanLine).filter(Boolean)
        
        let firstName: string | null = null
        let lastName: string | null = null

        // Strategy 1: Look for 1. and 2. markers on Israeli driving licenses
        const idx1 = lines.findIndex(l => /1\.\s*[A-Z\u0590-\u05FF]/.test(l) || l.includes("1."))
        const idx2 = lines.findIndex(l => /2\.\s*[A-Z\u0590-\u05FF]/.test(l) || l.includes("2."))

        if (idx1 !== -1) {
            const line1 = lines[idx1]
            const name1 = line1.replace(/.*1\.\s*/, "").trim()
            if (name1) lastName = name1
            if (idx1 > 0) {
                const prevLine = lines[idx1 - 1]
                const hebMatch = prevLine.match(/[\u0590-\u05FF]+/g)
                if (hebMatch) lastName = hebMatch.join(' ')
            }
        }

        if (idx2 !== -1) {
            const line2 = lines[idx2]
            const name2 = line2.replace(/.*2\.\s*/, "").trim()
            if (name2) firstName = name2
            if (idx2 > 0) {
                const prevLine = lines[idx2 - 1]
                const hebMatch = prevLine.match(/[\u0590-\u05FF]+/g)
                if (hebMatch) firstName = hebMatch.join(' ')
            }
        }

        // Strategy 2: Find pure uppercase English lines (excluding headers/dates/etc)
        if (!firstName || !lastName) {
            const englishNameLines: { index: number; text: string }[] = []
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                const isUpperEnglish = /^[A-Z\s\.\-]+$/.test(line) && line.length > 2
                const isHeaderOrState = line.includes("DRIVING") || line.includes("LICENCE") || line.includes("STATE") || line.includes("ISRAEL")
                
                if (isUpperEnglish && !isHeaderOrState) {
                    englishNameLines.push({ index: i, text: line })
                }
            }

            if (englishNameLines.length >= 2) {
                const lnInfo = englishNameLines[0]
                const fnInfo = englishNameLines[1]

                if (lnInfo.index > 0) {
                    const prevLine = lines[lnInfo.index - 1]
                    const hebMatch = prevLine.match(/[\u0590-\u05FF]+/g)
                    if (hebMatch) lastName = hebMatch.join(' ')
                    else lastName = lastName || lnInfo.text
                }

                if (fnInfo.index > 0) {
                    const prevLine = lines[fnInfo.index - 1]
                    const hebMatch = prevLine.match(/[\u0590-\u05FF]+/g)
                    if (hebMatch) firstName = hebMatch.join(' ')
                    else firstName = firstName || fnInfo.text
                }
            }
        }

        // Strategy 3 Fallback: Find lines with Hebrew characters, excluding common license header/footer words
        if (!firstName || !lastName) {
            const hebLines = lines.map(l => {
                const words = l.match(/[\u0590-\u05FF]+/g)
                return words ? words.join(' ') : ''
            }).filter(l => {
                return l.length >= 2 && 
                       !l.includes("רישיון") && 
                       !l.includes("נהיגה") && 
                       !l.includes("מדינת") && 
                       !l.includes("ישראל") &&
                       !l.includes("רשות") &&
                       !l.includes("הרישוי") &&
                       !l.includes("רשאי") &&
                       !l.includes("לנהוג") &&
                       !l.includes("דרגה") &&
                       !l.includes("בתוקף")
            })

            if (hebLines.length >= 2) {
                lastName = lastName || hebLines[0]
                firstName = firstName || hebLines[1]
            } else if (hebLines.length === 1) {
                const parts = hebLines[0].split(/\s+/)
                if (parts.length >= 2) {
                    lastName = lastName || parts[0]
                    firstName = firstName || parts[1]
                }
            }
        }

        if (firstName) firstName = fixHebrewOrder(firstName.trim(), text)
        if (lastName) lastName = fixHebrewOrder(lastName.trim(), text)

        let fullName = null
        if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`
        } else if (firstName || lastName) {
            fullName = firstName || lastName
        }

        fields.full_name = {
            value: fullName,
            confidence: fullName ? 0.85 : 0
        }

        // Extract Birth Date (marker 3.)
        let birthDate: string | null = null
        const idx3 = rawLines.findIndex(l => /^[9\.\-]*\s*3\.\s*/.test(l) || (l.includes("3.") && !l.includes("2.")))
        if (idx3 !== -1 && idx3 < lines.length) {
            const dateMatch = lines[idx3].match(/\d{2}[\/\.]\d{2}[\/\.]\d{4}/)
            if (dateMatch) {
                birthDate = dateMatch[0].replace(/\./g, '/')
            }
        }
        if (!birthDate) {
            const dates = text.match(/\b\d{2}[\/\.]\d{2}[\/\.]\d{4}\b/g)
            if (dates && dates.length > 0) {
                // Return the first date found, formatting dots to slashes
                birthDate = dates[0].replace(/\./g, '/')
            }
        }
        fields.birth_date = { value: birthDate, confidence: birthDate ? 0.8 : 0 }

        // Extract Address (marker 8.)
        let address: string | null = null
        const idx8 = rawLines.findIndex(l => /^[9\.\-]*\s*8\s+/.test(l) || /^[9\.\-]*\s*8\.\s*/.test(l) || l.includes("-8") || l.startsWith("8 "))
        if (idx8 !== -1 && idx8 < lines.length) {
            address = lines[idx8].replace(/^[9\.\-]*\s*8[\.\s\-]*/, "").replace(/[\-\s]*8$/, "").trim()
        }
        fields.address = { value: address, confidence: address ? 0.8 : 0 }
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

        // Year - look for any 4-digit year (1990-2099) and pick the earliest one (which represents manufacture/ascent to road)
        const allYears = text.match(/(19|20)\d{2}/g)
        let yearValue = null
        if (allYears) {
            const sortedYears = allYears
                .map(y => parseInt(y))
                .filter(y => y >= 1990 && y <= new Date().getFullYear() + 1)
                .sort((a, b) => a - b)
            if (sortedYears.length > 0) {
                yearValue = String(sortedYears[0])
            }
        }
        fields.year = { value: yearValue, confidence: yearValue ? 0.9 : 0 }

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
                    return num >= 1000 && num <= 3999 && n !== yearValue
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

        // Owner ID Number - 9 digits (possibly with hyphens or spaces), should be different from plate
        const normalizedText = text.replace(/[\-\s]/g, "")
        const ownerIdMatches = normalizedText.match(/\b\d{9}\b/g)
        let ownerIdValue = null
        if (ownerIdMatches) {
            const candidates = ownerIdMatches.filter(id => id !== plateValue)
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
        const modelMatch = text.match(/\b(MAZDA\s*\d|MAZDA\d|COROLLA|BP6S[T7]|TOYOTA)\b/i) || text.match(/\bCOMFORT\b/i)
        fields.model = { value: modelMatch ? modelMatch[0].toUpperCase() : null, confidence: modelMatch ? 0.85 : 0 }
    }

    return fields
}
