"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, CheckCircle2, Loader2 } from "lucide-react"

interface DocumentUploadProps {
    label: string
    onUploadComplete: (url: string, file: File) => void
    isLoading?: boolean
}

/**
 * Downscales large camera photos (> 1MB) on client browser before upload.
 */
async function compressImageIfNeeded(file: File): Promise<File> {
    if (!file.type.startsWith("image/") || file.size < 1024 * 1024) {
        return file
    }
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.src = url
        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement("canvas")
            const maxDim = 1600
            let width = img.width
            let height = img.height

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width)
                    width = maxDim
                } else {
                    width = Math.round((width * maxDim) / height)
                    height = maxDim
                }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")
            ctx?.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })
                        resolve(compressedFile)
                    } else {
                        resolve(file)
                    }
                },
                "image/jpeg",
                0.8
            )
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }
    })
}

export function DocumentUpload({ label, onUploadComplete, isLoading: parentLoading }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        if (selectedFile.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(selectedFile))
        } else {
            setPreview("/images/pdf-icon.png") // Fallback indicator for PDF
        }
        await uploadFile(selectedFile)
    }

    const uploadFile = async (selectedFile: File) => {
        setUploading(true)
        try {
            const fileToUpload = await compressImageIfNeeded(selectedFile)
            const formData = new FormData()
            formData.append("file", fileToUpload)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || `Upload failed with status ${res.status}`)
            }

            const data = await res.json()
            if (data.url) {
                setUploadedUrl(data.url)
                onUploadComplete(data.url, fileToUpload)
            }
        } catch (error: any) {
            console.error("Error uploading file:", error)
            alert(error?.message || "שגיאה בהעלאת הקובץ")
        } finally {
            setUploading(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setPreview(null)
        setUploadedUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (uploading || parentLoading) return
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.currentTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
            return
        }
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (uploading || parentLoading) return

        const droppedFile = e.dataTransfer.files?.[0]
        if (!droppedFile) return

        const isValidType = droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".pdf")
        if (!isValidType) {
            alert("נא להעלות קבצי תמונה (PNG, JPG) או קובץ PDF בלבד")
            return
        }

        setFile(droppedFile)
        if (droppedFile.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(droppedFile))
        } else {
            setPreview("pdf")
        }
        await uploadFile(droppedFile)
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{label}</label>
            <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                    uploadedUrl 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : isDragging
                        ? 'border-emerald-400 bg-emerald-500/20 scale-[1.01] shadow-lg'
                        : 'border-muted hover:border-emerald-500/50'
                }`}
            >
                {!preview ? (
                    <div className={`text-center py-4 ${isDragging ? 'pointer-events-none' : ''}`}>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full flex flex-col items-center gap-2 h-auto py-4 hover:bg-transparent"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || parentLoading}
                        >
                            <Upload className={`h-8 w-8 transition-transform duration-200 ${isDragging ? 'scale-110 text-emerald-400' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-semibold">
                                {isDragging ? "שחרר את הקובץ לכאן" : "לחץ להעלאת קובץ או גרור לכאן"}
                            </span>
                            <span className="text-xs text-muted-foreground">תמונות (JPG, PNG) או PDF (עד 10MB)</span>
                        </Button>
                    </div>
                ) : (
                    <div className="relative p-2">
                        {preview === "pdf" ? (
                            <div className="flex items-center justify-center p-4 bg-slate-800/60 rounded-lg text-emerald-400 font-bold text-sm">
                                📄 מסמך PDF: {file?.name}
                            </div>
                        ) : (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-36 object-contain rounded mb-2"
                            />
                        )}
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {file?.name}
                            </span>
                            <div className="flex gap-2 items-center">
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-red-400"
                                    onClick={clearFile}
                                    disabled={uploading || parentLoading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}
