import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, CheckCircle, Car } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "יצירת עסקה",
    description: "המוכר יוצר עסקה חדשה, מזין את פרטי הרכב והמחיר המוסכם ושולח הזמנה לקונה.",
    number: "01",
  },
  {
    icon: Shield,
    title: "העברה לנאמנות",
    description: "הקונה מעביר את הכסף לחשבון הנאמנות המפוקח על ידי עורך דין מוסמך.",
    number: "02",
  },
  {
    icon: CheckCircle,
    title: "חתימה דיגיטלית",
    description: "שני הצדדים חותמים דיגיטלית על מסמכי ההעברה - תקף משפטית ומאובטח לחלוטין.",
    number: "03",
  },
  {
    icon: Car,
    title: "העברה ושחרור כספים",
    description: "לאחר אישור העברת הבעלות במשרד התחבורה, הכספים משוחררים למוכר והרכב למי שקנה.",
    number: "04",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4 text-balance">איך זה עובד?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            תהליך פשוט ומאובטח בארבעה שלבים - מיצירת העסקה ועד לקבלת הכספים והרכב
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute top-4 left-4 text-6xl font-bold text-primary/10">{step.number}</div>
              <CardHeader className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
