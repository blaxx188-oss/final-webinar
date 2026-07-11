/* =========================================================
   وضوح | Webinar Landing Page — app.js
   Vanilla JS ES6 — بدون أي مكتبات خارجية
   ========================================================= */
'use strict';

/* -----------------------------------------------------------
   0. إعدادات عامة — عدّل هذه القيم حسب مشروعك
   ----------------------------------------------------------- */
const CONFIG = {
  // رابط Google Apps Script Web App (بعد النشر) — استبدله برابطك
  API_URL: 'https://script.google.com/macros/s/AKfycbx_Q7Vgx2u4jTsv-1Zamx90nF05N652KuCI7bjCX6gE8-BtFoovm4iO4_SCQ8VRtQ2H/exec',

  // تفاصيل الويبنار لأغراض التقويم والعداد
  WEBINAR_TITLE: 'لماذا تشعر بالضياع رغم نجاحك؟',
  WEBINAR_DESCRIPTION: 'ويبنار مجاني مباشر حول الوضوح الذهني واتخاذ القرار بثقة.',
  WEBINAR_DATE_ISO: '2026-08-01T20:00:00+03:00', // موعد بداية الويبنار
  WEBINAR_DURATION_MIN: 75,
  WEBINAR_JOIN_URL: 'https://example.com/live', // رابط البث المباشر الفعلي
  WHATSAPP_GROUP_URL: 'https://chat.whatsapp.com/PASTE_YOUR_GROUP_INVITE_LINK',

  // مفتاح Local Storage لمنع التسجيل المكرر من نفس الجهاز
  LS_KEY: 'webinar_registered_v1'
};

/* -----------------------------------------------------------
   1. DataLayer helper — لأغراض GTM / GA4
   ----------------------------------------------------------- */
window.dataLayer = window.dataLayer || [];
function pushEvent(eventName, payload = {}) {
  window.dataLayer.push({ event: eventName, ...payload });
  // console.log('[dataLayer]', eventName, payload); // فعّل هذا السطر أثناء التطوير فقط
}

document.addEventListener('DOMContentLoaded', () => {
  pushEvent('page_view', { page: 'landing' });

  initHeaderScroll();
  initCountdown();
  initRevealOnScroll();
  initFAQAccordion();
  initTestimonialsSlider();
  initRippleButtons();
  initScrollDepthTracking();
  initRegistrationForm();
  initModalControls();
  checkAlreadyRegistered();
});

/* -----------------------------------------------------------
   2. Header — تغيير الخلفية عند التمرير
   ----------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* -----------------------------------------------------------
   3. Countdown Timer
   ----------------------------------------------------------- */
function initCountdown() {
  const wrap = document.getElementById('countdown');
  const endedMsg = document.getElementById('countdownEnded');
  if (!wrap) return;

  const target = new Date(wrap.dataset.target).getTime();
  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs')
  };

  let finishedFired = false;

  function tick() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      wrap.style.display = 'none';
      endedMsg.style.display = 'block';
      if (!finishedFired) {
        finishedFired = true;
        pushEvent('countdown_finished');
      }
      clearInterval(timer);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    els.days.textContent = String(days).padStart(2, '0');
    els.hours.textContent = String(hours).padStart(2, '0');
    els.mins.textContent = String(mins).padStart(2, '0');
    els.secs.textContent = String(secs).padStart(2, '0');
  }

  tick();
  const timer = setInterval(tick, 1000);
}

/* -----------------------------------------------------------
   4. Scroll Reveal — Intersection Observer (بدون مكتبات)
   ----------------------------------------------------------- */
function initRevealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
}

/* -----------------------------------------------------------
   5. FAQ Accordion
   ----------------------------------------------------------- */
function initFAQAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* -----------------------------------------------------------
   6. Testimonials Slider (بسيط، بدون مكتبات)
   ----------------------------------------------------------- */
function initTestimonialsSlider() {
  const track = document.getElementById('testiTrack');
  const nav = document.getElementById('testiNav');
  if (!track || !nav) return;

  const cards = track.querySelectorAll('.testi-card');
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `الشهادة رقم ${i + 1}`);
    dot.addEventListener('click', () => {
      cards[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
    nav.appendChild(dot);
  });

  const dots = nav.querySelectorAll('.testi-dot');
  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / (cards[0].offsetWidth + 24));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }, { passive: true });
}

/* -----------------------------------------------------------
   7. Ripple effect على الأزرار
   ----------------------------------------------------------- */
function initRippleButtons() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);

      if (this.dataset.analytics) pushEvent(this.dataset.analytics);
    });
  });
}

/* -----------------------------------------------------------
   8. Scroll Depth Tracking (25/50/75/100%)
   ----------------------------------------------------------- */
