# Deployment Runbook — ChaiTip

**Status:** NOT DEPLOYED — re-verified 2026-11-12. This runbook is the plan for the deploy step (BUILD_PLAN.md step 5). No account has been created and no deploy has been attempted. A static deploy IS genuinely possible without credentials in the code (no backend, no env vars, no secrets — see below); it still needs a hosting account / browser tap by the parent/user. Do NOT deploy with invented credentials.

## Static-deploy readiness (verified 2026-11-12)

- Build is reproducible: `cd app && npm ci && npm run build` → `dist/main.js` (450.6 KiB) + `scene-*.js` (544.6 KiB, lazy) + 3 chunks, total ~1.4 MB. Exit 0.
- Tests gate the deploy: `npm test` → 10/10 PASS must hold on the exact commit being deployed.
- Publish directory is `app/` itself (contains `index.html`, `style.css`, and `dist/` after build). No server, no database, no env vars.
- Providers (free, no card): Netlify Drop / Netlify Git, Cloudflare Pages, Vercel static, GitHub Pages — any works. STOP if a card/payment is asked.
- `deployment/RELEASE_MANIFEST.json` exists as a null-filled template; fill it ONLY from the real deploy receipt.

## Target

- **App:** static site — `app/index.html`, `app/style.css`, `app/dist/*` (built by `npm run build`).
- **Provider (first choice):** Netlify free static hosting (drag-and-drop or Git-connected). **Alternative:** Cloudflare Pages free. Both are free tiers with no card for static sites.
- **Stop rule:** if any step asks for a card or payment, STOP and report — do not proceed.

## Steps (user tap / agent with saved session)

1. **Create the GitHub repo** `MSAbhishek22/chaitip` (public). Push this folder's contents (except `node_modules/`, `dist/` — `dist/` is rebuilt; `.gitignore` already covers both). Record the commit SHA.
2. **Build:** in `app/`, run `npm ci` then `npm run build`. Verify `dist/main.js` exists (esbuild code-split output: `main.js` + `scene-*.js` + chunks, NOT a single `bundle.js`) and `npm test` passes (10/10).
3. **Deploy:** connect the repo to Netlify (or drag the `app/` folder into Netlify Drop). Build command: `npm run build`; publish directory: `app/` (or `app/dist` + copy `index.html`/`style.css` — simplest is publish `app/` with build output inside it).
4. **Verify from a fresh browser session** (not the dev machine's localhost):
   - Page loads over HTTPS with no console errors.
   - Stall page renders, presets update the amount line, rate line shows live or labelled fallback.
   - Create-a-stall works with a real cashaddr; stall link + QR render.
   - Demo mode: create demo wallet, fund from faucet, send a testnet tip, receipt appears.
   - Live mode: connect Paytaca/Selene via WizardConnect QR, send a real mainnet tip of ₹5, receipt + txid verify on Blockchair.
   - Mobile viewport (360px): no horizontal overflow; 3D canvas fits.
5. **Record the release manifest** in `deployment/RELEASE_MANIFEST.json`: repo URL, production branch, exact commit SHA, production URL, provider, deploy timestamp (UTC + IST), smoke-test result + timestamp.
6. **Update the BLAZE banner** in `index.html` with the real GitHub repo link and the CashTokens/EMBER2026 address, then redeploy (banner links must be live before submission).

## Environment variables

None. The app has no secrets: CoinGecko is a keyless public endpoint; BCH provider is mainnet-js's default; WizardConnect uses the public Riften relay. `.env.example` is intentionally not needed; do not invent one.

## Rollback

Static deploy: redeploy the previous commit from the provider dashboard, or re-push the previous commit SHA. No database, no migrations, nothing to roll back beyond the static files.

## Ownership

Owner: M S Abhishek (solo). Repo: `github.com/MSAbhishek22/chaitip` (to be created). Maintainer notes live in this folder (`README.md`, `BUILD_PLAN.md`).
