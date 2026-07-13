/**
 * =============================================================================
 * وضوح | Webinar Landing Page — Code.gs
 * يستقبل بيانات التسجيل (بما فيها UTM و lead_id)، يحفظها في Google Sheets،
 * يمنع التسجيل المكرر، ويرسل إيميلات تأكيد + إشعار إداري.
 * =============================================================================
 */

/* -----------------------------------------------------------------------
   0) الإعدادات العامة — عدّل هذه القيم فقط
   ----------------------------------------------------------------------- */
var CONFIG = {
  SHEET_NAME: 'Registrations',
  ADMIN_EMAIL: 'blaxx188@gmail.com',
  WEBINAR_NAME: 'لماذا تشعر بالضياع رغم نجاحك؟',
  WEBINAR_DATE_TEXT: 'السبت 1 أغسطس 2026 - الساعة 8:00 مساءً',
  WEBINAR_JOIN_LINK: 'https://example.com/live',
  SEND_ADMIN_NOTIFICATION: true
};

/* -----------------------------------------------------------------------
   1) نقطة الاستقبال الرئيسية (POST من صفحة التسجيل)
   ----------------------------------------------------------------------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var data = parseRequestBody(e);
    Logger.log(JSON.stringify(data));
    var fullName = (data.fullName || '').toString().trim();
    var email = (data.email || '').toString().trim().toLowerCase();
    var phone = normalizePhone((data.phone || '').toString().trim());

    if (!fullName || !isValidEmail(email) || !isValidPhone(phone)) {
      return jsonResponse({ status: 'error', message: 'بيانات غير صحيحة.' });
    }

    var sheet = getOrCreateSheet();

    if (isDuplicate(sheet, email, phone)) {
      return jsonResponse({ status: 'duplicate', message: 'هذا البريد أو رقم الجوال مسجل مسبقًا.' });
    }

    // إضافة صف جديد بكل البيانات — بما فيها UTM ومعرّف الـ Lead
// إضافة صف جديد مع الحفاظ على الأعمدة القديمة
sheet.appendRow([
  new Date(),                     // A: وقت التسجيل
  fullName,                       // B: الاسم الكامل
  email,                          // C: البريد الإلكتروني
  phone,                          // D: رقم الجوال

  data.source || '',              // E: المصدر (Referrer)
  data.page || '',                // F: رابط الصفحة
  'مسجل',                         // G: الحالة

  // ===== الأعمدة الجديدة =====
  data.leadId || '',              // H: Lead ID
  data.utm_source || '',          // I: utm_source
  data.utm_medium || '',          // J: utm_medium
  data.utm_campaign || '',        // K: utm_campaign
  data.utm_content || '',         // L: utm_content
  data.utm_term || '',            // M: utm_term
  data.page_load_time || '',      // N: Page Load Time
  data.timestamp || ''            // O: Timestamp
]);

    sendConfirmationEmail(fullName, email);

    if (CONFIG.SEND_ADMIN_NOTIFICATION) {
      sendAdminNotification(fullName, email, phone, data);
    }

    return jsonResponse({ status: 'success', message: 'تم التسجيل بنجاح.' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: 'حدث خطأ في الخادم: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/* -----------------------------------------------------------------------
   2) نقطة اختبار GET
   ----------------------------------------------------------------------- */
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'الخدمة تعمل بشكل صحيح.' });
}

/* -----------------------------------------------------------------------
   3) قراءة بيانات الطلب
   ----------------------------------------------------------------------- */
function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('لا توجد بيانات مرسلة.');
  }
  return JSON.parse(e.postData.contents);
}

/* -----------------------------------------------------------------------
   4) الحصول على الشيت أو إنشاؤه مع رأس الأعمدة (بما فيها UTM)
   ----------------------------------------------------------------------- */
/* -----------------------------------------------------------------------
   4) الحصول على الشيت أو إنشاؤه مع تحديث الأعمدة تلقائياً
   ----------------------------------------------------------------------- */
function getOrCreateSheet() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

