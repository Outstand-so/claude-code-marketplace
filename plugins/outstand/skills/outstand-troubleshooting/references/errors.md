# Symptom → cause → doc reference

This is a routing table, not the authoritative content. Confirm exact current wording, fields,
and codes via `outstand-docs` before telling the user something is true.

| Symptom | Likely cause | Confirm against |
|---|---|---|
| Every request returns `401` | Missing/invalid `Authorization: Bearer <api_key>` header | `authentication` |
| Every request returns `402` with `subscription_inactive` | Org's subscription isn't `active` (includes `trialing`, `past_due`, `canceled`, etc.) | `authentication` |
| Retrying a `402` keeps failing | `402` is **not retryable** — it only clears when the subscription is reactivated in billing, not by resubmitting | `authentication` |
| `429` with `"API key rate limit exceeded"` | Rolling-window rate limit hit — retryable, honor `Retry-After` if present, else back off exponentially | `authentication` |
| `429` with `"API key request quota exhausted"` | Fixed quota key ran out — **not retryable by waiting**, needs the quota raised (contact Outstand support) | `authentication` |
| Rate limiting behaves inconsistently across keys | Limits are dynamic per-org, not a fixed published number — pace off `X-RateLimit-Remaining`/`X-RateLimit-Reset` response headers, don't hardcode a limit | `authentication` |
| `POST /v1/posts` returns 200 but nothing appears on the platform yet | Expected — publish is async. A 200 means "accepted and queued," not "live." Poll `GET /v1/posts/{id}` or use webhooks | `architecture`, `post-lifecycle` |
| Post shows `published` but one platform never got it | **Partial success** — `post.published` fires when at least one account succeeds; inspect *per-account* `status`/`error`, don't treat the post as one boolean | `architecture`, `post-lifecycle` |
| Every account on a post failed | **Full failure** — post-level `publishedAt` stays null and `post.error` fires instead of `post.published` | `architecture` |
| Republishing after a failure creates a duplicate on platforms that already succeeded | Terminal platform failures aren't auto-retried into a new post — key retry logic off per-account status, or delete the failed post and create a new one rather than blind-resubmitting | `architecture`, `post-lifecycle` |
| Scheduled post fires a bit early/late | Scheduling accuracy is ~±30s, governed by queue dispatch timing — not a bug | `architecture` |
| Webhook data seems to lag or duplicate | Check for at-least-once delivery / retry semantics on the specific event, and confirm handler idempotency | `webhooks` |
| Media URL 404s weeks after upload | Uploaded media is retained ~60 days, not permanent — re-upload or persist media elsewhere if long-term access is needed | `getting-started`, `get-upload-url`/`confirm-upload` |
| Media upload "succeeds" but post fails referencing it | 3-step flow (`request upload URL` → `PUT` bytes → `confirm`) — the confirm step is often skipped, leaving the file inactive | `get-upload-url`, `confirm-upload` |
| `account.token_expired` / platform auth suddenly fails | OAuth token expired or was revoked on the platform side — needs reconnect via the auth-url flow | `webhooks`, relevant `configurations/<network>` page |
| TikTok posts fail unexpectedly for some accounts | Direct Post active-creator cap or ~24h token lifetime edge case | `configurations/tiktok` + check index for a TikTok known-issues page |
| Facebook analytics/insights fields disappear or change shape | Check for the Facebook Insights deprecation notice in the doc index | search index for "Facebook" + "Insights" |
| Reply/comment payload shape changed unexpectedly | Check for a replies-endpoint response-shape migration notice | search index for "replies" + "migration" |
| X publish suddenly fails with auth errors across many accounts | Check for an X token-refresh known-issue notice | search index for "X" + "token" |

## Diagnostic order

1. Reproduce the exact error the user reports — read their actual response body/status, don't
   guess from a description alone.
2. Look it up in this table for a candidate cause.
3. Confirm the exact current behavior via `outstand-docs` (fetch the relevant page).
4. If MCP is connected, verify against live state (`get_post`, `list_posts`, `get_social_account`,
   `get_account_usage`) rather than reasoning about it abstractly — read-only tools only, see the
   safety rule in `outstand-troubleshooting/SKILL.md`.
5. Propose the fix, citing the doc page.

## Read-only-during-diagnosis safety rule

While diagnosing, only call read-only MCP tools: `list_posts`, `get_post`, `get_post_analytics`,
`get_replies`, `list_social_accounts`, `get_social_account`, `get_account_metrics`,
`get_account_usage`, `list_social_networks`, `get_social_network`, `list_media`, `get_media`,
`list_pinterest_boards`.

Never call a mutating tool (`create_post`, `update_post`, `repost_post`, `create_reply`,
`delete_post`, `delete_remote_post`, `delete_social_account`, `delete_media`,
`delete_social_network`, `update_social_network`, `create_social_network`, `connect_bluesky`,
`upload_media`, `confirm_media_upload`) during diagnosis unless the user explicitly asked for that
specific action — these act on real, live social accounts and posts. Confirm the target account
by name before any delete.
