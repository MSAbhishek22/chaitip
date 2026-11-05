# ChaiTip — Concept

## One line

**Tip your chaiwala in BCH. No middleman, no fee — the whole tip lands in the vendor's wallet, on-chain, in seconds.**

## The problem (real, India-specific)

India runs on micro-payments: UPI made a ₹10 chai payable by phone. But every UPI/card rail has a middleman — an app, a processor, a fee, an account that can freeze. Street vendors (chaiwalas, thela owners, auto drivers) are the most cash-dependent workers in the country and the least served by crypto: no existing BCH product speaks their language, works from a printed QR on a stall, and settles a ₹5 tip without eating it in fees.

## The product

A vendor opens a **stall page** in 60 seconds: stall name, their BCH cashaddr, preset tip amounts. They get a printable QR + share link. A customer opens the link, taps a preset (₹5 / ₹10 / ₹20 — priced live in BCH), connects their BCH wallet (Paytaca / Selene via WizardConnect), approves, and the tip is a **real Bitcoin Cash mainnet transaction** straight to the vendor. The vendor sees a live tip feed and an on-chain receipt for every tip — a ticket-stub receipt with txid, amount, fee (fractions of a paisa), and explorer link.

**No accounts. No custody.** ChaiTip never holds funds. The app is a page + a wallet handshake + a receipt.

## Why this wins on the BLAZE judging rubric (120 pts)

| Category (10 pts × 3 judges) | How ChaiTip scores |
|---|---|
| Innovation & creativity | First BCH tipping product built for India's street economy, not for crypto Twitter. The stall-QR + ticket-receipt metaphor is new to BCH. |
| Design & usability | One screen, one action. A judge understands it in 10 seconds and can tip in under a minute. Built for the "couple of minutes" judging note. |
| Technical strength | Real mainnet BCH sends via WizardConnect + mainnet-js; real fee math (sub-cent); on-chain receipt verification via address history. No mock chain. |
| Business / investment potential | Vendor SaaS wedge: free stall pages → paid features (daily settlement reports, loyalty CashTokens, multi-staff splits). UPI proved the market; BCH removes the middleman's cut. |

## Why NOT a reuse of an existing project

- **CageCheck** (secret-leak guard): no payments, no BCH — nothing to re-plumb.
- **NoteVault** (notes + AI routing): bolting BCH tips onto notes would be a forced fit and would fail the "significantly improved / original" reading.
- **ClinicLink** (health worker escalation): real-money payments into a health workflow would be inappropriate and forced.
- **ChatBoss** (Twitch overlay): streaming tips exist elsewhere; re-skinning it for BCH would be a minor tweak, exactly what the rules warn against.
- **Fresh build** is cleaner under the rules ("original"), faster to explain to judges, and the simplest thing that works.

## Scope (deliberately small — judges reward working simplicity)

**P0 (this build):**
1. Create-a-stall (name, cashaddr validated by mainnet-js, presets) — stored locally, shareable link.
2. Tip flow: presets in ₹ with live BCH conversion (CoinGecko public API, labelled fallback rate), custom amount.
3. Wallet connect via WizardConnect (`@wizardconnect/core` dapp relay + QR pairing) for Paytaca/Selene; address-only fallback (show cashaddr + QR, verify by txid).
4. Send = real BCH mainnet transaction; receipt = ticket stub with txid + explorer link + fee.
5. Live tip feed per stall (local + on-chain history lookup via mainnet-js provider).
6. 3D: a chai glass with gold coins dropping on every confirmed tip (Three.js, lazy, 2D fallback).
7. Mandatory BLAZE banner (Widget Factory presentation link, GitHub repo link, CashTokens/EMBER2026 address) — placeholders wired, values filled at deploy time.

**Explicitly OUT of scope:** user accounts, server/backend, custody, fiat on-ramp, CashTokens loyalty (Phase 2 idea, not claimed as built), Media-track entry (possible later, separate decision).

## Honest limits (stated in the app, not hidden)

- A live mainnet tip needs a funded BCH wallet (Paytaca/Selene on the tipper's phone) and a few rupees of BCH. The sandbox build cannot perform a live mainnet send — no wallet, no funds. Demo mode uses BCH testnet (chipnet/testnet via mainnet-js `TestNetWallet`) so the full flow can be exercised without real money.
- WizardConnect live handshake (QR → wallet → sign) is implemented with the real SDK but **unverified against a real wallet** until the user's phone test. The app says so on the connect screen.
- BCH/INR rate comes from CoinGecko's free public endpoint; if it is unreachable the app falls back to a labelled static rate with its timestamp.
- No BCH is ever requested from, or sent to, any address the user does not control. Demo stalls never accept real tips.
