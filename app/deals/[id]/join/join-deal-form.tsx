"use client"

import { useTransition, useState } from "react"
import { joinDeal } from "@/lib/actions/deals"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2 } from "lucide-react"

export default function JoinDealForm({ dealId, invitationId }: { dealId: string, invitationId?: string }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState("")

    const handleJoin = () => {
        setError("")
        startTransition(async () => {
            const result = await joinDeal(dealId, invitationId)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="space-y-3 pt-2">
            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-right">
                    {error}
                </div>
            )}
            <Button
                onClick={handleJoin}
                disabled={isPending}
                className="w-full h-14 text-base font-bold bg-primary hover:bg-primary-fixed-dim text-on-primary rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
                {isPending ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>מצטרף לעסקה...</span>
                    </>
                ) : (
                    <>
                        <ShieldCheck className="h-5 w-5" />
                        <span>אשר והצטרף לעסקה</span>
                    </>
                )}
            </Button>
        </div>
    )
}
