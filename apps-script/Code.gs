/**
 * =========================================================
 * وضوح | Webinar Registration Backend — Google Apps Script
 * =========================================================
 * الوظائف:
 * 1. استقبال بيانات التسجيل من نموذج صفحة الهبوط (Fetch API).
 * 2. حفظها في Google Sheets.
 * 3. منع التسجيل المكرر (بالبريد الإلكتروني أو رقم الجوال).
 * 4. إرسال بريد ترحيبي تلقائي للمستخدم.
 * 5. إرسال إشعار بريد للإدارة عند كل تسجيل جديد.
 *
 * طريقة النشر: راجع README.md — قسم "نشر Google Apps Script"
 * =========================================================
 */

/* ----------------------- إعدادات عامة ----------------------- */
// اسم الشيت الذي سيتم الكتابة فيه (سيُنشأ تلقائيًا إن لم يوجد)
const SHEET_NAME = 'Registrations';

// البريد الإلكتروني الذي سيصله إشعار عند كل تسجيل جديد
const ADMIN_EMAIL = 'admin@example.com'; // ⚠️ استبدل هذا ببريدك الإداري

// اسم الويبنار (يُستخدم في نصوص البريد الإلكتروني)
const WEBINAR_TITLE = 'لماذا تشعر بالضياع رغم نجاحك؟';
const WEBINAR_DATE_TEXT = 'السبت، 1 أغسطس 2026 — 8:00 مساءً بتوقيت السعودية';
const WEBINAR_JOIN_URL = 'https://example.com/live'; // ⚠️ استبدل برابط البث الفعلي

/**
 * نقطة الدخول الرئيسية لطلبات POST القادمة من نموذج التسجيل
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // منع التعارض عند وصول طلبين في نفس اللحظة

  try {
    const data = parseRequestData(e);

    // ----- التحقق الأساسي من البيانات -----
    const validation = validateInput(data);
    if (!validation.valid) {
      return buildJsonResponse({ status: 'error', message: validation.message });
    }

    const sheet = getOrCreateSheet();

    // ----- التحقق من التسجيل المكرر (بالبريد أو الجوال) -----
    if (isDuplicate(sheet, data.email, data.phone)) {
      return buildJsonResponse({ status: 'duplicate', message: 'هذا البريد أو رقم الجوال مسجّل مسبقًا.' });
    }

    // ----- حفظ البيانات في الشيت -----
    sheet.appendRow([
      new Date(),               // تاريخ ووقت التسجيل
      data.fullName,
      data.email,
      data.phone,
      data.source || '',
      data.page || '',
      'مسجّل'                    // حالة التسجيل
    ]);

    // ----- إرسال بريد ترحيبي للمستخدم -----
    sendUserConfirmationEmail(data);

    // ----- إشعار الإدارة -----
    sendAdminNotificationEmail(data);

    return buildJsonResponse({ status: 'success', message: 'تم التسجيل بنجاح.' });

  } catch (err) {
    return buildJsonResponse({ status: 'error', message: 'حدث خطأ في الخادم: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * دعم طلبات GET لأغراض اختبار أن الرابط يعمل فقط
 */
function doGet(e) {
  return buildJsonResponse({ status: 'ok', message: 'Webinar registration API is running.' });
}

/* ----------------------- دوال مساعدة ----------------------- */

/**
 * تحليل بيانات الطلب القادم (JSON عبر text/plain لتفادي مشاكل CORS)
 */
function parseRequestData(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('لا توجد بيانات في الطلب.');
  }
  return JSON.parse(e.postData.contents);
}

/**
 * التحقق الأساسي من صحة البيانات المُرسلة
 */
function validateInput(data) {
  if (!data.fullName || data.fullName.trim().length < 2) {
    return { valid: false, message: 'الاسم غير صحيح.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    return { valid: false, message: 'البريد الإلكتروني غير صحيح.' };
  }
  const phoneRegex = /^(05\d{8}|9665\d{8}|\+9665\d{8})$/;
  const cleanPhone = (data.phone || '').replace(/\s|-/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, message: 'رقم الجوال غير صحيح.' };
  }
  return { valid: true };
}

/**
 * إحضار الشيت المخصص للتسجيلات، أو إنشاؤه إذا لم يكن موجودًا
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['التاريخ والوقت', 'الاسم الكامل', 'البريد الإلكتروني', 'رقم الجوال', 'المصدر', 'الصفحة', 'الحالة']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * التحقق من وجود تسجيل سابق بنفس البريد أو نفس رقم الجوال
 */
function isDuplicate(sheet, email, phone) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // فقط صف العناوين موجود

  const range = sheet.getRange(2, 3, lastRow - 1, 2); // الأعمدة: البريد، الجوال
  const values = range.getValues();

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim().replace(/\s|-/g, '');

  return values.some(row => {
    const existingEmail = String(row[0]).trim().toLowerCase();
    const existingPhone = String(row[1]).trim().replace(/\s|-/g, '');
    return existingEmail === normalizedEmail || existingPhone === normalizedPhone;
  });
}

/**
 * إرسال بريد ترحيبي تلقائي للمستخدم بعد نجاح التسجيل
 */
function sendUserConfirmationEmail(data) {
  const subject = `تم تأكيد تسجيلك في ويبنار: ${WEBINAR_TITLE}`;
  const body =
`مرحبًا ${data.fullName}،

يسعدنا تأكيد تسجيلك في الويبنار المجاني:
"${WEBINAR_TITLE}"

📅 الموعد: ${WEBINAR_DATE_TEXT}
🔗 رابط الانضمام: ${WEBINAR_JOIN_URL}

سنذكّرك بالموعد قبل بدء الويبنار. نراك هناك!

مع تحياتنا،
فريق وضوح`;

  try {
    MailApp.sendEmail(data.email, subject, body);
  } catch (err) {
    // لا نوقف تنفيذ الطلب إذا فشل إرسال البريد، فقط نسجل الخطأ
    Logger.log('فشل إرسال بريد المستخدم: ' + err.message);
  }
}

/**
 * إرسال إشعار للإدارة عند كل تسجيل جديد
 */
function sendAdminNotificationEmail(data) {
  const subject = `تسجيل جديد في الويبنار: ${data.fullName}`;
  const body =
`تسجيل جديد وصل الآن:

الاسم: ${data.fullName}
البريد: ${data.email}
الجوال: ${data.phone}
المصدر: ${data.source || 'غير محدد'}
الصفحة: ${data.page || 'غير محدد'}
الوقت: ${new Date().toLocaleString('ar-SA')}`;

  try {
    MailApp.sendEmail(ADMIN_EMAIL, subject, body);
  } catch (err) {
    Logger.log('فشل إرسال بريد الإدارة: ' + err.message);
  }
}

/**
 * بناء استجابة JSON موحّدة
 */
function buildJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
