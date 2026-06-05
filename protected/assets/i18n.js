'use strict';

/**
 * Lightweight bilingual (ES / EN) support.
 *
 * Every translatable element carries one of:
 *   data-i18n="key"            -> sets textContent
 *   data-i18n-html="key"       -> sets innerHTML (for strings containing markup)
 *   data-i18n-placeholder="key"-> sets the placeholder attribute
 *   data-i18n-aria="key"       -> sets aria-label
 *   data-i18n-title="key"      -> sets the title attribute
 *
 * Secret values (venue names, addresses, IBAN) are injected server-side and are
 * language-neutral, so they are intentionally NOT translated here.
 */

const translations = {
  es: {
    'meta.title': 'Maca & Ale · Nuestra Boda',

    'nav.story': 'Historia',
    'nav.about': 'Nosotros',
    'nav.gallery': 'Galería',
    'nav.when': 'Cuándo & Dónde',
    'nav.gift': 'Regalo',
    'nav.rsvp': 'Confirmar',
    'nav.logout': 'Salir',
    'nav.logoutTitle': 'Cerrar sesión',

    'hero.eyebrow': 'Nos casamos',
    'hero.date': '4 de Septiembre de 2026',
    'hero.scroll': 'Desplázate',

    'count.eyebrow': 'Cuenta atrás',
    'count.title': 'Falta poco para el gran día',
    'count.days': 'Días',
    'count.hours': 'Horas',
    'count.minutes': 'Minutos',
    'count.seconds': 'Segundos',

    'story.eyebrow': 'Nuestra historia',
    'story.title': 'Cómo llegamos hasta aquí',
    'story.1.date': 'Primavera de 2019',
    'story.1.title': 'Nos conocimos',
    'story.1.text': 'Un encuentro casual que lo cambió todo. (Edita este texto con vuestra historia.)',
    'story.2.date': 'Verano de 2019',
    'story.2.title': 'Nuestra primera cita',
    'story.2.text': 'La primera de muchas. (Edita este texto con vuestra historia.)',
    'story.3.date': 'Diciembre de 2024',
    'story.3.title': 'La propuesta',
    'story.3.text': 'Dijimos «sí» al resto de nuestras vidas. (Edita este texto con vuestra historia.)',

    'about.eyebrow': 'Los novios',
    'about.title': 'Sobre nosotros',
    'about.maca': 'Una breve presentación de la novia. (Edita este texto.)',
    'about.ale': 'Una breve presentación del novio. (Edita este texto.)',

    'gallery.eyebrow': 'Recuerdos',
    'gallery.title': 'Galería',
    'gallery.note': 'Las fotos llegarán pronto.',

    'when.eyebrow': 'El gran día',
    'when.title': 'Cuándo & Dónde',
    'when.ceremonyKicker': 'La ceremonia',
    'when.celebrationKicker': 'La celebración',
    'when.ceremonyAct': 'Ceremonia religiosa',
    'when.reception': 'Recepción',
    'when.cocktail': 'Cóctel',
    'when.banquet': 'Banquete',
    'when.party': 'Fiesta · DJ y barra libre',
    'when.directions': 'Cómo llegar',

    'gift.eyebrow': 'Un detalle especial',
    'gift.title': 'Regalo de boda',
    'gift.intro':
      'Tres cosas hay en la vida: salud, dinero y amor. Afortunadamente nos sobran las dos primeras, así que si nos queréis obsequiar con algo, el dinero será bien recibido para nuestra nueva etapa juntos. ¡Mil gracias!',
    'gift.label': 'Aportación por transferencia',
    'gift.copy': 'Copiar',
    'gift.copied': '¡Copiado!',
    'gift.holder': 'Titular',
    'gift.thanks': 'Gracias de todo corazón 💙',
    'gift.empty': 'Disponible próximamente',

    'rsvp.eyebrow': 'Confirma tu asistencia',
    'rsvp.title': '¿Nos acompañas?',
    'rsvp.intro':
      'Por favor, confirma antes del <strong>1 de Agosto de 2026</strong>.<br />Si no puedes asistir, también agradecemos que nos lo hagas saber.',
    'rsvp.name': 'Nombre y apellidos',
    'rsvp.guests': 'Número de acompañantes (aparte de ti)',
    'rsvp.attendLegend': '¿Asistirás?',
    'rsvp.yes': 'Sí, allí estaré',
    'rsvp.no': 'No podré asistir',
    'rsvp.note': 'Mensaje (opcional)',
    'rsvp.submit': 'Enviar confirmación',
    'rsvp.hint': 'Se abrirá tu correo con la confirmación lista para enviar.',
    'rsvp.mailSubject': 'Confirmación de asistencia',
    'rsvp.mailName': 'Nombre',
    'rsvp.mailGuests': 'Acompañantes',
    'rsvp.mailAttend': 'Asistencia',
    'rsvp.mailNote': 'Mensaje',
  },

  en: {
    'meta.title': 'Maca & Ale · Our Wedding',

    'nav.story': 'Story',
    'nav.about': 'About Us',
    'nav.gallery': 'Gallery',
    'nav.when': 'When & Where',
    'nav.gift': 'Gift',
    'nav.rsvp': 'RSVP',
    'nav.logout': 'Log out',
    'nav.logoutTitle': 'Log out',

    'hero.eyebrow': "We're getting married",
    'hero.date': 'September 4, 2026',
    'hero.scroll': 'Scroll down',

    'count.eyebrow': 'Countdown',
    'count.title': 'The big day is almost here',
    'count.days': 'Days',
    'count.hours': 'Hours',
    'count.minutes': 'Minutes',
    'count.seconds': 'Seconds',

    'story.eyebrow': 'Our story',
    'story.title': 'How we got here',
    'story.1.date': 'Spring 2019',
    'story.1.title': 'We met',
    'story.1.text': 'A chance encounter that changed everything. (Edit this text with your story.)',
    'story.2.date': 'Summer 2019',
    'story.2.title': 'Our first date',
    'story.2.text': 'The first of many. (Edit this text with your story.)',
    'story.3.date': 'December 2024',
    'story.3.title': 'The proposal',
    'story.3.text': 'We said “yes” to the rest of our lives. (Edit this text with your story.)',

    'about.eyebrow': 'The couple',
    'about.title': 'About us',
    'about.maca': 'A short introduction to the bride. (Edit this text.)',
    'about.ale': 'A short introduction to the groom. (Edit this text.)',

    'gallery.eyebrow': 'Memories',
    'gallery.title': 'Gallery',
    'gallery.note': 'Photos coming soon.',

    'when.eyebrow': 'The big day',
    'when.title': 'When & Where',
    'when.ceremonyKicker': 'The ceremony',
    'when.celebrationKicker': 'The celebration',
    'when.ceremonyAct': 'Religious ceremony',
    'when.reception': 'Reception',
    'when.cocktail': 'Cocktail',
    'when.banquet': 'Dinner',
    'when.party': 'Party · DJ & open bar',
    'when.directions': 'Get directions',

    'gift.eyebrow': 'A special detail',
    'gift.title': 'Wedding gift',
    'gift.intro':
      "There are three things in life: health, money and love. Luckily we have plenty of the first two — so if you'd like to give us something, a contribution toward our new life together would be very welcome. Thank you so much!",
    'gift.label': 'By bank transfer',
    'gift.copy': 'Copy',
    'gift.copied': 'Copied!',
    'gift.holder': 'Account holder',
    'gift.thanks': 'Thank you from the bottom of our hearts 💙',
    'gift.empty': 'Available soon',

    'rsvp.eyebrow': 'Confirm your attendance',
    'rsvp.title': 'Will you join us?',
    'rsvp.intro':
      'Please confirm before <strong>August 1, 2026</strong>.<br />If you cannot make it, we would appreciate knowing too.',
    'rsvp.name': 'Full name',
    'rsvp.guests': 'Number of companions (besides you)',
    'rsvp.attendLegend': 'Will you attend?',
    'rsvp.yes': "Yes, I'll be there",
    'rsvp.no': "Sorry, I can't make it",
    'rsvp.note': 'Message (optional)',
    'rsvp.submit': 'Send confirmation',
    'rsvp.hint': 'Your email app will open with the confirmation ready to send.',
    'rsvp.mailSubject': 'Wedding RSVP',
    'rsvp.mailName': 'Name',
    'rsvp.mailGuests': 'Companions',
    'rsvp.mailAttend': 'Attendance',
    'rsvp.mailNote': 'Message',
  },
};

