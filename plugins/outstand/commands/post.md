---
description: Publish or schedule a social media post to your connected Outstand accounts (X, LinkedIn, Instagram, TikTok and more) straight from Claude Code
---

# Outstand: Post

Use the `outstand-publish` skill to run this. List the connected accounts first, confirm the
target accounts and the final text per network with the user, then publish or schedule and
report the real per-account result (accepted is not published).

If `$ARGUMENTS` is non-empty, treat it as the content and/or targeting to start from (e.g.
`/outstand:post "We just shipped dark mode" to X and LinkedIn tomorrow 9am`). Still confirm
before publishing unless the user said to post it as-is.
