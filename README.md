# Downingtown East Boys Volleyball — Team Website

The official website of the **Downingtown East Cougars Boys Volleyball** program
(PIAA District 1 · Ches-Mont League · Exton, PA), live at
**[debvb.github.io](https://debvb.github.io/)**.

## What's on the site

- **Home** — photo slideshow, next game / season record strip, latest news
- **Schedule** — full season schedule with results, home/away, and directions
- **Roster** — Varsity & JV player cards with per-player season stats
- **News** — match recaps with scoreboards and team stat lines
- **History** — archives of past seasons: old rosters, schedules/results, and news
- **Coaches / Contact / Donate** — staff bios, email links, Venmo support
- **[Score Sheet Guide](https://debvb.github.io/volleyball-scoring-guide.html)** — interactive scorebook tutorial

## How it works

Static **Jekyll** site hosted on **GitHub Pages**. Shared chrome (head, nav,
footer) lives in `_includes/` and `_layouts/default.html`; per-page styles in
`assets/css/`.

**Live data comes from a Google Sheet** — no code changes needed for routine
updates. `js/sheets.js` fetches the published sheet's `Schedule`, `Roster`,
and `News` tabs as CSV at page load (with a 24-hour localStorage fallback
cache). Column formats for each tab are documented at the top of
[`js/sheets.js`](js/sheets.js).

**Photos**: drop images into `photos/` and push — a GitHub Action
(`.github/workflows/update-photos.yml`) regenerates `photos/photos.json`,
which drives the homepage slideshow. Keep images ≤1600px on the long edge.

## Updating content

| Task | How |
|---|---|
| Add a game / result | Edit the `Schedule` tab in the Google Sheet |
| Post news / a recap | Add a row to the `News` tab (`ShowOnHome: yes` to feature it) |
| Update player stats | Edit the `Roster` tab |
| Add slideshow photos | Commit images to `photos/` |
| Edit bios / pages | Edit the corresponding `.html` file |
| Archive a season | Duplicate the live tabs as `Schedule YYYY` / `Roster YYYY` / `News YYYY`, add a row to the `Seasons` tab, then clear the live tabs (details in `js/sheets.js`) |

## Contact

Maintained by **Grant Shieh**, Head Boys Volleyball Coach at Downingtown East
High School.

- Team Instagram: [@deastboysvb](https://instagram.com/deastboysvb)
- Team Twitter/X: [@devbboys](https://x.com/devbboys)
- GitHub: [github.com/DEBVB](https://github.com/DEBVB)
