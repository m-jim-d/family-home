# family-home

Live site: https://jljcd.com

## Scripts

- `publish.bat` — copies the source site into this repo with `robocopy /MIR`, commits everything, and pushes to GitHub (`origin main`). Use `publish.bat nocopy` to commit and push without copying.
- `init.bat` — one-time setup to initialize the repo and push the first commit.

## Responsive design

Pages are built with simple, self-contained inline styles and a consistent responsive pattern:

- A `width=device-width, initial-scale=1.0` viewport meta tag on every page.
- A centered, width-limited `.pageblock` container (usually `max-width: 700px`) with generous left/top margins on desktop.
- A mobile media query, `@media (max-width: 600px)`, that trims margins and padding so the content reads well on phones.
- Images use `max-width: 100%; height: auto;` so they scale down without overflowing the viewport.

The home page (`index.html`) also adds a small media query that increases touch spacing between list items on narrow screens.

## Featured content

- **Rattlesnake Mountain** — `rattlesnake/intro.html` and `rattlesnake/overview.html`
- **Choir MIDI files** — `choir/midi-files.html`
- **Cascade Sailboards / Windsurfing** — `cascade/cascade.html` and `cascade/cascade-cover.html`
- **Star of Bethlehem** — `star.html`
- **Sermon on Marriage and Friendship** — `sermon.html`
