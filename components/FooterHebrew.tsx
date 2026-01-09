"use client"

import { Shield, Mail, Phone, MapPin } from "lucide-react"

const footerSections = [
  {
    title: "שירותים",
    links: [
      { label: "העברת בעלות", href: "/transfer" },
      { label: "ייעוץ משפטי", href: "/legal" },
      { label: "בדיקת רכב", href: "/inspection" },
      { label: "ביטוח עסקה", href: "/insurance" },
    ],
  },
  {
    title: "החברה",
    links: [
      { label: "אודות", href: "/about" },
      { label: "הצוות שלנו", href: "/team" },
      { label: "קריירה", href: "/careers" },
      { label: "בלוג", href: "/blog" },
    ],
  },
  {
    title: "משאבים",
    links: [
      { label: "מרכז עזרה", href: "/help" },
      { label: "מדריכים", href: "/guides" },
      { label: "שאלות נפוצות", href: "/faq" },
      { label: "צור קשר", href: "/contact" },
    ],
  },
  {
    title: "מידע משפטי",
    links: [
      { label: "תנאי שימוש", href: "/terms" },
      { label: "מדיניות פרטיות", href: "/privacy" },
      { label: "אבטחת מידע", href: "/security" },
      { label: "הסכם שירות", href: "/service-agreement" },
    ],
  },
]

export function FooterHebrew() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-muted/50 border-t">
      <div className="container py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-rubik)" }}>
                AutoTrust
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground mb-6 max-w-xs">
              הפלטפורמה המובילה בישראל להעברת בעלות רכב מאובטחת עם הגנת נאמנות וחתימה דיגיטלית.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:info@autotrust.co.il" className="hover:text-foreground transition-colors">
                  info@autotrust.co.il
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:03-1234567" className="hover:text-foreground transition-colors">
                  03-1234567
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>רחוב הרצל 123, תל אביב</span>
              </div>
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section, index) => (
            <div key={index} className="lg:col-span-1">
              <h4 className="text-sm font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {currentYear} AutoTrust. כל הזכויות שמורות.</p>
            <div className="flex items-center gap-6">
              <a
                href="#accessibility"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                הצהרת נגישות
              </a>
              <a href="#sitemap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                מפת אתר
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
