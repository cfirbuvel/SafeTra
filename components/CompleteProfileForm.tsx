"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeProfile } from "@/lib/actions/users"
import { sendProfileVerificationCode, verifyProfileContact } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Phone, Mail, Loader2 } from "lucide-react"

interface CompleteProfileFormProps {
    user: any
    next: string
}

export function CompleteProfileForm({ user, next }: CompleteProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [verificationLoading, setVerificationLoading] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [otpCode, setOtpCode] = useState("")
    const [contactValue, setContactValue] = useState("")
    const [error, setError] = useState<string | null>(null)

    // Decide what info we need
    const isShadowEmail = user?.isShadowEmail
    const needEmail = isShadowEmail
    const needPhone = !isShadowEmail && !user?.phone

    const handleSendCode = async () => {
        if (!contactValue) return
        setVerificationLoading(true)
        setError(null)
        const res = await sendProfileVerificationCode(contactValue)
        if (res.success) {
            setCodeSent(true)
        } else {
            setError(res.message)
        }
        setVerificationLoading(false)
    }

    const handleVerifyCode = async () => {
        if (!otpCode) return
        setVerificationLoading(true)
        setError(null)
        const res = await verifyProfileContact(contactValue, otpCode)
        if (res.success) {
            setIsVerified(true)
        } else {
            setError(res.message)
        }
        setVerificationLoading(false)
    }

    return (
        <form
            action={async (formData) => {
                if (!isVerified) {
                    setError("יש לאמת את פרטי הקשר תחילה")
                    return
                }
                setLoading(true)
                setError(null)
                const res = await completeProfile(formData)
                if (res.success) {
                    router.push(res.next)
                } else {
                    setError(res.error || "שגיאה בעדכון הפרופיל")
                    setLoading(false)
                }
            }}
            className="space-y-4"
        >
            <input type="hidden" name="next" value={next} />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי</Label>
                    <Input id="firstName" name="firstName" required disabled={loading} placeholder="ישראל" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה</Label>
                    <Input id="lastName" name="lastName" required disabled={loading} placeholder="ישראלי" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="teudatZehut">תעודת זהות</Label>
                <Input id="teudatZehut" name="teudatZehut" required disabled={loading} placeholder="123456789" />
            </div>

            <div className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Label htmlFor="contact">
                        {needEmail ? "כתובת דוא״ל לאימות" : "מספר טלפון לאימות"}
                    </Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            {needEmail ? (
                                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                            ) : (
                                <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                            )}
                            <Input
                                id="contact"
                                name={needEmail ? "email" : "phone"}
                                type={needEmail ? "email" : "tel"}
                                required
                                disabled={loading || isVerified || codeSent}
                                className="pl-10"
                                placeholder={needEmail ? "example@email.com" : "050-0000000"}
                                value={contactValue}
                                onChange={(e) => setContactValue(e.target.value)}
                            />
                        </div>
                        {!isVerified && !codeSent && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSendCode}
                                disabled={!contactValue || verificationLoading}
                            >
                                {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח קוד"}
                            </Button>
                        )}
                        {isVerified && (
                            <div className="flex items-center text-green-600 gap-1 px-3 bg-green-50 rounded-md border border-green-200">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-xs font-bold">מאומת</span>
                            </div>
                        )}
                    </div>
                </div>

                {codeSent && !isVerified && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="otp">קוד אימות (6 ספרות)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="otp"
                                maxLength={6}
                                placeholder="000000"
                                className="text-center tracking-[0.5em] font-mono"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                            />
                            <Button
                                type="button"
                                onClick={handleVerifyCode}
                                disabled={otpCode.length < 6 || verificationLoading}
                            >
                                {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCodeSent(false)}
                                className="text-xs"
                            >
                                שנה {needEmail ? "מייל" : "טלפון"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-sm font-medium text-destructive text-center bg-destructive/10 p-2 rounded-md">{error}</p>}

            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading || !isVerified}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "שמור והמשך"}
            </Button>

            {!isVerified && (
                <p className="text-xs text-muted-foreground text-center">
                    לחץ על "שלח קוד" כדי לקבל {needEmail ? "קישור" : "קוד"} אימות
                </p>
            )}
        </form>
    )
}
