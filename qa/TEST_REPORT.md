# Test Report — ChaiTip

**Date:** 2026-11-05 (evening IST), re-verified 2026-11-12 ~09:51 IST · **Environment:** Muse Linux sandbox, Node v24.22.1, npm 10.9.4 · **Commands:** `npm test`, `npm run build`, `python3 -m http.server` + curl.

## Re-verification — 2026-11-12 (this pass)

- **Tests — 10/10 PASS, 0 fail, exit 0** (`npm test`, duration 2,206 ms). Same 10 named tests as 5 Nov.
- **Build — PASS, exit 0** (esbuild, 533 ms): `dist/main.js` 450.6 KiB, `dist/scene-BXLCZWHB.js` 544.6 KiB, `dist/chunk-JASUU3JV.js` 356.2 KiB, `dist/chunk-OOJM4CTU.js` 638 B, `dist/MockNetworkProvider-SBQNISNV.js` 1.3 KiB. Total ~1.4 MB.
- **Syntax — PASS:** `node --check` on all 5 source files.
- **Serve smoke — PASS (HTTP only):** port 8132; `index.html` 200 (10,344 B), `style.css` 200 (9,613 B), `dist/main.js` / `scene` / chunk all 200. Key IDs present (`scene`, `stall-address`, `stall-name`, `tip-btn` via `tip-btn`/`connect-btn`, `tip-feed`).
- **Secret scan — PASS:** only benign warnings/comments, no real secret, no `.env`.
- Browser render, live WizardConnect handshake, live mainnet/testnet tip, verify-by-txid: still **NOT verified** (see gaps below).

## Automated tests — 10/10 PASS

`app/tests/test.mjs` (`node --test --test-force-exit`), **1.4 s, exit 0**:

| Test | Result |
|---|---|
| ₹ → sats conversion at the verified rate (₹5→19,424; ₹10→38,847; ₹20→77,694 sats @ ₹25,742/BCH) | PASS |
| sats → BCH and ₹ round-trips | PASS |
| Custom amount validation (empty / 0 / non-number / >₹10,000 / valid) | PASS |
| Stall validation rejects bad addresses, accepts a real one (random mainnet-js wallet) | PASS |
| Receipt formatting (short txid, amounts, explorer URL) | PASS |
| Placeholder unlocking bytecode shape (71-byte sig + 33-byte pubkey) | PASS |
| Unsigned tip transaction builds and decodes cleanly (payment + change, `receive` inputPaths, broadcast:true) | PASS |
| Unsigned tip transaction refuses an unfunded wallet | PASS |
| WizardConnect pairing credentials produce a real pairing URI (`wiz://?p=…`, `WIZ://…` QR URI) | PASS |
| Cleanup: disconnect providers | PASS |

**Fixes made during testing (honest ledger):** the first run had 1 failure — my hand-computed expected values were wrong (₹10 = 38,847 sats, not 38,846; ₹5 = 19,424, not 19,423). The code was right; the test expectations were corrected against `node` arithmetic. The test runner also hung on exit until `--test-force-exit` was added (mainnet-js holds provider handles open); tests themselves finished in ~1 s.

## Build — PASS

`npm run build` (esbuild, ESM, code-split, minified): 5 chunks, no errors.
- `dist/main.js` 461,426 B · `dist/scene-BXLCZWHB.js` 557,673 B (Three.js, lazy) · `dist/chunk-JASUU3JV.js` 364,737 B · `dist/chunk-OOJM4CTU.js` 638 B · `dist/MockNetworkProvider-SBQNISNV.js` 1,323 B (stubbed electrum dep — see below).
- `node --check` passes on all four `src/*.js` files.
- **Build quirk, fixed:** mainnet-js imports `@mem-cash/electrum` (optional dep, only for its mock provider). It is not installed and the install timed out; the build now aliases it to `src/stubs/electrum-stub.js`, which throws if ever called. The mock provider is never used by the app.

## Serve smoke test — PASS (HTTP layer only)

`python3 -m http.server 8130` in `app/`: `index.html` 200 (10,344 B), `style.css` 200, `dist/main.js` 200, `dist/scene-BXLCZWHB.js` 200, both shared chunks 200, mock-provider chunk 200. All key element IDs present in the served HTML (9 matches for banner/stall/tip/QR/scene markers).

## Secret scan — PASS

Grep for keys/passwords/seeds/mnemonics across the project (excluding `node_modules/`, `dist/`): only two benign mentions — a comment stating no seed/private key is ever stored, and a concept-doc reference to CageCheck. No secrets exist in the tree. No `.env` file.

## NOT verified (explicit gaps — do not claim otherwise)

- **Browser render:** no headless-browser render was run in this session. Layout, 3D scene visuals, QR rendering, and the tab/preset/mode interactions are verified by code + serve checks only. First visual check happens on the deployed URL.
- **Live WizardConnect handshake:** pairing code runs the real `@wizardconnect/core` relay flow, but no real Paytaca/Selene wallet was paired. Needs the user's phone test.
- **Live mainnet tip:** no funded wallet, no real BCH — no mainnet transaction was sent. The unsigned-tx construction is unit-tested; the sign + broadcast round-trip is not.
- **Live testnet tip:** no faucet funds in the sandbox — the demo send path is code-complete but unexecuted end-to-end.
- **Verify-by-txid:** no real txid exists to look up yet.
- **CoinGecko rate in-browser:** the endpoint returned live data from Node (`{"bitcoin-cash":{"inr":25742,"usd":272.51}}` on 2026-11-05); the in-browser fetch path is code-complete but unexecuted.

## Known issues

1. Bundle is ~1.4 MB total (mainnet-js + Three.js + WizardConnect). Acceptable for a demo; lazy scene chunk already splits the 3D weight off first paint. No further optimisation attempted in prep.
2. `dist/` is gitignored and rebuilt from source; the release manifest must record the deployed commit SHA, not the local build.
