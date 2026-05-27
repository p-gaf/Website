# patrickgaffney.studio

Hand-coded portfolio site. Static HTML, CSS, vanilla JS. No build step.

## Running locally

`fetch()` won't work when opening the HTML files directly from the filesystem,
so use a tiny local server:

```
python3 -m http.server 8000
```

http://localhost:8000

## Adding a song

Edit `data/songs.json` and append a new object. Drop the cover image into
`images/covers/` and reference it by relative path.

```json
{
  "title": "Song Name",
  "artist": "Artist Name",
  "roles": ["production", "mixing"],
  "year": 2024,
  "cover": "images/covers/song-slug.jpg",
  "spotify": "https://open.spotify.com/track/...",
  "apple_music": "https://music.apple.com/..."
}
```

`roles` can include any of: `production`, `mixing`, `engineering`, `mastering`.
Any role that doesn't match one of the filter buttons just shows up in the tag
line but isn't filterable — add a new filter button in `music.html` if you
want one.

The music list sorts newest first by `year`, automatically.

## Adding a photography project

1. Make a folder: `images/projects/<slug>/` and drop photos in there.
   Convention: `cover.jpg` plus `01.jpg`, `02.jpg`, etc.
2. Copy `projects/_template.html` to `projects/<slug>.html`. Fill in the
   title, year, paragraph, and `<img>` tags. Each image must have
   `class="lb"` so it opens in the lightbox.
3. Append an entry to `data/projects.json`:
   ```json
   {
     "slug": "<slug>",
     "title": "Project Title",
     "year": 2024,
     "representative_image": "images/projects/<slug>/cover.jpg",
     "page": "projects/<slug>.html"
   }
   ```

The Projects list on `photography.html` sorts newest first by `year`.

## Adding a Selected Work photo

Drop the photo into `images/selected/` and append to `data/selected.json`:

```json
{ "src": "images/selected/07.jpg", "caption": "Untitled, 2025" }
```

Selected Work photos are *not* linked to projects — they're standalone images
with captions, displayed in a grid.

## Lightbox

Any `<img class="lb">` opens in the lightbox on click.

- Click anywhere (or press Esc) to close
- Arrow keys to step through the current gallery
- "Current gallery" = images sharing the same `data-gallery` attribute. On
  project subpages, the project's `.lb` images have no `data-gallery` and
  are grouped together automatically.

## Deploying

The site is served via GitHub Pages from the `main` branch of the repo.

- Push to `main` → GitHub Pages auto-publishes within ~30 seconds.
- The `CNAME` file at the repo root tells Pages to serve the site at
  `patrickgaffney.studio`.
- The `.nojekyll` file disables Jekyll preprocessing so files are served
  verbatim (no surprises with underscore-prefixed files, etc.).

If `_template.html` shouldn't be publicly accessible at
`/projects/_template.html`, move it out of `projects/` or .gitignore it
locally — it's only referenced by humans, not by the site itself.

## File map

```
.
├── index.html              ← homepage
├── music.html              ← music credits + filter
├── photography.html        ← selected work + projects list
├── projects/
│   ├── _template.html      ← starter for new project pages
│   └── <slug>.html         ← one per project
├── data/
│   ├── songs.json
│   ├── projects.json
│   └── selected.json
├── images/
│   ├── covers/             ← song cover art
│   ├── selected/           ← Selected Work photos
│   └── projects/<slug>/    ← per-project photos
├── css/styles.css
├── js/
│   ├── music-filter.js
│   └── lightbox.js
├── CNAME                   ← custom-domain hint for GitHub Pages
├── .nojekyll               ← disables Jekyll on GitHub Pages
└── README.md
```
