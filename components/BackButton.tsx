"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface BackButtonProps {
    href?: string
    label?: string
    className?: string
}

export function BackButton({ href, label = "חזור", className }: BackButtonProps) {
    const router = useRouter()

    const handleClick = () => {
        if (href) {
            router.push(href)
        } else {
            router.back()
        }
    }

    return (
        <Button
            variant="ghost"
            onClick={handleClick}
            className={`flex items-center gap-2 p-0 hover:bg-transparent hover:text-primary ${className}`}
        >
            <ArrowRight className="h-4 w-4" />
            <span>{label}</span>
        </Button>
    )
}
