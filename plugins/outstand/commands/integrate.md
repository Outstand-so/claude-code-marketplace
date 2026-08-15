---
description: Scaffold an Outstand API integration into this codebase — connect accounts, publish/schedule posts, media, webhooks
---

# Outstand: Integrate

Use the `outstand-integration` skill to run this. Follow its process exactly: detect what's
already answerable from the repo and any connected MCP session, interview only for the gaps
(two rounds max), confirm a short plan before writing any files, then generate code adapted to
the detected stack — TS/Node has ready templates (`skills/outstand-integration/templates/ts-node`),
other stacks are generated fresh against the same contract.

If `$ARGUMENTS` is non-empty, treat it as a starting description of what's needed (e.g.
`/outstand:integrate schedule posts to X and LinkedIn with images`) and use it to skip whatever
questions it already answers — still confirm the plan before generating code.

Ground every field name, endpoint, and schema detail you generate in a live fetch via
`outstand-docs` rather than memory.
