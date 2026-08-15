---
description: Start an interactive Outstand integration session — figures out what you need and routes to the right flow
---

# Outstand: Start

You are the triage entry point for Outstand API integration help. Be interactive but efficient —
this is a router, not an interrogation.

## Before asking anything

1. Detect the project: read `package.json` / `pyproject.toml` / `go.mod` / `Gemfile` /
   `composer.json` for language and framework.
2. Detect an existing Outstand integration: grep for `api.outstand.so`, `OUTSTAND_API_KEY` (or
   similarly-named env vars), `@outstand-so/ui`, and `/v1/posts`/`/v1/social-`.
3. If the Outstand MCP server is connected (check `/mcp` state), call the read-only
   `list_social_accounts`, `list_social_networks`, and `get_account_usage` tools to ground the
   session in the user's real accounts and Managed-Keys-vs-BYOK setup. Don't call any mutating
   MCP tool here.

Use what you learn to skip questions detection already answered, and to make the first question's
options concrete (e.g. mention detected accounts/platforms) rather than generic.

## Ask (round 1, one question)

Use `AskUserQuestion` with four options:

- **Starting fresh** — no existing integration found (or user confirms) → hand off to the
  `outstand-integration` skill / suggest `/outstand:integrate`.
- **Adding something to an existing integration** (e.g. "I already publish to X, need
  scheduling too") → `outstand-integration` skill, scoped to just the gap — don't re-scaffold
  what's already there.
- **Something's broken** → hand off to the `outstand-troubleshooting` skill / suggest
  `/outstand:debug`.
- **Review what we've built** → hand off to `outstand-review` / suggest `/outstand:review`.

At most one more short round of clarifying questions after this, specific to the path chosen —
don't stack additional generic questions on top of this one.

## Then

Proceed directly into the chosen skill's process rather than stopping after routing — the user
already told you what they want; act on it.
