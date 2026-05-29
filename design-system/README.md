# Sherweb Design System

This project is a design system derived from the **"SW Brand 2025 (2).fig"** Figma file (uploaded by the user) and Sherweb brand assets. It is the source of truth for recreating branded interfaces, marketing pages, slides and emails for Sherweb.

## Who is Sherweb?

Sherweb is a **cloud solutions provider and marketplace for MSPs (Managed Service Providers)**. Their product is a B2B platform that lets IT providers resell and manage Microsoft (365, Azure, Dynamics), Acronis, Bitdefender, Cloud PBX and other SaaS products to their own clients.

Their brand voice is:
- Expert but human — "We're here to help you grow"
- Bilingual: English + French (Québec). Both languages are first-class.
- Partner-focused: "MSPs", "Partners", "Our experts", "We"
- Educational / consultative — leans into guides, whitepapers, webinars
- Confident, practical, a touch punchy on CTAs ("Get guide", "Book a demo", "Let's talk")

## Products / surfaces represented in the Figma

Based on the 51 pages of the Figma file, the brand system covers:

- **Website & landing pages** — Hero, Features, FAQ, Testimonials, Navigation, Footer, Awards, Certifications, Calendly embeds
- **Marketing emails** (Email2 page — 25 frames, legacy brand Old-brand-email)
- **Slide decks** (PPT2 page, Typography-PPT)
- **Brand guidelines + documentation** (Brand-Guideline, Documentation)
- **Recipes** (31 frames — internal marketing playbook templates)
- **MSP-AI** (88 frames — largest single surface; likely a product or campaign microsite)
- **Personas, Speakers/VP photos** — reference + asset pages
- **UI primitives**: Buttons (27), Forms (18), Cards, Labels, Menu, Navigation, Avatars, Flags, Shapes, Timeline, Calendar, Hero variants, Features, FAQ, Testimonials, Footer, Calendly, Shadows-Borders, Colors, Typography, Layout-Grid (55 breakpoint references), Spacing

## Sources

- **Figma** — "SW Brand 2025 (2).fig" (attached; mounted as a read-only VFS in this session)
- **Fonts** — Montserrat family (user-uploaded, 18 weights/styles)
- **Logo** — `Logo_Sherweb.svg` (user-uploaded), plus extracted variants in `assets/`

If the reader does not have Figma access, the JSX pseudocode under each page in the mounted `.fig` is the design source of truth.

---

## Index of this design system

| File / folder | Purpose |
|---|---|
| `README.md` | This file — brand overview, content + visual foundations, iconography |
| `colors_and_type.css` | CSS variables — colors, type scale, radii, shadows, spacing, motion |
| `SKILL.md` | Agent Skill manifest (cross-compatible with Claude Code) |
| `fonts/` | Montserrat TTFs (18 weights/styles) |
| `assets/` | Logos, icons, brand imagery — raw SVG/PNG |
| `preview/` | Small HTML cards that populate the Design System tab |
| `ui_kits/website/` | UI kit for the Sherweb marketing website (core screens, click-thru) |
| `ui_kits/email/` | UI kit for Sherweb marketing emails |
| `slides/` | Sample slides using the deck template system |

---

## CONTENT FUNDAMENTALS

### Voice attributes (always on)

Sherweb's voice has four constants. Every piece of copy — landing, product UI, email, error toast — holds all four:

| Attribute | What it means | Example |
|---|---|---|
| **Professional** | Expert, precise, never casual or hype-y. We respect the reader's time and IQ. | "Microsoft's partner program has changed. Keep earning incentives." |
| **Neutral** | Factual, low adjective-density. No hype, no fear, no flattery. | "Acronis Cyber Protect — backup and security in one console." |
| **Confident** | We make claims and stand by them. No hedging ("might", "could help"), no apology. | "You'll grow margin on every Microsoft seat." |
| **Supportive** | Partner-first. The reader is the hero; we're the guide. "You" + "we", never "users". | "You bring the client relationship. We handle the licensing." |

### Tone shifts (dial by surface)

Voice is constant; **tone** dials with context. Same brand, different temperature:

