"use client"

import { Button } from "@/components/ui/button"
import { Shield, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function Hero() {
  const router = useRouter()

  const handleNavigateToLogin = () => {
    router.push("/auth/login")
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent to-background py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pr-8 sm:pr-12 lg:pr-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary w-fit">
              <Shield className="h-4 w-4" />
              <span>מאובטח בנאמנות ע"י עורך דין</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-balance">
              העברת בעלות רכב
              <span className="text-primary"> בצורה בטוחה ומהירה</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              הפלטפורמה הדיגיטלית המובילה להעברת בעלות רכב בישראל. עם הגנה מלאה בנאמנות, חתימה דיגיטלית וליווי משפטי -
              תהליך פשוט, מהיר ובטוח לחלוטין.
            </p>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>כספים מוגנים בחשבון נאמנות מפוקח</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>חתימה דיגיטלית מאובטחת תקפה משפטית</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>ליווי ובקרה של עורכי דין מוסמכים</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button size="lg" className="text-base" onClick={handleNavigateToLogin}>
                התחל העברת בעלות
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                איך זה עובד?
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              💳 ללא עמלות נסתרות • ⚡ תהליך מהיר של 24-48 שעות • 🛡️ מאובטח ומוגן
            </p>
          </div>

          <div className="relative">
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10 p-8">
              <div className="absolute inset-0 rounded-2xl bg-grid-pattern opacity-10" />
              <img
                src="/images/ff2338a0-d859-4c31-bd76-2de66888d501.png"
                alt="העברת בעלות רכב מאובטחת"
                className="rounded-xl object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
