# AIDesignJobs

Curated design roles at AI companies. From foundation labs to startups — every role verified, linked to source, updated daily.

## Stack

Single static HTML file. No build step.

```
.
├── index.html       # the site
├── favicon.svg      # icon
├── og-image.svg     # social share preview (1200×630)
├── robots.txt
├── sitemap.xml
├── netlify.toml     # security headers + caching
└── README.md
```

## Before deploying

### 1. Replace placeholder URLs

Search & replace `https://aidesignjobs.com` with your actual domain in:
- `index.html` (canonical, og:url, JSON-LD)
- `sitemap.xml`
- `robots.txt`

### 2. Add your Google Analytics 4 ID

In `index.html`, find this line:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```
Replace **both** occurrences of `G-XXXXXXXXXX` with your GA4 Measurement ID (Admin → Data Streams → Web → "Measurement ID" in [analytics.google.com](https://analytics.google.com)).

If you don't want analytics, delete the entire `<!-- Google Analytics 4 -->` block.

## Deploy

Connected to Netlify — every push to `main` deploys automatically.

## Updating jobs

Edit the `JOBS` array near the bottom of `index.html` and push.

## SEO checklist after going live

1. **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console)) — add your property, verify, submit `/sitemap.xml`
2. **Bing Webmaster Tools** — same (import directly from Google Search Console)
3. **Indexing test** — paste your URL in [search.google.com/test/rich-results](https://search.google.com/test/rich-results) — should detect `WebSite`, `Organization`, and `JobPosting` schemas
4. **Page speed** — run [pagespeed.web.dev](https://pagespeed.web.dev) (should score 95+)
5. **Social previews** — test at [opengraph.xyz](https://www.opengraph.xyz)

## Tracked GA events

- `page_view` — automatic
- `apply_click` — fired when user clicks "Apply now" in a job drawer (params: `job_company`, `job_title`, `job_id`)
