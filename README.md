# patrickgaffney.studio

Hand-coded portfolio site. Static HTML, CSS, vanilla JS. No build step.

## Running locally

`fetch()` won't work when opening the HTML files directly from the filesystem,
so use the included local server (it mirrors GitHub Pages' implicit `.html`
fallback so internal links work the same as in production):

```
python3 scripts/serve.py
```

Then open <http://localhost:8000>. Pass a port number to use something other
than 8000 (`python3 scripts/serve.py 9000`).

You can still use the stock `python3 -m http.server 8000` if you only need to
preview pages by their full `.html` paths, but the clean URLs (`/discography`,
`/projects/altadena-girls-for-vogue`) require the included server.

## Adding a credit

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

`roles` can include any of: `production`, `mixing`, `engineering`, `mastering`,
`scoring`.
Any role that doesn't match one of the filter buttons just shows up in the tag
line but isn't filterable — add a new filter button in `discography.html` if you
want one.

Optional `"note"` field for a credit that isn't a filterable role — renders in
italic parentheses after the roles, e.g. `"note": "album cover"` displays as
*Engineering (album cover)*. Add `"note_link"` to make the note text a link
(e.g. to the photography project the cover came from), and `"note_title"` for
the hover tooltip:

```json
"note": "album cover",
"note_link": "/projects/jane-dillon",
"note_title": "See the Jane Dillon photographs"
```

Also omit either streaming link if the track isn't on that platform; the row
just shows the one that exists.

The list sorts newest-first by `date` (ISO `YYYY-MM-DD`), falling back to
`year` for anything without one. Keep `date` on new entries so ordering stays
exact.

### Scoring credits (film / commercial)

Scored work uses the same file with a few different fields — `director`
instead of `artist`, and `youtube`/`vimeo` instead of the streaming links:

```json
{
  "title": "Night Shift Short Film",
  "director": "Pranav Bhojwani",
  "roles": ["scoring"],
  "date": "2024-11-22",
  "year": 2024,
  "cover": "images/covers/night-shift.jpg",
  "youtube": "https://www.youtube.com/watch?v=AuajvywpoOc"
}
```

The byline renders as *Night Shift Short Film — Dir. Pranav Bhojwani*. For two
directors, use one comma-separated string.

Cover images for these are 16:9 video thumbnails rather than square album art.
Pull them from `https://img.youtube.com/vi/<VIDEO_ID>/maxresdefault.jpg`
(falling back to `hqdefault.jpg`) or, for Vimeo, from the oEmbed endpoint
`https://vimeo.com/api/oembed.json?url=<video url>`. Crop to 16:9 and save at
480x270 — `hqdefault` is 4:3 with letterbox bars that need cropping off. The
renderer adds a `.wide` class to any entry with a `director`, sizing it 107x60
instead of 60x60 (same height, wider).

## Adding a photography project

1. Optimize each image through `scripts/optimize_image.py` first
   (see "Image optimization" below).
2. Make a folder: `images/projects/<slug>/` and drop the optimized
   photos in there. Convention: `cover.jpg` plus `01.jpg`, `02.jpg`, etc.
3. Copy `projects/_template.html` to `projects/<slug>.html`. Fill in the
   title, year, paragraph, and `<img>` tags. Each image must have
   `class="lb"` so it opens in the lightbox.
4. Append an entry to `data/projects.json`:
   ```json
   {
     "slug": "<slug>",
     "title": "Project Title",
     "year": 2024,
     "category": "fashion-editorial",
     "page": "/projects/<slug>"
   }
   ```

`category` must be one of: `fashion-editorial`, `music`, `documentary`,
`events`. Projects are grouped by category on `photography.html` and
sorted newest-first within each group. Empty categories are hidden.

## Image optimization

Every photo gets run through the optimizer before placing under
`images/`. Defaults: max long edge 2400px, JPEG quality 82, EXIF stripped.

```bash
# single image
python3 scripts/optimize_image.py raw-shot.heic -o images/selected/mojave.jpg

# a whole folder (drops optimized .jpg copies into the destination dir)
python3 scripts/optimize_image.py images/raw/ireland-2022/ -o images/projects/ireland-2022/

# custom dimension / quality
python3 scripts/optimize_image.py raw.tiff --max-dim 2000 --quality 80
```

Use semantic filenames (`mojave-sunrise.jpg`, not `IMG_4831.jpg`). Within
project folders, sequential names (`01.jpg`, `02.jpg`) are fine because
the order is fixed.

The `images/raw/` folder is gitignored — drop unoptimized originals there
without worrying about them ending up on GitHub. Two conventional
sub-locations:

- `images/raw/selects/` — drop new files here when you want to add to
  Selected Work. Tell Claude to "process the selects."
- `images/raw/<category>/<project-name>/` — full project folder. Tell
  Claude to "process the [project name] folder." Claude derives slug,
  title, year (from EXIF), category (from parent folder), and image
  order from filename sort.

## Adding a Selected Work photo

Drop the photo into `images/selected/` and append to `data/selected.json`:

```json
{ "src": "images/selected/ireland-2025-06.jpg", "caption": "Ireland, 2025" }
```

Selected Work images are drawn from the projects, so name each one
`<project-slug>-<NN>.jpg` after its source frame — that keeps it traceable.
A one-off with no project keeps a short descriptive slug instead.

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
├── discography.html        ← music + scoring credits, with filter
├── music.html              ← redirect stub -> /discography
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
├── scripts/
│   └── optimize_image.py   ← image optimizer (see "Image optimization")
├── CNAME                   ← custom-domain hint for GitHub Pages
├── .nojekyll               ← disables Jekyll on GitHub Pages
└── README.md
```
