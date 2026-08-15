---
name: outstand-troubleshooting
description: Use when the user reports something broken, unexpected, or confusing about their Outstand integration — an error response, a post that "published" but didn't appear on a platform, a webhook that isn't firing, a rate limit or 402/429 they don't understand, a stuck scheduled post, or platform-specific publish failures. Diagnose before proposing a fix.
---

# Outstand Troubleshooting

Diagnose first, fix second. Most Outstand integration bugs trace back to one of a handful of
architectural properties (async publishing, partial-success fan-out, non-retryable 402, dynamic
rate limits) rather than a one-off platform glitch — check `references/errors.md` before assuming
something exotic is happening.

## Process

1. **Get the exact evidence.** Ask for (or read, if visible) the actual HTTP status, response
   body, or webhook payload — not a paraphrase. "It doesn't work" and "I got a 402 with
   `subscription_inactive`" lead to different investigations.
2. **Check `references/errors.md`** for the symptom → likely-cause mapping.
3. **Confirm against live docs** via the `outstand-docs` skill before stating anything as fact —
   status codes, field names, and retry semantics must come from a fetched page.
4. **Verify against live state if MCP is connected.** Don't reason abstractly about what a post's
   status "probably" is — call `get_post`/`list_posts`/`get_social_account`/`get_account_usage`
   and look. Read-only tools only during diagnosis — see the safety rule in
   `references/errors.md`; never call a mutating tool unless the user explicitly asked for that
   action.
5. **Propose the fix**, citing the doc page. If it's a code bug (e.g. treating a post as a single
   boolean instead of per-account status), show the corrected snippet in the user's own file/
   language rather than a generic example.

## Common root causes, in order of frequency

1. Treating `POST /v1/posts`'s 200 response as "published" instead of "accepted" (see
   `architecture`, `post-lifecycle`).
2. Treating a post's outcome as one boolean instead of per-account status (partial success).
3. Retrying a `402` (non-retryable) or missing `Retry-After` on `429` (retryable).
4. Hardcoding a rate limit instead of reading `X-RateLimit-Remaining`.
5. Skipping the `confirm` step of the 3-step media upload flow.
6. Platform-specific quirks — hand off to `outstand-platforms` if the symptom is scoped to one
   network.

## When the fix touches architecture, not just a bug

If troubleshooting reveals the user's whole integration approach is wrong (e.g. polling instead
of webhooks, no idempotency, retry-by-recreate), don't just patch the symptom — say so plainly,
and suggest `/outstand:review` for a fuller audit rather than silently doing a deep refactor
inside a debugging session the user framed as narrow.
