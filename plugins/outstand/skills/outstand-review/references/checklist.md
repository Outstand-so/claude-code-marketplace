# Outstand integration review checklist

Ordered roughly by how often each mistake actually happens and how bad its consequences are.
Confirm any doc-dependent claim (exact field names, status codes) via `outstand-docs` before
citing it in a finding.

1. **Post outcome treated as a boolean.** Look for code that checks something like
   `if (response.success)` or `if (post.status === 'published')` and stops there, without
   inspecting per-account status. This is the single most common bug — a post can be
   `published` at the top level while one platform's account failed. Grep for `.published` /
   `post.status` handling around webhook receivers and post-creation call sites.

2. **No webhook handler, or polling used where webhooks would do.** Async publish means the
   client needs `post.published`/`post.error` (via webhooks) or polling `GET /v1/posts/{id}` to
   learn the real outcome. Polling works but is worse — flag if there's no webhook endpoint at
   all and the code polls tightly or not at all.

3. **Retry logic that re-creates posts instead of keying off per-account status.** After a
   partial failure, resubmitting the same content can double-post to platforms that already
   succeeded. Check that retry/republish paths check per-account `published` state first.

4. **`402` treated as retryable.** `subscription_inactive` will never clear by resubmitting;
   look for generic retry-on-any-error-code logic that doesn't special-case 402.

5. **`429` handled without `Retry-After` / hardcoded rate limits.** Look for a fixed
   requests-per-second constant instead of reading `X-RateLimit-Remaining`/`X-RateLimit-Reset`
   from responses.

6. **API key exposed client-side.** Grep for the API key or `@outstand-so/ui`'s `apiKey` prop
   in frontend/browser code. `OutstandProvider apiKey=` in a public React bundle ships the key
   to every visitor — fine for a single-tenant internal tool, a real problem for anything
   multi-tenant or public. Recommend proxying through a backend route instead.

7. **Outstand IDs not persisted, or persisted without indexes.** `socialNetworkId`,
   `socialAccountId`, `postId`, and per-account `platformPostId` are the stable identifiers for
   all follow-up calls (analytics, comment management, dedup). Check they're stored, and that
   columns storing them are indexed — webhook processing does lookups by these IDs.

8. **Media URLs assumed permanent.** Uploaded media has a ~60-day retention window. Flag code
   that stores only the Outstand media URL for long-term reference without a plan to re-upload
   or mirror it elsewhere.

9. **No idempotency on post-creation paths.** A retried request (client timeout, double-click,
   queue redelivery) without an idempotency key/check can create duplicate posts.

10. **`scheduledAt` handling.** Timezone bugs (naive local time sent where UTC/ISO-8601 is
    expected) and code that assumes exact-second scheduling accuracy rather than ~±30s.

11. **Platform-specific gaps** — worth a lighter pass, hand off specifics to `outstand-platforms`:
    Bluesky routed through OAuth instead of app-password, Pinterest pins created without a board,
    TikTok/YouTube posts missing required media.

## Severity guidance

- **High**: partial-success mishandling, exposed API key, retry-creates-duplicates, `402`
  retried as if transient.
- **Medium**: no webhooks/polling-only, missing idempotency, unindexed ID columns.
- **Low**: media retention assumption, scheduling accuracy assumption, minor platform gaps.

Report findings ranked by severity, cite the file/line and the doc page that supports the
finding, and don't apply fixes until the user has seen the list and picked what to act on.
