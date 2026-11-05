# ChaiTip — Architecture

## Stack (free-only, no backend, no build server needed at runtime)

| Layer | Choice | Why |
|---|---|---|
| App | Static single-page app (`app/index.html` + `app/dist/bundle.js`) | Deployable to any free static host (Netlify / Cloudflare Pages / Render static). No server to pay for or keep awake. |
| BCH SDK | `mainnet-js` (npm, bundled with esbuild) | Address validation (`isValidAddress`), cashaddr conversion, `Wallet`/`TestNetWallet`, provider history lookup, fee/exchange-rate helpers. Verified loading in Node 24 in this session. |
| Wallet connect | `@wizardconnect/core` (Riften Labs, npm, bundled) | The BLAZE-mandated WizardConnect integration. Dapp relay (`initiateDappRelay`), key-exchange URI + QR pairing, HD-wallet session (`hdwalletv1`), `signTransaction` round-trip. Verified package loads; live wallet handshake pending a real phone test. |
| 3D | `three` (npm, bundled) | Chai glass + falling coins scene, lazy-loaded, pointer-drag orbit, 2D CSS fallback when WebGL is unavailable. |
| QR | `qrcode` (npm, bundled) | Stall QR + payment QR rendered locally, no third-party service. |
| Price feed | CoinGecko free public endpoint (no key) | `GET /api/v3/simple/price?ids=bitcoin-cash&vs_currencies=inr,usd`. Verified returning `{"bitcoin-cash":{"inr":25742,"usd":272.51}}` on 2026-11-05. Labelled static fallback if unreachable. |
| Storage | `localStorage` only | Stall pages + tip feed live in the visitor's browser. No database, no accounts, no personal data leaves the device. |
| Tests | Node `node:test` (`app/tests/test.mjs`) | Pure-function tests: address validation, ₹→sats conversion, preset math, receipt formatting, stall validation. No mocks of the chain. |

## Data flow — tip (mainnet, live path)

```
Vendor stall page (cashaddr, presets)
  → Tipper picks ₹5/₹10/₹20 (or custom) → live BCH rate → sats amount
  → "Connect wallet" → WizardConnect dapp relay → QR → Paytaca/Selene scans
  → wallet_ready (HD xpubs) → app derives receive address, builds WcTransactionObject
       (1 output: vendor cashaddr, value = sats; fee estimated by wallet)
  → signTransaction request → wallet signs → app broadcasts → txid
  → Receipt ticket: txid, amount, fee, timestamp, explorer link
  → Tip feed updates; 3D coin drops into the chai glass
```

## Data flow — fallback paths (all truthfully labelled in UI)

1. **Address-only (no wallet connect):** app shows vendor cashaddr + QR + exact sats amount. Tipper pays from any wallet manually, then pastes the txid; app verifies it against the vendor address history via the mainnet-js provider and only then marks the tip confirmed.
2. **Demo mode (testnet):** in-browser throwaway `TestNetWallet`; the whole flow runs end-to-end on BCH testnet. Funded via a public testnet faucet link (user tap). A real testnet tx is broadcast when funded; otherwise the app shows the prepared transaction and the funding step instead of faking success.
3. **No WebGL:** the 3D scene is replaced by a static CSS chai-glass illustration; tipping still works.

## Files

```
app/
  index.html            — shell, BLAZE banner, stall/tip/feed layout
  style.css             — night-stall design system (see design/DESIGN_CONSTITUTION.md)
  src/bch.js            — pure BCH logic: validation, conversion, presets, receipts
  src/wallet.js         — WizardConnect dapp relay + demo testnet wallet + verify-by-txid
  src/scene.js          — Three.js chai-glass coin fountain (lazy, fallback)
  src/main.js           — UI wiring, routing (?stall=), feed, rate fetch
  dist/bundle.js        — esbuild bundle (built, not hand-edited)
  tests/test.mjs        — node:test suite for src/bch.js
  package.json          — deps: mainnet-js, @wizardconnect/core, three, qrcode; dev: esbuild
```

## Security / honesty rules in code

- Never ask for, accept, or store a seed phrase, WIF, or private key. The only wallet input is a public cashaddr.
- Demo-mode testnet keys are throwaway, generated in-browser, labelled DEMO, and never used on mainnet.
- Amounts are computed from the fetched rate at tip time and shown in both ₹ and BCH/sats before approval; the wallet shows the same amount for signing.
- No analytics, no trackers, no external requests except CoinGecko (rate) and the BCH provider (mainnet-js default) for history lookup.
- `.env` not needed (no secrets exist). `.gitignore` covers `node_modules/` and `dist/` (dist is rebuilt from source; the release manifest records the commit + build hash instead).
