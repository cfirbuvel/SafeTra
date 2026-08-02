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
        setPreview(URL.createObjectURL(selectedFile))
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
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (uploading || parentLoading) return

        const droppedFile = e.dataTransfer.files?.[0]
        if (!droppedFile) return

        if (!droppedFile.type.startsWith("image/")) {
            alert("נא להעלות קבצי תמונה בלבד")
            return
        }

        setFile(droppedFile)
        setPreview(URL.createObjectURL(droppedFile))
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
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                    uploadedUrl 
                        ? 'border-green-500 bg-green-50/10' 
                        : isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary'
                }`}
            >
                {!preview ? (
                    <div className="text-center py-4">
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full flex flex-col items-center gap-2 h-auto py-4"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || parentLoading}
                        >
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm">לחץ להעלאת תמונה</span>
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-32 object-contain rounded mb-2"
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {file?.name}
                            </span>
                            <div className="flex gap-2">
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
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
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}