- **Marketing** — warm, direct, contraction-friendly. Hook + benefit. *"Your Microsoft margin just shrank. Let's fix that."*
- **Onboarding** — helpful, second-person, instructive. *"Add your first client to see provisioning in action."*
- **Product UI** — calm, neutral, label-first. No editorial. *"5 subscriptions · 2 pending renewal"*
- **Errors & legal** — sharp, factual. State the fact, name the fix. *"Payment declined. Update the card or use a different method."*

See `preview/voice-attributes.html`, `preview/voice-do-dont.html`, `preview/voice-tone-shifts.html` for the visual cards.

### Voice & tone

- **Second-person, direct.** "**You** can transition", "Don't leave money on the table", "**We** can help". Rarely third-person; rarely corporate-we without a direct-to-reader hook.
- **Bilingual by design.** Every page has English and French variants. French copy tends to use the Québec-forward "les MSP", "nos experts", "découvrez". When writing copy, assume both locales will exist and keep sentences compact enough to reflow.
- **Confident and benefit-first.** Headlines surface a change or opportunity, not a feature: "Microsoft's partner program has changed, keep earning incentives."
- **Supportive sub-copy.** One or two sentences of body text explains what happened + what Sherweb does about it. No marketing fluff words like "innovative", "synergy", "disruptive".
- **CTAs are verbs + nouns.** "Get guide", "Book a demo", "Contact sales", "Watch webinar", "Download checklist". 1–3 words. Never "Learn more" by itself — always paired with what.

### Casing

- **Sentence case** for headings, buttons and nav items. Not Title Case. "Get guide" not "Get Guide". "Produits et solutions" not "Produits Et Solutions".
- **All-caps** is reserved for small labels (`letter-spacing: 1px`, 12–14px) and button text in some treatments.
- **Proper nouns keep their casing**: Microsoft 365, Azure, Acronis, Bitdefender, Dynamics 365, Office Protect, Cloud PBX.

### I vs you vs we

- "**You**" = the MSP reader.
- "**We / our experts**" = Sherweb.
- "I" is reserved for testimonials and quotes.

### Emoji & symbolism

- **No emoji.** In 38,701 Figma nodes there is no meaningful emoji usage. The brand uses **Font Awesome Pro icons** (Light/Regular/Solid) for functional iconography. Don't introduce emoji into Sherweb designs.

### Vibe, in two lines

> Quietly confident. The smart partner in the room who actually knows Microsoft's fine print, can prove it, and makes it feel simple. Blue + white marketing site, red when it's time to act.

### Sample copy

- Hero: *"Microsoft's partner program has changed, keep earning incentives"* / *"On October 3, 2022, the Microsoft Partner Network became the Microsoft Cloud Partner Program. Don't leave money on the table. Our experts can help you transition."*
- CTA pair: **"Get guide"** (primary) + **"Contact sales"** (secondary)
- Footer blurb: *"We are a marketplace of cloud solutions and value-added services provided by a team of passionate experts dedicated to growing MSPs."*

---

## VISUAL FOUNDATIONS

### Colors

The palette is **blue-forward with a single red accent**. There is no purple, no teal, no warm neutrals.

- **Brand blue** `#0061AA` (Blue 700) — links, brand, product accents
- **Bright blue** `#34AFFC` (Blue 500) and `#7BCAFE` (Blue 300) — illustrative / light mode accents
- **Deep blue** `#072A4A` (Blue 950) — dark hero backgrounds, inverse surfaces
- **Red** `#DB4227` (Red 600) — **primary CTA color**. Used sparingly: buttons, urgent labels, logo accent dot. Darker `#B93624` for hover.
- **Tint backgrounds** `#DFF0FF` (Blue 100) — alternating hero backgrounds
- **Neutrals**: slate-grey ramp from `#090A0C` ink to `#F4F6F7` surface. Secondary text is a warm slate `#76889A`. Borders are `#E2E7EB`.
- **No gradients in UI chrome.** Brand gradients (`#0A4270 → #072A4A`) appear only as **hero/cover backgrounds** and occasionally on slide covers, always with a subtle color-dodge noise layer on top.

### Type

