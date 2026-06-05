'use strict';

/**
 * Lightweight multilingual support (ES / EN / EU / Canarian / JA).
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
    'rsvp.cancelNote': 'Si ya has confirmado y necesitas cancelar, por favor avísanos directamente.',
    'rsvp.name': 'Nombre y apellidos',
    'rsvp.myIntol': 'Tus alergias o intolerancias alimentarias',
    'rsvp.addCompanion': '+ Añadir acompañante',
    'rsvp.companionTitle': 'Acompañante',
    'rsvp.companionName': 'Nombre y apellidos',
    'rsvp.companionKid': 'Es niño/a',
    'rsvp.companionIntol': 'Alergias o intolerancias',
    'rsvp.remove': 'Quitar acompañante',
    'rsvp.attendLegend': '¿Asistirás?',
    'rsvp.yes': 'Sí, allí estaré',
    'rsvp.no': 'No podré asistir',
    'rsvp.note': 'Mensaje (opcional)',
    'rsvp.submit': 'Enviar confirmación',
    'rsvp.hint': 'Tu confirmación se envía al instante; no necesitas tu correo.',
    'rsvp.sending': 'Enviando…',
    'rsvp.success': '¡Gracias! Hemos recibido tu confirmación.',
    'rsvp.error': 'No se pudo enviar. Inténtalo de nuevo en un momento.',
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
    'rsvp.cancelNote': 'If you have already confirmed and need to cancel, please let us know directly.',
    'rsvp.name': 'Full name',
    'rsvp.myIntol': 'Your food allergies or intolerances',
    'rsvp.addCompanion': '+ Add companion',
    'rsvp.companionTitle': 'Companion',
    'rsvp.companionName': 'Full name',
    'rsvp.companionKid': 'Is a child',
    'rsvp.companionIntol': 'Allergies or intolerances',
    'rsvp.remove': 'Remove companion',
    'rsvp.attendLegend': 'Will you attend?',
    'rsvp.yes': "Yes, I'll be there",
    'rsvp.no': "Sorry, I can't make it",
    'rsvp.note': 'Message (optional)',
    'rsvp.submit': 'Send confirmation',
    'rsvp.hint': 'Your reply is sent instantly — no email app needed.',
    'rsvp.sending': 'Sending…',
    'rsvp.success': 'Thank you! We have received your confirmation.',
    'rsvp.error': 'Could not send. Please try again in a moment.',
  },

  // ---- Euskara / Basque ----
  eu: {
    'meta.title': 'Maca & Ale · Gure Ezkontza',

    'nav.story': 'Istorioa',
    'nav.about': 'Gu',
    'nav.gallery': 'Galeria',
    'nav.when': 'Noiz & Non',
    'nav.gift': 'Oparia',
    'nav.rsvp': 'Baieztatu',
    'nav.logout': 'Irten',
    'nav.logoutTitle': 'Saioa itxi',

    'hero.eyebrow': 'Ezkontzen gara',
    'hero.date': '2026ko irailaren 4a',
    'hero.scroll': 'Behera egin',

    'count.eyebrow': 'Atzerako kontaketa',
    'count.title': 'Egun handia gertu dago',
    'count.days': 'Egun',
    'count.hours': 'Ordu',
    'count.minutes': 'Minutu',
    'count.seconds': 'Segundo',

    'story.eyebrow': 'Gure istorioa',
    'story.title': 'Nola iritsi ginen hona',
    'story.1.date': '2019ko udaberria',
    'story.1.title': 'Ezagutu ginen',
    'story.1.text': 'Dena aldatu zuen ustekabeko topaketa. (Editatu testu hau zuen istorioarekin.)',
    'story.2.date': '2019ko uda',
    'story.2.title': 'Gure lehen hitzordua',
    'story.2.text': 'Askoren artean lehena. (Editatu testu hau zuen istorioarekin.)',
    'story.3.date': '2024ko abendua',
    'story.3.title': 'Eskaintza',
    'story.3.text': '«Bai» esan genion gure bizitza osoari. (Editatu testu hau zuen istorioarekin.)',

    'about.eyebrow': 'Ezkongaiak',
    'about.title': 'Guri buruz',
    'about.maca': 'Andregaiaren aurkezpen laburra. (Editatu testu hau.)',
    'about.ale': 'Senargaiaren aurkezpen laburra. (Editatu testu hau.)',

    'gallery.eyebrow': 'Oroitzapenak',
    'gallery.title': 'Galeria',
    'gallery.note': 'Argazkiak laster iritsiko dira.',

    'when.eyebrow': 'Egun handia',
    'when.title': 'Noiz & Non',
    'when.ceremonyKicker': 'Zeremonia',
    'when.celebrationKicker': 'Ospakizuna',
    'when.ceremonyAct': 'Erlijio-zeremonia',
    'when.reception': 'Harrera',
    'when.cocktail': 'Koktela',
    'when.banquet': 'Banketea',
    'when.party': 'Festa · DJ-a eta barra librea',
    'when.directions': 'Nola iritsi',

    'gift.eyebrow': 'Xehetasun berezia',
    'gift.title': 'Eztei-oparia',
    'gift.intro':
      'Bizitzan hiru gauza daude: osasuna, dirua eta maitasuna. Zorionez, lehen biak soberan ditugu; beraz, zerbait oparitu nahi badiguzue, dirua ondo etorriko zaigu elkarrekin hasten dugun etapa berrirako. Mila esker!',
    'gift.label': 'Transferentzia bidez',
    'gift.copy': 'Kopiatu',
    'gift.copied': 'Kopiatuta!',
    'gift.holder': 'Titularra',
    'gift.thanks': 'Bihotz-bihotzez, eskerrik asko 💙',
    'gift.empty': 'Laster eskuragarri',

    'rsvp.eyebrow': 'Baieztatu zure etortzea',
    'rsvp.title': 'Gurekin etorriko zara?',
    'rsvp.intro':
      'Mesedez, baieztatu <strong>2026ko abuztuaren 1a</strong> baino lehen.<br />Ezin baduzu etorri, jakinaraztea ere eskertzen dugu.',
    'rsvp.cancelNote': 'Jada baieztatu baduzu eta etortzerik ez baduzu, jakinarazi iezaguzu zuzenean.',
    'rsvp.name': 'Izen-abizenak',
    'rsvp.myIntol': 'Zure elikadura-alergiak edo intolerantziak',
    'rsvp.addCompanion': '+ Gehitu lagun bat',
    'rsvp.companionTitle': 'Laguna',
    'rsvp.companionName': 'Izen-abizenak',
    'rsvp.companionKid': 'Haurra da',
    'rsvp.companionIntol': 'Alergiak edo intolerantziak',
    'rsvp.remove': 'Kendu laguna',
    'rsvp.attendLegend': 'Etorriko zara?',
    'rsvp.yes': 'Bai, hor egongo naiz',
    'rsvp.no': 'Ezin izango dut joan',
    'rsvp.note': 'Mezua (aukerakoa)',
    'rsvp.submit': 'Bidali baieztapena',
    'rsvp.hint': 'Zure baieztapena berehala bidaltzen da; ez duzu posta elektronikorik behar.',
    'rsvp.sending': 'Bidaltzen…',
    'rsvp.success': 'Eskerrik asko! Zure baieztapena jaso dugu.',
    'rsvp.error': 'Ezin izan da bidali. Saiatu berriro une batean.',
  },

  // ---- Canario / Canarian Spanish (fun, dialectal) ----
  can: {
    'meta.title': 'Maca & Ale · La Boda, mi niño',

    'nav.story': 'El Cuento',
    'nav.about': 'Los Novios',
    'nav.gallery': 'Los Retratos',
    'nav.when': 'Cuándo y Ánde',
    'nav.gift': 'El Detalle',
    'nav.rsvp': 'Apúntate',
    'nav.logout': "Pa' fuera",
    'nav.logoutTitle': 'Cerrar la sesión, mi niño',

    'hero.eyebrow': "¡Nos vamo' a casar!",
    'hero.date': '4 de Septiembre de 2026',
    'hero.scroll': "Tira p'abajo",

    'count.eyebrow': 'La cuenta atrás',
    'count.title': "Ya queda na' pal gran día, chacho",
    'count.days': 'Días',
    'count.hours': 'Horas',
    'count.minutes': 'Minutos',
    'count.seconds': 'Segundos',

    'story.eyebrow': 'Nuestra movida',
    'story.title': 'Cómo llegamos hasta aquí, mi niño',
    'story.1.date': 'Primavera de 2019',
    'story.1.title': 'Nos conocimos',
    'story.1.text': "Un encontronazo de casualidad que lo cambió to'. (Edita este texto con vuestra historia.)",
    'story.2.date': 'Verano de 2019',
    'story.2.title': 'La primera salidita',
    'story.2.text': 'La primera de muchísimas, mi niña. (Edita este texto con vuestra historia.)',
    'story.3.date': 'Diciembre de 2024',
    'story.3.title': 'La pedida',
    'story.3.text': "Dijimos que «sí» pa'l resto de nuestras vidas. (Edita este texto con vuestra historia.)",

    'about.eyebrow': 'Los novios',
    'about.title': 'Sobre nosotros dos',
    'about.maca': 'Cuatro cositas sobre la novia. (Edita este texto.)',
    'about.ale': 'Cuatro cositas sobre el novio. (Edita este texto.)',

    'gallery.eyebrow': 'Recuerdos',
    'gallery.title': 'Los retratos',
    'gallery.note': 'Las fotos llegan enseguidita, ten paciencia.',

    'when.eyebrow': 'El gran día',
    'when.title': 'Cuándo y Ánde',
    'when.ceremonyKicker': 'La ceremonia',
    'when.celebrationKicker': 'El jolgorio',
    'when.ceremonyAct': 'Ceremonia religiosa',
    'when.reception': 'El recibimiento',
    'when.cocktail': 'El piscolabis',
    'when.banquet': 'La comilona',
    'when.party': 'Fiestón · DJ y barra libre, agüita',
    'when.directions': 'Cómo llegar',

    'gift.eyebrow': 'Un detallito especial',
    'gift.title': 'El regalito',
    'gift.intro':
      "Tres cosas hay en la vida, mi niño: salud, perras y amor. Por suerte de las dos primeras vamos sobraos, así que si nos quieren regalar algo, una ayudita pa'l bolsillo nos viene de lujo pa' esta nueva etapa juntos. ¡Mil gracias, chacho!",
    'gift.label': 'Un empujoncito por transferencia',
    'gift.copy': 'Copiar',
    'gift.copied': '¡Copiao!',
    'gift.holder': 'Titular',
    'gift.thanks': 'Gracias de corazón, mi niño 💙',
    'gift.empty': 'Enseguidita lo ponemos',

    'rsvp.eyebrow': 'Dinos si te apuntas',
    'rsvp.title': '¿Te vienes, mi niño?',
    'rsvp.intro':
      "Apúntate antes del <strong>1 de Agosto de 2026</strong>, no te despistes.<br />Y si al final no puedes venir, avísanos igual, que no pasa na'.",
    'rsvp.cancelNote': 'Si ya te apuntaste y al final no puedes, chacho, avísanos directamente.',
    'rsvp.name': 'Nombre y apellidos',
    'rsvp.myIntol': 'Lo que no puedes comer (alergias o intolerancias)',
    'rsvp.addCompanion': '+ Apuntar a otro',
    'rsvp.companionTitle': 'Acompañante',
    'rsvp.companionName': 'Nombre y apellidos',
    'rsvp.companionKid': 'Es un chiquillo/a',
    'rsvp.companionIntol': 'Lo que no puede comer',
    'rsvp.remove': 'Quitar acompañante',
    'rsvp.attendLegend': '¿Te vienes?',
    'rsvp.yes': '¡Claro, allí estaré!',
    'rsvp.no': 'No voy a poder, qué penita',
    'rsvp.note': 'Un mensajito (si quieres)',
    'rsvp.submit': '¡Apúntame!',
    'rsvp.hint': 'Se envía al momento, mi niño; no hace falta ni el correo.',
    'rsvp.sending': 'Enviando, espérate…',
    'rsvp.success': '¡Gracias, mi niño! Ya te tenemos apuntao.',
    'rsvp.error': 'Ños, no se pudo enviar. Prueba otra vez en un ratito.',
  },

  // ---- 日本語 / Japanese ----
  ja: {
    'meta.title': 'Maca & Ale · 私たちの結婚式',

    'nav.story': 'ストーリー',
    'nav.about': '私たちについて',
    'nav.gallery': 'ギャラリー',
    'nav.when': '日時 & 場所',
    'nav.gift': 'ご祝儀',
    'nav.rsvp': '出欠確認',
    'nav.logout': 'ログアウト',
    'nav.logoutTitle': 'ログアウト',

    'hero.eyebrow': '結婚します',
    'hero.date': '2026年9月4日',
    'hero.scroll': '下へスクロール',

    'count.eyebrow': 'カウントダウン',
    'count.title': '大切な日まであと少し',
    'count.days': '日',
    'count.hours': '時間',
    'count.minutes': '分',
    'count.seconds': '秒',

    'story.eyebrow': '私たちの物語',
    'story.title': 'ここに至るまで',
    'story.1.date': '2019年 春',
    'story.1.title': '出会い',
    'story.1.text': 'すべてを変えた偶然の出会い。（このテキストをお二人の物語に書き換えてください。）',
    'story.2.date': '2019年 夏',
    'story.2.title': '初めてのデート',
    'story.2.text': '数えきれないデートの始まり。（このテキストをお二人の物語に書き換えてください。）',
    'story.3.date': '2024年 12月',
    'story.3.title': 'プロポーズ',
    'story.3.text': '残りの人生を共にすると誓いました。（このテキストをお二人の物語に書き換えてください。）',

    'about.eyebrow': '新郎新婦',
    'about.title': '私たちについて',
    'about.maca': '新婦の簡単なご紹介。（このテキストを編集してください。）',
    'about.ale': '新郎の簡単なご紹介。（このテキストを編集してください。）',

    'gallery.eyebrow': '思い出',
    'gallery.title': 'ギャラリー',
    'gallery.note': '写真は近日公開予定です。',

    'when.eyebrow': '特別な日',
    'when.title': '日時 & 場所',
    'when.ceremonyKicker': '挙式',
    'when.celebrationKicker': '披露宴',
    'when.ceremonyAct': '宗教式',
    'when.reception': '受付',
    'when.cocktail': 'カクテル',
    'when.banquet': 'ディナー',
    'when.party': 'パーティー · DJ & 飲み放題',
    'when.directions': 'アクセス',

    'gift.eyebrow': 'ささやかなお願い',
    'gift.title': 'ご祝儀',
    'gift.intro':
      '人生には三つの大切なものがあります。健康、お金、そして愛。幸いにも最初の二つは十分にありますので、もし何か贈ってくださるなら、二人の新しい門出のためのご祝儀をいただけたら嬉しいです。本当にありがとうございます！',
    'gift.label': '銀行振込で',
    'gift.copy': 'コピー',
    'gift.copied': 'コピーしました！',
    'gift.holder': '口座名義',
    'gift.thanks': '心より感謝を込めて 💙',
    'gift.empty': '近日公開',

    'rsvp.eyebrow': 'ご出欠のご確認',
    'rsvp.title': 'ご出席いただけますか？',
    'rsvp.intro':
      '<strong>2026年8月1日</strong>までにご返信ください。<br />ご欠席の場合も、お知らせいただけますと幸いです。',
    'rsvp.cancelNote': 'すでにご返信いただいた後にキャンセルが必要な場合は、直接ご連絡ください。',
    'rsvp.name': 'お名前（姓名）',
    'rsvp.myIntol': 'あなたのアレルギー・食物不耐性',
    'rsvp.addCompanion': '+ 同伴者を追加',
    'rsvp.companionTitle': '同伴者',
    'rsvp.companionName': 'お名前（姓名）',
    'rsvp.companionKid': 'お子様です',
    'rsvp.companionIntol': 'アレルギー・食物不耐性',
    'rsvp.remove': '同伴者を削除',
    'rsvp.attendLegend': 'ご出席されますか？',
    'rsvp.yes': 'はい、出席します',
    'rsvp.no': '残念ながら欠席します',
    'rsvp.note': 'メッセージ（任意）',
    'rsvp.submit': '確認を送信',
    'rsvp.hint': 'ご返信はすぐに送信されます。メールアプリは必要ありません。',
    'rsvp.sending': '送信中…',
    'rsvp.success': 'ありがとうございます！ご出欠を承りました。',
    'rsvp.error': '送信できませんでした。しばらくしてからもう一度お試しください。',
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
      const nav = (navigator.language || 'es').toLowerCase();
      if (nav.indexOf('eu') === 0) lang = 'eu';
      else if (nav.indexOf('ja') === 0) lang = 'ja';
      else if (nav.indexOf('es') === 0) lang = 'es';
      else lang = 'en';
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
