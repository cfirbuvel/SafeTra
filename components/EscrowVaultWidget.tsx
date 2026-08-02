"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Lock, Upload, CheckCircle2, Clock, Landmark, Copy, Check, ArrowRightLeft, FileText } from "lucide-react"
import { uploadPaymentProofAction, confirmHandoverAction } from "@/lib/actions/deals"

import { useRouter } from "next/navigation"

interface EscrowVaultWidgetProps {
    deal: any
    currentUserId: string
}

export function EscrowVaultWidget({ deal, currentUserId }: EscrowVaultWidgetProps) {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState("")

    const isSeller = currentUserId === deal.seller_id
    const isBuyer = currentUserId === deal.buyer_id || (!isSeller && currentUserId !== deal.seller_id)
    const referenceCode = `ST-${deal.id.slice(0, 4).toUpperCase()}-${deal.id.slice(-4).toUpperCase()}`

    // Internal state tracking for dual sign-off
    const sellerConfirmed = deal.seller_confirmed_delivery || deal.status === "COMPLETED" || deal.status_note?.includes("SELLER_CONFIRMED")
    const buyerConfirmed = deal.buyer_confirmed_delivery || deal.status === "COMPLETED" || deal.status_note?.includes("BUYER_CONFIRMED")

    const copyReferenceCode = async () => {
        if (typeof window !== "undefined" && navigator.clipboard) {
            await navigator.clipboard.writeText(referenceCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleUploadProof = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            setError("אנא בחר קובץ אסמכתת העברה")
            return
        }

        setUploading(true)
        setError("")

        const formData = new FormData()
        formData.append("file", file)

        const result = await uploadPaymentProofAction(deal.id, formData)
        if (result?.error) {
            setError(result.error)
        } else {
            setFile(null)
            router.refresh()
        }
        setUploading(false)
    }

    const handleConfirmHandover = async () => {
        setConfirming(true)
        setError("")
        const role = isSeller ? "seller" : "buyer"
        const result = await confirmHandoverAction(deal.id, role)
        if (result?.error) {
            setError(result.error)
        } else {
            router.refresh()
        }
        setConfirming(false)
    }

    return (
        <Card className="glass-card rounded-2xl border-white/10 p-6 mt-6 overflow-hidden text-right" dir="rtl">
            <CardHeader className="px-0 pt-0 pb-4 border-b border-white/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-on-surface">כספת נאמנות SafeTra 🔒</CardTitle>
                        <p className="text-xs text-on-surface-variant">מנגנון הגנה מוסדי על כספי העסקה בשווי ₪{Number(deal.price_ils).toLocaleString("he-IL")}</p>
                    </div>
                </div>

                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold px-3 py-1">
                    {deal.status === "AWAITING_PAYMENT" && "ממתין להפקדה"}
                    {deal.status === "PAYMENT_VERIFICATION" && "אימות תשלום"}
                    {deal.status === "OWNERSHIP_TRANSFER_PENDING" && "כספים נעולים בנאמנות"}
                    {deal.status === "COMPLETED" && "הושלם ושודר"}
                    {["CANCELLED", "REFUND_PENDING"].includes(deal.status) && "החזר בטיפול"}
                </Badge>
            </CardHeader>

            <CardContent className="px-0 pt-6 space-y-6">

                {/* STAGE 1: AWAITING PAYMENT (Deposit instructions & proof upload) */}
                {deal.status === "AWAITING_PAYMENT" && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-xl bg-surface-container-low border border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-primary">
                                <span className="flex items-center gap-1.5">
                                    <Landmark className="h-4 w-4" />
                                    פרטי חשבון הנאמנות להפקדה בנקאית:
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-white/5">
                                <div>
                                    <span className="text-on-surface-variant text-[10px] block">בנק</span>
                                    <span className="font-bold text-on-surface">בנק לאומי (10)</span>
                                </div>
                                <div>
                                    <span className="text-on-surface-variant text-[10px] block">סניף</span>
                                    <span className="font-bold text-on-surface">680 - מרכז</span>
                                </div>
                                <div>
                                    <span className="text-on-surface-variant text-[10px] block">מספר חשבון נאמנות</span>
                                    <span className="font-bold text-on-surface">987654321</span>
                                </div>
                                <div>
                                    <span className="text-on-surface-variant text-[10px] block">סכום המעובר</span>
                                    <span className="font-bold text-primary">₪{Number(deal.price_ils).toLocaleString("he-IL")}</span>
                                </div>
                            </div>

                            {/* Reference code copy box */}
                            <div className="pt-2">
                                <span className="text-[10px] text-primary font-bold block mb-1">קוד ייחוס חובה לציין בסיבת ההעברה:</span>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant text-sm font-mono font-bold text-primary dir-ltr text-center">
                                        {referenceCode}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={copyReferenceCode}
                                        className="shrink-0 bg-primary/20 text-primary border-primary/30 font-bold"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                        {copied ? "הועתק" : "העתק קוד"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {isBuyer ? (
                            <form onSubmit={handleUploadProof} className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                                <label className="text-xs font-bold text-on-surface block">העלאת אסמכתת העברה בנקאית:</label>
                                <Input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="bg-surface-container-lowest border-outline-variant text-xs cursor-pointer"
                                />
                                <Button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="w-full font-bold bg-primary text-on-primary hover:bg-primary-fixed-dim flex items-center gap-2 justify-center"
                                >
                                    <Upload className="h-4 w-4" />
                                    {uploading ? "מעלה אסמכתא..." : "אשר והעלה אסמכתת תשלום"}
                                </Button>
                            </form>
                        ) : (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                                <Clock className="h-4 w-4 shrink-0" />
                                <span>ממתין לביצוע העברה בנקאית והעלאת אסמכתא ע״י הקונה...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* STAGE 2: PAYMENT VERIFICATION (Lawyer checking) */}
                {deal.status === "PAYMENT_VERIFICATION" && (
                    <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                            <Clock className="h-5 w-5 animate-spin" />
                            <span>הפקדת הנאמנות נבדקת כעת ע״י עורך הדין</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            אסמכתת המעבר התקבלה. עורך הדין המפקח מאמת את קבלת הכספים בחשבון הנאמנות. ברגע שהאימות הושלם, הסטטוס יעודכן לנעילת כספים.
                        </p>
                        {deal.payment_proof_url && (
                            <a
                                href={deal.payment_proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary underline font-bold pt-1"
                            >
                                <FileText className="h-4 w-4" />
                                לצפייה באסמכתא שהועלתה
                            </a>
                        )}
                    </div>
                )}

                {/* STAGE 3: ESCROW LOCKED & DUAL HANDOVER SIGN-OFF */}
                {deal.status === "OWNERSHIP_TRANSFER_PENDING" && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-400">כספים נעולים בנאמנות 🔒</p>
                                    <p className="text-xs text-on-surface-variant">סכום העסקה שמור בכספת עד לאישור מסירה דו-צדדי</p>
                                </div>
                            </div>
                            <span className="text-base font-extrabold text-emerald-400 font-mono">₪{Number(deal.price_ils).toLocaleString("he-IL")}</span>
                        </div>

                        {/* Handover status grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${sellerConfirmed ? 'bg-green-500/10 border-green-500/30' : 'bg-surface-container-low border-white/10'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-on-surface">אישור מסירת מוכר (מפתחות ומסמכים)</span>
                                    {sellerConfirmed ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
                                </div>
                                <p className="text-[11px] text-on-surface-variant">
                                    {sellerConfirmed ? "המוכר אישר את מסירת הרכב" : "ממתין לאישור מסירה מהמוכר"}
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl border ${buyerConfirmed ? 'bg-green-500/10 border-green-500/30' : 'bg-surface-container-low border-white/10'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-on-surface">אישור קבלת קונה (מפתחות ורכב)</span>
                                    {buyerConfirmed ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
                                </div>
                                <p className="text-[11px] text-on-surface-variant">
                                    {buyerConfirmed ? "הקונה אישר את קבלת הרכב" : "ממתין לאישור קבלה מהקונה"}
                                </p>
                            </div>
                        </div>

                        {/* Handover Action Button */}
                        {((isSeller && !sellerConfirmed) || (isBuyer && !buyerConfirmed)) && (
                            <Button
                                onClick={handleConfirmHandover}
                                disabled={confirming}
                                className="w-full font-bold bg-primary text-on-primary hover:bg-primary-fixed-dim py-3 flex items-center gap-2 justify-center"
                            >
                                <ArrowRightLeft className="h-5 w-5" />
                                {confirming ? "מאשר מסירה..." : isSeller ? "אשר מסירת רכב ושחרור כספים" : "אשר קבלת רכב ושחרור כספים"}
                            </Button>
                        )}
                    </div>
                )}

                {/* STAGE 4: COMPLETED (Escrow paid out) */}
                {deal.status === "COMPLETED" && (
                    <div className="p-5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                            <CheckCircle2 className="h-6 w-6" />
                            <span>העסקה הושלמה! הכספים שוחררו בהצלחה 💸</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            העברת הבעלות ואישור המסירה הדו-צדדי הושלמו. כספי הנאמנות בשווי ₪{Number(deal.price_ils).toLocaleString("he-IL")} הועברו למוכר.
                        </p>
                    </div>
                )}

                {/* STAGE 5: REFUND / CANCELLED */}
                {["CANCELLED", "REFUND_PENDING"].includes(deal.status) && (
                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                            <Clock className="h-5 w-5" />
                            <span>העסקה בוטלה - החזר כספי בטיפול ע״י עורך דין</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            כספי העסקה ייבדקו ע״י עורך הדין המפקח ויוחזרו לחשבון הבנק של הקונה.
                        </p>
                    </div>
                )}

                {error && (
                    <p className="text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
