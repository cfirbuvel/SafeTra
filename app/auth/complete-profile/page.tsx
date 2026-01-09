import { Suspense } from "react"
import { getCurrentUser } from "@/lib/actions/auth"
import { Navbar } from "@/components/Navbar"
import { CompleteProfileForm } from "@/components/CompleteProfileForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"

export default async function CompleteProfilePage(props: {
    searchParams: Promise<{ next?: string }>
}) {
    const searchParams = await props.searchParams
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
    }

    const nextUrl = typeof searchParams.next === 'string' ? searchParams.next : "/dashboard"

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
            <Navbar user={user} />

            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-primary/10">
                    <CardHeader className="text-center space-y-1">
                        <CardTitle className="text-3xl font-bold font-rubik">השלמת פרופיל</CardTitle>
                        <CardDescription className="text-base">
                            כדי שנוכל להפיק את מסמכי העסקה, עלינו לאמת את פרטי ההתקשרות שלך.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div className="flex justify-center p-8"><span className="animate-spin text-primary">●</span></div>}>
                            <CompleteProfileForm user={user} next={nextUrl} />
                        </Suspense>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
