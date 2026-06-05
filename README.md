# La Boda de Macayale 💛

A private, password-protected wedding website for **Maca & Ale**, styled after
the elegant "Aurora Gold" design and self-hosted on a personal server with
[Coolify](https://coolify.io/). Available in **Spanish and English**.

All private details — the password, the bank IBAN, and the venue names,
addresses and map links — are **never stored in this repository**. They live in
environment variables on the server and are injected into the page at request
time, so they only reach logged-in guests.

## How the password protection works

A tiny [Express](https://expressjs.com/) server ([server.js](server.js)):

1. Serves a branded login page at `/login` (public).
2. On submit, compares the entry against the `SITE_PASSWORD` environment
   variable using a constant-time comparison.
3. On success, sets a **signed, httpOnly session cookie** (signed with
   `SESSION_SECRET`) and serves the site.
4. Every other route requires a valid session — otherwise it redirects to
   `/login`. The whole `protected/` folder is unreachable without logging in.

> Why not a client-side check? Anything shipped to the browser can be read by
> anyone (View Source). Real protection has to happen on the server.

## Private values are injected, not committed

Sensitive content uses `{{PLACEHOLDER}}` tokens in the HTML. At request time the
server replaces them with values from environment variables (see `INJECTIONS` in
[server.js](server.js)). An unauthenticated visitor is redirected before any of
this is rendered, so the secrets never leave the server for anonymous requests.

Injected values: `GIFT_IBAN`, `GIFT_HOLDER`, `CEREMONY_NAME`,
`CEREMONY_ADDRESS`, `CEREMONY_MAPS_URL`, `CEREMONY_SITE_URL`, `PARTY_NAME`,
`PARTY_ADDRESS`, `PARTY_MAPS_URL`, `PARTY_SITE_URL`.

## Collecting RSVPs

Guests confirm through the form at the bottom of the site. On submit, the browser
`POST`s the reply to `/rsvp` (behind the login gate), and the server appends it as
one JSON line to the file named by `RSVP_FILE`. No email client is involved, so it
works reliably for everyone — and every reply is captured in one place.

Each reply lists the main guest plus a row per companion — name, whether they're a
child, and that person's allergies/intolerances.

**View the responses** at `/rsvps?key=YOUR_RSVP_ADMIN_KEY` (you must also be logged
in). It shows totals — replies, attending, not attending, total head-count and
children — plus a per-guest table (companions and their allergies). The
**Download CSV** button exports **one row per person** (main guest and each
companion, with adult/child and their allergies) — ready to hand to the caterer.
If `RSVP_ADMIN_KEY` is left unset, the admin view is disabled (returns 404).

> **Persistence on Coolify:** the file lives outside the repo, so attach a
> **persistent volume** (e.g. mounted at `/data`) and set `RSVP_FILE=/data/rsvps.jsonl`.
> Without a volume, redeploys would wipe the confirmations.

## Languages (ES / EN)

UI text is translated client-side in [protected/assets/i18n.js](protected/assets/i18n.js).
Every translatable element carries a `data-i18n` key; a `ES · EN` toggle in the
nav swaps the language, remembers the choice in `localStorage`, and auto-detects
from the browser on first visit. The login page is bilingual too and shares the
same saved preference. Injected secret values are language-neutral and are not
translated.

## Project structure

```
server.js              Express server + auth gate + value injection
public/                Served WITHOUT auth
  login.html           Branded, bilingual login page
  login.css
protected/             Served ONLY after login
  index.html           The wedding site (with {{...}} tokens + data-i18n keys)
  assets/styles.css
  assets/i18n.js       ES/EN translations + language toggle
  assets/main.js       Countdown, scroll reveal, IBAN copy, RSVP
  images/              Your private photos (git-ignored)
Dockerfile             For Coolify
.dockerignore
.env.example           Documents every env var (.env itself is git-ignored)
```

## Run locally

```bash
npm install
cp .env.example .env     # then edit .env with your real values
npm start                # reads .env automatically via dotenv
# open http://localhost:3000
```

`dotenv` loads `.env` in development; in production it is a no-op because Coolify
supplies the variables directly.

## Deploy on Coolify

1. Push this repo to your Git host and create a new **Application** in Coolify
   pointing at it. Coolify will detect the `Dockerfile`.
2. Under **Environment Variables**, set everything from `.env.example` with your
   real values — at minimum `SITE_PASSWORD`, `SESSION_SECRET`
   (`openssl rand -hex 32`), `NODE_ENV=production`, plus the gift and venue
   values you want shown. To collect RSVPs, also set `RSVP_ADMIN_KEY`
   (`openssl rand -hex 16`) and attach a **persistent volume** with
   `RSVP_FILE` pointing inside it (see *Collecting RSVPs* above).
3. Set the **port** to `3000`, attach your domain, and let Coolify handle HTTPS.
4. Deploy. 🎉

### Adding photos (kept private)

Wedding photos are git-ignored on purpose. Add them on the server only —
e.g. a Coolify **persistent volume** mounted at `/app/protected/images`, using
the filenames listed in [protected/images/README.md](protected/images/README.md).
Until a photo is present, the site shows a tasteful gold gradient placeholder.

## Customising

- **Private values** (venues, IBAN) — set the env vars above; never hard-code.
- **Wording / translations** — edit [protected/assets/i18n.js](protected/assets/i18n.js).
- **Schedule times / structure** — edit [protected/index.html](protected/index.html).
- **Countdown date** — `data-date` on the countdown section.
- **RSVP storage** — see *Collecting RSVPs* below; data lives in `RSVP_FILE`.
- **Colors / fonts** — CSS variables at the top of
  [protected/assets/styles.css](protected/assets/styles.css).

## Security notes

- `.env`, photos, keys and anything `*.iban` are git-ignored — keep it that way.
- **Never commit** the bank IBAN or venue details. Set them as environment
  variables; the server injects them only for authenticated guests.
