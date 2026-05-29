# Sherweb Design System — TL;DR

Quick reference. Full details in `README.md`.

---

## Brand in one line

> Quietly confident. The smart partner in the room who knows Microsoft's fine print, can prove it, and makes it feel simple. **Blue + white** marketing, **red** when it's time to act.

**2026 campaign principle — Expect Better.** The artifact *is* the brand. A reader should think: *"this is the first survey I've ever received that doesn't feel like a survey."*

---

## Audience & company

- **Sherweb** = cloud solutions provider + marketplace for **MSPs**.
- Resells Microsoft 365 / Azure / Dynamics, Acronis, Bitdefender, Cloud PBX, etc.
- **Bilingual EN + FR (Québec)** — both first-class.

---

## Voice (always on)

| Attribute | Rule |
|---|---|
| **Professional** | Expert, precise, never hype-y. |
| **Neutral** | Factual, low adjective-density. |
| **Confident** | Make the claim. No hedging, no apology. |
| **Supportive** | "You" = the MSP. "We" = Sherweb. Never "users". |

**Tone shifts by surface:** Marketing (warm, direct) → Onboarding (helpful) → Product UI (calm, label-first) → Errors & legal (sharp, factual).

**Casing:** sentence case for headings + buttons. All-caps only on small labels.
**CTAs:** verb + noun, 1–3 words. *"Get guide"*, *"Book a demo"*. **Never** "Learn more" alone.
**No emoji.** Use Font Awesome.

---

## Colors

| Token | Hex | Use |
|---|---|---|
| Blue 700 | `#0061AA` | Brand, links |
| Blue 500 | `#34AFFC` | Accent, illustrative |
| Blue 950 | `#072A4A` | Dark hero, inverse |
| Blue 100 | `#DFF0FF` | Tint backgrounds |
| **Red 600** | `#DB4227` | **Primary CTA**, used sparingly |
| Red 700 | `#B93624` | CTA hover |
| Ink | `#090A0C` | Primary text |
| Slate | `#76889A` | Secondary text |
| Border | `#E2E7EB` | Hairline |
| Surface | `#F4F6F7` | Off-white bg |

No purple. No teal. No warm neutrals. Gradients only on hero covers.

---

## Type

- **Single family: Montserrat** (all 9 weights × normal + italic, wired locally).
- Weights 400/500/600/700 carry 95% of the system; 800/900 for oversize display only.
- **Negative letter-spacing** on displays (−0.75 to −1.5px) — tight, confident.
- **Buttons** are the only letter-spaced-out text (+1px).
- No serif, no mono on Sherweb surfaces.

| Style | Size / Line |
|---|---|
| Display L | 64/72, bold, −1.5 |
| Display M | 48/56, bold, −1 |
| Display S | 36/48, bold, −0.75 |
| Headline L → S | 32→18 |
| Body L → S | 16→12, +0.25 tracking |

---

## Spacing & layout

- **8-pt grid.** 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96.
- Section padding 56px (tablet) → 100px (desktop) vertical.
- Card padding: 24 / 40 / 64–80.
- **Max content 1280px**, breakpoints 360 / 768 / 1280.
- Sticky nav, 64–80px tall.

---

## Components

**Card** = white bg · 1px `#E2E7EB` border OR `shadow-sm` (rarely both) · 16px radius · 24–32px padding.
**Button** = 8px radius. Primary red, secondary blue, no shadow change on hover.
**Hero image** = 16px-rounded card next to text, never full-bleed.
**Hover** = `translateY(-2px)` + shadow lift, 220ms `cubic-bezier(.2,.7,.2,1)`.
**Press** = `scale(0.98)`. No bounce, no spring.

### Radii
`4 / 6 / 8 / 12 / 16 / 24 / 40` + `pill`. Buttons 8, cards 16, recipe canvases 40, tags pill.

---

## Iconography

- **Font Awesome 7 Pro**, wired locally (Classic + Brands + Duotone + Sharp + Sharp Duotone, Thin/Light/Regular/Solid).
- Light & Regular dominate at 16–24px; Solid for filled buttons + badges.
- Icons sit inside **square or circular chips** (Blue 100, Red, or None) — the chip is the grammar, not the glyph.
- Use the FA Free CDN for class→unicode mapping; local Pro `.otf` files override the family via `!important`.

```html
<i class="fa-light fa-arrow-right"></i>
<i class="fa-sharp fa-solid fa-shield"></i>
<i class="fa-brands fa-microsoft"></i>
```

---

## Imagery & motion

- Cool, modern photography — office interiors, support staff, laptops on clean desks. Natural color, not B&W.
- **No hand-drawn illustrations, no patterns, no abstract decoration.**
- Gradients only on hero/cover (`#0A4270 → #072A4A`), with subtle noise on `color-dodge`.
- Motion is navigational, not decorative.

---

## Files

| Path | Purpose |
|---|---|
| `colors_and_type.css` | All design tokens (CSS variables) + @font-face |
| `fonts/` | Montserrat + Font Awesome 7 Pro |
| `assets/` | Sherweb logos |
| `preview/` | Design System tab cards |
| `ui_kits/website/` · `ui_kits/email/` | Reference UI kits |
| `slides/` | Deck template samples |
| `README.md` | Full doc |
| `SUMMARY.md` | This file |

---

## Quick-start (HTML)

```html
<link rel="stylesheet" href="colors_and_type.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

<button style="
  background: var(--color-red-600);
  color: #fff;
  font-family: var(--ff-sans);
  font-weight: 500;
  letter-spacing: 1px;
  padding: 12px 20px;
  border-radius: 8px;
  border: 0;
">
  Get guide
</button>
```
