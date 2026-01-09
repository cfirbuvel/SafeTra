"use client"

import { useTransition } from "react"
import { joinDeal } from "@/lib/actions/deals"

export default function JoinDealForm({ dealId, invitationId }: { dealId: string, invitationId?: string }) {
    const [isPending, startTransition] = useTransition()

    const handleJoin = () => {
        startTransition(async () => {
            const result = await joinDeal(dealId, invitationId)
            if (result.error) {
                alert(result.error)
            }
        })
    }

    return (
        <button
            onClick={handleJoin}
            disabled={isPending}
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
            {isPending ? "מצטרף..." : "אשר והצטרף לעסקה"}
        </button>
    )
}
