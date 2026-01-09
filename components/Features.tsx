import { Card, CardContent } from "@/components/ui/card"
import { Shield, FileSignature, Clock, Users, Lock, HeadphonesIcon } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "הגנה בנאמנות מלאה",
    description: "הכסף מוחזק בחשבון נאמנות מפוקח על ידי עורך דין מוסמך עד להשלמת העסקה.",
  },
  {
    icon: FileSignature,
    title: "חתימה דיגיטלית מאובטחת",
    description: "חתימה דיגיטלית תקפה משפטית בהתאם לחוק החתימה האלקטרונית הישראלי.",
  },
  {
    icon: Clock,
    title: "תהליך מהיר - 24-48 שעות",
    description: "תהליך מקוון מהיר ויעיל המקצר את זמן העסקה באופן משמעותי.",
  },
  {
    icon: Users,
    title: "ליווי משפטי מקצועי",
    description: "עורכי דין מוסמכים עוקבים ומפקחים על כל שלב בתהליך.",
  },
  {
    icon: Lock,
    title: "אבטחה ברמה הגבוהה ביותר",
    description: "הצפנה מתקדמת, אימות דו-שלבי והגנה מלאה על המידע האישי שלך.",
  },
  {
    icon: HeadphonesIcon,
    title: "תמיכה ושירות 24/7",
    description: "צוות התמיכה שלנו זמין עבורך בכל שעה ומוכן לעזור בכל שאלה.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4 text-balance">למה לבחור ב-AutoTrust?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            הפלטפורמה המתקדמת והמאובטחת ביותר להעברת בעלות רכב בישראל
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
