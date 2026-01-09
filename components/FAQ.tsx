import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "מה זה חשבון נאמנות ואיך הוא מגן עליי?",
    answer:
      "חשבון נאמנות הוא חשבון בנק מיוחד המנוהל על ידי עורך דין מוסמך. הכסף מוחזק בחשבון זה עד להשלמת כל תנאי העסקה ואישור העברת הבעלות. זה מבטיח שהמוכר יקבל את כספו רק לאחר שהקונה קיבל את הרכב כדין, והקונה מוגן מפני הונאה או אי-העברת בעלות.",
  },
  {
    question: "האם החתימה הדיגיטלית תקפה משפטית?",
    answer:
      "כן, לחלוטין. אנו משתמשים בחתימה דיגיטלית מתקדמת העומדת בתקן הישראלי ובחוק החתימה האלקטרונית. החתימה כוללת הצפנה, חותמת זמן ואימות זהות, והיא מוכרת על ידי כל הרשויות הממשלתיות בישראל.",
  },
  {
    question: "כמה זמן לוקח התהליך?",
    answer:
      "התהליך הממוצע נמשך בין 24 ל-48 שעות מרגע העברת הכסף לנאמנות ועד לשחרור הכספים. הזמן תלוי במהירות בה שני הצדדים מבצעים את החתימות והעברת המסמכים הנדרשים למשרד התחבורה.",
  },
  {
    question: "מה קורה אם אחד הצדדים רוצה לבטל את העסקה?",
    answer:
      "ניתן לבטל עסקה בכל שלב עד לחתימה הסופית. אם הביטול מתבצע לפני העברת הכסף, אין חיוב. אם הכסף כבר בנאמנות, הוא מוחזר במלואו לקונה. במקרה של מחלוקת, עורך הדין המלווה מתערב ומסייע בפתרון.",
  },
  {
    question: "האם המידע שלי מאובטח?",
    answer:
      "אבטחת המידע היא בראש סדר העדיפויות שלנו. אנו משתמשים בהצפנה ברמה הגבוהה ביותר (AES-256), אימות דו-שלבי, ועומדים בכל תקני האבטחה והפרטיות הישראליים והבינלאומיים. המידע מאוחסן בשרתים מאובטחים בישראל.",
  },
  {
    question: "מה כלול בליווי המשפטי?",
    answer:
      "הליווי המשפטי כולל בדיקת תקינות המסמכים, פיקוח על העברת הכספים, אימות זהויות, הכנת מסמכי העברה, וייצוג משפטי במקרה של מחלוקת. עורכי הדין שלנו זמינים לייעוץ ולתמיכה לאורך כל התהליך.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4 text-balance">שאלות נפוצות</h2>
          <p className="text-lg text-muted-foreground text-pretty">כל מה שרציתם לדעת על התהליך</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-right text-base font-semibold">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
