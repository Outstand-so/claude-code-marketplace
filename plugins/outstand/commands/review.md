---
description: Audit this codebase's existing Outstand integration for correctness bugs (partial-success handling, retries, idempotency, exposed keys, and more)
---

# Outstand: Review

Dispatch the `outstand-reviewer` agent to audit the codebase's Outstand integration against
`skills/outstand-review/references/checklist.md`. The agent has no write access — it returns a
severity-ranked findings list, most severe first (partial-success mishandling and exposed API
keys typically rank highest).

After the agent reports back, present the findings to the user and offer to apply fixes for
whichever ones they select — do not apply any fix without the user picking it first.

If `$ARGUMENTS` names a specific file, directory, or concern (e.g.
`/outstand:review src/webhooks/outstand.ts`), pass that scope to the agent instead of a full-repo
sweep.
