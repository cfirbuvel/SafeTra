"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    const supabase = createSupabaseClient()
    const router = useRouter()

    useEffect(() => {
        // ... (fetch logic stays the same)
        const fetchNotifications = async () => {
            const data = await getNotifications()
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }

        fetchNotifications()

        const channel = supabase
            .channel(`user-notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification
                    setNotifications(prev => [newNotification, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

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
                    <Bell className="h-5 w-5 transition-colors group-hover:text-blue-500" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-pulse"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 overflow-hidden p-0">
                <div dir="rtl">
                    <DropdownMenuLabel className="flex justify-between items-center p-4">
                        <span className="text-lg font-bold">התראות</span>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-0 text-blue-500 hover:text-blue-600 hover:bg-transparent"
                                onClick={handleMarkAllAsRead}
                            >
                                סמן הכל כנקרא
                            </Button>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                אין התראות חדשות
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b last:border-0 hover:bg-accent transition-colors cursor-pointer group ${!notification.is_read ? "bg-blue-50/20" : ""
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex justify-between w-full mb-1 items-start gap-2">
                                        <span className={`text-sm font-semibold leading-tight group-hover:text-blue-600 transition-colors ${!notification.is_read ? "text-blue-600" : ""}`}>
                                            {notification.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: he,
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    {!notification.is_read && (
                                        <div className="mt-2 flex justify-end">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
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
