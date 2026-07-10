# Sharior Farhan — Portfolio

A complete ground-up redesign of the portfolio of **Md Sharior Hossain Farhan**, Software Engineer (bKash R&E via Exabyting). Built with **HTML5, CSS3, and vanilla JavaScript only** — no frameworks, no build tools, no npm. Open `index.html` in any browser and it runs.

The only element carried over from the old portfolio is the **water ripple effect**, rebuilt from scratch for smoothness and performance.

---

## Folder structure

```
/
├── index.html          Single-page portfolio (all content, SEO, structured data)
├── style.css           Single stylesheet, organized by section
├── script.js           All behavior, modular IIFE, initialized on DOMContentLoaded
├── README.md           This file
├── assets/
│   ├── images/
│   │   └── portrait.jpg    Profile photo (from old portfolio)
│   ├── icons/
│   │   └── favicon.svg     SVG favicon + apple-touch-icon
│   └── resume.pdf          Latest CV (Download Resume buttons link here)
```

---

## Features

### Water ripple (hero background)
- Classic two-buffer wave-propagation simulation on Canvas 2D.
- Simulation runs at **¼ resolution** (1 cell ≈ 4 px) into an offscreen canvas, then upscaled — CPU cost stays tiny, the scale/composite happens on the GPU.
- Ambient "raindrops" every ~1.4 s keep it alive; pointer movement adds subtle wakes (distance-throttled), click/tap adds a bigger drop.
- **Pauses automatically** when the hero scrolls out of view or the tab is hidden (IntersectionObserver + visibilitychange) — zero cost while reading the page.
- Fully disabled under `prefers-reduced-motion`.

### Hero
- Name, animated typing role line (vanilla `setTimeout` state machine), short intro, current company, years of experience, location.
- Buttons: Download Resume, Contact Me, LinkedIn, GitHub — all magnetic on fine pointers, with a material-style click ripple.
- Staggered entrance animations (pure CSS keyframes with per-element delay).

### Navigation
- Sticky navbar; transparent over the dark hero, frosted-glass (`backdrop-filter: blur`) once scrolled.
- Scroll-spy via IntersectionObserver with animated underline on the active link.
- 2 px scroll-progress bar (transform-only, rAF-driven).
- Mobile hamburger with animated icon, slide-down panel, Escape/link-click/resize close.

### Sections
- **About** — rewritten professionally from the CV: summary, philosophy, problem-solving mindset, three engineering principles.
- **Experience** — expandable timeline cards (ARIA `aria-expanded` accordion, CSS `grid-template-rows` animation), each with logo placeholder, role, org, dates, location, responsibilities, animated metric counters, tech tags.
- **Projects** — six cards with image placeholders, Problem / Solution / Result breakdown, tech tags, GitHub links, hover lift.
- **Tech Stack** — eight categorized cards with elegant badges (core skills highlighted); no cheesy progress bars.
- **Achievements** — CanSat champion, Robotronics champion, BitFest runners-up, scholarship, leadership, competitive programming.
- **Education** — vertical timeline: BRAC University (CGPA 3.83, scholarship), HSC, SSC.
- **Contact** — email/LinkedIn/GitHub/location list, resume download, validated front-end form (opens a pre-filled `mailto:`).
- **Footer** — copyright, social icons, back-to-top.

### Animations
All animations are transform/opacity only (GPU-composited, 60 fps): reveal-on-scroll (IntersectionObserver, unobserved after firing), magnetic buttons (rAF-throttled), button ripple, hover lifts, counter easing, caret blink, pulse dot. Everything honors `prefers-reduced-motion`.

---

## Performance checklist

- [x] Zero external JS; one CSS file; system-fallback font stack behind Google Fonts
- [x] Ripple simulation at ¼ resolution; pauses off-screen and on hidden tab
- [x] All scroll work behind `requestAnimationFrame` tick flag (no layout thrash)
- [x] `resize` handlers debounced (200 ms) / throttled
- [x] Scroll-spy, reveals, counters, nav state: IntersectionObserver — no per-scroll math
- [x] Animations use `transform`/`opacity` only; `will-change` on hot elements
- [x] Portrait image `loading="lazy"` with explicit `width`/`height` (no CLS)
- [x] Passive event listeners on scroll/pointer events
- [x] Reveal observers `unobserve` after firing (no leaked observers)
- [x] Fonts loaded with `preconnect` + `display=swap`

## SEO checklist

- [x] Descriptive `<title>` + meta description + keywords + author
- [x] Canonical URL, `robots` meta (`index, follow`), `theme-color`
- [x] Open Graph (type, title, description, url, site_name, image)
- [x] Twitter Card (`summary_large_image`)
- [x] JSON-LD `Person` schema (name, jobTitle, worksFor, alumniOf, sameAs, knowsAbout, address)
- [x] SVG favicon + apple-touch-icon
- [x] Semantic landmarks: `header/nav/main/section/article/footer`
- [x] Single `<h1>`, ordered `h2 → h3` hierarchy
- [x] Alt text on the portrait; decorative SVGs `aria-hidden`
- [ ] Before deploying: update the canonical/OG URLs to your real domain, add `sitemap.xml` and `robots.txt` at the site root (placeholders below)

**robots.txt placeholder**
```
User-agent: *
Allow: /
Sitemap: https://www.shariorfarhan.com/sitemap.xml
```

**sitemap.xml placeholder**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.shariorfarhan.com/</loc></url>
</urlset>
```

## Accessibility checklist

- [x] Skip-to-content link (visible on keyboard focus)
- [x] Full keyboard navigation; visible `:focus-visible` outlines everywhere
- [x] Accordion: real `<button>` with `aria-expanded` / `aria-controls`
- [x] Hamburger: `aria-expanded`, `aria-controls`, `aria-label`; Escape closes
- [x] Form: proper `<label for>`, `aria-live` status region, inline validation
- [x] Icon-only links carry `aria-label`s
- [x] `prefers-reduced-motion`: ripple off, typewriter static, reveals/instant, smooth-scroll off
- [x] Color contrast: body text ≥ 7:1, secondary text ≥ 4.5:1 on both light and dark surfaces
- [x] `scroll-padding-top` so anchored sections aren't hidden under the sticky nav
- [x] No horizontal scrolling at any viewport width

---

## Placeholder assets to replace

| Placeholder | Where | Replace with |
|---|---|---|
| `bK` / `DS` / `BU` logo monograms | Experience cards | Real company logos (SVG, ~48×48) |
| 6 project media panels (dashed notes) | Project cards | Screenshots / architecture diagrams (16:9) |
| `assets/images/portrait.jpg` | About section | A recent professional photo if desired |
| Canonical / OG URLs | `<head>` | Your real deployed domain |
| LinkedIn/GitHub URLs | Hero, contact, footer | Verify handles are current |

## Content sources
All content was rewritten from the latest CV (`assets/resume.pdf`); the old portfolio was used only as reference. CV data always took precedence.
