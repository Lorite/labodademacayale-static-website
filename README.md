# La Boda de Macayale 💛

A private, password-protected wedding website for **Maca & Ale**, styled after
the elegant "Aurora Gold" design and self-hosted on a personal server with
[Coolify](https://coolify.io/).

The password is **never stored in this repository** — it lives in an
environment variable on the server, and the actual page content is gated
server-side so unauthenticated visitors can't download it.

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

## Project structure

```
server.js              Express server + auth gate
public/                Served WITHOUT auth
  login.html           Branded login page
  login.css
protected/             Served ONLY after login
  index.html           The wedding site
  assets/styles.css
  assets/main.js       Countdown, scroll reveal, RSVP
  images/              Your private photos (git-ignored)
Dockerfile             For Coolify
.dockerignore
.env.example           Documents the required env vars (.env is git-ignored)
```

## Run locally

```bash
npm install
SITE_PASSWORD='ourwedding' SESSION_SECRET="$(openssl rand -hex 32)" npm start
# open http://localhost:3000
```

Or copy `.env.example` to `.env`, fill it in, and use a tool like
`dotenv`/`direnv` (the server itself reads plain environment variables).

## Deploy on Coolify

1. Push this repo to your Git host and create a new **Application** in Coolify
   pointing at it. Coolify will detect the `Dockerfile`.
2. Under **Environment Variables**, set:
   - `SITE_PASSWORD` — the password you give guests
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`)
   - `NODE_ENV` = `production`
3. Set the **port** to `3000`, attach your domain, and let Coolify handle HTTPS.
4. Deploy. 🎉

### Adding photos (kept private)

Wedding photos are git-ignored on purpose. Add them on the server only —
e.g. a Coolify **persistent volume** mounted at `/app/protected/images`, using
the filenames listed in [protected/images/README.md](protected/images/README.md).
Until a photo is present, the site shows a tasteful gold gradient placeholder.

## Customising

- **Names / date / venue** — edit [protected/index.html](protected/index.html).
- **Countdown date** — `data-date` on the countdown section.
- **RSVP email** — `TO` constant in [protected/assets/main.js](protected/assets/main.js).
- **Colors / fonts** — CSS variables at the top of
  [protected/assets/styles.css](protected/assets/styles.css).

## Security notes

- `.env`, photos, keys and anything `*.iban` are git-ignored — keep it that way.
- **Never commit the bank IBAN.** Share gift details privately, or store them in
  an environment variable rather than in the source.
