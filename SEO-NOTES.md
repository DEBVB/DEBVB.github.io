# SEO notes — what's done in code, and what still needs a human

This file tracks the search work on the site. The code changes are shipped; the items under
"Off-site / manual" cannot be done from the repository and need someone with an inbox or a
Search Console login.

---

## Done in code

| # | Change | Where |
|---|--------|-------|
| 1 | Homepage `<title>` rewritten to `Downingtown East Volleyball — Cougars Boys Schedule, Roster & Scores` | `index.html` front matter |
| 2 | Homepage `<h1>` now reads "Downingtown East Boys Volleyball"; "Cougars" moved to the subhead | `index.html` |
| 3 | Permanent program block on the homepage — description, league, season, tryout timing, quick facts, and last season's record pulled from the `Seasons` sheet tab | `index.html`, `assets/css/index.css` |
| 4 | JSON-LD: expanded `SportsTeam` + `WebSite` on the homepage, `SportsEvent` list generated from the live schedule, `Person` on coaches, `HowTo` + `FAQPage` on the score sheet guide, `Article` + `FAQPage` + `BreadcrumbList` on the three new guides | all pages |
| 6 | Unique, keyword-first titles on every page | all front matter |
| 7 | History page gained evergreen prose, a combined-record rollup, and public-facing empty states | `history.html`, `assets/css/history.css` |
| 8 | Score sheet guide: retitled, plus a full static (crawlable) written reference with symbol table, worked example, and FAQ. Three sibling pages built | `volleyball-scoring-guide.html` + 3 new pages |
| 9 | Coaches page titled and `<h1>`'d for "Coach Grant Shieh", with a fuller `Person` block | `coaches.html` |
| — | `meta keywords` removed sitewide | `_includes/head.html` |
| — | Images renamed descriptively; alt text rewritten | repo root, `_includes/`, `photos/photos.json` |
| — | Sitemap updated with the new pages | `sitemap.xml` |

New pages:

- `/volleyball-rotations-explained.html`
- `/libero-rules-volleyball.html`
- `/piaa-volleyball-rules.html`

### Yearly maintenance

- `schedule.html` front matter has a `season_year` field that drives the `<title>`. Bump it once
  each spring. The on-page heading and record labels already derive from the schedule data.
- `sitemap.xml` `lastmod` dates are static — refresh them when a page changes materially.

---

## Off-site / manual — still to do

### Get a link from the school's athletics site (highest impact)

`downingtowneastathletics.org` and `cougars.digitalsports.com` currently outrank this site for the
generic query. A link from either is the single strongest authority signal available, and it is an
email, not a code change. Same for the Ches-Mont League site.

Suggested ask — to Corey Sigle (DE athletic director) and the Ches-Mont League webmaster:

> The boys volleyball program keeps a team site at https://debvb.github.io/ with the live schedule,
> roster, and results. Could the volleyball entry on the athletics page link to it? Happy to link
> back from our site.

### Submit the sitemap in Search Console

`robots.txt` and `sitemap.xml` both exist and are correct. The sitemap still needs to be submitted
at Search Console → Sitemaps → `https://debvb.github.io/sitemap.xml`. Verification is already in
place (`google3961a9f7cd47d85b.html` and the `google-site-verification` meta tag).

Also worth doing in the same session: request indexing for the three new guide pages.

### `/devbclinics/` is a separate repository

Item 10 — retargeting the clinics page at "volleyball clinics Exton PA" and "beach volleyball
lessons Chester County" — could not be done here. `https://debvb.github.io/devbclinics/` is served
from a different repository (`devbclinics`), which was not in scope for this session. The change
itself is small: rewrite the `<title>` and `<h1>` around the local-intent phrases, and add a
`LocalBusiness` or `SportsActivityLocation` JSON-LD block with the service area.

### Facts worth confirming

The homepage and PIAA pages state tryouts open "in early March" with the PIAA spring season. If
Downingtown East runs to a different date, edit the program block in `index.html` and the season
table in `piaa-volleyball-rules.html`.

The "Last Season" quick fact on the homepage and the combined record on the history page read from
the `Seasons` tab of the team Google Sheet (columns `Year | Record | Finish | Notes`). Both stay
hidden until that tab has data, so filling it in is what turns them on.

### Custom domain (optional)

`debvb.github.io` works, but something like `decougarsvb.com` (~$12/yr) is more memorable on a
flyer and is an asset the program owns if GitHub Pages ever changes. GitHub Pages handles DNS and
HTTPS: add a `CNAME` file to the repo root and point the domain's DNS at GitHub. Expect a short
ranking dip during the migration, so do it in the offseason rather than mid-season.
