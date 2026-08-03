import { getCurrentUser } from "@/lib/actions/auth"
import { getUserDealStats } from "@/lib/actions/users"
import { Navbar } from "@/components/Navbar"
import { ProfileStatsWidget } from "@/components/profile/ProfileStatsWidget"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { UserCircle } from "lucide-react"

export default async function ProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
    }

    const stats = await getUserDealStats(user.id)

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col" dir="rtl">
            <Navbar user={user} />

            <main className="flex-1 container max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
                {/* Header Widget & Stats */}
                <ProfileStatsWidget user={user} stats={stats} />

                {/* Profile Form Card */}
                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="space-y-1 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <UserCircle className="h-6 w-6 text-primary" />
                            <CardTitle className="text-2xl font-bold font-rubik">פרטים אישיים</CardTitle>
                        </div>
                        <CardDescription className="text-sm text-slate-500">
                            נהל את פרטי החשבון שלך, תמונת הפרופיל ופרטי ההתקשרות המאומתים.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ProfileForm user={user} />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