var headers = [
'وقت التسجيل',
'الاسم الكامل',
'البريد الإلكتروني',
'رقم الجوال',
'المصدر',
'الصفحة',
'الحالة',
'Lead ID',
'utm_source',
'utm_medium',
'utm_campaign',
'utm_content',
'utm_term',
'وقت التحميل (ms)',
'وقت الإرسال من المتصفح'
];

  // إنشاء الشيت لأول مرة
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }

  // قراءة الهيدر الحالي
  var lastColumn = sheet.getLastColumn();
  var currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  // إضافة أي أعمدة ناقصة
  headers.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
    }
  });

  return sheet;
}

/* -----------------------------------------------------------------------
   5) التحقق من التكرار: مقارنة البريد ورقم الجوال بكل الصفوف الحالية
   ----------------------------------------------------------------------- */
function isDuplicate(sheet, email, phone) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  // الأعمدة: C = البريد الإلكتروني (3), D = رقم الجوال (4)
  var range = sheet.getRange(2, 3, lastRow - 1, 2).getValues();

  for (var i = 0; i < range.length; i++) {
    var existingEmail = (range[i][0] || '').toString().trim().toLowerCase();
    var existingPhone = normalizePhone((range[i][1] || '').toString().trim());

    if (existingEmail === email || existingPhone === phone) {
      return true;
    }
  }
  return false;
}

/* -----------------------------------------------------------------------
   6) دوال التحقق من صحة البيانات
   ----------------------------------------------------------------------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^(\+?9665|05)[0-9]{8}$/.test(phone);
}

function normalizePhone(phone) {
  var cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.indexOf('+966') === 0) cleaned = '0' + cleaned.substring(4);
  else if (cleaned.indexOf('966') === 0) cleaned = '0' + cleaned.substring(3);
  return cleaned;
}

/* -----------------------------------------------------------------------
   7) إرسال بريد التأكيد للمستخدم
   ----------------------------------------------------------------------- */
function sendConfirmationEmail(fullName, email) {
  var subject = 'تأكيد التسجيل — ' + CONFIG.WEBINAR_NAME;
  var body =
    'مرحبًا ' + fullName + '،\n\n' +
    'تم تأكيد تسجيلك بنجاح في "' + CONFIG.WEBINAR_NAME + '".\n\n' +
    'موعد الندوة: ' + CONFIG.WEBINAR_DATE_TEXT + '\n' +
    'رابط الانضمام: ' + CONFIG.WEBINAR_JOIN_LINK + '\n\n' +
    'نرحب بك، ونتطلع لرؤيتك في الندوة.\n\n' +
    'مع تحياتنا.';

  MailApp.sendEmail(email, subject, body);
}

/* -----------------------------------------------------------------------
   8) إرسال إشعار للإدارة عند كل تسجيل جديد (بما فيه مصدر الحملة)
   ----------------------------------------------------------------------- */
function sendAdminNotification(fullName, email, phone, data) {
  var subject = 'تسجيل جديد — ' + CONFIG.WEBINAR_NAME;
  var utmLine = [data.utm_source, data.utm_medium, data.utm_campaign]
    .filter(function (v) { return v; })
    .join(' / ') || 'غير معروف (زيارة مباشرة أو بدون UTM)';

  var body =
    'تم تسجيل مشترك جديد:\n\n' +
    'الاسم: ' + fullName + '\n' +
    'البريد الإلكتروني: ' + email + '\n' +
    'رقم الجوال: ' + phone + '\n' +
    'مصدر الحملة (UTM): ' + utmLine + '\n' +
    'Lead ID: ' + (data.leadId || '—') + '\n' +
    'الوقت: ' + new Date().toLocaleString('ar-SA');

  MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
}

/* -----------------------------------------------------------------------
   9) بناء استجابة JSON موحدة
   ----------------------------------------------------------------------- */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function updateHeaders() {

  var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_NAME);

  var headers = [
    'وقت التسجيل',
    'الاسم الكامل',
    'البريد الإلكتروني',
    'رقم الجوال',
    'المصدر',
    'الصفحة',
    'الحالة',
    'Lead ID',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'وقت التحميل (ms)',
    'وقت الإرسال من المتصفح'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
