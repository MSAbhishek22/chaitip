# Interaction Inventory — ChaiTip (Rulebook §4.1)

**App:** `app/index.html` + `app/dist/bundle.js` (built 2026-11-05). Every visible control is listed; nothing is decorative.

| Page / component | Action | Expected behaviour | Implementation / destination | Validation & errors | Test evidence | Status |
|---|---|---|---|---|---|---|
| BLAZE banner — presentation link | Click | Opens Widget Factory template (Google Slides) in a new tab | Real URL from the DoraHacks page | — | Link target verified in source; opens externally | PASS |
| BLAZE banner — repo / EMBER2026 | Read | Labelled pending text, NOT a link (repo/address do not exist yet) | Plain text with `.pending` style | — | No dead link present by design | PASS |
| Tabs — Tip a stall / Open your stall | Click | Switches views, updates aria-pressed | `switchTab()` | — | Serve check only (HTTP 200 + IDs present); browser render UNVERIFIED in sandbox | PASS (code) |
| Preset ₹5 / ₹10 / ₹20 | Click | Selects amount, updates amount line (₹ + BCH + sats) | `selectedInr`, `updateAmountLine()` | — | Unit test: conversion math | PASS |
| Preset Custom | Click | Reveals numeric input, focuses it | `custom-wrap` unhide | Invalid input shows inline error, tip amount unchanged | Unit test: `validateCustomAmount` | PASS |
| Custom amount input | Type | Validates 1–10,000; updates amount line when valid | `validateCustomAmount` | Out-of-range / non-number → inline error | Unit test | PASS |
| Mode Live / Demo | Click | Toggles mainnet vs testnet mode; hides Connect in demo | `setMode()` | — | Serve check only; browser render UNVERIFIED in sandbox | PASS (code) |
| Connect wallet (WizardConnect) | Click | Starts real WizardConnect relay, shows QR + 4-step stepper | `startPairing()` (`@wizardconnect/core`) | Pairing timeout / wallet refusal → failed step + message + fallbacks offered | Unit test: pairing URI generation; live-wallet handshake UNVERIFIED (needs phone test) | PASS (code) / BLOCKED (live wallet) |
| Pairing — Cancel | Click | Tears down relay, resets button | `pairing.cleanup()` | — | Code review | PASS |
| Tip button (live) | Click (disabled until wallet connected + stall has address) | Builds unsigned WC tx, asks wallet to sign, broadcasts via wallet, prints receipt ticket + coin drop | `tipLive()` → `buildWcTransaction` → `requestSignature` | Insufficient balance, sign refusal, timeout → error text, no receipt | Unit test: tx builds + decodes; live send UNVERIFIED (needs funded wallet) | PASS (code) / BLOCKED (live send) |
| Tip button (demo) | Click | Creates throwaway testnet wallet if needed; sends real testnet tip when funded; otherwise shows faucet step | `tipDemo()` → `createDemoWallet` / `sendDemoTip` | Empty wallet → faucet message, no fake success | Code review; live testnet send UNVERIFIED in sandbox (needs faucet funds) | PASS (code) / BLOCKED (live testnet send) |
| Pay-by-address — txid input + Verify | Click Verify | Looks up txid in stall address history, confirms or reports not-found-yet | `verifyTipByTxid()` | Empty txid → prompt; not found → "try again in a minute" (never "fraud") | Code review; live lookup UNVERIFIED (needs a real tx) | PASS (code) / BLOCKED (live) |
| 3D glass canvas | Drag | Orbits the glass | `scene.js` pointer handlers | — | Serve check only (chunk loads 200); visual render UNVERIFIED in sandbox | PASS (code) |
| 3D glass coin | Click | Scrolls to that tip's receipt | `onCoinClick` → scrollIntoView | No-op if receipt absent | Code review | PASS |
| Receipt — explorer link | Click | Opens Blockchair tx page in a new tab | Real URL from `explorerUrl()` | — | Unit test: URL shape | PASS |
| Receipt — txid | Read/copy | Full txid shown in monospace | `buildReceipt()` | — | Unit test | PASS |
| Create stall — form submit | Submit | Validates name + cashaddr (mainnet-js), saves to localStorage, shows link + QR | `validateStall()` + `isValidAddress` | Invalid address → error list, nothing saved | Unit test: validation incl. real random address | PASS |
| Create stall — Copy link | Click | Copies stall link to clipboard | `navigator.clipboard.writeText`, button becomes "Copied!" | Clipboard unavailable → no crash (optional chaining) | Code review | PASS |
| Create stall — View my stall | Click | Loads the new stall page | `showStall()` + tab switch | — | Serve check only; browser render UNVERIFIED in sandbox | PASS (code) |
| Demo stall buttons | Click | Loads demo stall in demo mode | `showStall(demo)` + `setMode('demo')` | — | Serve check only; browser render UNVERIFIED in sandbox | PASS (code) |
| Demo note — "Create a real stall instead" | Click | Switches to create tab | `switchTab('create')` | — | Code review | PASS |
| How-it-works / comparison table | Read | Static content | HTML | — | Serve check only (IDs present in served HTML) | PASS (code) |

**No dead buttons:** every control above either performs its stated action or, where the action depends on a live wallet/network step that cannot be completed in the sandbox, performs the real preparatory step and reports the blocker honestly instead of faking success. No `href="#"`, no empty handlers, no fake success toasts.
