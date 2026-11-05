# ChaiTip — Build Plan (dated)

**Hackathon window:** registration closes Fri 13 Nov 2026; hacking Sat 14 Nov → Sun 22 Nov 2026 19:30 IST (safe target); judging 23–27 Nov; winners Sat 28 Nov.
**Today:** Thu 5 Nov 2026 (prep week — build the core now, so the hacking window is for polish + live verification, not for starting).

## Done (2026-11-05, this session — sandbox)

- [x] Rules verified from official DoraHacks page (`RESEARCH.md`).
- [x] Concept picked + justified (`CONCEPT.md`): ChaiTip, fresh build, Mainnet track, solo.
- [x] Architecture (`ARCHITECTURE.md`): static app, mainnet-js + `@wizardconnect/core` + Three.js + qrcode, no backend.
- [x] Design research, constitution, registry (`design/`).
- [x] Core product built: stall creation, tip flow, WizardConnect wiring, demo testnet mode, address-only verify-by-txid, live rate, 3D coin fountain, receipt tickets.
- [x] Automated tests (`app/tests/test.mjs`) + test report (`qa/TEST_REPORT.md`).
- [x] Interaction inventory (`qa/INTERACTION_INVENTORY.md`).

## Critical path (in order — nothing here is agent-doable except where noted)

| # | Step | Owner | Deadline |
|---|---|---|---|
| 1 | **Check Streams section on live DoraHacks page + Telegram**: is any prep stream still upcoming? If yes, attend one (roll call). If all 4 already happened, ask organisers in Telegram whether late attendance / recording + confirmation is accepted. **Highest eligibility risk.** | User (browser/Telegram tap) | **Before 13 Nov** |
| 2 | **Register on DoraHacks** (solo, Mainnet track) | User | **By 12 Nov (safe) / 13 Nov (hard)** |
| 3 | Confirm project is real in **BCH BLAZE Telegram channel** | User | Before submission |
| 4 | **Create GitHub repo** `chaitip` (public) + push this code; record commit SHA | User tap (or agent via saved session) | 14–15 Nov |
| 5 | **Deploy live HTTPS** (Netlify/Cloudflare Pages free static; stop if a card is asked) + verify from a fresh browser | User tap / agent with saved session | 15–16 Nov |
| 6 | **Live wallet test**: install Paytaca or Selene on phone, fund with a few ₹ of BCH (faucet/exchange — no card), tip the deployed demo stall for real, confirm receipt + txid on explorer | User (phone) | 16–18 Nov |
| 7 | Fill the **BLAZE banner**: Widget Factory presentation link, GitHub repo link, CashTokens/EMBER2026 address (create a CashTokens address in the wallet — user tap) | User | Before submit |
| 8 | **Demo video from the LIVE URL only** (60–120 s, real tip on the live link) — never from screenshots | User records (or agent-directed) | 20–21 Nov |
| 9 | **Submit on DoraHacks** (project + video + repo + live link) | User (own browser tap) | **22 Nov, safe 19:30 IST** |

## Hacking-week work (14–22 Nov, after steps 1–6)

- Polish pass on the live deployment: mobile viewport, rate-fallback behaviour, receipt explorer links.
- If the live wallet test exposes WizardConnect issues, fix against the real wallet behaviour (do not fake the handshake).
- Optional, only if the core is solid: CashTokens loyalty stamp (vendor issues a stamp token per 10 tips) — Phase 2, never at the cost of the core.
- Media-track entry: only as a separate, deliberate decision; the video made for Mainnet can be adapted, not re-shot from screenshots.

## What is NOT on the critical path (deliberately deferred)

- GitHub repo creation + deploy: intentionally NOT done in this prep session (no account/repo creation per task rules; both are user taps).
- Demo video: forbidden until a live URL exists (rulebook §7 + task rule 5).
- Submission: user tap only, in the submission window.
