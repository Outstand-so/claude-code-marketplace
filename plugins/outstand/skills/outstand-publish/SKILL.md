---
name: outstand-publish
description: Publish, schedule, and check social media posts on X, LinkedIn, Instagram, Facebook, Threads, TikTok, YouTube, Bluesky, Pinterest, Google Business, Vimeo and Reddit through the Outstand API or MCP server. Use when the user asks you (the agent) to post, cross-post, schedule, thread, upload media for, or get analytics on social media content, rather than to write integration code. Self-contained; works with the Outstand MCP tools or plain HTTP with an OUTSTAND_API_KEY.
---

# Outstand Publish

Lets you act as the user's social media operator: turn content into posts, publish or schedule
them to their connected accounts, and report back what actually went out. If the user wants
Outstand wired into *their codebase* instead, that's the `outstand-integration` skill.

## Pick a transport

1. **Outstand MCP server connected** (tools such as `list_social_accounts`, `create_post`): use
   the MCP tools. Setup if missing: add the remote server `https://mcp.outstand.so/mcp`
   (OAuth on first use). Docs: https://www.outstand.so/docs/mcp/setup
2. **Otherwise, HTTP with an API key.** Base URL `https://api.outstand.so`, header
   `Authorization: Bearer $OUTSTAND_API_KEY`. If no key is set, tell the user to create one at
   https://www.outstand.so/app (free signup) and export `OUTSTAND_API_KEY`. Never print the key
   or write it into a file you commit.

Both transports hit the same API, so the rules below apply to both.

## The flow

### 1. Find the target accounts (always first)

MCP: `list_social_accounts`. HTTP: `GET /v1/social-accounts`.

Posts target accounts by their Outstand account `id` (preferred) or exact username. Network
names (`x`, `linkedin`) and nicknames are **not** identifiers. Pass IDs back exactly as
received; they're opaque strings, never construct them.

If the user says "post to LinkedIn" and two LinkedIn accounts are connected (say a personal
profile and a company page), ask which one. If the network they want isn't connected, say so and
offer the connect link (MCP: `get_auth_url`) instead of silently dropping it. X is the usual
case: it needs the user's own X app registered in Outstand first (BYOK), see
https://www.outstand.so/docs/configurations/x. Also note: an unresolvable
account in the `accounts` array is dropped without an error as long as another entry resolves.

### 2. Shape the content per network

- One shared `content` string works for simple cross-posts.
- For different text per network, set `content` inside that network's block, e.g.
  `"linkedin": { "content": "longer version" }, "x": { "content": "short version" }`.
  The top-level `content` is the fallback for the rest. Prefer this over separate posts.
- Threads and carousels use a `containers` array of `{ content, media }`: each container is one
  tweet in an X thread or one carousel item.
- Hard limits worth checking before you send: Threads rejects any container over 500
  characters (for every account in the request), Instagram carousels take 2 to 20 items, Reddit
  needs `reddit.subreddit` and a title, YouTube and Vimeo need a video, Pinterest needs a board
  (`list_pinterest_boards`).
- Anything else platform-specific: look it up, don't guess. MCP `search_docs`, or read
  https://www.outstand.so/docs/create-a-post.mdx and the network's
  `https://www.outstand.so/docs/configurations/<network>.mdx` page.

Show the user the final text per network before publishing, unless they've told you to just
post it.

### 3. Media (only if attaching files)

Three steps, all required:

1. MCP `request_media_upload_url` / HTTP `POST /v1/media/upload` with the `filename`
   (include the extension). Returns an `upload_url` and a media `id`.
2. `PUT` the bytes to `upload_url` with the right `Content-Type`.
3. MCP `confirm_media_upload` / HTTP `POST /v1/media/{id}/confirm`. Returns the public `url`.

Attach media to a container as `{ "url": "<confirmed url>", "filename": "<name>" }`. Media is
referenced by URL, not by id. A file that wasn't confirmed can't be used.

### 4. Publish or schedule

MCP `create_post` / HTTP `POST /v1/posts` with `accounts`, the content, and optionally
`scheduledAt` (ISO 8601, UTC, e.g. `2026-12-01T08:00:00Z`). Omit `scheduledAt` to publish now.
Convert the user's local time to UTC yourself and state both in your reply.

Over HTTP, send an `Idempotency-Key` header (a UUID) so a retry after a timeout can't create a
duplicate post.

Check the response `warnings` array: unknown keys are stripped and reported there, which usually
means a misspelled network block.

### 5. Report what actually happened

A successful create means **accepted, not published**. Publishing is async and happens per
account, so one post can succeed on X and fail on Instagram.

- Immediate posts: check `get_post` (HTTP `GET /v1/posts/{id}`) after a short wait and report
  status per account, with the live post URL when available.
- Scheduled posts: confirm the scheduled time and the target accounts; don't claim it published.
- If an account failed, quote its error. Don't retry by creating the same post again for every
  account; retry only the failed account, as a new post targeting just that account.

## Other things you can do

- **Analytics:** `get_post_analytics` for a post, `get_account_metrics` for an account,
  `get_audience_demographics` for Instagram/Facebook audiences.
- **Replies and comments:** `get_replies`, `create_reply`. A first comment can be attached at
  creation time (see https://www.outstand.so/docs/create-a-first-comment.mdx).
- **Edit or remove:** `update_post` (only before it publishes), `delete_post` (cancel a
  scheduled or draft post), `delete_remote_post` (take a published post down from the
  networks), `repost_post`.
- **LinkedIn mentions:** find the native URN with `linkedin_search_followers` or
  `linkedin_lookup_organization`, then pass `{ urn, text }` in `linkedin.mentions` with the same
  text in the post body.
- **Usage:** `get_account_usage` (HTTP `GET /v1/account/usage`) before large batches.

## Errors that change what you do

- `402`: billing or plan problem. Don't retry; tell the user.
- `429`: rate limited. Wait for `Retry-After`, then retry once.
- `400` with no resolvable accounts: re-run step 1, you used a wrong identifier.
- `account.token_expired` / auth errors on one account: that account needs reconnecting; offer
  `get_auth_url`.

## Safety

Publishing is public and often irreversible. Confirm the account and the text before the first
post in a session, never post to an account the user didn't name or clearly imply, and never
delete or edit published posts unless asked for that specific post.
