# ECS Design System v3 — Dark / Vercel·Linear grade

> Target: **Vercel/Linear polish** (minimal, razor-sharp typography, generous black space,
> restrained teal glow) + **SecNinjaz structure** (dark navy, cyan accent, centered animated
> logo hero, services, bundle packs, QuickScan). Center-oriented. Professional, NOT neon/cyberpunk.

## Theme: DARK (owner override — matches scope.md `goal:` "Premium dark-mode")

## Palette (tokens in globals.css @theme)
| Token        | Hex       | Use                                       |
|--------------|-----------|-------------------------------------------|
| bg           | #0A1622   | page background (deep navy-black)         |
| surface      | #0F2032   | card surface                              |
| surface-2    | #16293D   | elevated / hover surface                  |
| accent       | #08FFC8   | CTAs, glows, highlights (SPARINGLY)       |
| navy         | #204969   | mid surfaces, avatar bg, borders          |
| ink          | #FFF7F7   | primary text                              |
| muted        | #DADADA   | muted text (used at /40–/55 opacity)      |

Text tiers: headings `text-white`; body `text-white/55`; muted `text-white/40`.
Borders: `border-white/10` default, `border-accent/40` on hover.
Cards: `bg-white/[0.03] border border-white/10 rounded-2xl` → hover `border-accent/40 bg-white/[0.05] shadow-[0_0_28px_rgba(8,255,200,0.1)]`.

## Typography
- Headings: Space Grotesk, font-bold/black, tracking-tight
- Body: Inter
- Mono labels: Courier — eyebrow tags, stats labels (uppercase, tracking-[0.18em])
- Hero H1: clamp(2.25rem, 6vw, 4.5rem); section H2: text-3xl→5xl

## Spacing (generous — fixes the "cramped" complaint)
- Section vertical padding: **py-28** (not py-16/20)
- Section header margin-bottom: mb-16
- Container: max-w-7xl (content), max-w-4xl (hero/centered text)
- Card padding: p-7 / p-8

## Section pattern (every section)
- Top divider: `h-px bg-gradient-to-r from-transparent via-white/10 to-transparent`
- Centered eyebrow: mono pill `text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 tracking-[0.18em]`
- Big centered H2 + muted subtitle
- Optional ambient radial teal glow behind

## Buttons
- Primary: `bg-accent text-bg font-bold px-7 py-3.5 rounded-xl hover:shadow-[0_0_28px_rgba(8,255,200,0.45)]`
- Secondary: `border border-white/15 text-white px-7 py-3.5 rounded-xl hover:border-accent/50 hover:bg-white/5`

## Components
- **Loader**: full-screen bg, animated logo + orbit ring + terminal lines (done)
- **Navbar**: fixed, transparent→`bg-bg/80 backdrop-blur border-b border-white/10` on scroll; logo left, center links, accent "Book a Service" CTA right; mobile slide-down
- **Hero**: CENTERED — animated logo w/ orbit rings on top, badge, huge gradient H1, subtitle, typewriter quotes, dual CTA, 3-stat row (done)
- **Cards**: glass dark, top-accent line reveal on hover
- **Footer**: dark bg-surface, 3 cols, CIN, WhatsApp, thin top border
- **WhatsApp badge**: fixed bottom-right green pill

## Animations (framer-motion v12)
- ⚠️ TS strict: do NOT put `ease: "..."` (string) inside variants `transition`. Put duration/ease on the element `transition` prop, or omit ease.
- fade-up on section entrance (useInView, once)
- animated counters on stats
- staggered children, delay i*0.1
- orbit rotation on hero logo rings
- subtle hover glows

## Pages (all dark)
/ (home), /about, /services, /projects, /ideas, /contact, /scan, /vadmin-db7180, /vadmin-db7180/dashboard

## Page section backgrounds: alternate `bg-bg` and `bg-surface/30` for subtle rhythm.
## Page headers (sub-pages): centered, py-28, eyebrow + big H2 + subtitle + ambient glow (NO solid navy band).

## Must-not (global rules + owner): no neon overload, no cyberpunk, no purple SaaS gradients,
## no cookie popups, no chatbot widget, no hardcoded secrets, no Lorem Ipsum.
