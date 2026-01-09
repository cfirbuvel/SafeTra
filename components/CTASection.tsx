"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export function CTASection() {
  const router = useRouter()

  const handleNavigateToLogin = () => {
    router.push("/auth/login")
  }

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary/95 to-secondary">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white mb-6">
            <Shield className="h-4 w-4" />
            <span>מאובטח ומהיר</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl text-white mb-6 text-balance">
            מוכנים להעביר בעלות בצורה הכי בטוחה שיש?
          </h2>

          <p className="text-lg text-white/90 mb-8 leading-relaxed text-pretty">
            הצטרפו לאלפי ישראלים שכבר סומכים על AutoTrust להעברת בעלות רכב מאובטחת. התחילו עכשיו ותחוו תהליך פשוט, מהיר
            ובטוח לחלוטין.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-base bg-white text-primary hover:bg-white/90"
              onClick={handleNavigateToLogin}
            >
              התחל עכשיו בחינם
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base border-white text-white hover:bg-white/10 bg-transparent"
            >
              דבר עם יועץ
            </Button>
          </div>

          <p className="text-sm text-white/80 mt-6">✓ ללא עמלות נסתרות • ✓ ביטול בחינם • ✓ תמיכה 24/7</p>
        </div>
      </div>
    </section>
  )
}
