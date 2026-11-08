# Happy Birthday, Thangapoovey 💕

A personal birthday keepsake for Nisha, with a Tanglish letter, her handwritten birthday card, a five-petal flower of memories, music, and a quiet voice note at the end.

## Run locally

This is a static website. It has no dependencies and needs no build step.

```sh
npm run check
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`.

## Publish with GitHub Pages

Pages must be enabled once in the repository settings; the workflow does not enable it automatically.

1. Push this repository to the `main` branch on GitHub.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. The **Deploy birthday site to GitHub Pages** workflow deploys `dist/` on each push to `main`. It can also be run manually from **Actions**.
4. The deployment URL appears in the workflow's `github-pages` environment and in **Settings → Pages**.

The site uses relative asset paths, so it works at both an account Pages domain and a project path such as `https://username.github.io/repository/`. No domain or repository name is hardcoded. `dist/.nojekyll` marks the files as a plain static site.

## Files

- `dist/index.html` — the complete page and letters.
- `dist/styles.css` — layout and visual styling.
- `dist/app.js` — birthday interactions, reading progress, regional background music, and voice coordination.
- `dist/keepsakes.js` — reader for her original birthday card.
- `dist/flower-notes.js` — the five-petal memory flower.
- `dist/assets/` — local images, fonts, music, and the voice recording.
- `.github/workflows/pages.yml` — JavaScript checks and Pages deployment.

## Audio behavior

Remo birthday music plays across the page. Thangapoove plays only while the handwritten-card section is being read, and Remo returns when leaving it. A first interaction may be needed because browsers restrict autoplay. The sound control always allows pausing.

The voice note is tucked into the final expandable note. It plays only when its own play button is pressed, pauses the background music while playing, and never autoplays.

All media is stored in this repository. Publishing the site makes the included letters, photographs, and recordings accessible at the Pages URL.