- **Single family: Montserrat**, weights 400/500/600/700 primarily; ExtraBold 800 and Black 900 reserved for oversize display on slides (96–200px).
- **Hierarchy** (see `colors_and_type.css`):
  - Display Large 64/72 bold, −1.5px — slide titles, biggest hero words
  - Display Medium 48/56 bold, −1px — web hero headings
  - Display Small 36/48 bold, −0.75px — section headers
  - Headline Large 32/40, Medium 24/32, Regular 20/24, Small 18/24
  - Body Large 16/24, Medium 14/20, Small 12/16 — +0.25px tracking on all body
  - Buttons — Medium weight, +1px tracking (the only letter-spaced-out text in the system)
- **Negative letter-spacing** on displays is characteristic: tight, confident headlines.
- No serif, no mono in marketing surfaces. (Inter/IBM-Plex/Poppins appear only inside Figma mockups of 3rd-party products — not the Sherweb brand.)

### Spacing

- **8-point grid.** Gaps are consistently 4/8/12/16/24/32/40/48/64/80/96px.
- **Section padding**: 56px (tablet), 64–100px (desktop) vertical.
- **Card padding**: 24px small, 40px medium, 64–80px hero.

### Backgrounds

- **Mostly flat color.** White (`#FFFFFF`), surface tint (`#F4F6F7`), brand tint (`#DFF0FF`), or deep blue (`#072A4A`).
- **Full-bleed photography** for hero imagery — cool, modern, office + people shots. Always with a **16px border-radius** when used in cards, never full-bleed in a hero container (photos sit in a rounded card next to text).
- **Brand gradient backgrounds** only on cover/title contexts, always paired with a subtle noise texture (`mix-blend-mode: color-dodge`, `opacity: 0.55–0.8`).
- **No hand-drawn illustrations.** No repeating patterns. No abstract shapes as decoration.

### Animation & motion

- Understated. `--dur: 220ms`, `--ease-out: cubic-bezier(.2,.7,.2,1)`.
- **Fades + small transforms** on hover (translateY(-2px), subtle shadow lift on cards).
- **No bounce**, no spring physics, no loader gimmicks. Motion is navigational, not decorative.

### Hover / press states

- **Buttons**: darker background (Red 600 → Red 700; Blue 700 → Blue 800). No shadow change.
- **Cards**: translateY(-2px) + shadow goes from `--shadow-sm` to `--shadow-md`.
- **Links**: underline appears, 2px thick, 3px offset, same blue.
- **Press**: scale(0.98) on buttons, or simply a slightly darker fill. No colored glow.
- **Disabled**: 40% opacity, `pointer-events: none`.

### Borders

