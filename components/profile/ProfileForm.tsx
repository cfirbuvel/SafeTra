"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateUserProfile } from "@/lib/actions/users"
import { sendProfileVerificationCode, verifyProfileContact } from "@/lib/actions/auth"
import { AvatarUploader } from "@/components/profile/AvatarUploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    UploadCloud,
    User,
    Info,
    Smartphone,
    Clock
} from "lucide-react"
import { OcrResultCard } from "@/components/OcrResultCard"

interface ProfileFormProps {
    user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form fields
    const [fullName, setFullName] = useState(user.full_name || "")
    const [avatarUrl, setAvatarUrl] = useState(user.image || user.avatar_url || "")
    const [birthDate, setBirthDate] = useState(user.birth_date || user.user_metadata?.birth_date || "")
    const [address, setAddress] = useState(user.address || user.city || user.user_metadata?.address || "")

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

    // ID Document Upload state
    const initialIdDocUrl = user.id_doc_url || user.user_metadata?.id_doc_url || ""
    const [idDocUrl, setIdDocUrl] = useState(initialIdDocUrl)
    const [idDocUploading, setIdDocUploading] = useState(false)
    const [idDocSaved, setIdDocSaved] = useState(Boolean(initialIdDocUrl))

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

    const [isDraggingId, setIsDraggingId] = useState(false)
    const [idDocPreviewUrl, setIdDocPreviewUrl] = useState<string | null>(initialIdDocUrl || null)
    const [ocrResult, setOcrResult] = useState<any>(null)
    const [showOcrJson, setShowOcrJson] = useState(true)

    const processIdFile = async (file: File) => {
        setIdDocUploading(true)
        setError(null)

        if (file.type.startsWith("image/")) {
            setIdDocPreviewUrl(URL.createObjectURL(file))
        } else {
            setIdDocPreviewUrl("pdf")
        }

        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                const uploadData = await res.json()
                if (uploadData.url) {
                    setIdDocUrl(uploadData.url)
                    if (file.type.startsWith("image/")) {
                        setIdDocPreviewUrl(uploadData.url)
                    }
                }
                setIdDocSaved(true)
                setSuccessMessage("מסמך הזיהוי הועלה ונשלח לבדיקת מערכת")
            } else {
                setError("שגיאה בהעלאת מסמך הזיהוי")
                return
            }

            // Run OCR Extraction
            const ocrFormData = new FormData()
            ocrFormData.append("file", file)
            ocrFormData.append("docType", "id_card")

            const ocrRes = await fetch("/api/ocr", {
                method: "POST",
                body: ocrFormData,
            })

