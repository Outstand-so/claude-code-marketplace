# TypeScript/Node templates

Starting points for scaffolding an Outstand integration into a TS/Node backend. These are
**templates to adapt**, not a package to install verbatim — copy the relevant files, rename to
match repo conventions, wire the `TODO`s to the repo's actual persistence/framework, and confirm
field names against a live doc fetch (`outstand-docs`) if any endpoint has visibly changed since
this session.

| File | Purpose |
|---|---|
| `outstand-client.ts` | Thin fetch-based API client. Encodes 402-non-retryable / 429-retryable-except-quota-exhausted, reads `X-RateLimit-*` headers, supports `Idempotency-Key`. |
| `outstand-webhook.ts` | Express-style handler for `post.published` / `post.error` / `account.token_expired`, iterating per-account status. Includes signature verification. |
| `outstand-schema.prisma` | Recommended Prisma models (`SocialNetwork`, `SocialAccount`, `Post`, `PostAccount`) — merge into the repo's existing schema, don't drop in as a second schema file. |
| `smoke-test.ts` | Publishes one real post to one account and polls to a terminal state — for verifying an integration end-to-end, not a unit test. |

If the repo uses a different ORM (Drizzle, TypeORM, raw SQL) or framework (Fastify, Hono, Next.js
route handlers), keep the `PostAccount`-per-row shape and the webhook's per-account handling —
those are the parts that matter — and translate the surrounding code to match.
