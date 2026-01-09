export function classifyDocument(text: string): "id_card" | "driving_license" | "vehicle_registration" | "unknown" {
    const lowerText = text.toLowerCase();

    // Heuristics for Vehicle Registration (Rishayon Rechev)
    if (
        lowerText.includes("רישיון רכב") ||
        lowerText.includes("רכב") ||
        lowerText.includes("שלדה") ||
        lowerText.includes("בעלים") ||
        lowerText.includes("משקל")
    ) {
        return "vehicle_registration";
    }

    // Heuristics for Driving License (Rishayon Nehiga)
    if (
        lowerText.includes("רישיון נהיגה") ||
        lowerText.includes("driving license") ||
        lowerText.includes("driving licence") ||  // British spelling
        lowerText.includes("נהיגה") ||
        lowerText.includes("דרגת") ||
        lowerText.includes("קוד הגבלה")
    ) {
        return "driving_license";
    }

    // Heuristics for ID Card (Teudat Zehut)
    if (
        lowerText.includes("תעודת זהות") ||
        lowerText.includes("identity card") ||
        lowerText.includes("מקום לידה") ||
        lowerText.includes("אזרחות")
    ) {
        return "id_card";
    }

    return "unknown";
}
