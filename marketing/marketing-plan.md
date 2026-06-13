# ECS Marketing Plan — Analytics-Driven, ₹0 Ad Budget to Start

**Owner:** Marketing agent (`.claude/agents/marketing-agent.md`) · **Measured in:** Google Analytics 4 + Search Console

## 1. Positioning

- **Who:** Indian startups & SMBs that need a website that sells, and any business that needs proof its app is secure.
- **One-liner:** *"We build websites the way attackers wish we wouldn't — and break into apps so criminals can't."*
- **Differentiators:** patents (PenBox-DMAS), ex-EY founder, every website ships pentested, free QuickScan.

## 2. The Funnel (instrumented end-to-end)

```
Search / LinkedIn / referral
        │
        ▼  GA4: session_start, source/medium
Website (excelon site)
        │
        ▼  GA4: cta_click
QuickScan or Contact form
        │
        ▼  GA4: scan_request / generate_lead  ← CONVERSION EVENTS
WhatsApp conversation (+91 70876 03933)
        │
        ▼  GA4: whatsapp_click  ← CONVERSION EVENT
Proposal → Paid engagement
        │
        ▼  tracked manually in admin/leads dashboard
Retainer / referral / case study
```

## 3. Google Analytics 4 setup (do once — 15 min)

1. Create GA4 property at analytics.google.com → get **Measurement ID** (`G-XXXXXXXXXX`).
2. Set env var `GA_MEASUREMENT_ID=G-XXXXXXXXXX` on the server (Render dashboard / `.env`). The site auto-injects the tag — **no code change needed**; IP anonymization is already on.
3. In GA4 → Admin → Events → mark as conversions (key events): `generate_lead`, `scan_request`, `whatsapp_click`.
4. Link **Google Search Console** (free): Admin → Product links. Verify domain via DNS TXT.
5. Submit `https://<domain>/sitemap.xml` in Search Console.

### Events already wired into the site
| Event | Fires when | Params |
|---|---|---|
| `whatsapp_click` | any wa.me link / floating badge clicked | location, page |
| `cta_click` | any primary CTA button clicked | label, page |
| `generate_lead` | contact form submitted | form, page |
| `scan_request` | QuickScan form submitted | form, page |

### Weekly review ritual (15 min, the marketing agent can do this from a GA export)
- Sessions by source/medium → which channel grows?
- Landing page → scan_request conversion rate (target ≥ 3%).
- whatsapp_click count → did the founder reply to all within 24 h?
- Top Search Console queries → feed next content piece.

## 4. Channels (in order of effort/return)

1. **SEO (primary)** — site is fully optimized (per-page meta, JSON-LD, sitemap). Content roadmap:
   targets like "penetration testing company India", "website development Ludhiana",
   "free website security scan", "WAPT services", "Shopify developer Punjab".
   1 case-study or explainer page per delivered project.
2. **QuickScan as growth loop** — every report footer carries the full-assessment CTA; ask happy recipients for a referral.
3. **LinkedIn founder-brand** — 2 posts/week: pentest war stories (anonymized), patent journey, before/after site launches. Link → QuickScan.
4. **WhatsApp** — the conversion floor for the Indian SMB market; pre-filled messages everywhere.
5. **Brochures** — `business/brochures/*.pdf` for direct outreach, expos, and partner agencies.
6. **Google Business Profile** (free) — "cyber security service" + "website designer" categories, Ludhiana; collects reviews.
7. **Paid (later, only after funnel converts)** — Google Ads on bottom-funnel keywords; the GA4 events double as ad-conversion signals.

## 5. KPIs (first 90 days — founder to confirm targets)

| Metric | Target |
|---|---|
| Organic sessions/mo | 500 |
| QuickScan requests/mo | 10 |
| WhatsApp conversations/mo | 20 |
| Leads → paid conversion | 20% |
| Case studies published | 2 |
