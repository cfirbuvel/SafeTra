import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/actions/auth"
import { getUserDeals } from "@/lib/actions/deals"
import { Navbar } from "@/components/Navbar"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Dashboard - SafeTra",
  description: "SafeTra Secure Auto Exchange User Dashboard",
}

interface Deal {
  id: string
  title: string
  price_ils: number
  status: string
  created_at: string
  license_plate?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  chassis_number?: string
  seller_id: string
  buyer_id: string
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/auth/login")
  if (user.role === "lawyer") redirect("/lawyer")
  if (user.role === "admin") redirect("/admin")

  const deals = await getUserDeals()
  const userDeals = (deals || []) as Deal[]

  // Get active deal to show on the timeline (default to first active deal)
  const activeDeal = userDeals.find(d => d.status !== "COMPLETED" && d.status !== "CANCELLED") || userDeals[0]

  // Map status to timeline step active index (1 to 5)
  const getTimelineStep = (status: string) => {
    switch (status) {
      case "DRAFT":
        return 1 // Verification
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return 2 // Legal Review
      case "AWAITING_PAYMENT":
        return 3 // Contract
      case "PAYMENT_VERIFICATION":
      case "OWNERSHIP_TRANSFER_PENDING":
        return 4 // Escrow
      case "COMPLETED":
        return 5 // Finished
      default:
        return 1
    }
  }

  const activeStep = activeDeal ? getTimelineStep(activeDeal.status) : 1

  const vehicleMake = activeDeal?.vehicle_make || ""
  const vehicleModel = activeDeal?.vehicle_model || ""
  const vehicleYear = activeDeal?.vehicle_year || ""
  const licensePlate = activeDeal?.license_plate || ""
  const chassisNumber = activeDeal?.chassis_number || ""
  const priceILS = activeDeal?.price_ils || 0

