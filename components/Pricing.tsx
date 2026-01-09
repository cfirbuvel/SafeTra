import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "בסיסי",
    price: "₪499",
    description: "מושלם לעסקאות פרטיות פשוטות",
    features: [
      "חשבון נאמנות מפוקח",
      "חתימה דיגיטלית מאובטחת",
      "ליווי משפטי בסיסי",
      "תמיכה בשעות העבודה",
      "ביטול עסקה בחינם",
    ],
    popular: false,
  },
  {
    name: "מקצועי",
    price: "₪799",
    description: "הפתרון המומלץ לרוב העסקאות",
    features: [
      "כל היתרונות של התוכנית הבסיסית",
      "ליווי משפטי מלא 24/7",
      "בדיקת היסטוריית רכב",
      "ייעוץ מקצועי לפני העסקה",
      "עדיפות בטיפול",
      "ביטוח עסקה מלא",
    ],
    popular: true,
  },
  {
    name: "עסקי",
    price: "לפי הצעה",
    description: "לסוחרים ועסקים עם נפח עסקאות גבוה",
    features: [
      "כל היתרונות של התוכנית המקצועית",
      "ניהול מרובה עסקאות",
      "API לאינטגרציה",
      "מנהל חשבון ייעודי",
      "דיווחים מתקדמים",
      "תמחור מיוחד לנפחים",
    ],
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4 text-balance">תמחור שקוף ומובן</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            בחר את החבילה המתאימה לך - ללא עמלות נסתרות, ללא הפתעות
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-4 right-0 left-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                    מומלץ ביותר
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "לפי הצעה" && <span className="text-muted-foreground mr-2">לעסקה</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.price === "לפי הצעה" ? "צור קשר" : "התחל עכשיו"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
