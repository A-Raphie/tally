# Cross-reference record: Tally vs ui-craft / improve-ui / baseline-ui / winsznx-ui

Date: 2026-09-09 · Surface: Tally (landing `/` + desk `/desk`) · Commit at audit: c897444

## Design language
- Audited surface: Tally landing + desk (Next.js App Router, two routes, shared VerdictCard)
- Design sources: DESIGN_LEDGER tally entry (genome v2, terminal instrument), `src/app/globals.css` token block, winsznx-ui Part 3/5/6, ui-craft pre-ship battery, baseline-ui constraints
- Documented decisions: no brand accent; semantic verdict inks (win/loss/void) as only chroma; status strip reflects real API health; provenance details panel per verdict card; paper/stamp genome v1 killed by ledger check (assay owns stamp-strike, scrip owns security-paper, reeve killed document+stamp+paper)
- Governing owners and consumers: `globals.css` tokens consumed by both routes and `_components/verdict-card.tsx`; landing and desk are the only surfaces
- Explicit exceptions: tracking-* wide uppercase micro-labels (genome prescribes them; winsznx governs over baseline-ui generic default); no `cn` utility (class logic is static template strings; clsx+tailwind-merge dependency declined); native `details/summary` for disclosure instead of Radix/Base UI (no custom keyboard behavior needed)

## Findings
| # | Problem | Evidence | Proposed change | Scope | Confidence |
|---|---|---|---|---|---|
| 1 | No 404/error/loading surfaces; bad URLs and render errors show Next unstyled defaults | ui-craft pre-ship battery requires real `app/not-found.tsx` + `app/error.tsx` + `loading.tsx`; none existed in `src/app/` | Add three styled files using existing tokens | `src/app/` | High |
| 2 | Landing anatomy missing FAQ + thesis band | winsznx-ui Part 3 order: hero → … → FAQ → final CTA with thesis moment as own large-type band; `src/app/page.tsx` had neither | Thesis band after problem stats; three-question FAQ (`04 /`) before final CTA, verified facts only | `src/app/page.tsx` | High |

Accepted with reason (not findings): baseline-ui `cn` MUST declined (no dynamic class logic worth a dependency); baseline-ui letter-spacing ban overridden by genome; animation budget already transform/opacity ≤200ms ease-out with reduced-motion honored.

## Disposition
Both findings implemented same day (see commit following this file). Re-gate: typecheck clean, `/` 200, 404 route returns styled surface, landing measured at 375px via computed styles.