            if (ocrRes.ok) {
                const ocrData = await ocrRes.json()
                if (ocrData.data) {
                    setOcrResult(ocrData.data)
                    setShowOcrJson(true)
                    const fields = ocrData.data.fields
                    if (fields?.id_number?.value && !isIdLocked) {
                        setTeudatZehut(fields.id_number.value)
                    }
                    if (fields?.full_name?.value) {
                        setFullName(fields.full_name.value)
                    }
                    if (fields?.birth_date?.value) {
                        setBirthDate(fields.birth_date.value)
                    }
                    if (fields?.address?.value) {
                        setAddress(fields.address.value)
                    }
                    setSuccessMessage("מסמך הזיהוי פוענח בהצלחה! הפרטים עודכנו בטופס.")
                }
            }
        } catch (err) {
            setError("שגיאה בהעלאת המסמך")
        } finally {
            setIdDocUploading(false)
        }
    }

    const handleIdDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processIdFile(file)
    }

    const handleIdDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleIdDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (idDocUploading) return
        setIsDraggingId(true)
    }

    const handleIdDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.currentTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
            return
        }
        setIsDraggingId(false)
    }

    const handleIdDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingId(false)
        if (idDocUploading) return

        const file = e.dataTransfer.files?.[0]
        if (!file) return

        const isValidType = file.type.startsWith("image/") || file.type === "application/pdf" || file.name.endsWith(".pdf")
        if (!isValidType) {
            setError("נא להעלות קבצי תמונה (JPG, PNG) או קובץ PDF בלבד")
            return
        }

        await processIdFile(file)
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

        if (teudatZehut) {
            payload.teudatZehut = teudatZehut
        }

        if (idDocUrl) {
            payload.idDocUrl = idDocUrl
        }

        if (birthDate) {
            payload.birthDate = birthDate
        }

        if (address) {
            payload.address = address
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

    const isShadowEmail = user.isShadowEmail
    const displayEmail = verifiedContact?.type === "email" ? verifiedContact.value : (isShadowEmail ? "לא הוגדר (התחברות טלפונית)" : (user.email || ""))
    const displayPhone = verifiedContact?.type === "phone" ? verifiedContact.value : (user.phone || "לא הוגדר")

    const hasIdDoc = Boolean(idDocSaved || idDocUrl || user.id_doc_url)

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-100">
            {/* Profile Avatar Header */}
            <div className="py-4 flex flex-col items-center gap-2">
                <AvatarUploader
                    currentAvatarUrl={avatarUrl}
                    fullName={fullName}
                    onAvatarChange={(newUrl) => {
                        setAvatarUrl(newUrl)
                        setSuccessMessage("תמונת הפרופיל עודכנה. לחץ על 'שמור שינויים' כדי לחולל עדכון קבוע.")
                    }}
                />
            </div>

            {/* Section 1: Identity Verification (Stitch Screen 1) */}
            <div className="rounded-xl p-5 border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${hasIdDoc ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold font-rubik text-slate-100">אימות זהות</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium ${
                        hasIdDoc
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    }`}>
                        {hasIdDoc ? (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span>מסמך הועלה בהצלחה</span>
                            </>
                        ) : (
                            <>
                                <Clock className="h-3.5 w-3.5 text-amber-400" />
                                <span>ממתין להעלאה</span>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed">
                    על מנת להבטיח את סביבת העסקאות, אנו דורשים אימות מזהה ממשלתי (תעודת זהות או דרכון).
                </p>

                {/* ID Thumbnail Preview */}
                {idDocPreviewUrl && (
                    <div className="relative rounded-xl border border-emerald-500/30 bg-slate-950/80 p-4 flex flex-col items-center gap-3 shadow-xl">
                        {idDocPreviewUrl === "pdf" ? (
                            <div className="flex items-center gap-2 text-emerald-400 font-bold py-6 text-sm">
                                📄 מסמך PDF מאומת הועלה בהצלחה
                            </div>
                        ) : (
                            <img
                                src={idDocPreviewUrl}
                                alt="תצוגה מקדימה של תעודת הזהות"
                                className="max-h-48 w-auto object-contain rounded-lg shadow-md border border-white/10"
                            />
                        )}
                        <div className="flex items-center justify-between w-full border-t border-white/10 pt-2 px-1">
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                תעודת זהות שהועלתה
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-slate-400 hover:text-emerald-400 h-7"
                                onClick={() => {
                                    setIdDocPreviewUrl(null)
                                    setIdDocSaved(false)
                                }}
                            >
                                החלף תמונה
                            </Button>
                        </div>
                    </div>
                )}

                <label
                    onDragOver={handleIdDragOver}
                    onDragEnter={handleIdDragEnter}
                    onDragLeave={handleIdDragLeave}
                    onDrop={handleIdDrop}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                        isDraggingId
                            ? "border-emerald-400 bg-emerald-500/20 scale-[1.01] shadow-xl"
                            : "border-emerald-400/40 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                    }`}
                >
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, application/pdf"
                        className="hidden"
                        onChange={handleIdDocUpload}
                        disabled={idDocUploading}
                    />
                    <div className={`flex flex-col items-center justify-center gap-2 ${isDraggingId ? "pointer-events-none" : ""}`}>
                        {idDocUploading ? (
                            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                        ) : idDocSaved ? (
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        ) : (
                            <UploadCloud className={`h-8 w-8 text-emerald-400 transition-transform duration-200 ${isDraggingId ? "scale-125" : ""}`} />
                        )}
                        <span className="text-sm font-semibold text-emerald-400">
                            {idDocUploading ? "מעלה ומפענח מסמך..." : isDraggingId ? "שחרר את המסמך לכאן" : idDocSaved ? "מסמך הועלה בהצלחה" : "לחץ להעלאת מסמך או גרור לכאן"}
                        </span>
                        <span className="text-xs text-slate-500">JPG, PNG או PDF (עד 5MB)</span>
                    </div>
                </label>

                {/* User-Friendly OCR Results Card */}
                {ocrResult && <OcrResultCard result={ocrResult} />}
            </div>

            {/* Section 2: Phone & Contact Verification (Stitch Screen 2) */}
            <div className="rounded-xl p-5 border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-4 shadow-lg border-r-4 border-r-amber-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold font-rubik text-slate-100">אימות טלפון ודוא״ל</h3>
                    </div>
                </div>

                {/* Phone row */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-300 font-medium flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-slate-400" />
                            מספר טלפון
                        </Label>
                        {isEditingContact !== "phone" && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7"
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
                        <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 space-y-3">
                            <Label htmlFor="newPhone" className="text-xs text-slate-400">
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
                                    className="bg-slate-900 border-slate-800 text-slate-100 h-10"
                                />
                                {!codeSent ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSendCode}
                                        disabled={newContactValue.length < 9 || verificationLoading}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                                    >
                                        {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח קוד"}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCodeSent(false)}
                                        className="border-slate-700 text-slate-300"
                                    >
                                        שינוי
                                    </Button>
                                )}
                            </div>

                            {codeSent && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs text-slate-400">קוד אימות (6 ספרות שנשלח ב-SMS)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            maxLength={6}
                                            placeholder="000000"
                                            className="text-center font-mono tracking-widest bg-slate-900 border-slate-800 text-emerald-400 text-lg h-11"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleVerifyCode}
                                            disabled={otpCode.length < 6 || verificationLoading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
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
                                    className="text-xs text-slate-400"
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
                        <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                            <span className="text-sm font-mono text-slate-200">{displayPhone}</span>
                            {verifiedContact?.type === "phone" ? (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    אומת מחדש
                                </span>
                            ) : (
                                user.phone && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                        מאומת
                                    </span>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Email row */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-300 font-medium flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-slate-400" />
                            כתובת דוא״ל
                        </Label>
                        {isEditingContact !== "email" && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7"
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
                        <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 space-y-3">
                            <Label htmlFor="newEmail" className="text-xs text-slate-400">
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
                                    className="bg-slate-900 border-slate-800 text-slate-100 h-10"
                                />
                                {!codeSent ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSendCode}
                                        disabled={!newContactValue.includes("@") || verificationLoading}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                                    >
                                        {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח קוד"}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCodeSent(false)}
                                        className="border-slate-700 text-slate-300"
                                    >
                                        שינוי
                                    </Button>
                                )}
                            </div>

                            {codeSent && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs text-slate-400">קוד אימות (6 ספרות שנשלח במייל)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            maxLength={6}
                                            placeholder="000000"
                                            className="text-center font-mono tracking-widest bg-slate-900 border-slate-800 text-emerald-400 text-lg h-11"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleVerifyCode}
                                            disabled={otpCode.length < 6 || verificationLoading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
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
                                    className="text-xs text-slate-400"
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
                        <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                            <span className="text-sm text-slate-200" dir="ltr">{displayEmail}</span>
                            {verifiedContact?.type === "email" ? (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    אומת מחדש
                                </span>
                            ) : (
                                !isShadowEmail && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                        מאומת
                                    </span>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Section 3: Personal Details (Stitch Screen 3) */}
            <div className="rounded-xl p-5 border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-4 shadow-lg border-r-4 border-r-emerald-500">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                        <User className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold font-rubik text-slate-100">פרטים אישיים</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-xs text-slate-400 font-medium">שם מלא</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="ישראל ישראלי"
                            required
                            className="bg-slate-950/60 border-slate-800 text-slate-100 h-11 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="teudatZehut" className="text-xs text-slate-400 font-medium">מספר תעודת זהות</Label>
                            {isIdLocked && (
                                <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                                    <Lock className="h-3 w-3" />
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
                                className={`h-11 font-mono ${isIdLocked ? "bg-slate-950/80 text-slate-500 border-slate-800 cursor-not-allowed" : "bg-slate-950/60 border-slate-800 text-slate-100"}`}
                            />
                            {isIdLocked && (
                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-xs text-slate-400 font-medium">תאריך לידה</Label>
                        <Input
                            id="birthDate"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="bg-slate-950/60 border-slate-800 text-slate-100 h-11 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs text-slate-400 font-medium">כתובת / עיר מגורים</Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="עיר, רחוב"
                            className="bg-slate-950/60 border-slate-800 text-slate-100 h-11 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>פרטי תעודת הזהות ניתנים לעריכה דרך תמיכת הלקוחות בלבד מטעמי אבטחה ויושרה משפטית.</span>
                </p>
            </div>

            {/* Error / Success Feedback */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Save Button */}
            <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "שמור שינויים"}
            </Button>
        </form>
    )
}
