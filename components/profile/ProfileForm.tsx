"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUserProfile } from "@/lib/actions/users"
import { sendProfileVerificationCode, verifyProfileContact } from "@/lib/actions/auth"
import { AvatarUploader } from "@/components/profile/AvatarUploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Mail, Phone, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface ProfileFormProps {
    user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form fields
    const [fullName, setFullName] = useState(user.full_name || "")
    const [avatarUrl, setAvatarUrl] = useState(user.image || user.avatar_url || "")

    // ID Number lock status
    const existingId = user.id_number || user.teudat_zehut || ""
    const isIdLocked = Boolean(existingId)
    const [teudatZehut, setTeudatZehut] = useState(existingId)

    // Contact modification state (Phone & Email verification)
    const [isEditingContact, setIsEditingContact] = useState<"none" | "email" | "phone">("none")
    const [newContactValue, setNewContactValue] = useState("")
    const [verificationLoading, setVerificationLoading] = useState(false)
    const [codeSent, setCodeSent] = useState(false)
    const [otpCode, setOtpCode] = useState("")
    const [verifiedContact, setVerifiedContact] = useState<{ type: "email" | "phone"; value: string } | null>(null)

    // Alert feedback
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSendCode = async () => {
        if (!newContactValue) return
        setVerificationLoading(true)
        setError(null)
        const res = await sendProfileVerificationCode(newContactValue)
        if (res.success) {
            setCodeSent(true)
        } else {
            setError(res.message || "שגיאה בשליחת הקוד")
        }
        setVerificationLoading(false)
    }

    const handleVerifyCode = async () => {
        if (!otpCode) return
        setVerificationLoading(true)
        setError(null)
        const res = await verifyProfileContact(newContactValue, otpCode)
        if (res.success) {
            setVerifiedContact({
                type: isEditingContact as "email" | "phone",
                value: newContactValue,
            })
            setCodeSent(false)
            setIsEditingContact("none")
            setOtpCode("")
            setNewContactValue("")
            setSuccessMessage("פרטי הקשר אומתו בהצלחה!")
        } else {
            setError(res.message || "קוד שגוי")
        }
        setVerificationLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        const payload: any = {
            fullName,
            avatarUrl,
        }

        if (!isIdLocked && teudatZehut) {
            payload.teudatZehut = teudatZehut
        }

        if (verifiedContact) {
            if (verifiedContact.type === "email") {
                payload.email = verifiedContact.value
            } else if (verifiedContact.type === "phone") {
                payload.phone = verifiedContact.value
            }
        }

        const result = await updateUserProfile(payload)

        if (result.success) {
            setSuccessMessage("הפרופיל עודכן בהצלחה!")
            router.refresh()
        } else {
            setError(result.error || "שגיאה בעדכון הפרופיל")
        }
        setLoading(false)
    }

    // Displays real email vs shadow email
    const isShadowEmail = user.isShadowEmail
    const displayEmail = verifiedContact?.type === "email" ? verifiedContact.value : (isShadowEmail ? "לא הוגדר (התחברות טלפונית)" : (user.email || ""))
    const displayPhone = verifiedContact?.type === "phone" ? verifiedContact.value : (user.phone || "לא הוגדר")

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar section */}
            <div className="py-2 flex justify-center">
                <AvatarUploader
                    currentAvatarUrl={avatarUrl}
                    fullName={fullName}
                    onAvatarChange={(newUrl) => {
                        setAvatarUrl(newUrl)
                        setSuccessMessage("תמונת הפרופיל עודכנה. לחץ על 'שמור שינויים' כדי לשמור באופן קבוע.")
                    }}
                />
            </div>

            {/* Personal info fields */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700 font-medium">שם מלא</Label>
                    <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="ישראל ישראלי"
                        required
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="teudatZehut" className="text-slate-700 font-medium">מספר תעודת זהות</Label>
                        {isIdLocked && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Lock className="h-3 w-3 text-amber-600" />
                                נעול מטעמי אבטחה
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            id="teudatZehut"
                            value={teudatZehut}
                            onChange={(e) => setTeudatZehut(e.target.value)}
                            placeholder="123456789"
                            disabled={isIdLocked}
                            className={`h-11 ${isIdLocked ? "bg-slate-100/80 text-slate-500 font-mono cursor-not-allowed" : ""}`}
                        />
                        {isIdLocked && (
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        )}
                    </div>
                </div>

                {/* Email Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-700 font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            כתובת דוא״ל
                        </Label>
                        {isEditingContact !== "email" && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary h-8 hover:bg-primary/5"
                                onClick={() => {
                                    setIsEditingContact("email")
                                    setNewContactValue("")
                                    setCodeSent(false)
                                    setError(null)
                                }}
                            >
                                עדכן מייל
                            </Button>
                        )}
                    </div>

                    {isEditingContact === "email" ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                            <Label htmlFor="newEmail" className="text-xs font-medium text-slate-600">
                                הזן כתובת דוא״ל חדשה לאימות
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="newEmail"
                                    type="email"
                                    placeholder="example@domain.com"
                                    value={newContactValue}
                                    onChange={(e) => setNewContactValue(e.target.value)}
                                    disabled={codeSent || verificationLoading}
                                    className="h-10 text-sm"
                                />
                                {!codeSent ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSendCode}
                                        disabled={!newContactValue.includes("@") || verificationLoading}
                                    >
                                        {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח קוד"}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCodeSent(false)}
                                    >
                                        שינוי
                                    </Button>
                                )}
                            </div>

                            {codeSent && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs text-slate-600">קוד אימות (6 ספרות שנשלח במייל)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            maxLength={6}
                                            placeholder="000000"
                                            className="text-center font-mono tracking-widest h-10"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleVerifyCode}
                                            disabled={otpCode.length < 6 || verificationLoading}
                                        >
                                            {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground"
                                    onClick={() => {
                                        setIsEditingContact("none")
                                        setCodeSent(false)
                                    }}
                                >
                                    ביטול
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-md border border-slate-200/60">
                            <span className="text-sm font-medium text-slate-700">{displayEmail}</span>
                            {verifiedContact?.type === "email" ? (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    אומת מחדש
                                </span>
                            ) : (
                                !isShadowEmail && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        מאומת
                                    </span>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Phone Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-700 font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            מספר טלפון
                        </Label>
                        {isEditingContact !== "phone" && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary h-8 hover:bg-primary/5"
                                onClick={() => {
                                    setIsEditingContact("phone")
                                    setNewContactValue("")
                                    setCodeSent(false)
                                    setError(null)
                                }}
                            >
                                עדכן טלפון
                            </Button>
                        )}
                    </div>

                    {isEditingContact === "phone" ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                            <Label htmlFor="newPhone" className="text-xs font-medium text-slate-600">
                                הזן מספר טלפון חדש לאימות (SMS)
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="newPhone"
                                    type="tel"
                                    placeholder="050-0000000"
                                    value={newContactValue}
                                    onChange={(e) => setNewContactValue(e.target.value)}
                                    disabled={codeSent || verificationLoading}
                                    className="h-10 text-sm"
                                />
                                {!codeSent ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSendCode}
                                        disabled={newContactValue.length < 9 || verificationLoading}
                                    >
                                        {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח קוד"}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCodeSent(false)}
                                    >
                                        שינוי
                                    </Button>
                                )}
                            </div>

                            {codeSent && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs text-slate-600">קוד אימות (6 ספרות שנשלח ב-SMS)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            maxLength={6}
                                            placeholder="000000"
                                            className="text-center font-mono tracking-widest h-10"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleVerifyCode}
                                            disabled={otpCode.length < 6 || verificationLoading}
                                        >
                                            {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground"
                                    onClick={() => {
                                        setIsEditingContact("none")
                                        setCodeSent(false)
                                    }}
                                >
                                    ביטול
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-md border border-slate-200/60">
                            <span className="text-sm font-medium text-slate-700 font-mono">{displayPhone}</span>
                            {verifiedContact?.type === "phone" ? (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    אומת מחדש
                                </span>
                            ) : (
                                user.phone && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        מאומת
                                    </span>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Error / Success Feedback */}
            {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Save Button */}
            <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-md transition-all hover:shadow-lg"
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "שמור שינויים"}
            </Button>
        </form>
    )
}
