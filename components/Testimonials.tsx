import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "דוד כהן",
    role: "קונה רכב",
    content:
      "תהליך מדהים! הרגשתי בטוח לחלוטין לאורך כל הדרך. הכסף היה מוגן בנאמנות והכל התנהל בצורה מקצועית וחלקה. ממליץ בחום!",
    rating: 5,
    image: "/israeli-man-professional.jpg",
  },
  {
    name: "שרה לוי",
    role: "מוכרת רכב",
    content:
      "חסכתי המון זמן וכאב ראש. במקום לנסוע למשרד התחבורה וטפסים אין סופיים, הכל נעשה דיגיטלית תוך יומיים. שירות מעולה!",
    rating: 5,
    image: "/israeli-woman-professional.jpg",
  },
  {
    name: "משה אברהם",
    role: "סוחר רכבים",
    content:
      "כסוחר רכבים, אני עובד עם AutoTrust באופן קבוע. התמחור מצוין, השירות מהיר, והכי חשוב - הלקוחות שלי סומכים על התהליך.",
    rating: 5,
    image: "/car-dealer-israeli.jpg",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4 text-balance">מה הלקוחות שלנו אומרים</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            אלפי עסקאות מוצלחות ולקוחות מרוצים בכל רחבי הארץ
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">{testimonial.content}</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