const STORAGE_KEY = 'boda_lang';

const I18n = {
  lang: 'es',

  t(key) {
    const dict = translations[this.lang] || translations.es;
    if (key in dict) return dict[key];
    if (key in translations.es) return translations.es[key];
    return null;
  },

  apply() {
    const map = [
      ['data-i18n', (el, v) => { el.textContent = v; }],
      ['data-i18n-html', (el, v) => { el.innerHTML = v; }],
      ['data-i18n-placeholder', (el, v) => el.setAttribute('placeholder', v)],
      ['data-i18n-aria', (el, v) => el.setAttribute('aria-label', v)],
      ['data-i18n-title', (el, v) => el.setAttribute('title', v)],
    ];
    map.forEach(([attr, setter]) => {
      document.querySelectorAll('[' + attr + ']').forEach((el) => {
        const v = this.t(el.getAttribute(attr));
        if (v != null) setter(el, v);
      });
    });

    document.documentElement.lang = this.lang;
    const title = this.t('meta.title');
    if (title) document.title = title;

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang-btn') === this.lang);
    });

    window.dispatchEvent(new CustomEvent('languagechanged', { detail: { lang: this.lang } }));
  },

  set(lang) {
    if (!translations[lang]) return;
    this.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    this.apply();
  },

  init() {
    let lang = null;
    try { lang = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (!lang) {
      lang = (navigator.language || 'es').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
    }
    this.lang = translations[lang] ? lang : 'es';

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', () => this.set(btn.getAttribute('data-lang-btn')));
    });

    this.apply();
  },
};

window.i18n = I18n;
document.addEventListener('DOMContentLoaded', () => I18n.init());
