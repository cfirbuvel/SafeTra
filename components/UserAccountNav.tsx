"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, LayoutDashboard, UserCircle, Settings, LogOut } from "lucide-react"

interface UserAccountNavProps {
    user: any
}

export function UserAccountNav({ user }: UserAccountNavProps) {
    const router = useRouter()

    const handleLogout = async () => {
        const result = await logout()
        if (result.success) {
            router.refresh()
            router.push("/")
        }
    }

    const initials = user.full_name
        ? user.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
        : user.email?.[0].toUpperCase() || "U"

    // Prioritize showing a real email. If it's a shadow email, show phone instead if available.
    const displayEmail = user.isShadowEmail ? (user.phone || "") : (user.email || "")

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8 cursor-pointer ring-primary/10 ring-offset-background transition-colors hover:ring-2 hover:ring-primary/20">
                    <AvatarImage src={user.image || "/images/default-avatar.png"} alt={user.full_name || "User avatar"} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                        {user.full_name && <p className="font-bold text-sm">{user.full_name}</p>}
                        {displayEmail && (
                            <p className="w-[200px] truncate text-xs text-muted-foreground">
                                {displayEmail}
                            </p>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href={user.role === 'lawyer' ? "/lawyer" : "/dashboard"} className="cursor-pointer w-full flex items-center">
                        <LayoutDashboard className="ml-2 h-4 w-4" />
                        <span>{user.role === 'lawyer' ? "לוח בקרה (עו״ד)" : "דשבורד"}</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                        <UserCircle className="ml-2 h-4 w-4" />
                        <span>פרופיל</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                        <Settings className="ml-2 h-4 w-4" />
                        <span>הגדרות</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onSelect={(event) => {
                        event.preventDefault()
                        handleLogout()
                    }}
                >
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>התנתקות</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
