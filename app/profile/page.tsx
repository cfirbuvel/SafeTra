import { getCurrentUser } from "@/lib/actions/auth"
import { getUserDealStats } from "@/lib/actions/users"
import { Navbar } from "@/components/Navbar"
import { ProfileStatsWidget } from "@/components/profile/ProfileStatsWidget"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserCheck, ShieldCheck, Wallet, ArrowRightLeft } from "lucide-react"

export default async function ProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
    }

    const stats = await getUserDealStats(user.id)

    return (
        <div className="min-h-screen bg-[#0a0e18] text-slate-100 flex flex-col pb-20 md:pb-8 selection:bg-emerald-500/20 selection:text-emerald-400" dir="rtl">
            {/* Top Bar / Header */}
            <Navbar user={user} />

            {/* Main Content Canvas (Stitch layout max-w 800px) */}
            <main className="flex-1 container max-w-[800px] mx-auto p-4 sm:p-6 space-y-6">
                {/* Profile Header & Stats */}
                <ProfileStatsWidget user={user} stats={stats} />

                {/* Profile Forms & Verification Sections */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-6">
                    <div className="border-b border-white/10 pb-4 space-y-1">
                        <h1 className="text-xl sm:text-2xl font-bold font-rubik text-slate-100 flex items-center gap-2">
                            <span>פרופיל משתמש ואימות - SafeTra</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400">
                            נהל את פרטי החשבון שלך, תמונת הפרופיל, אימות זהות ממשלתי ופרטי ההתקשרות המאומתים.
                        </p>
                    </div>

                    <ProfileForm user={user} />
                </div>
            </main>

            {/* Bottom Navigation Bar (Mobile Only - Stitch layout) */}
            <nav className="md:hidden bg-slate-950/90 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-xl border-t border-white/10 shadow-2xl flex justify-around items-center px-4 py-2 h-16">
                <Link
                    href="/deals"
                    className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors active:scale-95 duration-200"
                >
                    <ArrowRightLeft className="h-5 w-5" />
                    <span className="text-[10px] font-semibold mt-1">עסקאות</span>
                </Link>
                <Link
                    href="/dashboard"
                    className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors active:scale-95 duration-200"
                >
                    <Wallet className="h-5 w-5" />
                    <span className="text-[10px] font-semibold mt-1">נאמנות</span>
                </Link>
                <Link
                    href="/lawyer"
                    className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors active:scale-95 duration-200"
                >
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-[10px] font-semibold mt-1">אימות</span>
                </Link>
                <Link
                    href="/profile"
                    className="flex flex-col items-center justify-center bg-emerald-500/10 text-emerald-400 rounded-xl px-4 py-1 border border-emerald-500/20 active:scale-95 duration-200"
                >
                    <UserCheck className="h-5 w-5" />
                    <span className="text-[10px] font-bold mt-1">פרופיל</span>
                </Link>
            </nav>
        </div>
    )
}
