import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { getCurrentUser } from "@/lib/actions/auth"
import { RealtimeManager } from "@/components/realtime/RealtimeManager"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "SafeTra - Secure Auto Exchange",
  description:
    "Secure peer-to-peer vehicle transaction platform with lawyer review and escrow services.",
  icons: {
    icon: "/icon.svg",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-left" richColors theme="dark" closeButton />
        <RealtimeManager userId={user?.id} role={user?.role} />
        <Analytics />
      </body>
    </html>
  )
}
