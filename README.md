# ChaiTip — BCH BLAZE 2026

**Tip your chaiwala in BCH. No middleman, no fee — the whole tip lands in the vendor's wallet, on-chain, in seconds.**

- **Hackathon:** BCH BLAZE 2026 (DoraHacks), Mainnet track, solo.
- **Status:** `IN_PROGRESS` — core product built and tested in the sandbox; live deploy, live wallet test, video, and submission are still ahead (see `BUILD_PLAN.md`).
- **Stack:** static app, `mainnet-js` + `@wizardconnect/core` + Three.js + `qrcode`, no backend, no accounts, no custody.

## Quick start (local)

```bash
cd app
npm install
npm test        # node:test suite (pure logic + tx-builder verification)
npm run build   # esbuild -> dist/main.js + chunks (code-split)
npm start       # serves on http://localhost:8130
```

## How it works

1. A vendor opens a stall (name + BCH cashaddr, validated) and gets a share link + QR.
2. A customer picks ₹5/₹10/₹20 (live BCH rate via CoinGecko, labelled fallback if unreachable).
3. They connect Paytaca/Selene via **WizardConnect** (real `@wizardconnect/core` dapp relay + QR pairing), approve one payment, and the tip is a **real BCH mainnet transaction** straight to the vendor.
4. A ticket-stub receipt (txid, fee, explorer link) is printed, a gold coin drops into the 3D chai glass, and the tip feed updates.
5. No wallet? Pay by address and verify by pasting the txid. No real money? Demo mode runs the whole flow on BCH testnet.

## Docs

- `RESEARCH.md` — rules/prizes/deadlines verified from the official DoraHacks page + what's still unverified.
- `CONCEPT.md` — why this concept, why fresh (not a reuse), judging-rubric fit.
- `ARCHITECTURE.md` — stack, data flows, security rules.
- `BUILD_PLAN.md` — dated plan + critical path (registration by 12–13 Nov is the user's tap).
- `design/` — constitution, registry (distinct vs CageCheck/NoteVault/ClinicLink), research.
- `qa/` — interaction inventory + test report.
- `deployment/` — runbook (deploy NOT done yet).
- `submission/` — submission draft (NOT submitted).

## Honest limits

- Live mainnet tips need a funded BCH wallet; the sandbox build cannot perform one. The WizardConnect handshake is implemented with the real SDK but unverified against a real wallet until the user's phone test.
- Demo stalls never accept real tips. No seed phrases or private keys are ever requested or stored.
