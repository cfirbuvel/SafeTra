"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, Shield } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import dynamic from "next/dynamic"

const UserAccountNav = dynamic(
  () => import("@/components/UserAccountNav").then((mod) => mod.UserAccountNav),
  { ssr: false }
)
const NotificationMenu = dynamic(
  () => import("@/components/NotificationMenu").then((mod) => mod.NotificationMenu),
  { ssr: false }
)
import Link from "next/link"

interface NavbarProps {
  user?: any
}

export function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-rubik)" }}>
            AutoTrust
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            איך זה עובד
          </a>
          <a href="/#features" className="text-sm font-medium hover:text-primary transition-colors">
            יתרונות
          </a>
          {user && (
            <Link
              href={user.role === 'lawyer' ? "/lawyer" : "/dashboard"}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {user.role === 'lawyer' ? "לוח בקרה (עו״ד)" : "דשבורד"}
            </Link>
          )}
          <a href="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            מחירים
          </a>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push("/auth/login")}>
                  התחברות
                </Button>
                <Button size="sm" onClick={() => router.push("/auth/login")}>
                  התחל עכשיו
                </Button>
              </>
            ) : (
              <>
                <NotificationMenu userId={user.id} />
                <UserAccountNav user={user} />
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          {user && (
            <>
              <NotificationMenu userId={user.id} />
              <UserAccountNav user={user} />
            </>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="תפריט">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 flex flex-col gap-4">
            <a href="/#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors">
              איך זה עובד
            </a>
            <a href="/#features" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors">
              יתרונות
            </a>
            {user && (
              <Link
                href={user.role === 'lawyer' ? "/lawyer" : "/dashboard"}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {user.role === 'lawyer' ? "לוח בקרה (עו״ד)" : "דשבורד"}
              </Link>
            )}
            <a href="/#pricing" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors">
              מחירים
            </a>
            {!user && (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setIsMenuOpen(false); router.push("/auth/login") }}>
                  התחברות
                </Button>
                <Button size="sm" onClick={() => { setIsMenuOpen(false); router.push("/auth/login") }}>
                  התחל עכשיו
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
