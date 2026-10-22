# 🎬 Lumière — Cinematic Review Atelier

**Lumière** هو أتيليه سينمائي أنيق لصناعة مراجعات **Letterboxd** احترافية وشخصية — بالدارجة المغربية، الإنگليزية، والفرنسية — مع محرّك بصري من Fanart.tv & TMDB وبصمة كتابة (Writing DNA) تحفظ أسلوبك الخاص.

## ✨ الهوية الجديدة (v5.0 "Lumière")
- **لوحة الألوان**: `#ffb454` ذهب الإسقاط • `#2dd4bf` تركوازي سينمائي • `#fb7185` مرجاني دافئ • خلفية `#06070d` حبر الليل العميق.
- **العناصر المميزة**: شعار LUMIÈRE مع شارة SVG متوهجة، faisceau ديال بروجيكتور متحرك، وrails ديال البيليكول على الجوانب.
- **الحركات**: Balayage ضوئي على الـ Hero، Spotlight يتبع الفأرة داخل بطاقات `cinema-glass`، Scroll-reveal للأقسام، Modal pop animation.
- **الإتاحة**: Focus rings واضحة، دعم `prefers-reduced-motion`، وتباين محسّن.

## 📁 هيكلة الدوسي (Project Structure)
```
lumiere-atelier/
├── index.html        # الصفحة الرئيسية (نقية 100% بلا سكريبتات خارجية محقونة)
├── css/
│   └── styles.css    # نظام التصميم v5.0: Tokens, halos, spotlight cards
├── js/
│   ├── config.js     # بلاصة مفاتيح الـ API ديالك (Fanart.tv, TMDB, OMDb, Gemini)
│   └── app.js        # الكود البرمجي الكامل (Writing DNA, Fanart Engine, CSV/RSS Sync)
└── README.md         # دليل الاستخدام
```

## 🔑 كيفاش تزيد مفاتيح الـ API ديالك؟
عندك جوج طرق ساهلين:
1. **من الكود مباشرة:** حل الملف `js/config.js` بأي محرر نصوص وحط المفاتيح فـ البلايص المخصصة ليهم.
2. **من الواجهة:** حل `index.html` وكليكي على **"🔑 مفاتيح الـ API"** وحطهم تما.

## 🖼️ محرك Fanart.tv البصري
- ملي كتقلب على أي فيلم وتختارو، التطبيق كيجبد الـ **TMDB ID** أو **IMDb ID** أوتوماتيكياً.
- كيتصل بـ **Fanart.tv API** وكيجبد ليك:
  1. **HD Movie Backgrounds**: خلفيات رسمية عالية الجودة كتولي هي خلفية الموقع.
  2. **HD ClearLogo**: لوغو الفيلم شفاف بلا خلفية فوق البانر.
  3. **Fanart Gallery Drawer**: معرض وسط الصفحة تبدل منو الخلفية بكليكة وحدة.

## 🧬 Writing DNA
عمّر مرة وحدة: أفلامك المفضلة، عدستك النقدية، عينات من مراجعاتك القديمة، والكلمات اللي ما بغيتيهاش — وكتدخل أوتوماتيكياً فـ كل برومبت باش الـ AI يكتب بحالك نتا.

---
*Lumière — where every review is projected in your own light.* ✨
