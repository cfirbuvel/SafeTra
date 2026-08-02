import { NewDealForm } from "./NewDealForm"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export const metadata = {
  title: "New Deal - SafeTra",
  description: "Create a secure vehicle transaction vault",
}

export default async function NewDealPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login?next=/deals/new")
  }

  if (user.role === "lawyer") {
    redirect("/lawyer")
  }

  if (user.role === "admin") {
    redirect("/admin")
  }

  const isProfileComplete = user.full_name && user.id_number && user.email

  if (!isProfileComplete) {
    redirect("/auth/complete-profile?next=/deals/new")
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4">
          <span className="font-display-lg text-2xl font-bold text-primary tracking-tight">SafeTra</span>
          <div className="hidden md:flex gap-2 mr-8">
            <nav className="flex gap-4">
              <Link className="text-on-surface-variant hover:bg-surface-bright/50 transition-colors font-medium text-sm px-4 py-1.5 rounded-lg" href="/dashboard">לוח בקרה</Link>
              <Link className="text-on-surface-variant hover:bg-surface-bright/50 transition-colors font-medium text-sm px-4 py-1.5 rounded-lg" href="/deals">העסקאות שלי</Link>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">צומת מאובטח פעיל</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-on-surface-variant">{user.full_name || user.email}</span>
            <Link href="/auth/logout" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              logout
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex flex-col h-screen fixed right-0 top-0 w-72 bg-surface-container-lowest border-l border-outline-variant shadow-xl z-40 pt-20 px-4">
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-surface-container">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <p className="text-base font-bold text-primary">SafeTra ריבוני</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold opacity-70">רמת כספת v4</p>
          </div>
        </div>
        <nav className="space-y-2">
          <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-semibold">לוח בקרה</span>
          </Link>
          <Link className="bg-primary-container text-on-primary-container rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/deals/new">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-sm font-semibold">עסקה חדשה</span>
          </Link>
          <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/deals">
            <span className="material-symbols-outlined">handshake</span>
            <span className="text-sm font-semibold">העסקאות שלי</span>
          </Link>
        </nav>
        <div className="mt-auto mb-8 p-4 glass-card rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-primary tracking-widest">מובלעת אבטחה</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#10b981]"></span>
          </div>
          <p className="text-xs text-on-surface-variant opacity-70 leading-relaxed">כל ערוצי העסקאות מוגנים באמצעות פרוטוקול AES 256-bit.</p>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="lg:mr-72 pt-24 pb-32 px-4 md:px-8 max-w-[1440px] mx-auto min-h-screen text-right">
        <NewDealForm />
      </main>

      {/* Bottom Mobile Navigation */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 w-full z-50 bg-background/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 py-3">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-on-surface-variant opacity-65 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-semibold mt-0.5">לוח בקרה</span>
        </Link>
        <Link href="/deals/new" className="flex flex-col items-center justify-center text-primary font-bold">
          <span className="material-symbols-outlined">add_box</span>
          <span className="text-[10px] font-semibold mt-0.5">יצירה</span>
        </Link>
        <Link href="/deals" className="flex flex-col items-center justify-center text-on-surface-variant opacity-65 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">handshake</span>
          <span className="text-[10px] font-semibold mt-0.5">עסקאות</span>
        </Link>
      </footer>
    </div>
  )
}

