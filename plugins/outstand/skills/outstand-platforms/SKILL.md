---
name: outstand-platforms
description: Use when the user names a specific social platform (X/Twitter, LinkedIn, Instagram, Facebook, Threads, TikTok, YouTube, Bluesky, Pinterest, Google Business, Vimeo, Reddit) and needs to know its connection method, config requirements, or platform-specific quirks (e.g. character limits, media requirements, Instagram container polling, TikTok's creator cap, Bluesky's app-password auth, Pinterest boards, Reddit's required subreddit/title, TikTok Business). Pairs with outstand-docs for the actual fetch.
---

# Outstand Platform Quirks

Outstand supports 12 platforms behind one API, but each has its own connection method and
publishing quirks. This skill tells you where to look, not the answers themselves — fetch the
live page via `outstand-docs` before stating any platform-specific detail (character limits,
required fields, media constraints) since these change and are exactly the kind of fact that
must never come from memory.

## Canonical `network` values

Use these exact strings wherever the API expects a `network` (confirm against a fetched page if
precision matters, e.g. generating code):

| Platform | `network` | Connect via |
|---|---|---|
| X (Twitter) | `x` | OAuth, **BYOK only**: no managed X app, the user must register their own X app first |
| LinkedIn | `linkedin` | OAuth |
| Instagram | `instagram` | OAuth |
| Facebook | `facebook` | OAuth |
| Threads | `threads` | OAuth |
| TikTok | `tiktok` | OAuth |
| TikTok Business | `tiktok-business` | OAuth, Managed Keys only (counts as TikTok, not a separate platform; posts use the `tiktok` block) |
| YouTube | `youtube` | OAuth |
| Pinterest | `pinterest` | OAuth |
| Google Business Profile | `google_business` | OAuth, BYOK only (own Google Cloud credentials) |
| Vimeo | `vimeo` | OAuth |
| Reddit | `reddit` | OAuth, BYOK only (register your own Reddit app via `POST /v1/social-networks`) |
| Bluesky | `bluesky` | App password (no OAuth) |

All platforms except Bluesky connect through the same OAuth redirect
(`https://www.outstand.so/app/api/socials/{network}/{orgId}?redirect_uri=...`). Bluesky connects
via `POST /v1/social-accounts/bluesky` with a handle + app password — never route it through the
OAuth flow.

## Per-platform doc pages

Each platform has a `configurations/<network>` page covering OAuth app setup (or Managed Keys),
plus scattered known-issue pages. Fetch the current page via `outstand-docs` before answering —
this list is a routing aid, not the content:

- `configurations/x`, `configurations/linkedin`, `configurations/instagram`,
  `configurations/facebook`, `configurations/Threads` (capital T — the one inconsistent slug),
  `configurations/tiktok`, `configurations/youtube`, `configurations/pinterest`,
  `configurations/bluesky`, `configurations/google-business`, `configurations/vimeo`,
  `configurations/reddit`, `configurations/tiktok-business`
- Known issues / migrations (check the index — these are time-bound and may resolve or change):
  `known-issues/tiktok-active-user-cap`, `known-issues/facebook-insights-deprecation`,
  `known-issues/replies-response-shape-migration`, `known-issues/x-token-refresh`.
- Platform-specific endpoints live under `platform-apis/<network>/...` (Pinterest boards,
  LinkedIn mention lookup, Threads reply moderation, TikTok creator info and managed capacity,
  Instagram comment hiding). Check the index for the current list.

## Managed Keys vs BYOK

Outstand includes **Managed Keys** by default — it handles OAuth app registration for most
platforms so the user doesn't need their own developer app. Exceptions that are BYOK-only (the
table above marks them): X, Google Business Profile and Reddit; check each config page for the
current list. Say this up front when a user wants X, it's the most common surprise. **BYOK** (bring your own key, via
`POST /v1/social-networks`) is for agencies wanting full white-labelling. Don't assume the user
needs BYOK just because they're asking about a platform's OAuth app — ask, or check
`list_social_networks` via MCP if connected, before recommending they register their own app.

## Platform-specific behaviors worth flagging proactively

Confirm exact current details via `outstand-docs` before generating code, but these shapes are
architecturally stable enough to mention while scoping:

- **Bluesky**: app-password auth, not OAuth — different connect code path entirely.
- **Instagram / X**: async media containers — the adaptor polls for readiness; don't assume
  media attaches synchronously in application code, Outstand handles this server-side.
- **TikTok**: token lifetime is short (~24h, refreshed inline by Outstand) and Direct Post has a
  creator-cap constraint under some setups — check the known-issues page if the user hits
  unexplained TikTok publish failures.
- **Pinterest**: pins require a board — fetch/list boards before letting a user pick one in a UI.
- **Reddit**: BYOK only, and every post needs `reddit.subreddit` (no `r/` prefix; `u_<username>`
  for a profile) and a title. Text and link posts.
- **TikTok Business**: connect with network `tiktok-business`, but configure posts in the
  `tiktok` block. It has stricter rules than personal TikTok (required brand/AIGC toggles,
  public-only, no drafts). Fetch `create-a-post` before generating code for it.
- **Threads**: 500-character limit per container; a cross-post that exceeds it is rejected for
  every account unless `threads.content` overrides the text.
- **Per-network text overrides**: every network block accepts `content`, so one post can carry a
  long LinkedIn version and a short X version. Prefer this over separate posts per network.
- **YouTube / Vimeo**: video-upload platforms — treat media as required, not optional, when
  scaffolding a post for these networks.

## Multi-platform posts

A single `POST /v1/posts` can target several networks at once via the `accounts` array. Each
account is a `network + account identifier` pair, and each is published independently — see the
partial-success behavior covered in `outstand-troubleshooting`. Don't design per-platform
duplicate endpoints in generated code; one call, multiple accounts, is the intended shape.
