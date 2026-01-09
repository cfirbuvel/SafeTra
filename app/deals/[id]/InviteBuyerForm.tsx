"use client"

import { useState, useEffect } from "react"
import { inviteBuyer, getDealInvitations } from "@/lib/actions/deals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clipboard, UserPlus, CheckCircle2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createSupabaseClient } from "@/lib/supabase/client"

export function InviteBuyerForm({ dealId }: { dealId: string }) {
    const [phone, setPhone] = useState("")
    const [lastInviteLink, setLastInviteLink] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [invitations, setInvitations] = useState<any[]>([])
    const supabase = createSupabaseClient()

    // Load invitations on mount
    useEffect(() => {
        refreshInvitations()

        // Real-time subscription for invitation updates
        const channel = supabase
            .channel(`deal-invitations-${dealId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all changes (Insert/Update/Delete)
                    schema: 'public',
                    table: 'deal_invitations',
                    filter: `deal_id=eq.${dealId}`,
                },
                () => {
                    // Refresh when any invitation changes
                    refreshInvitations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [dealId, supabase])

    const copyToClipboard = async (text: string) => {
        if (typeof window !== "undefined" && navigator?.clipboard) {
            try {
                await navigator.clipboard.writeText(text)
            } catch (err) {
                console.error("Failed to copy:", err)
            }
        }
    }

    async function refreshInvitations() {
        const data = await getDealInvitations(dealId)
        setInvitations(data)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        setLastInviteLink("")

        const result = await inviteBuyer(dealId, phone)

        if (result.error) {
            setError(result.error)
        } else if (result.link) {
            setLastInviteLink(result.link)
            setPhone("") // Clear for next invite
            refreshInvitations()
        }

        setLoading(false)
    }

    return (
        <Card className="p-6 mt-6 overflow-hidden">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    הזמנת קונים
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <Input
                        placeholder="מספר טלפון של הקונה (050...)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading} className="whitespace-nowrap">
                        {loading ? "מייצר..." : "שלח הזמנה"}
                    </Button>
                </form>

                {lastInviteLink && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                        <p className="text-sm text-blue-700 font-medium mb-2">הזמנה חדשה נוצרה! שלח את הקישור:</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white p-2 rounded border text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                {lastInviteLink}
                            </code>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(lastInviteLink)}
                                className="shrink-0"
                            >
                                <Clipboard className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {invitations.length > 0 && (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">הזמנות שנשלחו:</h3>
                        <div className="space-y-3">
                            {invitations.map((invite) => (
                                <div key={invite.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-xs font-bold border">
                                            {invite.buyer?.full_name?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{invite.buyer?.full_name || "קונה מוזמן"}</p>
                                            <p className="text-xs text-muted-foreground">{invite.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {invite.status === "ACCEPTED" ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                                                <CheckCircle2 className="h-3 w-3" />
                                                התקבל
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex gap-1 items-center">
                                                <Clock className="h-3 w-3" />
                                                ממתין
                                            </Badge>
                                        )}
                                        {invite.status === "PENDING" && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                    const link = `${window.location.origin}/deals/${dealId}/join?invite=${invite.id}`
                                                    copyToClipboard(link)
                                                }}
                                                title="העתק קישור שוב"
                                            >
                                                <Clipboard className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
