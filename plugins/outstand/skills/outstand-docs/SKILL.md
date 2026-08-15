---
name: outstand-docs
description: Use whenever you need an authoritative fact about the Outstand API — an endpoint's request/response schema, a field name, an enum value, a status/error code, a platform-specific quirk, or an MCP tool's parameters. Every other Outstand skill depends on this one. Do not answer these questions from memory or training data; Outstand's API evolves and a wrong field name breaks the user's code.
---

# Outstand Docs Lookup

Outstand's docs publish each page as verbatim source at a predictable URL, and a single index
lists every page. Use that pair instead of guessing or dumping the entire doc set into context.

## The contract

1. **Fetch the index.**
   ```
   curl -s https://www.outstand.so/docs/llms.txt
   ```
   ~6KB. Lists every doc page with a one-line description and its slug. This is the router —
   use it to find the 1–3 pages that actually answer the question. Fetch this once per session
   and reuse it; re-fetch only if you suspect it's gone stale mid-session (rare).

2. **Fetch the exact page(s) as verbatim markdown**, appending `.mdx` to the doc URL:
   ```
   curl -s https://www.outstand.so/docs/<slug>.mdx
   ```
   Example: `https://www.outstand.so/docs/create-a-post.mdx`. This returns the real page
   source — exact JSON schemas, field names, required/optional markers, example payloads —
   not a summary. Fetch **at most 3 pages** per question. If 3 pages don't answer it, say what's
   missing rather than fetching more speculatively.

3. **Never fetch `llms-full.txt`.** It's the entire doc set concatenated (~680KB) and exists for
   bulk/offline consumption, not per-question lookups — it will blow your context budget for a
   single-field question.

4. **`WebFetch` is for existence checks only** — "is there a page about X" — never for the
   answer itself. WebFetch summarizes through a smaller model, which is exactly how a field gets
   silently renamed or an enum value dropped. Field names, status codes, and schemas must come
   from text you fetched with `curl`/`WebFetch`-raw and read yourself in the `.mdx`.

5. **Don't restate a fact you haven't fetched this session.** If asked something and no fetched
   page covers it, fetch the relevant page(s) first — don't answer from training data and don't
   answer from a slug someone mentioned without confirming it against the current index.

6. **Don't refetch a page already read this session.** Once you've pulled a page's `.mdx`, reuse
   its content for follow-up questions instead of re-curling it.

## Slugs are hints, not truth

Other Outstand skills mention doc slugs (e.g. "see `webhooks`" or "see `configurations/x`") as a
starting guess for step 2. Always let the index (step 1) confirm the slug is still current before
relying on it — docs get renamed.

## Known-good slugs (spot-checked, may drift — reconfirm via the index)

`getting-started`, `authentication`, `architecture`, `webhooks`, `post-lifecycle`,
`create-a-post`, `update-a-post`, `list-posts`, `get-post-details`, `delete-cancel-a-post`,
`connect-a-new-social-network`, `list-connected-social-networks`,
`get-social-network-authentication-url`, `list-connected-social-accounts`,
`connect-a-bluesky-account`, `get-upload-url`, `confirm-upload`, `list-media-files`,
`configurations/x`, `configurations/linkedin`, `configurations/instagram`,
`configurations/facebook`, `configurations/Threads` (note the capital T — inconsistent with
every other platform slug, confirmed by direct fetch), `configurations/tiktok`,
`configurations/youtube`, `configurations/pinterest`, `configurations/bluesky`,
`configurations/google-business`, `mcp`, `mcp/setup`, `mcp/tools`, `sdk/ui`,
`backend-integration`, `comparisons`.

**Known doc-site gap:** the index (`llms.txt`) links a Vimeo config page at
`configurations/vimeo`, but as of this writing that page 404s (both lowercase and capitalized,
with or without `.mdx`) — it appears to not exist despite Vimeo being a supported platform. If a
user needs Vimeo setup details and this is still broken, say so plainly rather than inventing
content, and point them to `getting-started`/`authentication` for the generic OAuth flow plus
`support@outstand.so` for Vimeo-specific app setup.

## When answering integration questions

Prefer citing the doc page you fetched (e.g. "per `create-a-post`, the `containers` array...")
so the user can verify and so downstream skills know the claim is grounded, not recalled.
