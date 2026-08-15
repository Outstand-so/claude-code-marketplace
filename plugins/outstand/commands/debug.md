---
description: Diagnose and fix an Outstand API problem — errors, unexpected responses, posts that didn't publish where expected
---

# Outstand: Debug

Use the `outstand-troubleshooting` skill to run this. Get the exact evidence (real HTTP
status/body/webhook payload, not a paraphrase) before diagnosing. Check
`skills/outstand-troubleshooting/references/errors.md` for the symptom-to-cause mapping, confirm
current behavior via `outstand-docs`, and — if the Outstand MCP server is connected — verify
against live state with **read-only tools only** (`get_post`, `list_posts`, `get_social_account`,
`get_account_usage`, etc.). Never call a mutating MCP tool during diagnosis unless the user
explicitly asked for that specific action, and confirm the target account by name first.

If `$ARGUMENTS` is non-empty, treat it as the symptom description or error text to start from.

If the root cause turns out to be architectural rather than a single bug (e.g. no webhook
handling at all, retry-by-recreate), say so plainly and suggest `/outstand:review` for a fuller
audit instead of silently expanding this into a rewrite.
