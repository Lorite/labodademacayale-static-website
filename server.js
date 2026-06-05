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
 *   GIFT_IBAN, GIFT_HOLDER                              wedding gift / bank info
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

// Private values injected into the page (see header) — supplied via env vars,
// never committed to the repo. Keys match the {{PLACEHOLDER}} tokens in the HTML.
const INJECTIONS = [
  'GIFT_IBAN', 'GIFT_HOLDER',
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
