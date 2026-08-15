---
name: outstand-integration
description: Use when the user wants to add Outstand API integration to their codebase — connecting social accounts, publishing posts, scheduling, media upload, or webhooks — whether starting fresh or adding a capability to an existing integration. Runs a short scoped interview, confirms a plan, then generates code. Not for reviewing existing code (see outstand-review) or debugging errors (see outstand-troubleshooting).
---

# Outstand Integration

Scaffolds a working Outstand integration: API client, account connection, post creation,
optional media upload, webhook handling, and DB schema — scoped to what the user actually needs,
not every capability the API offers.

## Process

1. **Interview.** Follow `references/interview.md` — detect what's answerable from the repo and
   MCP state before asking anything; two short question rounds at most.

2. **Confirm the plan before writing code.** Summarize platforms, sync strategy (webhooks vs
   polling), and the files you'll create/modify. Get an explicit go-ahead. This is a hard gate,
   not a formality — generating unwanted files is expensive to undo.

3. **Ground every schema detail in the live docs.** Use `outstand-docs` to confirm exact field
   names, endpoints, and response shapes before generating code — don't rely on the templates'
   comments as the final word if the user's request touches something the templates don't cover
   (e.g. a platform-specific option block, first-comment scheduling, Pinterest boards).

4. **Generate code adapted to the detected stack:**
   - **TypeScript/Node**: start from `templates/ts-node/` (see its README) — a client, webhook
     handler, Prisma schema, and smoke-test script. Adapt naming and framework specifics
     (Express vs Fastify vs Next.js routes) to match the repo.
   - **Any other stack**: no pre-written templates — generate against the same contract the
     TS/Node templates encode (see "What every generated integration must get right" below),
     following the repo's existing HTTP-client, ORM, and route conventions. Confirm exact
     request/response shapes via `outstand-docs` since you don't have a template to lean on.
   - **React frontend**: if the repo is a React app, prefer `@outstand-so/ui`
     (`OutstandProvider`, `ConnectAccountButton`, etc. — see the `sdk/ui` doc page) over
     hand-rolled OAuth-redirect UI. Flag that passing a raw `apiKey` prop ships the key to the
     browser — fine for single-tenant internal tools, a real problem for multi-tenant/public
     apps, where it belongs behind a backend proxy instead.

5. **Verify.** If the user has a working dev environment and a real (or sandbox) Outstand
   account, offer to run the smoke test to publish one real post and confirm it reaches a
   terminal state — don't just claim the integration works.

## What every generated integration must get right

Regardless of stack, generated code must:

- Treat `POST /v1/posts`'s response as "accepted," not "published" (`architecture`,
  `post-lifecycle`).
- Track **per-account** status (`Post` : `PostAccount` as 1 : N), never a single boolean on the
  post.
- Not retry `402`; retry `429` honoring `Retry-After`, except the quota-exhausted variant.
- Use webhooks over polling when the deployment can receive inbound requests; document the
  upgrade path clearly if it scaffolds polling instead.
- Use the 3-step media flow (`request upload URL` → `PUT` → `confirm`) end-to-end, not a
  shortcut that skips confirm.
- Pass `Idempotency-Key` on post creation paths that might be retried by the caller's own logic.
- Persist Outstand IDs (`socialNetworkId`, `socialAccountId`, `postId`, `platformPostId`) with
  indexes.

This list mirrors `outstand-review/references/checklist.md` deliberately — scaffolding correctly
the first time is cheaper than reviewing and fixing later.
