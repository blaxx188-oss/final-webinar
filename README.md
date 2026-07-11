# مشروع صفحة هبوط الويبنار — "لماذا تشعر بالضياع رغم نجاحك؟"

مشروع Static كامل (HTML/CSS/JS) مبني بدون أي Framework، جاهز للرفع على منصة **سلة (Salla)** أو أي استضافة Static أخرى (Netlify, Vercel, GitHub Pages, Cloudflare Pages...).

---

## 📁 هيكل المشروع

```
webinar-project/
├── index.html          # الصفحة الرئيسية
├── thank-you.html      # صفحة الشكر
├── css/style.css        # التصميم الكامل
├── js/app.js             # كل المنطق التفاعلي
├── apps-script/Code.gs    # الباك إند (Google Apps Script)
├── assets/
│   ├── images/            # ضع صور المحاضرة والشهادات هنا
│   ├── icons/
│   └── logo.svg
└── README.md
```

> ⚠️ **ملاحظة مهمة**: يجب عليك إضافة صورك الفعلية داخل `assets/images/` بالأسماء التالية حتى تظهر الصفحة بشكل صحيح:
> `speaker.jpg`, `speaker-full.jpg`, `testi-1.jpg`, `testi-2.jpg`, `testi-3.jpg`, `og-cover.jpg`

---

## 1️⃣ إنشاء Google Sheet لاستقبال التسجيلات

1. اذهب إلى [sheets.google.com](https://sheets.google.com) وأنشئ ملف جديد باسم `Webinar Registrations`.
2. لا تحتاج لإنشاء أي أعمدة يدويًا — الكود سينشئها تلقائيًا عند أول تسجيل.

---

## 2️⃣ نشر Google Apps Script

1. من داخل الشيت: **الإضافات (Extensions) → Apps Script**.
2. احذف أي كود موجود، والصق محتوى ملف `apps-script/Code.gs` بالكامل.
3. عدّل هذه القيم أعلى الملف حسب مشروعك:
   ```js
   const ADMIN_EMAIL = 'admin@example.com';      // بريدك الإداري
   const WEBINAR_JOIN_URL = 'https://example.com/live'; // رابط البث الفعلي
   ```
4. من الأعلى اضغط **حفظ (Save)**.
5. اضغط **نشر (Deploy) → New deployment**.
6. اختر النوع: **Web app**.
7. الإعدادات:
   - **Execute as**: Me (حسابك)
   - **Who has access**: Anyone (حتى يعمل النموذج من أي زائر)
8. اضغط **Deploy**، ووافق على صلاحيات الوصول عند طلبها.
9. انسخ **رابط Web App URL** الناتج (ينتهي بـ `/exec`).

---

## 3️⃣ وضع الرابط داخل JavaScript

افتح ملف `js/app.js` وابحث عن السطر التالي في أعلى الملف:

```js
API_URL: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
```

استبدله برابط Web App الذي نسخته في الخطوة السابقة:

```js
API_URL: 'https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec',
```

عدّل أيضًا هذه الإعدادات في نفس الملف حسب مشروعك:
```js
WEBINAR_DATE_ISO: '2026-08-01T20:00:00+03:00',
WEBINAR_JOIN_URL: 'https://example.com/live',
WHATSAPP_GROUP_URL: 'https://chat.whatsapp.com/xxxxxxxx',
```

> كرر نفس تعديل `WEBINAR_DATE_ISO` في ملف `thank-you.html` (سمة `data-target` في عنصر `#countdown`).

---

## 4️⃣ رفع المشروع على منصة سلة (Salla)

1. من لوحة تحكم سلة: **المتجر → الصفحات → صفحة مخصّصة (Custom Page)**.
   - أو استخدم خاصية **"إضافة كود HTML مخصص"** إذا كان قالبك يدعمها.
2. الطريقة الموصى بها لأفضل أداء:
   - ارفع المشروع على استضافة Static مجانية (مثل **Cloudflare Pages** أو **Netlify**) للحصول على رابط مباشر.
   - أضف رابط الصفحة كـ **رابط خارجي** في قائمة سلة، أو ضمّنها عبر iframe داخل صفحة مخصصة.
3. بديل: انسخ محتوى `<body>` من `index.html` والصقه داخل محرر الصفحة المخصصة في سلة، وارفع ملفي `style.css` و`app.js` كملفات مرفقة، ثم عدّل مسارات `href`/`src` لتشير إلى الروابط الصحيحة داخل سلة.

---

## 5️⃣ ربط Google Tag Manager (GTM)

1. أنشئ حاوية GTM من [tagmanager.google.com](https://tagmanager.google.com).
2. انسخ كود `<head>` والصقه في `index.html` مكان التعليق:
   ```html
   <!-- GTM (Google Tag Manager) — الصق الكود هنا -->
   ```
3. انسخ كود `<noscript>` والصقه مباشرة بعد فتح وسم `<body>` مكان التعليق المخصص له.

---

## 6️⃣ ربط GA4

الطريقة الأسهل: أضف Tag من نوع **GA4 Configuration** داخل GTM مباشرة (لا حاجة لكود منفصل في الصفحة). بدّل بمعرف القياس `G-XXXXXXXXXX` الخاص بك.

---

## 7️⃣ ربط Meta Pixel

1. من Meta Events Manager أنشئ Pixel جديد وانسخ الكود.
2. الصقه في `index.html` مكان التعليق:
   ```html
   <!-- Meta Pixel — الصق الكود هنا -->
   ```
3. استبدل `YOUR_PIXEL_ID` بمعرف البكسل الخاص بك.
4. حدث `fbq('track','Lead')` يُطلق تلقائيًا من `js/app.js` بعد نجاح التسجيل — لا حاجة لأي تعديل إضافي.

---

## 8️⃣ ربط TikTok Pixel

1. من TikTok Ads Manager أنشئ Pixel وانسخ الكود.
2. الصقه مكان التعليق المخصص في `index.html`، واستبدل `YOUR_TIKTOK_PIXEL_ID`.
3. حدث `CompleteRegistration` يُطلق تلقائيًا بعد نجاح التسجيل.

---

## 9️⃣ تخصيص النصوص والألوان

### الألوان
كل الألوان معرّفة كمتغيرات CSS في أعلى ملف `css/style.css`:
```css
:root{
  --navy:#20264D;
  --indigo:#3B4C8C;
  --gold:#C99B4A;
  --cream:#FAF8F4;
}
```
غيّر القيم هنا فقط وسيتحدث التصميم بالكامل تلقائيًا.

### النصوص
كل النصوص (العناوين، الأوصاف، الأسئلة الشائعة، الشهادات) موجودة مباشرة داخل `index.html` — عدّلها كنص عادي بدون الحاجة لمس CSS أو JS.

### الشعار
عدّل ملف `assets/logo.svg` مباشرة (نص + ألوان)، أو استبدله بصورة PNG وحدّث المسار في `<img src="assets/logo.svg">`.

---

## ✅ قائمة تحقق نهائية قبل الإطلاق

- [ ] رفع صور المحاضرة والشهادات في `assets/images/`
- [ ] تحديث `API_URL` في `js/app.js`
- [ ] تحديث موعد الويبنار (`WEBINAR_DATE_ISO`) في كل من `index.html`, `thank-you.html`, `js/app.js`
- [ ] تحديث رابط قروب واتساب ورابط البث المباشر
- [ ] لصق أكواد GTM / GA4 / Meta / TikTok
- [ ] اختبار إرسال نموذج تجريبي والتأكد من وصول البريد وحفظ البيانات في الشيت
- [ ] اختبار الصفحة على الجوال والتابلت وسطح المكتب
