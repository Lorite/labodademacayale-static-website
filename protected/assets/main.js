'use strict';

// ---------- Countdown ----------
(function countdown() {
  const root = document.getElementById('countdown');
  if (!root) return;
  const target = new Date(root.dataset.date).getTime();
  const units = {
    days: root.querySelector('[data-unit="days"]'),
    hours: root.querySelector('[data-unit="hours"]'),
    minutes: root.querySelector('[data-unit="minutes"]'),
    seconds: root.querySelector('[data-unit="seconds"]'),
  };

  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      Object.values(units).forEach((el) => el && (el.textContent = '00'));
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (units.days) units.days.textContent = d;
    if (units.hours) units.hours.textContent = pad(h);
    if (units.minutes) units.minutes.textContent = pad(m);
    if (units.seconds) units.seconds.textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
})();

// ---------- Background images (only set when a real file exists) ----------
// Photos live in the gitignored protected/images/ folder. If a file is
// missing we keep the elegant gradient placeholder instead of a broken image.
(function lazyBackgrounds() {
  const cells = document.querySelectorAll('[data-img]');
  cells.forEach((cell) => {
    const src = cell.dataset.img;
    if (!src) return;
    const probe = new Image();
    probe.onload = () => {
      cell.style.backgroundImage = `url("${src}")`;
    };
    probe.src = src;
  });
})();

// ---------- Reveal on scroll ----------
(function revealOnScroll() {
  const targets = document.querySelectorAll(
    '.timeline__item, .venue, .gallery__cell, .profile, .section-title'
  );
  targets.forEach((el) => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
})();

// ---------- Gift / IBAN (value injected server-side from env var) ----------
(function gift() {
  // Hide optional rows (holder, BIC) that the server left blank.
  document.querySelectorAll('.gift__row[data-optional]').forEach((row) => {
    const dd = row.querySelector('dd');
    if (!dd || dd.textContent.trim() === '') row.hidden = true;
  });

  const ibanEl = document.getElementById('iban-value');
  const copyBtn = document.getElementById('iban-copy');
  if (!ibanEl || !copyBtn) return;

  const iban = ibanEl.textContent.trim();
  const t = (key, fallback) => (window.i18n ? window.i18n.t(key) : null) || fallback;

  // If no IBAN is configured yet, show a friendly note and disable copying.
  // The data-i18n attribute lets the message follow the selected language.
  if (iban === '') {
    ibanEl.setAttribute('data-i18n', 'gift.empty');
    ibanEl.textContent = t('gift.empty', 'Disponible próximamente');
    ibanEl.classList.add('is-empty');
    copyBtn.disabled = true;
    copyBtn.style.display = 'none';
    return;
  }

  let resetTimer = null;
  copyBtn.addEventListener('click', async () => {
    const plain = iban.replace(/\s+/g, ''); // copy without spaces for easy pasting
    try {
      await navigator.clipboard.writeText(plain);
    } catch (err) {
      // Fallback for browsers without the async clipboard API.
      const tmp = document.createElement('textarea');
      tmp.value = plain;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
    }
    copyBtn.textContent = t('gift.copied', '¡Copiado!');
    copyBtn.classList.add('is-copied');
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copyBtn.textContent = t('gift.copy', 'Copiar');
      copyBtn.classList.remove('is-copied');
    }, 1800);
  });
})();

// ---------- RSVP via email (no backend / no data stored) ----------
(function rsvp() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  // Change this to the couple's email address.
  const TO = 'hola@labodademacayale.com';

  const t = (key, fallback) => (window.i18n ? window.i18n.t(key) : null) || fallback;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const guests = (data.get('guests') || '0').toString().trim();
    const attendRaw = (data.get('attend') || '').toString();
    const attend = attendRaw === 'no' ? t('rsvp.no', 'No') : t('rsvp.yes', 'Sí');
    const note = (data.get('note') || '').toString().trim();

    const subject = `${t('rsvp.mailSubject', 'Confirmación de asistencia')} — ${name || '?'}`;
    const body =
      `${t('rsvp.mailName', 'Nombre')}: ${name}\n` +
      `${t('rsvp.mailGuests', 'Acompañantes')}: ${guests}\n` +
      `${t('rsvp.mailAttend', 'Asistencia')}: ${attend}\n` +
      `${t('rsvp.mailNote', 'Mensaje')}: ${note || '—'}`;

    window.location.href =
      `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
