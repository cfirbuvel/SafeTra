import { NewDealForm } from "./NewDealForm"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "עסקה חדשה - AutoTrust",
  description: "יצירת עסקה חדשה",
}

import { Navbar } from "@/components/Navbar"
import { BackButton } from "@/components/BackButton"

export default async function NewDealPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login?next=/deals/new")
  }

  if (user.role === "lawyer") {
    redirect("/lawyer")
  }

  const isProfileComplete = user.full_name && user.id_number && user.email

  if (!isProfileComplete) {
    redirect("/auth/complete-profile?next=/deals/new")
  }

  return (
    <>
      <Navbar user={user} />
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <BackButton href="/deals" className="mb-6" />
          <NewDealForm />
        </div>
      </div>
    </>
  )
}
