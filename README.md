# Outstand Claude Code Marketplace

The official Claude Code plugin marketplace for [Outstand](https://www.outstand.so) — a unified
social media API covering 12 platforms (X, LinkedIn, Instagram, Facebook, Threads, TikTok,
YouTube, Bluesky, Pinterest, Google Business Profile, Vimeo, Reddit) behind one integration.

## Install

```
/plugin marketplace add Outstand-so/claude-code-marketplace
/plugin install outstand@outstand
```

**Other agents** (Cursor, Codex, OpenClaw, Hermes and 40+ more) can install the skills with:

```
npx skills add Outstand-so/claude-code-marketplace
```

`outstand-publish` is self-contained, so it works on its own in any agent that reads
`SKILL.md` files. Pair it with the remote MCP server at `https://mcp.outstand.so/mcp`, or set
`OUTSTAND_API_KEY` for plain HTTP.

(Replace the marketplace source with a local path — `/plugin marketplace add ./` — while
developing against a clone of this repo.)

## What's in the `outstand` plugin

Two jobs in one plugin: post to social media straight from Claude (`/outstand:post`), and integrate the Outstand API into your codebase.

| Command | Use it for |
|---|---|
| `/outstand:post` | Publish or schedule a post to your connected accounts, no code needed |
| `/outstand:start` | Not sure where to begin — routes you to the right flow |
| `/outstand:integrate` | Scaffold a new integration or add a capability to an existing one |
| `/outstand:debug` | Diagnose an error, an unexpected response, or a post that didn't publish where expected |
| `/outstand:review` | Audit an existing integration for the mistakes Outstand's async, partial-success API shape invites |

You don't have to use the slash commands — describing what you need in plain language (e.g. "help
me post to LinkedIn and X from my Express app") routes to the same skills.

The plugin also bundles the [Outstand MCP server](https://www.outstand.so/docs/mcp) —
Claude Code will offer a one-click OAuth connection the first time you use it, so the assistant
can see your real connected accounts and post/webhook state instead of guessing.

## Repository layout

```
.claude-plugin/marketplace.json   # marketplace manifest
plugins/outstand/                 # the outstand plugin
  commands/                       # /outstand:post, :start, :integrate, :debug, :review
  skills/                         # outstand-publish, outstand-docs, outstand-integration, outstand-platforms,
                                   # outstand-troubleshooting, outstand-review
  agents/                         # outstand-reviewer (read-only audit agent)
  .mcp.json                       # bundled Outstand MCP server config
scripts/check-doc-links.sh        # verifies every Outstand doc slug this plugin references
```

## Development

The plugin deliberately does not vendor a snapshot of Outstand's API docs — every skill fetches
current documentation live (`https://www.outstand.so/docs/llms.txt` as an index, then the
specific page as `.mdx`) rather than relying on training data or a copy that goes stale between
plugin releases. See `plugins/outstand/skills/outstand-docs/SKILL.md` for the fetch contract.

Run `bash scripts/check-doc-links.sh` after editing any skill/command to confirm every doc slug
it references still resolves.

## License

MIT
