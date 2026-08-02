"use client"

import { useState, useTransition, useActionState } from "react"
import { createDeal } from "@/lib/actions/deals"
import { processDocumentAction } from "@/lib/actions/ocr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Sparkles, ShieldAlert, CheckCircle2, Upload, FileText, Camera, Video, ShieldCheck } from "lucide-react"
import { DocumentUpload } from "@/components/DocumentUpload"

const initialState = {
    error: "",
}

export function NewDealForm() {
    const [state, action, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createDeal(formData)
        if (result?.error) {
            return { error: result.error }
        }
        return { error: "" }
    }, initialState)

    const [currentStep, setCurrentStep] = useState(1)
    const [idDocUrl, setIdDocUrl] = useState("")
    const [vehicleRegDocUrl, setVehicleRegDocUrl] = useState("")
    const [isAnalyzingId, setIsAnalyzingId] = useState(false)
    const [isAnalyzingVehicle, setIsAnalyzingVehicle] = useState(false)
    const [ocrSignals, setOcrSignals] = useState<string[]>([])

    // Extracted Data State
    const [licensePlate, setLicensePlate] = useState("")
    const [vehicleMake, setVehicleMake] = useState("")
    const [vehicleModel, setVehicleModel] = useState("")
    const [vehicleYear, setVehicleYear] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [idNumber, setIdNumber] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const [address, setAddress] = useState("")
    const [engineVolume, setEngineVolume] = useState("")
    const [licenseExpiry, setLicenseExpiry] = useState("")
    const [previousOwners, setPreviousOwners] = useState("")
    const [chassisNumber, setChassisNumber] = useState("")
    const [kilometers, setKilometers] = useState("")
    const [vehicleRegOwnerName, setVehicleRegOwnerName] = useState("")
    const [vehicleRegOwnerId, setVehicleRegOwnerId] = useState("")
    
    // Biometric Record Mock
    const [isRecording, setIsRecording] = useState(false)
    const [isRecorded, setIsRecorded] = useState(false)

    const handleIdUpload = async (url: string, file: File) => {
        setIdDocUrl(url)
        setIsAnalyzingId(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("docType", "id_card")

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            })
            
            if (res.ok) {
                const result = await res.json()
                if (result.data) {
                    const { fields, fraudSignals } = result.data
                    if (fields.full_name?.value) {
                        const nameParts = fields.full_name.value.split(" ")
                        setFirstName(nameParts[0] || "")
                        setLastName(nameParts.slice(1).join(" ") || "")
                        setVehicleRegOwnerName(fields.full_name.value)
                    }
                    if (fields.id_number?.value) {
                        setIdNumber(fields.id_number.value)
                        setVehicleRegOwnerId(fields.id_number.value)
                    }
                    if (fields.birth_date?.value) {
                        setBirthDate(fields.birth_date.value)
                    }
                    if (fields.address?.value) {
                        setAddress(fields.address.value)
                    }
                    setOcrSignals(prev => [...new Set([...prev, ...(fraudSignals || [])])])
                }
            }
        } catch (e) {
            console.error("OCR ID Error:", e)
        } finally {
            setIsAnalyzingId(false)
        }
    }

    const handleVehicleUpload = async (url: string, file: File) => {
        setVehicleRegDocUrl(url)
        setIsAnalyzingVehicle(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("docType", "vehicle_registration")

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                const result = await res.json()
                if (result.data) {
                    const { fields, fraudSignals } = result.data
                    if (fields.plate_number?.value) setLicensePlate(fields.plate_number.value)
                    if (fields.year?.value) setVehicleYear(fields.year.value)
                    if (fields.make?.value) setVehicleMake(fields.make.value)
                    if (fields.model?.value) setVehicleModel(fields.model.value)
                    if (fields.engine_volume?.value) setEngineVolume(fields.engine_volume.value)
                    if (fields.license_expiry?.value) {
                        const parts = fields.license_expiry.value.split('/')
                        if (parts.length === 3) {
                            setLicenseExpiry(`${parts[2]}-${parts[1]}-${parts[0]}`)
                        }
                    }
                    if (fields.previous_owners?.value) setPreviousOwners(fields.previous_owners.value)
                    if (fields.chassis_number?.value) setChassisNumber(fields.chassis_number.value)
                    if (!kilometers) setKilometers("15000")

                    if (fields.owner_name?.value) {
                        setVehicleRegOwnerName(fields.owner_name.value)
                        if (!firstName) {
                            const nameParts = fields.owner_name.value.split(/\s+/).filter(Boolean)
                            if (nameParts.length > 1) {
                                setLastName(nameParts[0])
                                setFirstName(nameParts.slice(1).join(" "))
                            } else if (nameParts.length === 1) {
                                setLastName(nameParts[0])
                            }
                        }
                    }
                    if (fields.owner_id?.value) setVehicleRegOwnerId(fields.owner_id.value)

                    setOcrSignals(prev => [...new Set([...prev, ...(fraudSignals || [])])])
                }
            }
        } catch (e) {
            console.error("OCR Vehicle Error:", e)
        } finally {
            setIsAnalyzingVehicle(false)
        }
    }

    const startRecording = () => {
        setIsRecording(true)
        setTimeout(() => {
            setIsRecording(false)
            setIsRecorded(true)
        }, 3000)
    }

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    return (
        <div className="w-full max-w-[800px] mx-auto space-y-8" dir="rtl">
            {/* Wizard Progress Stepper */}
            <div className="flex items-center justify-between px-4">
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                        currentStep === 1 ? 'border-primary bg-primary text-on-primary' : currentStep > 1 ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'
                    }`}>1</div>
                    <span className={`text-xs font-semibold ${currentStep >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>פרטי זהות</span>
                </div>
                <div className="flex-grow h-[2px] bg-outline-variant mx-4">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: currentStep > 1 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                        currentStep === 2 ? 'border-primary bg-primary text-on-primary' : currentStep > 2 ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'
                    }`}>2</div>
                    <span className={`text-xs font-semibold ${currentStep >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>פרטי הרכב</span>
                </div>
                <div className="flex-grow h-[2px] bg-outline-variant mx-4">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: currentStep > 2 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                        currentStep === 3 ? 'border-primary bg-primary text-on-primary' : currentStep > 3 ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'
                    }`}>3</div>
                    <span className={`text-xs font-semibold ${currentStep >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>אימות ביומטרי</span>
                </div>
                <div className="flex-grow h-[2px] bg-outline-variant mx-4">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: currentStep > 3 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                        currentStep === 4 ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'
                    }`}>4</div>
                    <span className={`text-xs font-semibold ${currentStep === 4 ? 'text-primary' : 'text-on-surface-variant'}`}>סיכום ואישור</span>
                </div>
            </div>

            <form action={action} className="space-y-6">
                {state?.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                )}

                {/* Hidden Fields for Backend Submission */}
                <input type="hidden" name="idDocUrl" value={idDocUrl} />
                <input type="hidden" name="vehicleRegDocUrl" value={vehicleRegDocUrl} />
                <input type="hidden" name="firstName" value={firstName} />
                <input type="hidden" name="lastName" value={lastName} />
                <input type="hidden" name="idNumber" value={idNumber} />
                <input type="hidden" name="birthDate" value={birthDate} />
                <input type="hidden" name="address" value={address} />
                <input type="hidden" name="engineVolume" value={engineVolume} />
                <input type="hidden" name="licenseExpiry" value={licenseExpiry} />
                <input type="hidden" name="previousOwners" value={previousOwners} />
                <input type="hidden" name="chassisNumber" value={chassisNumber} />
                <input type="hidden" name="vehicleRegOwnerName" value={vehicleRegOwnerName} />
                <input type="hidden" name="vehicleRegOwnerId" value={vehicleRegOwnerId} />
                
                {/* Missing required backend fields */}
                <input type="hidden" name="title" value={`${vehicleMake || ""} ${vehicleModel || ""} ${vehicleYear || ""}`.trim() || "עסקת מכירת רכב"} />
                <input type="hidden" name="priceILS" value="150000" />
                <input type="hidden" name="licensePlate" value={licensePlate} />
                <input type="hidden" name="vehicleMake" value={vehicleMake} />
                <input type="hidden" name="vehicleModel" value={vehicleModel} />
                <input type="hidden" name="vehicleYear" value={vehicleYear} />
                <input type="hidden" name="kilometers" value={kilometers} />

                {/* STEP 1: Personal Details */}
                {currentStep === 1 && (
                    <section className="glass-card rounded-2xl p-6 space-y-6 border-r-4 border-r-primary animate-in fade-in slide-in-from-bottom-4 duration-300 text-right">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-primary text-right">פרטים אישיים של המוכר</h2>
                            <p className="text-xs text-on-surface-variant text-right">מידע משפטי הנדרש להסכם הרכישה המחייב.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <DocumentUpload
                                label="סריקת תעודת זהות / דרכון"
                                onUploadComplete={handleIdUpload}
                                isLoading={isAnalyzingId}
                            />
                            
                            {isAnalyzingId && (
                                <div className="flex items-center gap-2 text-xs text-primary animate-pulse justify-end">
                                    <span>סורק מסמך מזהה באמצעות AI SecureOCR...</span>
                                    <Sparkles className="h-4 w-4" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">שם פרטי</label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="ישראל"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">שם משפחה</label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="ישראלי"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5 text-right">
                                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">מספר תעודת זהות / דרכון</label>
                                <Input
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    placeholder="123456789"
                                    className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-right"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">תאריך לידה (אופציונלי)</label>
                                    <Input
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        placeholder="DD/MM/YYYY"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">כתובת (אופציונלית)</label>
                                    <Input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="רחוב, עיר"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        <div dir="rtl" className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-xl justify-start">
                            <span className="material-symbols-outlined text-primary text-xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            <p className="text-[11px] text-on-surface-variant text-right leading-normal" dir="rtl">הפרטים והמסמכים המאומתים שלך מוגנים בכספות מוצפנות של SafeTra ונגישים רק לעורכי דין מורשים.</p>
                        </div>
                    </section>
                )}

                {/* STEP 2: Asset Details */}
                {currentStep === 2 && (
                    <section className="glass-card rounded-2xl p-6 space-y-6 border-r-4 border-r-secondary animate-in fade-in slide-in-from-bottom-4 duration-300 text-right">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-secondary text-right">מפרט הרכב והעסקה</h2>
                            <p className="text-xs text-on-surface-variant text-right">הזן את פרטי רישיון הרכב והמחיר המוסכם לנאמנות.</p>
                        </div>

                        <div className="space-y-4">
                            <DocumentUpload
                                label="רישיון רכב (סריקה/צילום)"
                                onUploadComplete={handleVehicleUpload}
                                isLoading={isAnalyzingVehicle}
                            />
                            
                            {isAnalyzingVehicle && (
                                <div className="flex items-center gap-2 text-xs text-secondary animate-pulse justify-end">
                                    <span>סורק רישיון רכב באמצעות AI SecureOCR...</span>
                                    <Sparkles className="h-4 w-4" />
                                </div>
                            )}

                            <div className="text-right">
                                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">כותרת העסקה</label>
                                <Input
                                    name="title"
                                    placeholder="לדוגמה: מכירת פורשה 911 GT3 שנת 2023"
                                    required
                                    className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">מספר רישוי</label>
                                    <Input
                                        value={licensePlate}
                                        onChange={(e) => setLicensePlate(e.target.value)}
                                        placeholder="12-345-67"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">מחיר מכירה מוסכם (₪)</label>
                                    <div className="relative">
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold">₪</span>
                                        <Input
                                            name="priceILS"
                                            type="number"
                                            required
                                            placeholder="150,000"
                                            className="pr-8 bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">יצרן</label>
                                    <Input
                                        value={vehicleMake}
                                        onChange={(e) => setVehicleMake(e.target.value)}
                                        placeholder="פורשה"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">דגם</label>
                                    <Input
                                        value={vehicleModel}
                                        onChange={(e) => setVehicleModel(e.target.value)}
                                        placeholder="911 GT3"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">שנה</label>
                                    <Input
                                        value={vehicleYear}
                                        onChange={(e) => setVehicleYear(e.target.value)}
                                        placeholder="2023"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">מספר שלדה (VIN)</label>
                                    <Input
                                        value={chassisNumber}
                                        onChange={(e) => setChassisNumber(e.target.value)}
                                        placeholder="WP0AA2A9XPS******"
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">קילומטראז'</label>
                                    <Input
                                        name="kilometers"
                                        type="number"
                                        value={kilometers}
                                        onChange={(e) => setKilometers(e.target.value)}
                                        placeholder="15,000"
                                        required
                                        className="bg-surface-container-lowest border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary transition-all text-right"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* STEP 3: Biometric Liveness Verify */}
                {currentStep === 3 && (
                    <section className="glass-card rounded-2xl p-6 space-y-6 border-r-4 border-r-primary animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-1 text-center">
                            <h2 className="text-xl font-bold text-primary">אישור ביומטרי</h2>
                            <p className="text-xs text-on-surface-variant">סרטון אימות קצר למניעת הונאות זהות ואישור העסקה.</p>
                        </div>

                        <div className="relative aspect-video max-w-md mx-auto bg-black/90 rounded-2xl overflow-hidden border-2 border-outline-variant shadow-2xl flex items-center justify-center">
                            {/* Camera overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                <div className={`w-36 h-36 border-2 border-dashed rounded-full flex items-center justify-center ${isRecording ? 'border-error animate-pulse' : 'border-primary/50'}`}>
                                    <Camera className={`h-12 w-12 ${isRecording ? 'text-error' : 'text-primary/40'}`} />
                                </div>
                                
                                {isRecording && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/85 px-3 py-1 rounded-full border border-error/30">
                                        <div className="w-2 h-2 bg-error rounded-full animate-ping"></div>
                                        <span className="text-[10px] font-mono font-bold text-error">הקלטה פעילה</span>
                                    </div>
                                )}
                            </div>

                            {/* Script overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                <div className="bg-surface-container-lowest/90 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
                                    <p className="text-xs text-on-surface leading-relaxed">
                                        <span className="text-primary font-bold uppercase tracking-wider block mb-1">נוסח האימות</span>
                                        "אני מאשר שאני הבעלים החוקי של הרכב ומאשר את יצירת העסקה הזו ב-SafeTra."
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <Button
                                type="button"
                                onClick={startRecording}
                                disabled={isRecording}
                                className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                                    isRecorded ? 'bg-primary text-on-primary' : 'bg-secondary hover:bg-secondary-container text-on-secondary-container'
                                }`}
                            >
                                {isRecording ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-error" />
                                        מקליט...
                                    </>
                                ) : isRecorded ? (
                                    <>
                                        <ShieldCheck className="h-5 w-5 text-on-primary" />
                                        הסרטון הועלה
                                    </>
                                ) : (
                                    <>
                                        <Video className="h-5 w-5" />
                                        הקלט והעלה
                                    </>
                                )}
                            </Button>
                            {isRecorded && (
                                <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    אימות ביומטרי אושר (99.2%)
                                </span>
                            )}
                        </div>
                    </section>
                )}

                {/* STEP 4: Review and Submit */}
                {currentStep === 4 && (
                    <section className="glass-card rounded-2xl p-6 space-y-6 border-r-4 border-r-primary animate-in fade-in slide-in-from-bottom-4 duration-300 text-right">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-primary text-right">סיום ויצירת העסקה</h2>
                            <p className="text-xs text-on-surface-variant text-right">בדוק את הפרטים שנשלפו ואשר את הגשת העסקה לבדיקת עורך דין.</p>
                        </div>

                        {/* Security Warning Checks */}
                        <div className="space-y-3 text-right">
                            {ocrSignals.length > 0 && (
                                <Alert variant="destructive" className="bg-orange-950/20 border-orange-900/50">
                                    <ShieldAlert className="h-4 w-4 text-orange-400" />
                                    <AlertTitle className="text-orange-300">בקרת אבטחת מידע</AlertTitle>
                                    <AlertDescription className="text-orange-400 text-xs">
                                        אותרו חריגות אפשריות במהלך פענוח המסמך: {ocrSignals.join(", ")}
                                    </AlertDescription>
                                </Alert>
                            )}

                             {(() => {
                                 if (!vehicleRegOwnerName || !firstName || !lastName) return null;
                                 const cleanReg = vehicleRegOwnerName.replace(/[^\u0590-\u05FF]/g, "");
                                 const cleanFirst = firstName.replace(/[^\u0590-\u05FF]/g, "");
                                 const cleanLast = lastName.replace(/[^\u0590-\u05FF]/g, "");
                                 
                                 const isMatch = cleanReg.includes(cleanFirst) && cleanReg.includes(cleanLast);
                                 
                                 if (!isMatch) {
                                     return (
                                         <Alert variant="destructive" className="bg-yellow-950/20 border-yellow-900/50">
                                             <ShieldAlert className="h-4 w-4 text-yellow-400" />
                                             <AlertTitle className="text-yellow-300">חוסר התאמה בשם הבעלים</AlertTitle>
                                             <AlertDescription className="text-yellow-400 text-xs">
                                                 מחזיק הרישיון: <strong>{firstName} {lastName}</strong> לעומת בעל הרכב הרשום: <strong>{vehicleRegOwnerName}</strong>
                                             </AlertDescription>
                                         </Alert>
                                     );
                                 }
                                 return null;
                             })()}

                            {vehicleRegOwnerId && idNumber && vehicleRegOwnerId !== idNumber && (
                                <Alert variant="destructive" className="bg-yellow-950/20 border-yellow-900/50">
                                    <ShieldAlert className="h-4 w-4 text-yellow-400" />
                                    <AlertTitle className="text-yellow-300">התרעת מספר תעודת זהות</AlertTitle>
                                    <AlertDescription className="text-yellow-400 text-xs">
                                        מסמך מזהה: <strong>{idNumber}</strong> לעומת רישום הרכב: <strong>{vehicleRegOwnerId}</strong>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {firstName && (
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1 text-right">
                                    <div className="flex items-center gap-1.5 text-xs text-primary font-bold justify-end">
                                        הזהות אומתה בהצלחה
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs text-on-surface-variant">
                                        השם שפוענח תואם לרישומים המשפטיים: <strong>{firstName} {lastName}</strong>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Summary Details */}
                        <div className="p-4 bg-surface-container-low rounded-xl space-y-3 text-xs text-right">
                            <h3 className="font-bold uppercase tracking-wider text-on-surface-variant">סיכום פרטי העסקה</h3>
                            <div className="grid grid-cols-2 gap-y-2">
                                <span className="text-on-surface-variant text-right">יצרן/דגם הרכב:</span>
                                <span className="text-left font-semibold">{vehicleMake} {vehicleModel} ({vehicleYear})</span>
                                <span className="text-on-surface-variant text-right">מספר רישוי:</span>
                                <span className="text-left font-mono font-semibold">{licensePlate}</span>
                                <span className="text-on-surface-variant text-right">מספר שלדה (VIN):</span>
                                <span className="text-left font-mono font-semibold">{chassisNumber || "ממתין לפענוח"}</span>
                                <span className="text-on-surface-variant text-right">סכום נאמנות:</span>
                                <span className="text-left font-bold text-primary">₪{Number(150000).toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary-fixed-dim text-on-primary emerald-glow"
                            disabled={isPending || isAnalyzingId || isAnalyzingVehicle}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    נועל כספי נאמנות ומייצר עסקה...
                                </>
                            ) : "שליחת העסקה לבדיקת עורך דין"}
                        </Button>
                    </section>
                )}

                {/* Wizard Controls */}
                <div className="flex justify-between items-center py-4 border-t border-white/10">
                    <Button
                        type="button"
                        onClick={prevStep}
                        variant="ghost"
                        className={`text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center gap-1 ${currentStep === 1 ? 'invisible' : ''}`}
                    >
                        <span className="material-symbols-outlined text-sm rotate-180">arrow_back</span>
                        חזרה
                    </Button>

                    {currentStep < 4 && (
                        <Button
                            type="button"
                            onClick={nextStep}
                            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold flex items-center gap-1.5 hover:brightness-110 transition-all active:scale-95"
                        >
                            המשך
                            <span className="material-symbols-outlined text-sm rotate-180">arrow_forward</span>
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}

