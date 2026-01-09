
import { getDealById, updateDealStatus } from "@/lib/actions/deals"
import { getCurrentUser } from "@/lib/actions/auth"
import { Navbar } from "@/components/Navbar"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ComparisonField } from "../ComparisonField"
import { BackButton } from "@/components/BackButton"
import Image from "next/image"

interface LawyerDealPageProps {
    params: Promise<{ id: string }>
}

const statusLabels: Record<string, string> = {
    DRAFT: "טיוטה",
    SUBMITTED: "הוגשה",
    UNDER_REVIEW: "בבדיקה",
    AWAITING_PAYMENT: "ממתין לתשלום",
    PAYMENT_VERIFICATION: "אימות תשלום",
    OWNERSHIP_TRANSFER_PENDING: "העברת בעלות",
    COMPLETED: "הושלם",
    CANCELLED: "בוטל",
    EXPIRED: "פג תוקף",
}

const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    SUBMITTED: "bg-blue-500",
    UNDER_REVIEW: "bg-yellow-500",
    AWAITING_PAYMENT: "bg-purple-500",
    PAYMENT_VERIFICATION: "bg-orange-500",
    OWNERSHIP_TRANSFER_PENDING: "bg-teal-500",
    COMPLETED: "bg-green-500",
    CANCELLED: "bg-red-500",
    EXPIRED: "bg-gray-700",
}

// Map the next logical step for each status
const nextStepMap: Record<string, { label: string; nextStatus: string; color: string }> = {
    SUBMITTED: { label: "התחל בדיקה", nextStatus: "UNDER_REVIEW", color: "bg-blue-600" },
    UNDER_REVIEW: { label: "אשר ושלח לתשלום", nextStatus: "AWAITING_PAYMENT", color: "bg-green-600" },
    // AWAITING_PAYMENT is usually waiting for Buyer action, but Lawyer can force push if needed? 
    // Probably lawyer waits here until buyer uploads proof, moving it to PAYMENT_VERIFICATION automatically?
    // Or manual toggle? Let's assume manual for now or "Check Bank".
    AWAITING_PAYMENT: { label: "אושר תשלום ידנית", nextStatus: "PAYMENT_VERIFICATION", color: "bg-purple-600" },
    PAYMENT_VERIFICATION: { label: "אשר קבלת כספים", nextStatus: "OWNERSHIP_TRANSFER_PENDING", color: "bg-teal-600" },
    OWNERSHIP_TRANSFER_PENDING: { label: "אשר העברת בעלות ושחרר כספים", nextStatus: "COMPLETED", color: "bg-green-700" },
}

export default async function LawyerDealPage({ params }: LawyerDealPageProps) {
    const { id } = await params
    const [deal, user] = await Promise.all([
        getDealById(id),
        getCurrentUser()
    ])

    if (!user || user.role !== "lawyer") {
        redirect("/")
    }

    if (!deal) {
        return <div>עסקה לא נמצאה</div>
    }

    // TODO: Fetch OCR Data if stored separately (currently assumed strictly in Deal or we need a way to get the "Raw OCR" result if we want side-by-side).
    // For now, we compare Deal columns vs Profile columns or just show them.
    // Ideally, we stored the OCR result in `deal.ocr_data` jsonb column? 
    // Wait, the current implementation maps OCR directly to the form. 
    // So "User Entered" IS the OCR data unless they edited it. 
    // We might want to see the "Original Document" vs "Current Data".

    const nextAction = nextStepMap[deal.status]

    return (
        <>
            <Navbar user={user} />
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <BackButton href="/lawyer" label="חזור ללוח הבקרה" />
                            <h1 className="text-3xl font-bold text-foreground mt-2">בדיקת עסקה: {deal.title}</h1>
                            <Badge className={`mt-2 text-lg ${statusColors[deal.status] || "bg-gray-500"} text-white`}>
                                {statusLabels[deal.status] || deal.status}
                            </Badge>
                        </div>

                        <div className="flex gap-2">
                            {nextAction && (
                                <form action={async () => {
                                    "use server"
                                    await updateDealStatus(deal.id, nextAction.nextStatus)
                                }}>
                                    <Button type="submit" className={nextAction.color} size="lg">
                                        {nextAction.label}
                                    </Button>
                                </form>
                            )}
                            {/* Cancel Button always available */}
                            <form action={async () => {
                                "use server"
                                await updateDealStatus(deal.id, "CANCELLED")
                            }}>
                                <Button type="submit" variant="destructive">
                                    בטל עסקה
                                </Button>
                            </form>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {/* 1. Vehicle Verification */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">פרטי רכב</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">מסמך רכב</h3>
                                    {deal.vehicle_reg_doc_url ? (
                                        <div className="relative aspect-video w-full border roundedoverflow-hidden">
                                            <Image
                                                src={deal.vehicle_reg_doc_url}
                                                alt="רישיון רכב"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-red-500">חסר מסמך</div>
                                    )}
                                </div>
                                <div>
                                    <ComparisonField label="מספר רכב" userValue={deal.license_plate} extractedValue={deal.license_plate} />
                                    <ComparisonField label="יצרן" userValue={deal.vehicle_make} extractedValue={deal.vehicle_make} />
                                    <ComparisonField label="דגם" userValue={deal.vehicle_model} extractedValue={deal.vehicle_model} />
                                    <ComparisonField label="שנה" userValue={deal.vehicle_year} extractedValue={deal.vehicle_year} />
                                </div>
                            </div>
                        </Card>

                        {/* 2. Seller Verification */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">מוכר</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">תעודה מזהה</h3>
                                    {deal.id_doc_url ? (
                                        <div className="relative aspect-video w-full border rounded overflow-hidden">
                                            <Image
                                                src={deal.id_doc_url}
                                                alt="תעודת זהות"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-red-500">חסר מסמך</div>
                                    )}
                                </div>
                                <div>
                                    {/* We use the joined seller profile data */}
                                    <ComparisonField label="שם מלא" userValue={deal.seller?.full_name} extractedValue={"FIXME: OCR Name"} />
                                    <ComparisonField label="ת.ז." userValue={deal.seller?.id_number} extractedValue={"FIXME: OCR ID"} />
                                </div>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </>
    )
}
