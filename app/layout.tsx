import type React from "react"
import type { Metadata } from "next"
import { Heebo, Rubik } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  weight: ["400", "500", "600", "700"],
})

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  weight: ["500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "AutoTrust - העברת בעלות רכב בצורה בטוחה",
  description:
    "פלטפורמה דיגיטלית להעברת בעלות רכב עם הגנה בנאמנות וחתימה דיגיטלית. רכישת רכב מאובטחת עם שירות נאמנות ועורכי דין מוסמכים.",
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
  },
  keywords: ["רכב יד שנייה", "העברת בעלות", "נאמנות", "עורך דין", "רכב בטוח", "מכירת רכב"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${rubik.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
