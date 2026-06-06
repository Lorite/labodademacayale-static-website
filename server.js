'use strict';

/**
 * La Boda de Macayale — password-gated static site server.
 *
 * The password and signing secret are read from environment variables
 * (configured in Coolify), so no secrets ever live in the repository.
 *
 *   SITE_PASSWORD   the password guests must enter
 *   SESSION_SECRET  random string used to sign the session cookie
 *   PORT            port to listen on (default 3000)
 *   SESSION_HOURS   how long a login stays valid (default 720 = 30 days)
 *
 * Private details below are injected into the page at request time, so they only
 * reach logged-in guests and never live in the (public) repository:
 *   GIFT_IBAN, GIFT_BENEFICIARY, GIFT_BIC, GIFT_BANK    wedding gift / bank info
 *   CEREMONY_NAME, CEREMONY_ADDRESS,
 *   CEREMONY_MAPS_URL, CEREMONY_SITE_URL                church / ceremony venue
 *   PARTY_NAME, PARTY_ADDRESS,
 *   PARTY_MAPS_URL, PARTY_SITE_URL                      reception / party venue
 *   CONTACT_EMAIL                                       address guests can write to
 *
 * When a guest sends an RSVP, two emails go out (if Gmail is configured below):
 * a notification to CONTACT_EMAIL and a confirmation to the guest. Mail is sent
 * via Gmail SMTP, authenticated with an app password:
 *   GMAIL_USER          the Gmail address that sends the mail
 *   GMAIL_APP_PASSWORD  a 16-char Gmail "app password" (NOT your login password)
 *   MAIL_FROM_NAME      optional display name on the "From" line (default Maca & Ale)
 * Leave GMAIL_USER / GMAIL_APP_PASSWORD unset to disable RSVP emails entirely;
 * confirmations are still saved to RSVP_FILE either way.
 */

require('dotenv').config({ quiet: true }); // loads a local .env in dev; no-op if absent (e.g. Coolify)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();

const PORT = process.env.PORT || 3000;
const SITE_PASSWORD = process.env.SITE_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MS = (Number(process.env.SESSION_HOURS) || 720) * 60 * 60 * 1000;
const COOKIE_NAME = 'boda_session';

// RSVP confirmations are appended to a JSON Lines file (one record per line)
// that lives OUTSIDE the repo. On Coolify, point RSVP_FILE at a persistent
// volume so replies survive redeploys (e.g. /data/rsvps.jsonl).
const RSVP_FILE = process.env.RSVP_FILE || path.join(__dirname, 'data', 'rsvps.jsonl');
// Secret needed to view the collected RSVPs at /rsvps?key=...  When unset the
// admin view is disabled entirely (returns 404).
const RSVP_ADMIN_KEY = process.env.RSVP_ADMIN_KEY || '';

// Private values injected into the page (see header) — supplied via env vars,
// never committed to the repo. Keys match the {{PLACEHOLDER}} tokens in the HTML.
const INJECTIONS = [
  'GIFT_IBAN', 'GIFT_BENEFICIARY', 'GIFT_BIC', 'GIFT_BANK',
  'CEREMONY_NAME', 'CEREMONY_ADDRESS', 'CEREMONY_MAPS_URL', 'CEREMONY_SITE_URL',
  'PARTY_NAME', 'PARTY_ADDRESS', 'PARTY_MAPS_URL', 'PARTY_SITE_URL',
  'CONTACT_EMAIL',
].reduce((acc, key) => {
  acc[key] = process.env[key] || '';
  return acc;
}, {});

// Gmail SMTP for RSVP notifications. Configured with an app password so no
// real account password is involved. When the credentials are absent the
// transporter is null and emails are simply skipped (the RSVP is still saved).
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Maca & Ale';

const mailer = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })
  : null;

if (!mailer) {
  console.warn('[mail] GMAIL_USER / GMAIL_APP_PASSWORD not set — RSVP emails disabled.');
}

if (!SITE_PASSWORD || !SESSION_SECRET) {
  console.error(
    '\n[config] Missing required environment variables.\n' +
      '         Set SITE_PASSWORD and SESSION_SECRET before starting.\n' +
      '         See .env.example for details.\n'
  );
  process.exit(1);
}

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Coolify's reverse proxy
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// --- tiny signed-token helpers (no extra dependencies) -------------------

