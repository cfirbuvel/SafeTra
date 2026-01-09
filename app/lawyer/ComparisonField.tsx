import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

interface ComparisonFieldProps {
    label: string
    userValue?: string | number | null
    extractedValue?: string | number | null
    isMatch?: boolean
}

export function ComparisonField({ label, userValue, extractedValue, isMatch }: ComparisonFieldProps) {
    // If we don't have extracted value, we can't strictly say it matches or not, 
    // but usually we want to highlight discrepancy. 
    // If both empty, it's fine.

    const mismatch = userValue && extractedValue && String(userValue).trim() !== String(extractedValue).trim()

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border-b last:border-0 hover:bg-muted/20">
            <div className="font-medium text-muted-foreground self-center">{label}</div>
            <div className={`p-2 rounded ${mismatch ? "bg-red-100 dark:bg-red-900/20" : ""}`}>
                <span className="text-xs text-muted-foreground block mb-1">הוזן ע״י משתמש</span>
                <div className="font-bold">{userValue || "-"}</div>
            </div>
            <div className={`p-2 rounded ${mismatch ? "bg-red-100 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/10"}`}>
                <span className="text-xs text-muted-foreground block mb-1">זוהה ע״י AI</span>
                <div className="flex justify-between items-center">
                    <span className="font-bold">{extractedValue || "-"}</span>
                    {mismatch ? (
                        <X className="w-4 h-4 text-red-500" />
                    ) : (
                        extractedValue && <Check className="w-4 h-4 text-green-500" />
                    )}
                </div>
            </div>
        </div>
    )
}
