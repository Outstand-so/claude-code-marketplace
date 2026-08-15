# Outstand plugin

Guided integration, scaffolding, debugging, and review for the
[Outstand](https://www.outstand.so) unified social media API.

## Commands

- **`/outstand:start`** — interactive triage: figures out whether you're starting fresh, adding
  a capability, debugging, or reviewing, and routes accordingly. Best entry point if you're not
  sure which of the others to use.
- **`/outstand:integrate [description]`** — scopes and scaffolds an integration: account
  connection, post creation, scheduling, media upload, webhooks, DB schema. Ready-made templates
  for TypeScript/Node; generates fresh (following your repo's conventions) for other stacks.
- **`/outstand:debug [symptom]`** — diagnoses an error, an unexpected response, or a post that
  "published" but didn't show up where expected, grounded in live docs and (if connected) your
  real account/post state via MCP.
- **`/outstand:review [scope]`** — dispatches a read-only audit agent against your existing
  integration for the mistakes Outstand's architecture invites (partial-success mishandling,
  non-retryable 402 retried, missing idempotency, exposed API keys, and more).

## MCP server

This plugin bundles `https://mcp.outstand.so/mcp`. On first use, Claude Code will prompt a
one-click OAuth connection — no API key to paste. This lets the assistant read your actual
connected accounts, posts, and usage instead of reasoning about your integration abstractly.

For headless/CI use where an OAuth browser flow isn't available, connect instead with an API key
as a `Bearer` token — see the [MCP setup docs](https://www.outstand.so/docs/mcp/setup) for the
API-key connection method.

## Design notes

- **Docs are fetched live, not vendored.** Outstand's API evolves; every skill pulls the current
  doc page rather than relying on a snapshot that ships with the plugin. See
  `skills/outstand-docs/SKILL.md`.
- **Read-only during diagnosis.** `/outstand:debug` and the review agent never call a mutating
  MCP tool (create/update/delete on posts, accounts, media, networks) without the user explicitly
  requesting that specific action.
- **Plans before code.** `/outstand:integrate` confirms a short plan before generating any file.
- **Findings before fixes.** `/outstand:review` reports a ranked list; it doesn't rewrite code
  until the user picks what to fix.