function sign(value) {
  const mac = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  return `${value}.${mac}`;
}

function unsign(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const value = token.slice(0, dot);
  const expected = sign(value);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? value : null;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function passwordMatches(input) {
  if (typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(SITE_PASSWORD);
  // Compare a digest of each so length never leaks and lengths always match.
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function isAuthenticated(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  const value = unsign(token);
  if (!value) return false;
  const expires = Number(value);
  return Number.isFinite(expires) && expires > Date.now();
}

// --- routes --------------------------------------------------------------

const PUBLIC_DIR = path.join(__dirname, 'public');
const PROTECTED_DIR = path.join(__dirname, 'protected');

// Load the site once at startup; gift details are injected per request so the
// IBAN only ever exists in memory from an env var, never on disk in the repo.
const INDEX_TEMPLATE = fs.readFileSync(path.join(PROTECTED_DIR, 'index.html'), 'utf8');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function renderIndex(res) {
  const html = INDEX_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in INJECTIONS ? escapeHtml(INJECTIONS[key]) : match
  );
  res.type('html').send(html);
}

// --- RSVP storage --------------------------------------------------------

function appendRsvp(record) {
  fs.mkdirSync(path.dirname(RSVP_FILE), { recursive: true });
  fs.appendFileSync(RSVP_FILE, JSON.stringify(record) + '\n'); // O_APPEND: safe for concurrent writes
}

function readRsvps() {
  let raw;
  try {
    raw = fs.readFileSync(RSVP_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return []; // no confirmations yet
    throw err;
  }
  return raw
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      try { return JSON.parse(line); } catch (e) { return null; } // skip any malformed line
    })
    .filter(Boolean);
}

// Companion count + child count for a record. Handles both the current shape
// (a `companions` array) and older records that stored plain numbers.
function partyInfo(r) {
  if (Array.isArray(r.companions)) {
    return {
      guests: r.companions.length,
      kids: r.companions.filter((c) => c && c.kid).length,
    };
  }
  return { guests: Number(r.guests) || 0, kids: Number(r.kids) || 0 };
}

// Flatten every dietary note in a record into { who, what } lines.
function allergyLines(r) {
  const out = [];
  if (r.intolerances) out.push({ who: r.name || '', what: r.intolerances });
  if (Array.isArray(r.companions)) {
    for (const c of r.companions) {
      if (c && c.intolerances) out.push({ who: c.name || '', what: c.intolerances });
    }
  }
  return out;
}

function adminKeyMatches(input) {
  if (!RSVP_ADMIN_KEY || typeof input !== 'string') return false;
  // Hash both sides so length never leaks and timingSafeEqual gets equal lengths.
  const ha = crypto.createHash('sha256').update(input).digest();
  const hb = crypto.createHash('sha256').update(RSVP_ADMIN_KEY).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function csvCell(value) {
  const s = String(value == null ? '' : value);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Expand one reply into individual people (main guest first, then companions).
// Legacy numeric records become anonymous rows so the count still matches.
function expandPeople(r) {
  const people = [{ name: r.name || '', kid: false, intolerances: r.intolerances || '', main: true }];
  if (Array.isArray(r.companions)) {
    for (const c of r.companions) {
      people.push({
        name: (c && c.name) || '',
        kid: Boolean(c && c.kid),
        intolerances: (c && c.intolerances) || '',
        main: false,
      });
    }
  } else {
    const guests = Number(r.guests) || 0;
    const kids = Number(r.kids) || 0;
    for (let i = 0; i < guests; i++) {
      people.push({ name: 'Acompanante ' + (i + 1), kid: i < kids, intolerances: '', main: false });
    }
  }
  return people;
}

// One row per person — handy for handing the caterer a flat guest list.
function toCsv(rows) {
  const header = ['Fecha', 'Grupo', 'Nombre', 'Tipo', 'Asiste', 'Email', 'Intolerancias', 'Mensaje', 'Idioma'];
  const lines = [header.join(',')];
  for (const r of rows) {
    for (const p of expandPeople(r)) {
      lines.push([
        r.ts,
        r.name, // group: the reply's main guest, so a party stays together when sorted
        p.name,
        p.kid ? 'Nino' : 'Adulto',
        r.attend,
        p.main ? r.email || '' : '', // email belongs to the reply's main contact
        p.intolerances,
        p.main ? r.note : '', // the message belongs to the reply, show it once
        r.lang,
      ].map(csvCell).join(','));
    }
  }
  // Leading BOM so Excel opens it as UTF-8 (accents render correctly).
  return '﻿' + lines.join('\r\n') + '\r\n';
}

function renderRsvpList(rows, key) {
  const yes = rows.filter((r) => r.attend === 'yes');
  const no = rows.filter((r) => r.attend === 'no');
  const heads = yes.reduce((sum, r) => sum + 1 + partyInfo(r).guests, 0);
  const kidsTotal = yes.reduce((sum, r) => sum + partyInfo(r).kids, 0);
  const enc = encodeURIComponent(key);

  const body = rows
    .slice()
    .reverse() // newest first
    .map((r) => {
      const info = partyInfo(r);
      const date = String(r.ts || '').replace('T', ' ').slice(0, 16);
      const attend = r.attend === 'no'
        ? '<span class="no">No</span>'
        : '<span class="yes">Si</span>';

      let nameCell = `<strong>${escapeHtml(r.name || '')}</strong>`;
      if (Array.isArray(r.companions) && r.companions.length) {
        const items = r.companions
          .map((c) => {
            const badge = c && c.kid ? ' <span class="badge">nino/a</span>' : '';
            return `<li>${escapeHtml((c && c.name) || '')}${badge}</li>`;
          })
          .join('');
        nameCell += `<ul class="party">${items}</ul>`;
      }

      const allergies = allergyLines(r)
        .map((l) => (l.who ? `<strong>${escapeHtml(l.who)}:</strong> ` : '') + escapeHtml(l.what))
        .join('<br />');

      const emailCell = r.email
        ? `<a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>`
        : '';

      return (
        '<tr>' +
        `<td>${escapeHtml(date)}</td>` +
        `<td>${nameCell}</td>` +
        `<td>${emailCell}</td>` +
        `<td class="num">${info.guests}</td>` +
        `<td class="num">${info.kids}</td>` +
        `<td>${attend}</td>` +
        `<td>${allergies}</td>` +
        `<td>${escapeHtml(r.note || '')}</td>` +
        '</tr>'
      );
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Confirmaciones &middot; Maca &amp; Ale</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #2b2b2b; margin: 0; background: #faf7f0; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-weight: 600; margin: 0 0 4px; }
  .cards { display: flex; flex-wrap: wrap; gap: 14px; margin: 22px 0 24px; }
  .card { background: #fff; border: 1px solid #e7ddc7; border-radius: 8px; padding: 14px 18px; min-width: 110px; }
  .card b { display: block; font-size: 26px; line-height: 1.1; }
  .card span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #7a7363; }
  .actions { margin: 0 0 18px; }
  a.btn { display: inline-block; background: #b8943f; color: #fff; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e7ddc7; border-radius: 8px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #efe7d4; font-size: 14px; vertical-align: top; }
  th { background: #f3ecda; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a7363; }
  tr:last-child td { border-bottom: none; }
  td.num { text-align: center; }
  .yes { color: #4f7a45; font-weight: 600; }
  .no { color: #a8553f; font-weight: 600; }
  .party { margin: 6px 0 0; padding-left: 16px; font-size: 13px; color: #5a5346; }
  .party li { margin: 2px 0; }
  .badge { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; background: #ece3cd; color: #7a6a3c; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
  .empty { color: #7a7363; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Confirmaciones</h1>
    <div class="cards">
      <div class="card"><b>${rows.length}</b><span>Respuestas</span></div>
      <div class="card"><b>${yes.length}</b><span>Asisten</span></div>
      <div class="card"><b>${no.length}</b><span>No asisten</span></div>
      <div class="card"><b>${heads}</b><span>Invitados (total)</span></div>
      <div class="card"><b>${kidsTotal}</b><span>Ninos</span></div>
    </div>
    <div class="actions"><a class="btn" href="/rsvps.csv?key=${enc}">Descargar CSV</a></div>
    ${rows.length === 0
      ? '<p class="empty">Aun no hay confirmaciones.</p>'
      : `<table>
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Email</th><th>Acomp.</th><th>Ninos</th><th>Asiste</th><th>Intolerancias</th><th>Mensaje</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`}
  </div>
</body>
</html>`;
}

// --- RSVP email notifications -------------------------------------------

// Total head-count for a reply (main guest + companions).
function headCount(record) {
  return 1 + partyInfo(record).guests;
}

// Fixed, non-secret event facts for the guest confirmation email. Venue NAMES
// and ADDRESSES come from env vars (INJECTIONS); only the date and start times
// live here. Keep these in sync with the schedule in protected/index.html.
const EVENT_DATE = { es: 'Viernes, 4 de Septiembre de 2026', en: 'Friday, September 4, 2026' };
const CEREMONY_TIME = '18:00';
const CELEBRATION_TIME = '19:30';

// Localized "event details" block (date, ceremony, celebration) for the guest
// email. A venue row is omitted when its name/address env vars are unset.
function buildEventDetails(en) {
  const L = en
    ? { title: 'Event details', date: 'Date', ceremony: 'Ceremony', celebration: 'Celebration', at: 'at', from: 'from', map: 'map' }
    : { title: 'Detalles del evento', date: 'Fecha', ceremony: 'Ceremonia', celebration: 'Celebración', at: 'a las', from: 'desde las', map: 'mapa' };

  const rows = [{ label: L.date, value: en ? EVENT_DATE.en : EVENT_DATE.es, url: '' }];

  const ceremonyVenue = [INJECTIONS.CEREMONY_NAME, INJECTIONS.CEREMONY_ADDRESS].filter(Boolean).join(', ');
  if (ceremonyVenue) {
    rows.push({ label: L.ceremony, value: L.at + ' ' + CEREMONY_TIME + ' · ' + ceremonyVenue, url: INJECTIONS.CEREMONY_MAPS_URL });
  }
  const partyVenue = [INJECTIONS.PARTY_NAME, INJECTIONS.PARTY_ADDRESS].filter(Boolean).join(', ');
  if (partyVenue) {
    rows.push({ label: L.celebration, value: L.from + ' ' + CELEBRATION_TIME + ' · ' + partyVenue, url: INJECTIONS.PARTY_MAPS_URL });
  }

  const text = L.title + ':\n' +
    rows.map((r) => '  - ' + r.label + ': ' + r.value + (r.url ? ' (' + r.url + ')' : '')).join('\n');

  const html =
    '<p style="margin:18px 0 4px;color:#7a7363">' + escapeHtml(L.title) + '</p>' +
    '<ul style="margin:0;padding-left:18px">' +
    rows.map((r) =>
      '<li><strong>' + escapeHtml(r.label) + ':</strong> ' + escapeHtml(r.value) +
      (r.url ? ' (<a href="' + escapeHtml(r.url) + '">' + escapeHtml(L.map) + '</a>)' : '') + '</li>').join('') +
    '</ul>';

  return { text, html };
}

// Notification sent to the couple (CONTACT_EMAIL) for every reply. Always in
// Spanish — it is read by Maca & Ale, not the guests.
function buildNotificationEmail(record) {
  const attends = record.attend === 'yes';
  const rows = [
    ['Nombre', record.name],
    ['Email', record.email],
    ['Asiste', attends ? 'Sí' : 'No'],
  ];
  if (attends) rows.push(['Total personas', String(headCount(record))]);
  if (record.intolerances) rows.push(['Intolerancias', record.intolerances]);
  if (record.note) rows.push(['Mensaje', record.note]);
  rows.push(['Fecha', record.ts]);

  const companionText = record.companions.length
    ? '\nAcompañantes (' + record.companions.length + '):\n' +
      record.companions
        .map((c) => '  - ' + c.name + (c.kid ? ' (niño/a)' : '') + (c.intolerances ? ' — ' + c.intolerances : ''))
        .join('\n') + '\n'
    : '';

  const text =
    'Nueva confirmación desde la web de la boda.\n\n' +
    rows.map(([k, v]) => k + ': ' + v).join('\n') + '\n' + companionText;

  const companionHtml = record.companions.length
    ? '<p style="margin:14px 0 4px"><strong>Acompañantes (' + record.companions.length + '):</strong></p>' +
      '<ul style="margin:0;padding-left:18px">' +
      record.companions
        .map((c) => '<li>' + escapeHtml(c.name) + (c.kid ? ' <em>(niño/a)</em>' : '') +
          (c.intolerances ? ' — ' + escapeHtml(c.intolerances) : '') + '</li>')
        .join('') + '</ul>'
    : '';

  const html =
    '<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#2b2b2b">' +
    '<h2 style="color:#b8943f;font-weight:600;margin:0 0 12px">Nueva confirmación</h2>' +
    '<table style="border-collapse:collapse">' +
    rows.map(([k, v]) =>
      '<tr><td style="padding:2px 14px 2px 0;color:#7a7363">' + escapeHtml(k) + '</td>' +
      '<td style="padding:2px 0"><strong>' + escapeHtml(v) + '</strong></td></tr>').join('') +
    '</table>' + companionHtml + '</div>';

  return {
    subject: 'Nueva confirmación: ' + record.name + ' — ' + (attends ? 'asiste' : 'no asiste'),
    text,
    html,
  };
}

// Confirmation sent back to the guest, in the language they used on the site.
function buildGuestEmail(record) {
  const en = record.lang === 'en';
  const attends = record.attend === 'yes';
  const t = en
    ? {
        subject: attends ? "We've received your RSVP! · Maca & Ale" : "We've received your reply · Maca & Ale",
        hi: 'Hi ' + record.name + ',',
        body: attends
          ? "Thank you for confirming — we're so happy you'll be celebrating with us! 💛"
          : "Thank you for letting us know. We're so sorry you can't make it — you'll be missed.",
        summary: 'Summary of your reply:',
        attend: 'Attending', yes: 'Yes', no: 'No',
        guests: 'People', companions: 'Companions', diet: 'Dietary notes',
        change: 'Need to change something? Just reply to this email.',
        sign: 'With love,',
      }
    : {
        subject: attends ? '¡Hemos recibido tu confirmación! · Maca & Ale' : 'Hemos recibido tu respuesta · Maca & Ale',
        hi: 'Hola ' + record.name + ',',
        body: attends
          ? '¡Gracias por confirmar! Nos hace muchísima ilusión que nos acompañes en nuestro gran día. 💛'
          : 'Gracias por avisarnos. Sentimos mucho que no puedas acompañarnos ese día, te echaremos de menos.',
        summary: 'Resumen de tu respuesta:',
        attend: 'Asistencia', yes: 'Sí', no: 'No',
        guests: 'Personas', companions: 'Acompañantes', diet: 'Intolerancias',
        change: '¿Necesitas cambiar algo? Responde a este correo.',
        sign: 'Con cariño,',
      };

  const lines = [t.attend + ': ' + (attends ? t.yes : t.no)];
  if (attends) {
    lines.push(t.guests + ': ' + headCount(record));
    if (record.companions.length) {
      lines.push(t.companions + ': ' +
        record.companions.map((c) => c.name + (c.kid ? ' (niño/a)' : '')).join(', '));
    }
    const diet = allergyLines(record).map((l) => (l.who ? l.who + ': ' : '') + l.what).join('; ');
    if (diet) lines.push(t.diet + ': ' + diet);
  }

  // Remind attending guests of the date, location and time.
  const event = attends ? buildEventDetails(en) : null;

  const blocks = [
    t.hi,
    t.body,
    t.summary + '\n' + lines.map((l) => '  - ' + l).join('\n'),
  ];
  if (event) blocks.push(event.text);
  blocks.push(t.change, t.sign + '\nMaca & Ale');
  const text = blocks.join('\n\n');

  const html =
    '<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#2b2b2b;max-width:520px">' +
    '<p>' + escapeHtml(t.hi) + '</p>' +
    '<p>' + escapeHtml(t.body) + '</p>' +
    '<p style="margin:16px 0 4px;color:#7a7363">' + escapeHtml(t.summary) + '</p>' +
    '<ul style="margin:0;padding-left:18px">' + lines.map((l) => '<li>' + escapeHtml(l) + '</li>').join('') + '</ul>' +
    (event ? event.html : '') +
    '<p style="margin-top:16px">' + escapeHtml(t.change) + '</p>' +
    '<p style="margin-top:20px">' + escapeHtml(t.sign) +
    '<br /><strong style="color:#b8943f">Maca &amp; Ale</strong></p></div>';

  return { subject: t.subject, text, html };
}

// Fire off both RSVP emails. Best-effort: a mail failure is logged but never
// affects the guest, whose reply is already safely stored in RSVP_FILE.
async function sendRsvpEmails(record) {
  if (!mailer) return;
  const from = '"' + MAIL_FROM_NAME + '" <' + GMAIL_USER + '>';
  const adminTo = INJECTIONS.CONTACT_EMAIL || GMAIL_USER;
  const notify = buildNotificationEmail(record);
  const guest = buildGuestEmail(record);

  const results = await Promise.allSettled([
    mailer.sendMail({ from, to: adminTo, replyTo: record.email, subject: notify.subject, text: notify.text, html: notify.html }),
    mailer.sendMail({ from, to: record.email, replyTo: adminTo, subject: guest.subject, text: guest.text, html: guest.html }),
  ]);
  for (const r of results) {
    if (r.status === 'rejected') console.error('[mail] RSVP email failed:', r.reason);
  }
}

// Public assets needed by the login page (css/fonts/etc.)
app.use('/public', express.static(PUBLIC_DIR, { redirect: false }));

app.get('/login', (req, res) => {
  if (isAuthenticated(req)) return res.redirect('/');
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.post('/login', (req, res) => {
  const password = req.body && req.body.password;
  if (passwordMatches(password)) {
    const expires = Date.now() + SESSION_MS;
    res.cookie(COOKIE_NAME, sign(String(expires)), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MS,
    });
    return res.redirect('/');
  }
  res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/login');
});

// Everything below requires a valid session.
app.use((req, res, next) => {
  if (isAuthenticated(req)) return next();
  res.redirect('/login');
});

// Record a guest's confirmation. Logged-in guests only (the gate above applies).
app.post('/rsvp', (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 120);
  if (!name) return res.status(400).json({ ok: false, error: 'name_required' });

  // Email of the main contact is mandatory so we can reach them if needed.
  const email = String(body.email || '').trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'email_required' });
  }

  const companions = (Array.isArray(body.companions) ? body.companions : [])
    .map((c) => ({
      name: String((c && c.name) || '').trim().slice(0, 120),
      kid: Boolean(c && c.kid),
      intolerances: String((c && c.intolerances) || '').trim().slice(0, 200),
    }))
    .filter((c) => c.name !== '') // ignore blank rows
    .slice(0, 20); // sane upper bound per reply

  const record = {
    ts: new Date().toISOString(),
    name,
    email,
    intolerances: String(body.intolerances || '').trim().slice(0, 200),
    attend: body.attend === 'no' ? 'no' : 'yes',
    companions,
    note: String(body.note || '').trim().slice(0, 1000),
    lang: body.lang === 'en' ? 'en' : 'es',
  };

  try {
    appendRsvp(record);
  } catch (err) {
    console.error('[rsvp] could not save confirmation:', err);
    return res.status(500).json({ ok: false, error: 'save_failed' });
  }

  // Notify the couple and confirm to the guest, but don't make them wait on
  // SMTP — the reply is already saved, so email is strictly best-effort.
  sendRsvpEmails(record).catch((err) => console.error('[mail] RSVP email error:', err));

  res.json({ ok: true });
});

// Admin view of the collected RSVPs — needs the secret ?key=... AND a login.
// Without RSVP_ADMIN_KEY set, adminKeyMatches() always fails, so this 404s.
app.get('/rsvps', (req, res) => {
  if (!adminKeyMatches(req.query.key)) return res.status(404).send('Not found');
  res.type('html').send(renderRsvpList(readRsvps(), String(req.query.key)));
});

app.get('/rsvps.csv', (req, res) => {
  if (!adminKeyMatches(req.query.key)) return res.status(404).send('Not found');
  res.type('text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rsvps.csv"');
  res.send(toCsv(readRsvps()));
});

// Serve the homepage through renderIndex (never let static serve it raw, or the
// {{GIFT_IBAN}} placeholder would leak unrendered).
app.get(['/', '/index.html'], (req, res) => renderIndex(res));

app.use(express.static(PROTECTED_DIR, { redirect: false, index: false }));

app.use((req, res) => {
  res.status(404);
  renderIndex(res);
});

// Only start listening when run directly (`node server.js`); requiring this
// module (e.g. from a test) gives access to the helpers without opening a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`La Boda de Macayale running on http://localhost:${PORT}`);
  });
}

module.exports = { app, buildNotificationEmail, buildGuestEmail, sendRsvpEmails };
