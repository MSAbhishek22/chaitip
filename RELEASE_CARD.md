# Release Card — ChaiTip (BCH BLAZE 2026)

| Deliverable | Evidence |
|---|---|
| Project identity | ChaiTip — tip your chaiwala in BCH; Mainnet track, solo; night-stall design (see `design/DESIGN_CONSTITUTION.md`) |
| Research | `RESEARCH.md` — rules/prizes/dates verified from the official DoraHacks page (read in full 2026-11-05); design research in `design/DESIGN_REFERENCES.md` |
| Live application | **NONE YET** — deploy is a user tap (see `deployment/DEPLOYMENT_RUNBOOK.md`) |
| GitHub | **NONE YET** — repo `github.com/MSAbhishek22/chaitip` to be created (user tap) |
| Deployment | NOT DEPLOYED — runbook ready, manifest template pending |
| UI quality | Design constitution + registry comparison vs CageCheck/NoteVault/ClinicLink (distinct: dark night-stall vs light paper) — PASS on paper; browser render UNVERIFIED |
| 3D experience | Three.js chai glass + coin-per-tip, drag orbit, CSS fallback, reduced-motion respected — built; visual render UNVERIFIED |
| Functional controls | `qa/INTERACTION_INVENTORY.md` — every control listed; no dead buttons; live-wallet-dependent actions are code-complete with honest failure states |
| QA | `qa/TEST_REPORT.md` — automated tests **10/10 PASS** (1.4 s), build PASS, serve smoke test PASS, secret scan PASS |
| Demo video | NOT RECORDED — forbidden until a live URL exists (rulebook §7) |
| Published video | BLOCKED (no live URL yet) |
| Submission | DRAFT ONLY (`submission/SUBMISSION_DRAFT.md`) — NOT submitted |

## Gate status

- `LIVE_DEPLOYMENT`: BLOCKED (user tap — repo + free static deploy)
- `GITHUB_COMMIT_MATCH`: BLOCKED (no repo yet)
- `ALL_VISIBLE_CONTROLS`: PASS (code) — live-wallet actions await a real wallet test
- `3D_EXPERIENCE`: PASS (code) — visual render unverified
- `UI_DISTINCTIVENESS`: PASS
- `RESPONSIVE_AND_ACCESSIBLE`: PASS (code) — browser render unverified
- `DEMO_VIDEO_RECORDED_FROM_LIVE`: BLOCKED (no live URL)
- `VIDEO_PUBLISHED_AND_URL_VERIFIED`: BLOCKED
- `HACKATHON_RULE_COMPLIANCE`: PASS (prep) — stream-attendance + Telegram + registration are user taps
- `OVERALL_RELEASE`: **IN_PROGRESS**

## Biggest risks (in order)

1. **Stream attendance (eligibility):** at least one rep must have attended ≥1 of 4 prep streams with roll call. Whether any stream is still upcoming is UNVERIFIED — check the live DoraHacks Streams section + Telegram before 13 Nov.
2. **Registration deadline:** 13 Nov (safe target 12 Nov) — user's tap.
3. **Live wallet test:** WizardConnect handshake + real mainnet tip need the user's phone (Paytaca/Selene) + a few ₹ of BCH.
4. **Deploy + video:** live HTTPS URL, then a video recorded from it — both after steps 1–3.
