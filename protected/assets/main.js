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
    '.timeline__item, .vrow, .gallery__cell, .profile, .section-title'
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
  // Hide optional rows (beneficiary, BIC/SWIFT, bank) that the server left blank.
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

// ---------- Gallery: lazy fill + pagination + lightbox ----------
// Cells are generated from a count so the markup stays tiny no matter how
// many photos there are. Each cell probes its file (images are gitignored);
// only ones that actually load become real, clickable photos. Bottom arrows
// page through the grid, and clicking a photo opens it full-screen.
(function gallery() {
  const grid = document.querySelector('.gallery__grid');
  if (!grid) return;

  const count = Number(grid.dataset.count) || 0;
  const prefix = grid.dataset.prefix || '';
  const ext = grid.dataset.ext || '.jpg';
  const perPage = Math.max(1, Number(grid.dataset.perPage) || 6);
  if (count <= 0 || !prefix) return;

  const note = document.querySelector('.gallery__note');
  const nav = document.querySelector('.gallery__nav');
  const status = document.querySelector('[data-gallery-status]');
  const prevBtn = document.querySelector('[data-gallery-prev]');
  const nextBtn = document.querySelector('[data-gallery-next]');

  const cells = [];
  for (let i = 1; i <= count; i++) {
    const src = `${prefix}${i}${ext}`;
    const fig = document.createElement('figure');
    fig.className = 'gallery__cell';
    fig.dataset.src = src;
    grid.appendChild(fig);
    cells.push(fig);

    const probe = new Image();
    probe.onload = () => {
      fig.style.backgroundImage = `url("${src}")`;
      fig.classList.add('is-clickable');
      fig.addEventListener('click', () => openLightbox(src));
      if (note) note.hidden = true; // real photos are here, drop "coming soon"
    };
    probe.src = src;
  }

  // ---- Pagination ----
  const pages = Math.ceil(count / perPage);
  let page = 0;

  function renderPage() {
    cells.forEach((cell, idx) => {
      cell.hidden = Math.floor(idx / perPage) !== page;
    });
    if (status) status.textContent = `${page + 1} / ${pages}`;
    if (prevBtn) prevBtn.disabled = page === 0;
    if (nextBtn) nextBtn.disabled = page === pages - 1;
  }

  if (pages > 1 && nav) {
    nav.hidden = false;
    if (prevBtn) prevBtn.addEventListener('click', () => { if (page > 0) { page--; renderPage(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (page < pages - 1) { page++; renderPage(); } });
  }
  renderPage();

  // ---- Lightbox ----
  const box = document.getElementById('lightbox');
  const boxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('[data-lightbox-close]');
  const lbPrev = document.querySelector('[data-lightbox-prev]');
  const lbNext = document.querySelector('[data-lightbox-next]');
  let order = [];
  let current = 0;

  function show(idx) {
    if (!order.length) return;
    current = (idx + order.length) % order.length; // wrap around
    boxImg.src = order[current];
  }

  function openLightbox(src) {
    if (!box || !boxImg) return;
    // Navigate over every loaded photo, in gallery order, across all pages.
    order = cells.filter((c) => c.classList.contains('is-clickable')).map((c) => c.dataset.src);
    const idx = order.indexOf(src);
    show(idx < 0 ? 0 : idx);
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-open'));
    document.addEventListener('keydown', onKey);
  }

  function closeLightbox() {
    if (!box) return;
    box.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { box.hidden = true; boxImg.removeAttribute('src'); }, 300);
  }

  function onKey(e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
  }

  if (box) {
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => show(current - 1));
    if (lbNext) lbNext.addEventListener('click', () => show(current + 1));
    box.addEventListener('click', (e) => { if (e.target === box) closeLightbox(); });
  }
})();

// ---------- RSVP (saved server-side at /rsvp; no email client needed) ----------
(function rsvp() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const statusEl = document.getElementById('rsvp-status');
  const button = form.querySelector('button[type="submit"]');
  const companionsEl = document.getElementById('companions');
  const addBtn = document.getElementById('add-companion');
  const template = document.getElementById('companion-template');
  const t = (key, fallback) => (window.i18n ? window.i18n.t(key) : null) || fallback;

  // Append a fresh companion row (name + "is child" + allergies + remove).
  function addCompanion() {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector('.companion__remove').addEventListener('click', () => row.remove());
    companionsEl.appendChild(row);
    if (window.i18n) window.i18n.apply(); // localize the new row's labels
    const nameInput = row.querySelector('[name="companion-name"]');
    if (nameInput) nameInput.focus();
  }

  if (addBtn && template && companionsEl) {
    addBtn.addEventListener('click', addCompanion);
  }

  // Read every companion row into a list, dropping any left without a name.
  function collectCompanions() {
    if (!companionsEl) return [];
    return Array.from(companionsEl.querySelectorAll('.companion'))
      .map((row) => ({
        name: (row.querySelector('[name="companion-name"]').value || '').trim(),
        kid: row.querySelector('[name="companion-kid"]').checked,
        intolerances: (row.querySelector('[name="companion-intol"]').value || '').trim(),
      }))
      .filter((c) => c.name !== '');
  }

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'rsvp__status' + (kind ? ' is-' + kind : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: (data.get('name') || '').toString().trim(),
      intolerances: (data.get('intolerances') || '').toString().trim(),
      attend: (data.get('attend') || 'yes').toString(),
      companions: collectCompanions(),
      note: (data.get('note') || '').toString().trim(),
      lang: window.i18n ? window.i18n.lang : 'es',
    };

    button.disabled = true;
    setStatus('sending', t('rsvp.sending', 'Enviando…'));

    try {
      const res = await fetch('/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('rsvp failed: ' + res.status);
      setStatus('ok', t('rsvp.success', '¡Gracias! Hemos recibido tu confirmación.'));
      form.reset();
      if (companionsEl) companionsEl.innerHTML = ''; // reset() leaves added rows; clear them
    } catch (err) {
      setStatus('error', t('rsvp.error', 'No se pudo enviar. Inténtalo de nuevo en un momento.'));
    } finally {
      button.disabled = false;
    }
  });
})();
