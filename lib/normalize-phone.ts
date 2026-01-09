/**
 * Normalizes a phone number to a standard format (972...)
 */
export function normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "")

    // If it starts with 972, keep it
    if (cleaned.startsWith("972")) return cleaned

    // If it starts with 0, replace with 972
    if (cleaned.startsWith("0")) {
        return "972" + cleaned.substring(1)
    }

    return cleaned
}