  return (
    <>
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        <Navbar user={user} />

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
            <Link className="bg-primary-container text-on-primary-container rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/dashboard">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-semibold">לוח בקרה</span>
            </Link>
            <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/deals/new">
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-sm font-semibold">עסקה חדשה</span>
            </Link>
            <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/deals">
              <span className="material-symbols-outlined">handshake</span>
              <span className="text-sm font-semibold">העסקאות שלי</span>
            </Link>
            <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg flex items-center gap-4 px-4 py-3 transition-all duration-300" href="/profile">
              <span className="material-symbols-outlined">account_circle</span>
              <span className="text-sm font-semibold">פרופיל</span>
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
          {/* Interactive Deal Timeline */}
          <section className="mb-12 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="font-display-lg text-3xl font-bold text-on-surface mb-1">תהליכים פעילים</h1>
                <p className="text-sm text-on-surface-variant max-w-lg">עקוב אחר העסקאות בעלות הערך הגבוה שלך לאורך מחזור חיים של אימות מאובטח.</p>
              </div>
              <Link href="/deals/new">
                <button className="bg-primary hover:bg-primary/95 text-on-primary font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all emerald-glow active:scale-95 group">
                  <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
                  התחלת עסקה חדשה
                </button>
              </Link>
            </div>

            {/* Timeline Component */}
            <div className="glass-card rounded-2xl p-6 overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* Step 1: Verification */}
                <div className={`flex flex-col items-center gap-2 flex-1 group/step transition-all duration-300 ${activeStep === 1 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${activeStep === 1 ? 'bg-primary-container border-primary/20 step-active scale-110' : 'bg-surface-container border-outline/30'} transition-transform duration-300`}>
                    <span className={`material-symbols-outlined ${activeStep === 1 ? 'text-on-primary-container' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${activeStep === 1 ? 'text-primary' : 'text-on-surface-variant'}`}>אימות</span>
                </div>
                <div className={`hidden md:block h-[2px] flex-1 ${activeStep > 1 ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>

                {/* Step 2: Legal Review */}
                <div className={`flex flex-col items-center gap-2 flex-1 group/step transition-all duration-300 ${activeStep === 2 ? 'opacity-100' : activeStep > 2 ? 'opacity-60' : 'opacity-30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${activeStep === 2 ? 'bg-secondary-container border-secondary/20 step-active scale-110' : activeStep > 2 ? 'bg-primary/20 border-primary/40' : 'bg-surface-container border-outline/30'} transition-transform duration-300`}>
                    <span className={`material-symbols-outlined ${activeStep === 2 ? 'text-secondary' : activeStep > 2 ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${activeStep === 2 ? 'text-secondary' : activeStep > 2 ? 'text-primary' : 'text-on-surface-variant'}`}>בדיקת עורך דין</span>
                </div>
                <div className={`hidden md:block h-[2px] flex-1 ${activeStep > 2 ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>

                {/* Step 3: Contract */}
                <div className={`flex flex-col items-center gap-2 flex-1 group/step transition-all duration-300 ${activeStep === 3 ? 'opacity-100' : activeStep > 3 ? 'opacity-60' : 'opacity-30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${activeStep === 3 ? 'bg-primary-container border-primary/20 step-active scale-110' : activeStep > 3 ? 'bg-primary/20 border-primary/40' : 'bg-surface-container border-outline/30'} transition-transform duration-300`}>
                    <span className={`material-symbols-outlined ${activeStep === 3 ? 'text-on-primary-container' : activeStep > 3 ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${activeStep === 3 ? 'text-primary' : activeStep > 3 ? 'text-primary' : 'text-on-surface-variant'}`}>חתימת חוזה</span>
                </div>
                <div className={`hidden md:block h-[2px] flex-1 ${activeStep > 3 ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>

                {/* Step 4: Escrow */}
                <div className={`flex flex-col items-center gap-2 flex-1 group/step transition-all duration-300 ${activeStep === 4 ? 'opacity-100' : activeStep > 4 ? 'opacity-60' : 'opacity-30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${activeStep === 4 ? 'bg-secondary-container border-secondary/20 step-active scale-110' : activeStep > 4 ? 'bg-primary/20 border-primary/40' : 'bg-surface-container border-outline/30'} transition-transform duration-300`}>
                    <span className={`material-symbols-outlined ${activeStep === 4 ? 'text-secondary' : activeStep > 4 ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${activeStep === 4 ? 'text-secondary' : activeStep > 4 ? 'text-primary' : 'text-on-surface-variant'}`}>נאמנות זהב</span>
                </div>
                <div className={`hidden md:block h-[2px] flex-1 ${activeStep > 4 ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>

                {/* Step 5: Finished */}
                <div className={`flex flex-col items-center gap-2 flex-1 group/step transition-all duration-300 ${activeStep === 5 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${activeStep === 5 ? 'bg-primary-container border-primary/20 step-active scale-110' : 'bg-surface-container border-outline/30'} transition-transform duration-300`}>
                    <span className={`material-symbols-outlined ${activeStep === 5 ? 'text-on-primary-container' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${activeStep === 5 ? 'text-primary' : 'text-on-surface-variant'}`}>הושלם</span>
                </div>
              </div>
            </div>
          </section>

          {/* Active Deals Bento Grid */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-on-surface">עסקאות פעילות</h2>
              <Link href="/deals" className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline">
                צפייה בארכיון
                <span className="material-symbols-outlined text-[16px] rotate-180">arrow_forward</span>
              </Link>
            </div>

            {userDeals.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/deals/new" className="col-span-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 group hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">התחלת עסקה</h3>
                  <p className="text-xs text-on-surface-variant text-center max-w-[200px]">התחל עסקה בטוחה בשיטת P2P עם הגנה מוסדית.</p>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userDeals.map((deal, idx) => {
                  const dealStep = getTimelineStep(deal.status)
                  const progressPct = dealStep * 20
                  const isSeller = deal.seller_id === user.id
                  const isPrimary = deal.status !== "CANCELLED" && deal.status !== "EXPIRED"

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

                  // Mock images for luxury/classic cars matching Stitch preview
                  const carImages = [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuA_T72TJ7xFT35cY_sV5hBfAOk95rH2QX_ZHnTxrZNyDtKEqB2CwcFaqAXBBv6tDy6y1QXCZO9o0TBU_hS8S6pea6-UsIJKYHg88pNWsQl5PAhPTDfmuSzFteyuVX0W7m1tClMLyFCnh5gL5LQp9-dGzeuwMxwO42XkJxJn0Kafxy3eB2q7uWgdOuqWCw4Y92SKEk6rmtNPEbgmE5GSDkJzW-D6rT06yrbeXVLmNZHb94AtntDnQveoXX8zDqJM3SzLxl7AXmUO1p0",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBUACm4siU8LhYAa5vdf0PlsZRx0R1_l1GIIBluvdrV1vor_hGEmDwSuRI6-yzmV-_d_GZgiOeSC-Rp68RXYzHT7GyJLWYCaTW_PHLSePw7qAHsBu3oE6aFJ3XCOmDqvacWiNC3Qk5Kzk_o_6Nro_d6o1Dh5ZoVx8wuI5C612J-HsG6VZE4Fxgab3iSJrUHvbLc7jEhuWbWL6jGMCYYfXA5CGg12Lh96yhApGVjubAyszi11Tiewe2Woi9uhLTBS7bgR6wbn4ll1GI"
                  ]
                  const imageUrl = (deal as any).thumbnail_url || carImages[idx % carImages.length]

                  return (
                    <Link key={deal.id} href={`/deals/${deal.id}`} className={`glass-card rounded-2xl overflow-hidden flex flex-col border-r-4 ${isPrimary ? 'border-r-primary' : 'border-r-secondary'} group hover:bg-surface-container-high transition-all duration-300 hover:-translate-y-1`}>
                      <div className="h-48 w-full relative">
                        <img className="w-full h-full object-cover" src={imageUrl} alt={deal.title} />
                        <div className="absolute top-4 left-4 glass-card px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-primary shadow-[0_0_8px_#10b981]' : 'bg-secondary shadow-[0_0_8px_#ffb77d]'}`}></span>
                          <span className="text-[10px] font-mono font-bold text-on-surface">
                            {getStatusHebrew(deal.status)}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-on-surface line-clamp-1">{deal.title}</h3>
                            <p className="text-[10px] font-mono text-on-surface-variant mt-1">VIN: {deal.chassis_number || "WP0AA2A9XPS******"}</p>
                          </div>
                          <span className={`text-xl font-bold ${isPrimary ? 'text-primary' : 'text-secondary'}`}>
                            ₪{Number(deal.price_ils).toLocaleString("he-IL")}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-surface-container-lowest rounded-xl">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${isPrimary ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                            {isSeller ? "מוכר" : "קונה"}
                          </div>
                          <div className="mr-3">
                            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">{isSeller ? "אתה המוכר" : "אתה הקונה"}</p>
                            <p className="text-xs text-on-surface font-semibold">צומת SafeTra מאומת</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-on-surface-variant font-medium">התקדמות התהליך</span>
                            <span className={`font-bold ${isPrimary ? 'text-primary' : 'text-secondary'}`}>{progressPct}%</span>
                          </div>
                          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full ${isPrimary ? 'bg-primary shadow-[0_0_10px_#10b981]' : 'bg-secondary'}`} style={{ width: `${progressPct}%` }}></div>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">info</span>
                            {deal.status === "DRAFT" && "ממתין להעלאת מסמכים"}
                            {deal.status === "SUBMITTED" && "ממתין להקצאת עורך דין"}
                            {deal.status === "UNDER_REVIEW" && "עורך הדין בודק את הגילויים"}
                            {deal.status === "AWAITING_PAYMENT" && "ממתין להפקדה בחשבון הנאמנות"}
                            {deal.status === "PAYMENT_VERIFICATION" && "מאמת את נעילת הכספים"}
                            {deal.status === "OWNERSHIP_TRANSFER_PENDING" && "העברת בעלות רכב בתהליך"}
                            {deal.status === "COMPLETED" && "העסקה הושלמה בהצלחה"}
                            {deal.status === "CANCELLED" && "העסקה בוטלה"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Secondary Info Cards */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-20 h-20 flex-shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <div>
                <h4 className="font-bold text-lg text-on-surface mb-2">הגנת נאמנות SafeTra</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-3">הכספים שלך נעולים בבטחה בחשבונות נאמנות ברמה מוסדית ומשתחררים רק לאחר העברת הבעלות ואישור שני הצדדים.</p>
                <div className="flex gap-4">
                  <span className="text-xs font-mono text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    כספות מבוטחות במלואן
                  </span>
                  <span className="text-xs font-mono text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    בקרה אוטומטית 24/7
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-20 h-20 flex-shrink-0 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
                <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
              </div>
              <div>
                <h4 className="font-bold text-lg text-on-surface mb-2">טיוטות משפטיות אוטומטיות</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-3">מנוע החוזים החכמים של SafeTra מייצר באופן דינמי שטר מכר והגשות העברת בעלות התואמים לתקנות.</p>
                <button className="text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:-translate-x-1 transition-transform">
                  צפייה בתבניות חוזה
                  <span className="material-symbols-outlined text-xs rotate-180">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom Mobile Navigation */}
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 w-full z-50 bg-background/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 py-3">
          <Link href="/dashboard" className="flex flex-col items-center justify-center text-primary font-bold">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-[10px] font-semibold mt-0.5">לוח בקרה</span>
          </Link>
          <Link href="/deals/new" className="flex flex-col items-center justify-center text-on-surface-variant opacity-65 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">add_box</span>
            <span className="text-[10px] font-semibold mt-0.5">יצירה</span>
          </Link>
          <Link href="/deals" className="flex flex-col items-center justify-center text-on-surface-variant opacity-65 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">handshake</span>
            <span className="text-[10px] font-semibold mt-0.5">עסקאות</span>
          </Link>
        </footer>
      </div>

    </>
  )
}

