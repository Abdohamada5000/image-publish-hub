# مركز رفع الصور — Cloudflare Worker

## المزايا
- واجهة عربية متوافقة مع الموبايل.
- رفع إلى ImgBB وإرجاع الرابط المباشر.
- API: POST /api/upload بحقل multipart اسمه image، أو JSON يحتوي image بصيغة Base64 وحقول اختيارية name وmimeType.
- فحص نوع الصورة وحد 32MB.
- مفتاح ImgBB محفوظ في Cloudflare Secrets.

## التثبيت
1. أنشئ Worker جديدًا باسم image-publish-hub.
2. استبدل محتوى index.js بمحتوى الملف ثم Deploy.
3. من Settings → Variables and Secrets أضف Secret باسم IMGBB_API_KEY وقيمته مفتاح ImgBB.
4. أضف Secret باسم UPLOAD_TOKEN بقيمة طويلة عشوائية؛ عند ضبطه يجب إرسال Authorization: Bearer YOUR_UPLOAD_TOKEN مع طلبات API.
5. اختبر /health ثم افتح الصفحة الرئيسية وجرب رفع صورة.

## مثال API
curl -X POST https://YOUR-WORKER.workers.dev/api/upload -H "Authorization: Bearer YOUR_UPLOAD_TOKEN" -F "image=@photo.jpg"

## فيسبوك
بعد الرفع، استخدم data.url في Composio مع أداة FACEBOOK_CREATE_PHOTO_POST، وحقل page_id للصفحة المتصلة، وحقل message للنص. هذا المشروع يرفع الصور فقط ولا يخزن بيانات دخول فيسبوك. النشر في المجموعات يحتاج صلاحيات وأداة منفصلة.

تنبيه: إذا لم تضبط UPLOAD_TOKEN فواجهة API عامة ويمكن للآخرين استهلاك رصيد ImgBB الخاص بك.
