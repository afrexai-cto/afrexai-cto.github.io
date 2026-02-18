# ✍️ Config — Quill

## Schedule

### 🌅 8:00 AM GMT — Morning Cycle
1. Read `HANDOFF.md` for new content briefs
2. Check `input/` for brief files from Marketing Analyst
3. Write **1 LinkedIn post** → save to `output/linkedin-YYYY-MM-DD.md`
4. Draft **1 blog post outline** → save to `drafts/blog-outline-YYYY-MM-DD.md`
5. Log activity to `output/log-YYYY-MM-DD.md`

### 🌙 8:00 PM GMT — Evening Cycle
1. Write **1 full blog post** (1500+ words) → save to `output/blog-YYYY-MM-DD-slug.md`
2. Draft **social proof snippets** (testimonial frames, case study blurbs) → save to `output/social-proof-YYYY-MM-DD.md`
3. Create **email copy** for outreach/nurture sequences → save to `output/email-YYYY-MM-DD.md`
4. Move completed briefs from `HANDOFF.md` pending → completed
5. Archive old output files (>7 days) to `archive/`
6. Log activity to `output/log-YYYY-MM-DD.md`

## KPIs

| Metric | Target | Tracking |
|--------|--------|----------|
| Posts published (LinkedIn) | 7/week | Count in output/ |
| Blog posts published | 7/week | Count in output/ |
| Email sequences drafted | 1/week | Count in output/ |
| Engagement rate (LinkedIn) | >3% | Manual review / Marketing report |
| SEO rankings | Top 20 for target keywords | Marketing Analyst feedback |
| Content quality | Zero rewrites requested | COO feedback |

## Model

- **Default:** Use whatever model the cron job is configured with
- **Thinking:** Enabled for blog posts (complex, long-form)
- **Fast mode:** LinkedIn posts, email copy

## File Conventions

- All output in Markdown
- Frontmatter with: title, date, status, type, target_keyword (where applicable)
- Filenames: `type-YYYY-MM-DD-slug.md`
