"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"

interface AvatarUploaderProps {
    currentAvatarUrl?: string
    fullName?: string
    onAvatarChange: (url: string) => void
}

export function AvatarUploader({ currentAvatarUrl, fullName, onAvatarChange }: AvatarUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const initials = fullName
        ? fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "U"

    const displayUrl = previewUrl || currentAvatarUrl || "/images/default-avatar.png"

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Local preview
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()

            if (res.ok && data.url) {
                onAvatarChange(data.url)
            } else {
                console.error("Upload error:", data.error)
                setPreviewUrl(null)
            }
        } catch (error) {
            console.error("Failed to upload avatar:", error)
            setPreviewUrl(null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="relative cursor-pointer group rounded-full p-1 border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300"
                onClick={() => fileInputRef.current?.click()}
            >
                <Avatar className="h-24 w-24">
                    <AvatarImage src={displayUrl} alt={fullName || "User avatar"} className="object-cover" />
                    <AvatarFallback className="bg-emerald-950 text-emerald-400 text-xl font-bold font-rubik">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-xs">
                    {uploading ? (
                        <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
                    ) : (
                        <Camera className="h-6 w-6 text-white" />
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />

            <button
                type="button"
                className="text-xs text-emerald-400 font-medium hover:underline focus:outline-none flex items-center gap-1"
                onClick={() => fileInputRef.current?.click()}
            >
                {uploading ? "מעלה תמונה..." : "שינוי תמונת פרופיל"}
            </button>
        </div>
    )
}
