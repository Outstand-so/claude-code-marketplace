---
name: outstand-review
description: Use when the user wants their existing Outstand integration audited or reviewed for correctness — not writing new code, evaluating code that already calls the Outstand API. Covers the specific mistakes the API's async, partial-success, fan-out shape invites. Typically dispatched via the outstand-reviewer agent so the read-heavy audit doesn't fill the main conversation's context.
---

# Outstand Integration Review

Audits existing code against `references/checklist.md` — a set of mistakes that are specific to
Outstand's architecture (async publish, per-account partial success, non-retryable 402, dynamic
rate limits, 3-step media upload, ~60-day media retention).

## Process

1. **Find the integration surface.** Grep for `api.outstand.so`, `OUTSTAND_API_KEY` (or similar
   env var names), `@outstand-so/ui`, and Outstand endpoint paths (`/v1/posts`, `/v1/social-`,
   `/v1/media`) to locate every file that touches the API — client wrapper, webhook route, DB
   models/migrations, any frontend connect UI.

2. **Walk the checklist** in `references/checklist.md` against what you found. For each item,
   either confirm it's handled correctly (skip it — don't report non-findings) or record a
   finding: file, line, what's wrong, why it matters (the concrete failure scenario), and the
   doc page it violates. Confirm any doc-dependent claim via `outstand-docs` before citing it.

3. **Rank findings by severity** (High/Medium/Low per the checklist's guidance) and report them
   — don't bury the top finding (partial-success mishandling) under minor ones.

4. **Do not apply fixes automatically.** Present the findings, then apply fixes only for what
   the user selects. A review that silently rewrites the codebase isn't a review.

## Dispatching as an agent

For a full-codebase review, invoke the `outstand-reviewer` agent (via `/outstand:review`) rather
than doing the grep-everything pass inline — it keeps the read-heavy exploration out of the main
conversation's context and returns just the findings.