- Hairline `1px solid #E2E7EB` on cards, inputs, dividers.
- `1px solid #0A96ED` on the typography spec pages (that's a spec treatment, not a UI treatment).
- Never dashed borders in the UI (dashed is a Figma frame-marker artifact).

### Shadows

Matches Tailwind's default shadow ramp — documented visually in the Figma `Box Shadow` frame:

- `.shadow-sm`: `0 1px 2px rgba(0,0,0,0.08)` — default card
- `.shadow`: `0 1px 3px rgba(0,0,0,0.10)` — hover lift
- `.shadow-md/-lg/-xl/-2xl` — popovers, modals, sticky nav, elevated dialogs

### Transparency & blur

- **Sparingly.** Mostly in sticky-nav treatments: `backdrop-filter: blur(12px)` + 80% white background. Not on cards. Not on hero copy.

### Corner radii

- **`4/6/8/12/16/24/40`** px and `pill` (9999). The Figma Borders frame documents all of these.
- **Buttons**: 8px.
- **Cards**: 16px.
- **Hero image cards**: 16px.
- **Big section containers / "recipes" canvases**: 40px.
- **Pill** for tags, category chips, avatar status dots.

### Cards

A **Sherweb card** is:
- `background: #FFFFFF`
- `border: 1px solid #E2E7EB` OR `box-shadow: 0 1px 2px rgba(0,0,0,0.08)` (rarely both)
- `border-radius: 16px`
- padding: 24–32px
- internal image (if any) is another 16px-rounded rect, sitting inside

### Imagery mood

- **Cool-leaning** (blue light, office interiors, headset support staff, server racks, laptops open on clean desks).
- **Color**: natural, saturated — not black-and-white, not grain-heavy.
- Occasional product screenshots + Microsoft/Azure logos treated as chips.

### Layout rules

- **Max content width 1280px**, with 1440–1920 being the full frame. Responsive breakpoints: 360, 768, 1280.
- Asymmetric hero layouts alternate **image-left / image-right** down a landing page.
- Navigation is **sticky, full-width, white or blue-950, 64–80px tall**.

---

## ICONOGRAPHY

### System

Sherweb uses **Font Awesome Pro** as its icon system in the Figma file — Light, Regular and Solid weights appear, plus Font Awesome Brands for social icons. Common usage: `fa-chevron-down`, `fa-arrow-right`, `fa-plus`, `fa-x`, `fa-search`, `fa-fire`, `fa-file-pdf`, plus brand icons `fa-x-twitter`, `fa-linkedin`, `fa-facebook-f`, `fa-instagram`.

- **Stroke weight**: Regular and Light weights dominate (16–24px sizing); Solid is used inside filled buttons and small badges.
- **Color**: inherits text color via `fill: currentColor` / `color`. Blue 700 on light bg, white on dark bg, red in CTA buttons.
- **Shape treatment**: icons sit inside a **square or circular background chip** at sizes `xxs/xs/sm/default/lg/xl`, with fills of `Blue 100`, `Red`, `None`. The chip is the consistent grammar, not the raw glyph.

### In this design system

**Font Awesome 7 Pro is wired locally** — the full set is in `fonts/` and registered in `colors_and_type.css`. All five families ship: Pro (Classic), Brands, Duotone, Sharp, Sharp Duotone — each with Thin (100), Light (300), Regular (400) and Solid (900) where applicable. Sherweb's Figma uses primarily Classic Pro Light/Regular/Solid plus Brands; reach for those first.

Usage pattern (load FA Free CDN for the class→unicode map, then our local Pro fonts take over via `!important` family/weight overrides):

```html
<link rel="stylesheet" href="../colors_and_type.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

<i class="fa-light fa-arrow-right"></i>         <!-- Classic Pro Light -->
<i class="fa-regular fa-chevron-down"></i>      <!-- Classic Pro Regular -->
<i class="fa-solid fa-fire"></i>                <!-- Classic Pro Solid -->
<i class="fa-sharp fa-light fa-plus"></i>       <!-- Sharp Light -->
<i class="fa-sharp fa-solid fa-shield"></i>     <!-- Sharp Solid -->
<i class="fa-duotone fa-cloud"></i>             <!-- Duotone Solid -->
<i class="fa-brands fa-microsoft"></i>          <!-- Brands -->
```

The CDN still provides the icon-name → unicode-codepoint mapping (e.g. `fa-arrow-right` → `\f061`); the glyph that actually paints comes from our local Pro `.otf` files because the `colors_and_type.css` rules override `font-family` with `!important`.

### Emoji & unicode

**Neither.** Sherweb does not use emoji or unicode glyphs as icons. Stick to Font Awesome.

### Logos and brand assets

- `assets/Logo_Sherweb.svg` — full horizontal wordmark (primary lockup)
- For dark-mode surfaces, the wordmark flips to white with a red accent dot (see the Figma `Logos/Logo-Sherweb` frame for all 25 variants across size × dark-mode × color).

### Product/partner logos

The Figma references partner logos (Microsoft, Acronis, Bitdefender, Google Workspace, Dynamics, Azure, Office Protect, Cloud PBX, etc.) as small chips/cards. We don't ship those logos in `assets/` to avoid trademark redistribution — fetch them from each vendor's press kit when needed.

---

## Caveats

- **Fonts**: Montserrat (all 9 weights × normal + italic) and Font Awesome 7 Pro (Classic + Brands + Duotone + Sharp + Sharp Duotone, all weights) are wired locally — no font substitution remains.
- **Partner logos** not shipped (trademarks).
- The Figma file has both **current-brand** (blue/red/Montserrat) and **legacy** ("Old-brand-email") assets. This system captures the current brand only.
