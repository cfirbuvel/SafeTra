import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { HowItWorks } from "@/components/HowItWorks"
import { Features } from "@/components/Features"
import { Pricing } from "@/components/Pricing"
import { FAQ } from "@/components/FAQ"
import { CTASection } from "@/components/CTASection"
import { FooterHebrew } from "@/components/FooterHebrew"
import { getCurrentUser } from "@/lib/actions/auth"

export default async function Page() {
  const user = await getCurrentUser()

  return (
    <>
      <Navbar user={user} />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <CTASection />
      <FooterHebrew />
    </>
  )
}
