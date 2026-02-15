# AfrexAI Website

**Live:** https://afrexai-cto.github.io/

## SEO & Lead Capture Infrastructure

### Files Created

| File | Purpose |
|------|---------|
| `sitemap.xml` | 58 URLs for search engine indexing |
| `robots.txt` | Crawler rules; blocks /crm-dashboard/, /board/, /portal/ |
| `lead-capture/index.html` | "Free AI Workforce Audit" landing page with Formspree form |
| `newsletter/index.html` | Email newsletter signup page with Formspree form |
| `_includes/analytics.html` | GA4 snippet (replace `G-XXXXXXXXXX` with real ID) |
| `scripts/add-analytics.sh` | Injects GA4 into all HTML files missing it |
| `scripts/add-meta-tags.sh` | Adds OG + Twitter Card meta tags to all HTML files |

### Setup Steps

1. **Google Analytics:** Edit `_includes/analytics.html` and replace `G-XXXXXXXXXX` with your GA4 measurement ID, then run:
   ```bash
   bash scripts/add-analytics.sh
   ```

2. **Meta Tags:** Add Open Graph and Twitter Card tags to all pages:
   ```bash
   bash scripts/add-meta-tags.sh
   ```

3. **Formspree:** Create two forms at [formspree.io](https://formspree.io) and replace `xplaceholder` in:
   - `lead-capture/index.html` (audit form)
   - `newsletter/index.html` (newsletter form)

4. **Calendly:** Update the Calendly link in `lead-capture/index.html` if different from `https://calendly.com/afrexai/ai-audit`

5. **OG Image:** Place a 1200×630 image at `assets/og-image.png` for social sharing previews.

### Protected Pages (not indexed)

- `/crm-dashboard/` — CRM dashboard
- `/board/` — Board portal
- `/portal/` — Client portal
