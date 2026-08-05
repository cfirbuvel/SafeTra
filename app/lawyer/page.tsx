import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { getServiceRoleClient } from "@/lib/supabase/service-role"
import Link from "next/link"
import { LawyerRealtimeListener } from "@/components/realtime/LawyerRealtimeListener"

export const metadata = {
  title: "Legal Review Console - SafeTra",
  description: "SafeTra Secure Auto Exchange Lawyer Console",
}

export default async function LawyerDashboard() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "lawyer" && user.role !== "admin")) {
    redirect("/")
  }

  const serviceClient = getServiceRoleClient()
  const { data: rawDeals, error: dealsError } = await serviceClient
    .from("deals")
    .select("*")
    .neq("status", "DRAFT") // Only show deals that have been submitted/approved
    .order("created_at", { ascending: false })

  if (dealsError) {
    console.error("Lawyer Dashboard Error:", dealsError)
  }

  // Manual Join for Profiles
  let deals: any[] = []
  if (rawDeals && rawDeals.length > 0) {
    const sellerIds = Array.from(new Set(rawDeals.map((d: any) => d.seller_id).filter(Boolean)))

    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, full_name, phone, email")
      .in("id", sellerIds)

    deals = rawDeals.map((deal: any) => ({
      ...deal,
      profiles: profiles?.find((p: any) => p.id === deal.seller_id) || null
    }))
  }

  // Calculate stats
  const activeQueue = deals.filter(d => d.status !== "COMPLETED" && d.status !== "CANCELLED").length
  const totalVolume = deals
    .filter(d => d.status !== "COMPLETED" && d.status !== "CANCELLED")
    .reduce((sum, d) => sum + Number(d.price_ils || 0), 0)

  // Translate statuses for Hebrew
  const getStatusHebrew = (status: string) => {
    switch (status) {
      case "DRAFT": return "טיוטה";
      case "SUBMITTED": return "הוגש";
      case "UNDER_REVIEW": return "בבדיקה";
      case "AWAITING_PAYMENT": return "ממתין לתשלום";
      case "PAYMENT_VERIFICATION": return "אימות תשלום";
      case "OWNERSHIP_TRANSFER_PENDING": return "העברת בעלות בהמתנה";
      case "COMPLETED": return "הושלם";
      case "CANCELLED": return "בוטל";
      default: return status;
    }
  }

  // Map AI risk labels based on plate and ocr check simulation
  const getRiskLabel = (deal: any) => {
    if (deal.owner_id_number && deal.vehicle_reg_owner_id && deal.owner_id_number !== deal.vehicle_reg_owner_id) {
      return { text: "AI: סיכון גבוה", color: "text-error bg-error/10 border-error/20" }
    }
    if (deal.first_name && deal.vehicle_reg_owner_name && !deal.vehicle_reg_owner_name.includes(deal.first_name)) {
      return { text: "AI: סיכון בינוני", color: "text-secondary bg-secondary/10 border-secondary/20" }
    }
    return { text: "AI: סיכון נמוך", color: "text-primary bg-primary/10 border-primary/20" }
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <LawyerRealtimeListener />
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex flex-col h-screen fixed right-0 top-0 w-72 bg-surface-container-lowest border-l border-outline-variant shadow-xl z-50">
        <div className="p-6 flex flex-col items-start">
          <h1 className="font-display-lg text-2xl font-bold text-primary mb-8">SafeTra</h1>
          <div className="flex items-center gap-3 p-3 w-full mb-8 glass-panel rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary">account_balance</span>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">SafeTra אבטחה</p>
              <p className="text-[9px] text-on-surface-variant uppercase font-semibold">רמה מוסדית</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 flex-1">
          {user.role === "admin" && (
            <Link className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all duration-300 rounded-lg" href="/admin">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-semibold">פאנל מנהל</span>
            </Link>
          )}
          <Link className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all duration-300 rounded-lg" href="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-semibold">לוח בקרה</span>
          </Link>
          <Link className="flex items-center gap-4 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg shadow-lg" href="/lawyer">
            <span className="material-symbols-outlined">gavel</span>
            <span className="text-sm font-semibold">ביקורות</span>
          </Link>
        </div>
        <div className="mt-auto p-6 border-t border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              {(user.full_name || "LE").split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div className="flex-1 overflow-hidden mr-3">
              <p className="text-xs font-bold truncate">{user.full_name || "עורך דין"}</p>
              <p className="text-[10px] text-primary font-mono">בעל רישיון מאומת</p>
            </div>
            <Link href="/auth/logout" className="material-symbols-outlined text-on-surface-variant text-sm hover:text-primary transition-colors">
              logout
            </Link>
          </div>
        </div>
      </nav>

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex justify-between items-center px-6 h-16 lg:right-72 lg:w-[calc(100%-18rem)]">
        <h2 className="font-display-lg text-xl font-bold text-primary tracking-tight lg:hidden">SafeTra</h2>
        <div className="hidden lg:flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">gavel</span>
          <span className="font-bold text-base text-on-surface">מסוף בדיקות משפטיות</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[9px] border border-primary/20">מערכת יציבה</div>
          <span className="material-symbols-outlined text-on-surface-variant hover:bg-surface-bright/50 transition-colors p-2 rounded-full cursor-pointer">notifications</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:mr-72 pt-24 px-4 lg:px-8 max-w-7xl mx-auto w-full min-h-screen pb-20 text-right">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em] mb-1">תור בדיקה</p>
            <h3 className="text-2xl font-bold text-on-background">עסקאות בהמתנה לאימות</h3>
          </div>
          <div className="flex gap-3">
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-on-surface-variant text-xs font-semibold">תור פעיל</span>
              <span className="text-primary font-bold text-sm">{activeQueue}</span>
            </div>
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-on-surface-variant text-xs font-semibold">נפח נאמנות</span>
              <span className="text-secondary font-bold text-sm">₪{totalVolume.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {deals.map((deal) => {
            const risk = getRiskLabel(deal)
            return (
              <div key={deal.id} className="glass-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 group hover:bg-surface-container-high transition-colors">
                <div className="flex-1 text-right w-full">
                  <div className="flex items-center gap-2.5 mb-2 justify-start">
                    <span className="font-mono text-[10px] text-primary/80">#עסקה-{deal.id.slice(0, 8).toUpperCase()}</span>
                    <h4 className="font-bold text-base text-foreground">
                      {deal.vehicle_make} {deal.vehicle_model} {deal.vehicle_year}
                    </h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${risk.color}`}>
                      {risk.text}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant flex flex-wrap gap-x-6 gap-y-1 justify-start">
                    <span>מוכר: <strong className="text-on-surface">{deal.profiles?.full_name || "לא ידוע"}</strong></span>
                    <span>מספר רישוי: <strong className="text-on-surface font-mono">{deal.license_plate || "לא זמין"}</strong></span>
                    <span>מחיר: <strong className="text-primary font-bold">₪{Number(deal.price_ils).toLocaleString()}</strong></span>
                    <span>סטטוס: <strong className="text-secondary font-semibold uppercase">{getStatusHebrew(deal.status)}</strong></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/lawyer/${deal.id}`}>
                    <button className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold px-6 py-2.5 rounded-lg text-xs transition-all duration-300 emerald-glow active:scale-95">
                      בדיקת עסקה
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}

          {(!deals || deals.length === 0) && (
            <div className="text-center text-on-surface-variant py-16 glass-panel rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">inbox</span>
              <p className="text-sm">אין עסקאות ממתינות לאימות בתור הבדיקה.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

