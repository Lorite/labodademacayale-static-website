# Private photos go here

Drop your wedding photos in this folder using these filenames so the site
picks them up automatically:

| File              | Where it appears            |
|-------------------|-----------------------------|
| `ceremony.jpg`    | When & Where — ceremony row |
| `finca.jpg`       | When & Where — celebration  |
| `historia-1.jpg`  | Love story — first milestone|
| `historia-2.jpg`  | Love story — second         |
| `historia-3.jpg`  | Love story — third          |
| `maca.jpeg`        | About us — Maca             |
| `ale.jpg`         | About us — Ale              |
| `galeria-1..6.jpg`| Gallery grid                |

**These image files are excluded from git** (see `.gitignore`), so they stay
off the public repository. On the server, add them via a Coolify persistent
volume or copy them into the container — never commit them here.

Until a photo exists, the site shows an elegant gold gradient placeholder.

## Photo descriptions (`captions.json`)

`captions.json` holds the text shown in the lightbox when a gallery photo is
clicked. It is keyed by image file name, with one caption per language:

```json
"galeria-1.jpg": {
  "es": "Nuestro primer viaje juntos.",
  "en": "Our first trip together.",
  "eu": "Gure lehen bidaia elkarrekin.",
  "can": "El primer viajito juntos, mi niño.",
  "ja": "二人で初めての旅。"
}
```

- Languages: `es` (Español), `en` (English), `eu` (Euskara), `can` (Canario),
  `ja` (日本語).
- Leave a language empty (`""`) to fall back to Spanish; leave a whole entry
  empty to show no caption for that photo.
- Like the photos, **this file is excluded from git** (see `.gitignore`), so
  your descriptions stay off the repo. Deploy it to the server the same way you
  add the images (Coolify persistent volume, or copy it into the container).
