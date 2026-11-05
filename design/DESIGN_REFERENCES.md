# Design Research — ChaiTip (Gate A, §1.1)

**Inspected:** 2026-11-05. Only pages actually opened are claimed as inspected; search snippets are labelled as such.

## 1. Same category — BCH payment products

### (a) Paytaca — https://www.paytaca.com/ (OPENED, read in full)
- What was inspected: homepage hero, problem/inversion sections, wallet + merchant-admin product tour, network/adoption argument, stats.
- Worth learning: the "no middleman" argument is made as a comparison table (intermediated vs peer-to-peer across cost, finality, permission, privacy, failure mode) — a comparison, not a slogan. Merchant Admin treats the wallet as "the owner's side of the counter". Copy is plain and confident; no crypto jargon on the hero.
- Do NOT copy: the light, airy, corporate-fintech layout and its green/white palette; ChaiTip must not look like a Paytaca clone.
- Translation: ChaiTip borrows the *comparison* device (a small "UPI vs BCH tip" strip: fee, settlement, custody) and the "wallet is the owner's side of the counter" framing for the vendor view — but in a night-stall visual language, not Paytaca's.

### (b) BCH Builders Lab / BCH Blaze — https://www.bchbuilders.online/ (OPENED, read in full)
- What was inspected: Blaze hero, "what builders are building" directory, tooling catalogue (CashScript, mainnet-js, libauth, Watchtower, Cashonize), learn section.
- Worth learning: the ecosystem presents tools as a shelf you can pick from, with one-line plain descriptions; the Blaze hero is three facts (prize, online, team size) + dates, no hype paragraph.
- Do NOT copy: the light editorial layout and generic section numbering.
- Translation: ChaiTip's stall page shows its three facts the same way (fee, settlement time, custody) in one strip, and the "how it works" is three steps, not a manual.

## 2. Same category — tipping products

### (c) Ko-fi — help.ko-fi.com "Getting started on Ko-fi" (SEARCH RESULT, read via snippet + help article text)
- What was inspected (snippet-level only): onboarding flow — connect payment, set up page, share link, goals, tip presets ($3/$5/$10 + custom).
- Worth learning: the tipping interaction is the *default* — every page has a tip button; presets + custom amount; the creator's page is the product, not a dashboard. "Supporters pay creators, not Ko-fi" — the platform never holds money.
- Do NOT copy: the pastel creator-platform aesthetic; the membership/shop sprawl.
- Translation: ChaiTip copies the interaction model (page = tip button; presets + custom; money goes straight to the vendor, never held) and the "no account to receive" posture. It deliberately does NOT copy Ko-fi's feature sprawl.

## 3. Interaction / motion reference

### (d) CashScript docs — WalletConnect & WizardConnect — https://cashscript.org/docs/guides/walletconnect (SEARCH RESULT, snippet-level)
- What was inspected (snippet-level only): the WizardConnect vs BCH WalletConnect comparison — WizardConnect is HD-wallet-aware, reuses the BCH WalletConnect transaction object, adds `inputPaths`; `signTransaction` round-trip; supported in Paytaca.
- Worth learning: the connect flow is a *handshake with visible steps* (pair → approve → sign), which is itself the interaction design: each step must show state (waiting / paired / signing / broadcast).
- Do NOT copy: n/a (docs, not a UI).
- Translation: ChaiTip's connect panel shows the handshake as a 4-step stepper with honest states, and never shows a success state before the wallet actually signs.

## 4. Typography / hierarchy reference

### (e) DoraHacks BCH BLAZE 2026 page — https://dorahacks.io/hackathon/bchblaze2026/detail (OPENED, read in full)
- What was inspected: full page — schedule, intro, key dates, prizes, eligibility, judging, sponsors.
- Worth learning: the page is ruthlessly scannable — bold section heads, short lists, numbers first. The judging note ("a couple of minutes by default… simpler things that work") is itself a design brief: the product must be graspable in one screen.
- Do NOT copy: the generic hackathon-page template look.
- Translation: ChaiTip's stall page hierarchy is: vendor name → amount → one button → receipt. Nothing else competes for the first viewport.

## 5. 3D / spatial reference

### (f) Three.js approach (NO external site inspected in this session — documented as a gap, not claimed)
- The 3D element (chai glass + falling coins) is designed from first principles in `design/DESIGN_CONSTITUTION.md` §10 and `app/src/scene.js`: coins fall on confirmed tips, glass fills, drag to orbit. No third-party 3D site was inspected; this reference slot is **BLOCKED/uninspected**, recorded honestly rather than invented.
- Translation: the 3D is functional (it visualises the tip feed — each coin is a real tip), not decorative, which is what the rulebook actually requires.

## What this research changed

- Dropped an early "dashboard with charts" direction: Ko-fi + the judging note both say the page IS the tip button.
- Added the honest-state stepper for the wallet handshake (from the WizardConnect docs).
- Added the "UPI vs BCH" comparison strip (from Paytaca's comparison-table device).
- Kept the scope to one screen + one action.
