import { TrendingUp, Users, Shield, Clock } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "15,000+",
    label: "עסקאות מוצלחות",
  },
  {
    icon: Shield,
    value: "₪420M+",
    label: "הועברו בנאמנות",
  },
  {
    icon: Clock,
    value: "24-48",
    label: "שעות ממוצע",
  },
  {
    icon: TrendingUp,
    value: "99.8%",
    label: "שביעות רצון",
  },
]

export function Stats() {
  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 mb-4">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-primary-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
