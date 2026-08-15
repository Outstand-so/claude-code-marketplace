# Integration interview

Goal: scope a concrete plan in as few questions as possible, then confirm it before writing any
code. Never ask what's already answerable from the repo or from a connected MCP session.

## Before asking anything

- Read `package.json` / `pyproject.toml` / `requirements.txt` / `go.mod` / `Gemfile` /
  `composer.json` to detect language, framework, and (for JS/TS) whether it's a frontend
  (React/Next/etc.) or backend project.
- Grep for `api.outstand.so`, `OUTSTAND_API_KEY`/`OUTSTAND_API_TOKEN`, `@outstand-so/ui`, and
  `/v1/posts` to detect an existing partial integration — if found, this is an "add a
  capability" job, not greenfield; scope questions to just the gap.
- If MCP is connected, call `list_social_accounts`, `list_social_networks`, and
  `get_account_usage` (read-only) to see what's already connected and whether the org is on
  Managed Keys or BYOK. Ground the interview in this instead of asking generically "which
  platforms do you use."
- Check for an existing ORM/migration setup (Prisma schema, SQLAlchemy models, migrations
  directory) so generated schema matches the repo's actual conventions instead of introducing a
  second one.

## What actually needs asking (skip anything detection already answered)

1. **Which platforms** — offer the detected/connected accounts as defaults; ask only if none are
   connected or the user wants new ones. Use `outstand-platforms` to confirm connection method
   per platform (OAuth vs Bluesky's app password).
2. **Immediate vs scheduled** (or both) — affects whether `scheduledAt` handling belongs in the
   scaffold.
3. **Media or text-only** — affects whether the 3-step upload helper belongs in the scaffold.
   If any target platform is YouTube/Vimeo, media is implicitly required — don't ask.
4. **Sync strategy: webhooks or polling** — recommend webhooks per the architecture, but ask if
   the deployment target can receive inbound webhooks at all (e.g. local-only dev, no public
   URL yet). If not, scaffold polling with a clear note to switch to webhooks before production.
5. **Frontend connect UI needed?** — only if the repo is a React app; offer `@outstand-so/ui`
   over hand-rolled OAuth-redirect UI.

Two short rounds, not five. If the answers imply more scope than fits comfortably in one
generation pass (e.g. "all 11 platforms, full UI, webhooks, migrations, tests"), say so and
propose splitting into phases rather than silently truncating the output.

## After the interview: confirm before writing

Summarize the plan in a few sentences — platforms, sync strategy, what files will be
created/modified — and get an explicit go-ahead before generating code. This mirrors the
brainstorming "bounded" design gate: a short design, then approval, then implementation.
