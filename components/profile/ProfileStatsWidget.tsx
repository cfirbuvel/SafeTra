"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldCheck, UserCheck, Calendar, ArrowLeft, FileText, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

interface ProfileStatsWidgetProps {
    user: any
    stats: {
        totalDeals: number
        activeDeals: number
        completedDeals: number
    }
}

export function ProfileStatsWidget({ user, stats }: ProfileStatsWidgetProps) {
    const isLawyer = user.role === "lawyer"

    const createdDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString("he-IL", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : null

    return (
        <div className="space-y-4">
            {/* Header / Role Info */}
            <Card className="border-primary/10 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold font-rubik">
                                    {user.full_name || "משתמש SafeTra"}
                                </h2>
                                <Badge variant={isLawyer ? "default" : "secondary"} className="gap-1 bg-primary text-primary-foreground">
                                    {isLawyer ? (
                                        <>
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            עורך דין מורשה
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="h-3.5 w-3.5" />
                                            משתמש רשום
                                        </>
                                    )}
                                </Badge>
                            </div>
                            {createdDate && (
                                <p className="text-xs text-slate-300 flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    חבר במערכת מ- {createdDate}
                                </p>
                            )}
                        </div>

                        <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <Link href={isLawyer ? "/lawyer" : "/dashboard"}>
                                <span>לוח בקרה</span>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Deal Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-slate-200/80 shadow-sm hover:border-primary/20 transition-all">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">סה״כ עסקאות</p>
                            <p className="text-2xl font-bold text-slate-800">{stats.totalDeals}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 shadow-sm hover:border-primary/20 transition-all">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">עסקאות פעילות</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.activeDeals}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 shadow-sm hover:border-primary/20 transition-all">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">הושלמו בהצלחה</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.completedDeals}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
