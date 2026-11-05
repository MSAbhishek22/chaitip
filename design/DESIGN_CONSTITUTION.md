# DESIGN CONSTITUTION — ChaiTip

**Project:** ChaiTip — tip your chaiwala in BCH (BCH BLAZE 2026, Mainnet track, solo)
**Status:** Describes the UI as actually built in `app/index.html` + `app/style.css` (5 Nov 2026). Anything not yet built is marked PLANNED.
**Rulebook:** ABHI_22 Global Project Quality Rulebook v1.0, §1.2.

## 1. Personality and emotional tone

A night street stall, not a fintech dashboard and not a crypto exchange. Warm, direct, a little loud — the way a good chai stall is: steam, marigold light, a hand-painted board, exact change. The tone is proud, not pleading: the vendor is selling something real, and the tip is a thank-you, not charity. Copy is short, in plain Indian English with ₹ amounts first and BCH second ("₹10 · 0.00039 BCH").

## 2. Target user and context of use

- **Primary:** a customer standing at a stall, phone in one hand, chai in the other. One thumb, 30 seconds, possibly patchy data. Everything must work at 360px wide with no horizontal scroll.
- **Secondary:** the vendor, checking the tip feed on the same phone at the end of the day.
- **Tertiary (decisive):** a BLAZE judge with two minutes. The first viewport must explain the product with zero scrolling: who, how much, one button, what happens.
- No accounts, no login, no app install for either side.

## 3. Visual metaphor — the night stall

- **Signboard:** the stall header is a hand-painted-style board — deep green, cream lettering, marigold underline — like the painted boards over Indian street stalls.
- **Ticket stub:** every tip receipt is a perforated ticket stub (notched edges, dashed tear line, monospace txid). The receipt is the proof, made physical.
- **Steam:** a slow, subtle steam wisp over the 3D chai glass. Motion means "hot and fresh", never decoration for its own sake.
- **Coins:** each confirmed tip drops a gold coin into the glass in the 3D scene. The glass filling up IS the tip feed, visualised.

## 4. Colour palette (semantic roles, exact values)

| Token | Value | Role |
|---|---|---|
| Stall green (bg) | `#0C211A` | Page background — night |
| Stall green 2 | `#123527` | Cards / panels |
| Cream | `#FFF6E5` | Primary text, ticket paper |
| Marigold | `#FFB000` | Primary action, amounts, coin gold |
| Saffron | `#FF7A1A` | Accent, steam highlight, active preset |
| Chai brown | `#8A5A2B` | Secondary text on cream, ticket details |
| Leaf green | `#2E9E6B` | Success / confirmed |
| Brick red | `#D64541` | Errors / failed, used sparingly |
| Muted | `#9DB8A6` | Secondary text on dark |

Rules: marigold is used only for the primary action and amounts — never as a page background. Red is never the only signal for an error (words always accompany it). No gradients except the subtle steam glow; no glassmorphism; no floating blobs.

## 5. Typography

- Display: system stack, 800–900 weight, tight letter-spacing, uppercase for the signboard name (`"RAMESH CHAI"`). No webfont dependency (works offline / on slow data).
- Body: system-ui, 400/600. Amounts are tabular numerals so ₹ and BCH figures align.
- Monospace: `ui-monospace` for txid, addresses, receipts.
- Hierarchy: stall name (32px) → amount presets (24px) → one primary button (18px) → receipt/feed (14px) → small print (12px).

## 6. Layout grid and composition

- Single column, max-width 560px, centred — a phone-first page that happens to look good on desktop.
- Order on a stall page: BLAZE banner (mandatory, top) → signboard (vendor) → amount presets → connect + tip button → 3D glass → receipt (when a tip lands) → tip feed → "how it works" (3 steps) → footer with honest limits.
- The "Open your stall" creator is a second view on the same page (tab switch, no route change), same column.

## 7. Navigation and information architecture

- No nav bar. Two tabs only: **Tip** (stall page) and **Open a stall** (creator). A `?stall=<id>` query param deep-links a stall page for sharing/QR.
- Every control lives on one screen; there is no settings page, no profile page, no second level.

## 8. Component behaviour

- Presets: tappable chips (₹5 / ₹10 / ₹20 / Custom). Selected chip is saffron-filled; custom reveals a numeric input with ₹ validation (₹1 minimum, ₹10,000 maximum).
- Connect: a 4-step stepper — Pair → Approve → Sign → Broadcast — each step shows waiting / active / done / failed honestly. No success state before the wallet signs.
- Buttons: pressed state (translateY 1px + darken), loading state (spinner + "Waiting for wallet…"), disabled only with a stated reason ("Enter a valid BCH address first").
- Receipt: appears with a short slide-in; includes txid (truncated, tap-to-copy), amount in ₹ + BCH, fee, timestamp, explorer link, and a "Verify on chain" button that re-checks the tx.
- Feed: newest first, each row = amount + time + status (confirmed / pending / failed) + txid link.

## 9. Motion language

- One easing (`cubic-bezier(.2,.7,.2,1)`), durations 150–300ms. Steam drifts slowly (6s loop). Coins drop with a small bounce. Nothing pulses, nothing auto-plays sound.
- `prefers-reduced-motion`: steam, coin drop and slide-in are disabled; state changes are instant.

## 10. 3D concept (rulebook §3)

- **What:** a Three.js scene — a glass of chai (lathe geometry, amber translucent material) on a stall counter, with gold coins (cylinders) that drop in one per confirmed tip. Drag to orbit; scroll does not hijack the page.
- **Why it matters:** it is the tip feed made visible — a vendor watching the glass fill sees the day's tips without reading numbers. Each coin maps to a real tip in the feed; tapping a coin highlights its receipt.
- **Fallback:** if WebGL is unavailable, a static CSS chai-glass illustration with the same coin count as text ("12 tips today"). Tipping works identically.
- **Performance:** lazy-loaded after first paint; capped pixel ratio; paused when off-screen or when `prefers-reduced-motion` is set.

## 11. Responsive behaviour

- 360px: single column, presets 2×2, 3D canvas 100% width × 220px.
- 768px: same column, max-width 560px (the page is intentionally phone-shaped at all sizes — it is a stall page, not a desktop dashboard).
- No horizontal overflow at any width; the BLAZE banner wraps.

## 12. Accessibility

- All amounts have text equivalents (never colour-only: confirmed = green + the word "Confirmed").
- Focus visible (2px marigold outline). All interactive elements are real `<button>`/`<input>`/`<a>`. Presets are buttons with `aria-pressed`. The 3D canvas has `role="img"` + a text summary of the same data next to it. Contrast: cream on `#0C211A` ≈ 14:1; marigold on green ≈ 7:1 for large text.
- Reduced-motion honoured (see §9).

## 13. Reference links and original decisions

- References: `design/DESIGN_REFERENCES.md` (Paytaca, BCH Builders Lab, Ko-fi, CashScript WizardConnect docs, DoraHacks page; Three.js slot honestly uninspected).
- Original decisions: night-stall palette (vs the light-paper identities of CageCheck/NoteVault/ClinicLink), ticket-stub receipts, ₹-first amounts, one-column phone-shaped page at all widths.
