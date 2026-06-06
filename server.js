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
 */

require('dotenv').config({ quiet: true }); // loads a local .env in dev; no-op if absent (e.g. Coolify)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

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
].reduce((acc, key) => {
  acc[key] = process.env[key] || '';
  return acc;
}, {});

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
  const header = ['Fecha', 'Grupo', 'Nombre', 'Tipo', 'Asiste', 'Intolerancias', 'Mensaje', 'Idioma'];
  const lines = [header.join(',')];
  for (const r of rows) {
    for (const p of expandPeople(r)) {
      lines.push([
        r.ts,
        r.name, // group: the reply's main guest, so a party stays together when sorted
        p.name,
        p.kid ? 'Nino' : 'Adulto',
        r.attend,
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

      return (
        '<tr>' +
        `<td>${escapeHtml(date)}</td>` +
        `<td>${nameCell}</td>` +
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
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Acomp.</th><th>Ninos</th><th>Asiste</th><th>Intolerancias</th><th>Mensaje</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`}
  </div>
</body>
</html>`;
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

app.listen(PORT, () => {
  console.log(`La Boda de Macayale running on http://localhost:${PORT}`);
});
