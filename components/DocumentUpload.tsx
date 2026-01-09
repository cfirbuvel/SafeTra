"use client"

import { useState, useRef } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, X, CheckCircle2, Loader2 } from "lucide-react"

interface DocumentUploadProps {
    label: string
    onUploadComplete: (url: string, file: File) => void
    isLoading?: boolean
}

export function DocumentUpload({ label, onUploadComplete, isLoading: parentLoading }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createSupabaseClient()

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
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `deal-docs/${fileName}`

            const { data, error } = await supabase.storage
                .from('documents')
                .upload(filePath, selectedFile)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(data.path)

            setUploadedUrl(publicUrl)
            onUploadComplete(publicUrl, selectedFile)
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('שגיאה בהעלאת הקובץ')
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

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{label}</label>
            <div
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${uploadedUrl ? 'border-green-500 bg-green-50/10' : 'border-muted hover:border-primary'
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