function initScrollDepthTracking() {
  const fired = { 25: false, 50: false, 75: false, 100: false };

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    [25, 50, 75, 100].forEach(mark => {
      if (pct >= mark && !fired[mark]) {
        fired[mark] = true;
        pushEvent('scroll_depth', { percent: mark });
      }
    });
  }, { passive: true });
}

/* -----------------------------------------------------------
   9. Toast Notifications
   ----------------------------------------------------------- */
function showToast(message, type = 'success') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* -----------------------------------------------------------
   10. Validation Helpers
   ----------------------------------------------------------- */
function isValidName(v) { return v.trim().length >= 2; }
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isValidSaudiPhone(v) {
  const clean = v.trim().replace(/\s|-/g, '');
  return /^(05\d{8}|9665\d{8}|\+9665\d{8})$/.test(clean);
}

/* -----------------------------------------------------------
   11. Registration Form — Fetch API بدون إعادة تحميل الصفحة
   ----------------------------------------------------------- */
function initRegistrationForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // منع الإرسال المزدوج

    pushEvent('start_registration');

    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');

    let valid = true;
    [fullName, email, phone].forEach(f => f.closest('.form-group').classList.remove('has-error'));

    if (!isValidName(fullName.value)) {
      fullName.closest('.form-group').classList.add('has-error');
      valid = false;
    }
    if (!isValidEmail(email.value)) {
      email.closest('.form-group').classList.add('has-error');
      valid = false;
    }
    if (!isValidSaudiPhone(phone.value)) {
      phone.closest('.form-group').classList.add('has-error');
      valid = false;
    }

    if (!valid) {
      showToast('يرجى تصحيح الحقول المظلّلة بالأحمر', 'error');
      return;
    }

    // منع التسجيل المكرر من نفس الجهاز
    if (localStorage.getItem(CONFIG.LS_KEY)) {
      showToast('لقد سجّلت مسبقًا من هذا الجهاز 👍', 'error');
      openSuccessModal();
      return;
    }

    isSubmitting = true;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const payload = {
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      source: document.referrer || 'direct',
      page: window.location.href,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain لتفادي مشاكل CORS مع Apps Script
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === 'success') {
        localStorage.setItem(CONFIG.LS_KEY, JSON.stringify({ email: payload.email, date: payload.timestamp }));
        pushEvent('registration_success', { email: payload.email });

        // Meta Pixel — بعد نجاح التسجيل
        if (typeof fbq === 'function') fbq('track', 'Lead');
        // TikTok Pixel — بعد نجاح التسجيل
        if (typeof ttq !== 'undefined') ttq.track('CompleteRegistration');

        openSuccessModal();
        form.reset();
      } else if (result.status === 'duplicate') {
        showToast('هذا البريد أو الجوال مسجّل مسبقًا', 'error');
        pushEvent('registration_failed', { reason: 'duplicate' });
      } else {
        throw new Error(result.message || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      console.error(err);
      showToast('تعذّر إرسال التسجيل، يرجى المحاولة مرة أخرى', 'error');
      pushEvent('registration_failed', { reason: 'network_error' });
    } finally {
      isSubmitting = false;
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // إزالة تظليل الخطأ فور التصحيح
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group').classList.remove('has-error');
    });
  });
}

/* -----------------------------------------------------------
   12. Already registered on this device?
   ----------------------------------------------------------- */
function checkAlreadyRegistered() {
  // لا نفتح المودال تلقائيًا، فقط نجهز الحالة إن احتجنا لاحقًا
}

/* -----------------------------------------------------------
   13. Success Modal Controls
   ----------------------------------------------------------- */
function openSuccessModal() {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  document.getElementById('addToCalendarBtn').href = buildGoogleCalendarLink();
  document.getElementById('joinWhatsappBtn').href = CONFIG.WHATSAPP_GROUP_URL;
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function initModalControls() {
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  if (!modal) return;

  closeBtn.addEventListener('click', closeSuccessModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSuccessModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSuccessModal();
  });
}

/* -----------------------------------------------------------
   14. Google Calendar Link Builder
   ----------------------------------------------------------- */
function buildGoogleCalendarLink() {
  const start = new Date(CONFIG.WEBINAR_DATE_ISO);
  const end = new Date(start.getTime() + CONFIG.WEBINAR_DURATION_MIN * 60000);

  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: CONFIG.WEBINAR_TITLE,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `${CONFIG.WEBINAR_DESCRIPTION}\n\nرابط الانضمام: ${CONFIG.WEBINAR_JOIN_URL}`,
    location: CONFIG.WEBINAR_JOIN_URL
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// إتاحة الدالة عالميًا لاستخدامها في thank-you.html
window.buildGoogleCalendarLink = buildGoogleCalendarLink;
window.WEBINAR_CONFIG = CONFIG;
