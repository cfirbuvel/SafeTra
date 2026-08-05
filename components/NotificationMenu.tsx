"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createSupabaseClient } from "@/lib/supabase/client"
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { Notification } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"
import { he } from "date-fns/locale"
import { useRouter } from "next/navigation"

export function NotificationMenu({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = useMemo(() => createSupabaseClient(), [])
    const router = useRouter()

    useEffect(() => {
        let isMounted = true

        const fetchNotifications = async () => {
            const data = await getNotifications()
            if (isMounted) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.is_read).length)
            }
        }

        fetchNotifications()

        // 1. Gentle background poll (every 30 seconds)
        const pollInterval = setInterval(() => {
            fetchNotifications()
        }, 30000)

        // 2. Real-time Postgres changes channel filtered specifically for this user
        const channel = supabase
            .channel(`user-notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                async () => {
                    await fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            isMounted = false
            clearInterval(pollInterval)
            supabase.removeChannel(channel)
        }
    }, [userId, supabase, router])

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id)
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const handleMarkAllAsRead = async () => {
        await markAllAsRead()
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await handleMarkAsRead(notification.id)
        }

        if (notification.deal_id) {
            const path = notification.type === "NEW_INVITATION"
                ? `/deals/${notification.deal_id}/join`
                : `/deals/${notification.deal_id}`
            router.push(path)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 transition-colors group-hover:text-primary" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-pulse bg-emerald-500 text-white font-bold border-2 border-background"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 overflow-hidden p-0 glass-card border-white/10">
                <div dir="rtl">
                    <DropdownMenuLabel className="flex justify-between items-center p-4">
                        <span className="text-lg font-bold text-on-surface">התראות</span>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-0 text-primary hover:text-primary-fixed-dim hover:bg-transparent"
                                onClick={handleMarkAllAsRead}
                            >
                                סמן הכל כנקרא
                            </Button>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-on-surface-variant">
                                אין התראות חדשות
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-white/5 last:border-0 hover:bg-surface-container transition-colors cursor-pointer group ${!notification.is_read ? "bg-primary/10" : ""
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex justify-between w-full mb-1 items-start gap-2">
                                        <span className={`text-sm font-semibold leading-tight group-hover:text-primary transition-colors ${!notification.is_read ? "text-primary font-bold" : "text-on-surface"}`}>
                                            {notification.title}
                                        </span>
                                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap pt-0.5">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: he,
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    {!notification.is_read && (
                                        <div className="mt-2 flex justify-end">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
