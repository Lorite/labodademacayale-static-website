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
 */

const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();

const PORT = process.env.PORT || 3000;
const SITE_PASSWORD = process.env.SITE_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MS = (Number(process.env.SESSION_HOURS) || 720) * 60 * 60 * 1000;
const COOKIE_NAME = 'boda_session';

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

app.use(express.static(PROTECTED_DIR, { redirect: false, extensions: ['html'] }));

app.get('/', (req, res) => {
  res.sendFile(path.join(PROTECTED_DIR, 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(PROTECTED_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`La Boda de Macayale running on http://localhost:${PORT}`);
});
