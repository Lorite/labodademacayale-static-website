# Private photos go here

Drop your wedding photos in this folder using these filenames so the site
picks them up automatically:

| File              | Where it appears            |
|-------------------|-----------------------------|
| `historia-1.jpg`  | Love story — first milestone|
| `historia-2.jpg`  | Love story — second         |
| `historia-3.jpg`  | Love story — third          |
| `maca.jpg`        | About us — Maca             |
| `ale.jpg`         | About us — Ale              |
| `galeria-1..6.jpg`| Gallery grid                |

**These image files are excluded from git** (see `.gitignore`), so they stay
off the public repository. On the server, add them via a Coolify persistent
volume or copy them into the container — never commit them here.

Until a photo exists, the site shows an elegant gold gradient placeholder.
