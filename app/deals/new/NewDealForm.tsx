"use client"

import { useState, useTransition, useActionState } from "react"
import { createDeal } from "@/lib/actions/deals"
import { processDocumentAction } from "@/lib/actions/ocr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BackButton } from "@/components/BackButton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DocumentUpload } from "@/components/DocumentUpload"
import { Loader2, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react"

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
    const [engineVolume, setEngineVolume] = useState("")
    const [licenseExpiry, setLicenseExpiry] = useState("")
    const [previousOwners, setPreviousOwners] = useState("")
    const [chassisNumber, setChassisNumber] = useState("")
    const [kilometers, setKilometers] = useState("")
    const [vehicleRegOwnerName, setVehicleRegOwnerName] = useState("")
    const [vehicleRegOwnerId, setVehicleRegOwnerId] = useState("")

    const handleIdUpload = async (url: string, file: File) => {
        setIdDocUrl(url)
        setIsAnalyzingId(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const result = await processDocumentAction(formData)

            if (result.data) {
                const { fields, fraudSignals } = result.data
                if (fields.full_name?.value) {
                    const nameParts = fields.full_name.value.split(" ")
                    setFirstName(nameParts[0] || "")
                    setLastName(nameParts.slice(1).join(" ") || "")

                    // Also populate owner comparison fields
                    setVehicleRegOwnerName(fields.full_name.value)
                }
                if (fields.id_number?.value) {
                    setIdNumber(fields.id_number.value)

                    // Also populate owner comparison field
                    setVehicleRegOwnerId(fields.id_number.value)
                }
                setOcrSignals(prev => [...new Set([...prev, ...fraudSignals])])
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
            const result = await processDocumentAction(formData)

            if (result.data) {
                const { fields, fraudSignals } = result.data
                console.log("[OCR Result] Processed Fields:", fields)

                if (fields.plate_number?.value) setLicensePlate(fields.plate_number.value)
                if (fields.year?.value) setVehicleYear(fields.year.value)
                if (fields.make?.value) setVehicleMake(fields.make.value)
                if (fields.model?.value) setVehicleModel(fields.model.value)
                if (fields.engine_volume?.value) setEngineVolume(fields.engine_volume.value)
                if (fields.license_expiry?.value) {
                    // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
                    const parts = fields.license_expiry.value.split('/')
                    if (parts.length === 3) {
                        const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`
                        setLicenseExpiry(formatted)
                    }
                }
                if (fields.previous_owners?.value) setPreviousOwners(fields.previous_owners.value)
                if (fields.chassis_number?.value) setChassisNumber(fields.chassis_number.value)
                if (fields.owner_name?.value) setVehicleRegOwnerName(fields.owner_name.value)
                if (fields.owner_id?.value) setVehicleRegOwnerId(fields.owner_id.value)

                // Unified name handling
                const nameToUse = fields.full_name?.value || fields.owner_name?.value
                if (nameToUse) {
                    const nameParts = nameToUse.split(/\s+/).filter(Boolean)
                    if (nameParts.length > 1) {
                        // Usually First Name is the first word, rest is Last Name
                        setFirstName(nameParts[0])
                        setLastName(nameParts.slice(1).join(" "))
                    } else {
                        setFirstName(nameParts[0] || "")
                        setLastName("")
                    }
                }
                setOcrSignals(prev => [...new Set([...prev, ...fraudSignals])])
            }
        } catch (e) {
            console.error("OCR Vehicle Error:", e)
        } finally {
            setIsAnalyzingVehicle(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl p-6 mx-auto" dir="rtl">
            <div className="mb-4">
                <BackButton href="/dashboard" />
            </div>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">יצירת עסקה חדשה</h1>
                {(isAnalyzingId || isAnalyzingVehicle) && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse">
                        <Sparkles className="h-4 w-4" />
                        <span>מנתח מסמכים...</span>
                    </div>
                )}
            </div>

            <form action={action} className="space-y-6">
                {state?.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                )}

                {/* hidden fields for AI data */}
                <input type="hidden" name="idDocUrl" value={idDocUrl} />
                <input type="hidden" name="vehicleRegDocUrl" value={vehicleRegDocUrl} />
                <input type="hidden" name="firstName" value={firstName} />
                <input type="hidden" name="lastName" value={lastName} />
                <input type="hidden" name="idNumber" value={idNumber} />
                <input type="hidden" name="engineVolume" value={engineVolume} />
                <input type="hidden" name="licenseExpiry" value={licenseExpiry} />
                <input type="hidden" name="previousOwners" value={previousOwners} />
                <input type="hidden" name="chassisNumber" value={chassisNumber} />
                <input type="hidden" name="vehicleRegOwnerName" value={vehicleRegOwnerName} />
                <input type="hidden" name="vehicleRegOwnerId" value={vehicleRegOwnerId} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Documents Column */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">מסמכים (אופציונלי)</h2>
                        <DocumentUpload
                            label="צילום תעודת זהות / רישיון נהיגה"
                            onUploadComplete={handleIdUpload}
                            isLoading={isAnalyzingId}
                        />
                        <DocumentUpload
                            label="צילום רישיון רכב"
                            onUploadComplete={handleVehicleUpload}
                            isLoading={isAnalyzingVehicle}
                        />
                    </div>

                    {/* Form Column */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">פרטי העסקה</h2>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                                כותרת העסקה
                            </label>
                            <Input id="title" name="title" type="text" placeholder="למשל: מכירת מאזדה 3" required disabled={isPending} />
                        </div>

                        <div>
                            <label htmlFor="priceILS" className="block text-sm font-medium text-foreground mb-1">
                                מחיר מוסכם (₪)
                            </label>
                            <Input id="priceILS" name="priceILS" type="number" placeholder="הכנס מחיר" required disabled={isPending} />
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3">פרטי בעלים מרישיון רכב (להשוואה)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">שם בעלים</label>
                                    <Input
                                        value={vehicleRegOwnerName}
                                        disabled
                                        className="bg-gray-50"
                                        placeholder="יופיע אחרי סריקת רישיון רכב"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">ת.ז. בעלים</label>
                                    <Input
                                        value={vehicleRegOwnerId}
                                        disabled
                                        className="bg-gray-50"
                                        placeholder="יופיע אחרי סריקת רישיון רכב"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">יצרן</label>
                                <Input
                                    name="vehicleMake"
                                    value={vehicleMake}
                                    onChange={(e) => setVehicleMake(e.target.value)}
                                    placeholder="למשל: מאזדה"
                                    disabled={isPending}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">דגם</label>
                                <Input
                                    name="vehicleModel"
                                    value={vehicleModel}
                                    onChange={(e) => setVehicleModel(e.target.value)}
                                    placeholder="למשל: 3"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">מספר רכב</label>
                                <Input
                                    name="licensePlate"
                                    value={licensePlate}
                                    onChange={(e) => setLicensePlate(e.target.value)}
                                    placeholder="00-000-00"
                                    disabled={isPending}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">שנת יצור</label>
                                <Input
                                    name="vehicleYear"
                                    type="number"
                                    value={vehicleYear}
                                    onChange={(e) => setVehicleYear(e.target.value)}
                                    placeholder="2024"
                                    disabled={isPending || isAnalyzingVehicle}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">נפח מנוע (CC)</label>
                                <Input
                                    name="engineVolume"
                                    type="number"
                                    value={engineVolume}
                                    onChange={(e) => setEngineVolume(e.target.value)}
                                    placeholder="1998"
                                    disabled={isPending}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">תוקף רישיון</label>
                                <Input
                                    name="licenseExpiry"
                                    type="date"
                                    value={licenseExpiry}
                                    onChange={(e) => setLicenseExpiry(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">בעלים קודמים</label>
                                <Input
                                    name="previousOwners"
                                    type="number"
                                    value={previousOwners}
                                    onChange={(e) => setPreviousOwners(e.target.value)}
                                    placeholder="0"
                                    disabled={isPending}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">קילומטר</label>
                                <Input
                                    name="kilometers"
                                    type="number"
                                    value={kilometers}
                                    onChange={(e) => setKilometers(e.target.value)}
                                    placeholder="100000"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">מספר שלדה</label>
                            <Input
                                name="chassisNumber"
                                value={chassisNumber}
                                onChange={(e) => setChassisNumber(e.target.value)}
                                placeholder="JMZBPS7AZ1212486"
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </div>

                {ocrSignals.length > 0 && (
                    <Alert variant="destructive" className="bg-orange-50 border-orange-200">
                        <ShieldAlert className="h-4 w-4 text-orange-600" />
                        <AlertTitle className="text-orange-800">התראות אבטחה</AlertTitle>
                        <AlertDescription className="text-orange-700">
                            זוהו בעיות פוטנציאליות במסמכים: {ocrSignals.join(", ")}
                        </AlertDescription>
                    </Alert>
                )}

                {firstName && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 text-sm">
                            זוהו פרטי מוכר: <strong>{firstName} {lastName}</strong>
                            {idNumber && ` (ת.ז. ${idNumber})`}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Cross-document validation warnings */}
                {vehicleRegOwnerName && firstName && vehicleRegOwnerName !== `${firstName} ${lastName}` && (
                    <Alert variant="destructive" className="bg-yellow-50 border-yellow-400">
                        <ShieldAlert className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">אי התאמה בשמות</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                            שם בתעודה: <strong>{firstName} {lastName}</strong><br />
                            שם ברישיון רכב: <strong>{vehicleRegOwnerName}</strong>
                        </AlertDescription>
                    </Alert>
                )}

                {vehicleRegOwnerId && idNumber && vehicleRegOwnerId !== idNumber && (
                    <Alert variant="destructive" className="bg-yellow-50 border-yellow-400">
                        <ShieldAlert className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">אי התאמה בת.ז.</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                            ת.ז. בתעודה: <strong>{idNumber}</strong><br />
                            ת.ז. ברישיון רכב: <strong>{vehicleRegOwnerId}</strong>
                        </AlertDescription>
                    </Alert>
                )}


                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isPending || isAnalyzingId || isAnalyzingVehicle}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            מעבד...
                        </>
                    ) : "שלח וצור עסקה"}
                </Button>
            </form>
        </Card>
    )
}
