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
            {/* Header Card in Stitch Glassmorphic Slate */}
            <div className="rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-xl text-white shadow-xl p-6 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold font-rubik text-slate-100">
                                {user.full_name || "משתמש SafeTra"}
                            </h2>
                            <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
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
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                חבר במערכת מ- {createdDate}
                            </p>
                        )}
                    </div>

                    <Button asChild variant="outline" size="sm" className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all">
                        <Link href={isLawyer ? "/lawyer" : "/dashboard"}>
                            <span>לוח בקרה</span>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Deal Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex items-center gap-3 shadow-lg hover:border-emerald-500/30 transition-all">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">סה״כ עסקאות</p>
                        <p className="text-2xl font-bold text-slate-100 font-rubik">{stats.totalDeals}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex items-center gap-3 shadow-lg hover:border-amber-500/30 transition-all">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">עסקאות פעילות</p>
                        <p className="text-2xl font-bold text-amber-400 font-rubik">{stats.activeDeals}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex items-center gap-3 shadow-lg hover:border-emerald-500/30 transition-all">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">הושלמו בהצלחה</p>
                        <p className="text-2xl font-bold text-emerald-400 font-rubik">{stats.completedDeals}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
