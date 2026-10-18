# SEO notes — what's done in code, and what still needs a human

This file tracks the search work on the site. The code changes are shipped; the items under
"Off-site / manual" cannot be done from the repository and need someone with an inbox or a
Search Console login.

---

## Done in code

| # | Change | Where |
|---|--------|-------|
| 1 | Homepage `<title>` rewritten to `Downingtown East Boys Volleyball — Schedule, Roster & Scores` | `index.html` front matter |
| 2 | Homepage `<h1>` now reads "Downingtown East Boys Volleyball"; "Cougars" moved to the subhead | `index.html` |
| 3 | Permanent program block on the homepage — description, league, season, tryout timing, quick facts, and last season's record pulled from the `Seasons` sheet tab | `index.html`, `assets/css/index.css` |
| 4 | JSON-LD: expanded `SportsTeam` + `WebSite` on the homepage, `SportsEvent` list generated from the live schedule, `Person` on coaches, `HowTo` + `FAQPage` on the score sheet guide, `Article` + `FAQPage` + `BreadcrumbList` on the three new guides | all pages |
| 6 | Unique, keyword-first titles on every page | all front matter |
| 7 | History page gained evergreen prose, a combined-record rollup, and public-facing empty states | `history.html`, `assets/css/history.css` |
| 8 | Score sheet guide: retitled, plus a full static (crawlable) written reference with symbol table, worked example, and FAQ. Three sibling pages built | `volleyball-scoring-guide.html` + 3 new pages |
| 9 | Coaches page titled and `<h1>`'d for "Coach Grant Shieh", with a fuller `Person` block | `coaches.html` |
| — | Titles trimmed to about 60 characters and descriptions to about 155, so Google shows them whole instead of cutting them off. Search terms come first | all front matter, `volleyball-scoring-guide.html` |
| — | `meta keywords` removed sitewide | `_includes/head.html` |
| — | Images renamed descriptively; alt text rewritten | repo root, `_includes/`, `photos/photos.json` |
| — | Sitemap updated with the new pages | `sitemap.xml` |
| — | Permanent text on the schedule, roster, and news pages (how the season works, positions and stat definitions, what gets posted), so they aren't empty placeholders between seasons. News `<h1>` now names the program | `schedule.html`, `roster.html`, `news.html`, `.page-about` in `assets/css/site.css` |
| — | Home links point to `/` instead of `/index.html`, matching the homepage canonical | `_includes/nav.html`, `_includes/footer.html`, `404.html`, `volleyball-scoring-guide.html` |

New pages:

- `/volleyball-rotations-explained.html`
- `/libero-rules-volleyball.html`
- `/piaa-volleyball-rules.html`

### Yearly maintenance

- `schedule.html` front matter has a `season_year` field, but it only drives the on-page heading.
  The year is typed out in `title`, `description`, `og_title` and `twitter_title`, so bump all of
  them together. Do it as soon as the next season's schedule is in the sheet, not in spring:
  families search for the new schedule over the winter, and a result that still shows last
  season's year gets skipped.
- `sitemap.xml` `lastmod` dates are static — refresh them when a page changes materially.
- Keep new titles to about 60 characters and descriptions to about 155, with the words people
  search for at the front. Phones cut descriptions shorter still, so the first ~120 characters
  should stand on their own.

### What the structured data does and doesn't do in Google

- `HowTo` and `FAQPage` markup no longer produces rich results for a site like this one. Google
  dropped HowTo rich results in 2023 and limited FAQ rich results to government and health sites.
  The markup is harmless and stays, but it won't make a listing stand out.
- What still shows: the site name and favicon (both in place), breadcrumbs on desktop, and event
  listings from the schedule's `SportsEvent` data.

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

### Search Console: sitemap and indexing (status as of October 2026)

The sitemap was submitted on Sep 12, 2026, but Search Console still shows **Couldn't fetch** with no
"Last read" date, meaning Google never actually fetched it. `robots.txt` and `sitemap.xml` are both
correct, and verification is in place (`google3961a9f7cd47d85b.html` and the
`google-site-verification` meta tag). To unstick it:

1. Open `https://debvb.github.io/sitemap.xml` in a browser and confirm it shows XML.
2. URL Inspection → paste that URL → **Test live URL**. "Page fetch: Successful" means Google can
   read it.
3. Sitemaps → ⋮ next to `/sitemap.xml` → **Remove sitemap**, then submit `sitemap.xml?v=2`. GitHub
   Pages serves the same file, but Search Console treats it as a new URL and tries again.

Only the homepage is indexed. From Aug 10 to Sep 19, three pages sat in "Crawled – currently not
indexed" (most likely schedule, roster, and news, which were empty placeholders after the July
archive). On Sep 20 they dropped out of the report entirely. The "Validation passed" on Oct 5 only
means they left that report; they were not indexed.

Once the off-season text on those pages is live, use URL Inspection → **Request indexing** on the
four guide pages, `coaches.html`, and `history.html` first, then `schedule.html`, `roster.html`, and
`news.html`. Search Console caps requests per day, so finish the list the next day if it says the
quota is reached. Expect it to take a few weeks either way.

### Track click-through rate in Search Console

Click-through rate mostly follows ranking, so a low number on its own isn't a problem. Look for
pages with lots of impressions, an average position in the top 5, and a CTR well below the rest:
Performance → Search results → turn on all four metrics → Pages, then open a page and check its
Queries. Those are the titles worth rewriting, around the words people actually typed.

After a change, note the date and compare the same queries over the 28 days before and after.
Only compare periods where the position stayed about the same; if the position moved, the CTR
change doesn't tell you much.

### Fill in addresses for away matches in the Schedule sheet

Google's event listings need an address for each match. Home matches get the school's address
automatically. Away matches use the sheet's `Address` column, and a row without one is published
with only the opponent's name (`schedule.html`, `injectEventSchema`), so it likely won't qualify.
Filling in that column is the whole fix.

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
flyer and is an asset the program owns if GitHub Pages ever changes. It also helps clicks: in
search results, `debvb.github.io` looks less official than `downingtowneastathletics.org` sitting
next to it, especially to parents. GitHub Pages handles DNS and HTTPS: add a `CNAME` file to the
repo root and point the domain's DNS at GitHub. Expect a short ranking dip during the migration,
so do it in the offseason rather than mid-season.
