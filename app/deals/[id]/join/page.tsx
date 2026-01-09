import { getDealById } from "@/lib/actions/deals"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { BackButton } from "@/components/BackButton"
import JoinDealForm from "./join-deal-form"

export default async function JoinDealPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ invite?: string }>
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const invitationId = searchParams.invite;

    const user = await getCurrentUser()
    if (!user) {
        redirect(`/auth/login?next=/deals/${params.id}/join${invitationId ? `?invite=${invitationId}` : ""}`)
    }

    const deal = await getDealById(params.id)

    if (!deal) {
        return (
            <>
                <Navbar user={user} />
                <div className="p-8 text-center" dir="rtl">
                    <BackButton href="/dashboard" className="mb-4 mx-auto" />
                    <div>העסקה לא נמצאה או שאין לך הרשאה לצפות בה.</div>
                </div>
            </>
        )
    }

    if (deal.status !== "DRAFT") {
        return (
            <>
                <Navbar user={user} />
                <div className="p-8 text-center" dir="rtl">
                    <BackButton href="/dashboard" className="mb-4 mx-auto" />
                    <div>העסקה כבר אינה ממתינה להצטרפות.</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar user={user} />
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-right" dir="rtl">
                <BackButton href="/dashboard" className="mb-4" />
                <h1 className="text-2xl font-bold mb-4">הוזמנת להצטרף לעסקה</h1>
                <div className="mb-6 p-4 bg-gray-50 rounded">
                    <p className="font-semibold text-lg">{deal.title}</p>
                    <p className="text-gray-600">מחיר: ₪{deal.price_ils.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mt-2">מוכר: {deal.first_name} {deal.last_name || ""}</p>
                </div>

                <JoinDealForm dealId={deal.id} invitationId={invitationId} />
            </div>
        </>
    )
}

