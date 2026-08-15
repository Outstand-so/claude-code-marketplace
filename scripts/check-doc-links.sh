#!/usr/bin/env bash
# Verifies every Outstand doc slug referenced anywhere in the plugin still resolves.
# Run from the repo root: bash scripts/check-doc-links.sh
#
# This catches doc drift (renamed/removed pages) in CI rather than mid-session for a user.

set -uo pipefail

BASE="https://www.outstand.so/docs"
FAIL=0
COUNT=0

# Extract backticked candidate slugs from every markdown file in the plugin, de-duplicated.
# Portable form (no mapfile/readarray — macOS ships bash 3.2).
# Internal component names that happen to look like slugs (skills/agents/templates within this
# plugin, not Outstand doc pages) — excluded explicitly rather than guessed at.
INTERNAL_NAMES='^(outstand-docs|outstand-integration|outstand-platforms|outstand-review|outstand-reviewer|outstand-troubleshooting)$'

# Known-broken upstream doc link — Outstand's own index links this page but it 404s. Tracked
# here so it doesn't silently start passing (remove this line once it's fixed) or silently keep
# failing CI forever (it's excluded from the check, not asserted-fixed).
KNOWN_BROKEN='^configurations/vimeo$'

SLUGS=$(
  grep -rhoE '`[a-zA-Z0-9/_-]+`' plugins/outstand \
    | tr -d '`' \
    | grep -vE '^(TODO|GET|POST|PUT|PATCH|DELETE)$' \
    | grep -vE "$INTERNAL_NAMES" \
    | grep -vE "$KNOWN_BROKEN" \
    | grep -vE '^/' \
    | grep -vE '^(skills|templates|references|commands|agents)/' \
    | grep -vE '/$' \
    | grep -vE '^X-[A-Za-z-]+$' \
    | grep -vE '^(Idempotency-Key|Retry-After)$' \
    | sort -u
)

while IFS= read -r slug; do
  [[ -z "$slug" ]] && continue
  # Skip obvious non-slugs (field names, code identifiers) — a real doc slug is lowercase or
  # has the one known capitalized exception, hyphenated, and has no camelCase/underscored
  # API-field shape.
  if [[ "$slug" =~ ^[a-zA-Z0-9/-]+$ ]] && [[ "$slug" == *-* || "$slug" == */* ]]; then
    COUNT=$((COUNT + 1))
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$slug.mdx")
    if [[ "$code" != "200" ]]; then
      echo "FAIL  $slug  (HTTP $code)"
      FAIL=1
    fi
  fi
done <<< "$SLUGS"

echo "Checked $COUNT candidate doc slugs against $BASE"

if [[ "$FAIL" -eq 0 ]]; then
  echo "All referenced doc slugs resolve."
else
  echo "One or more doc slugs failed to resolve — update the referencing skill/command."
fi

exit "$FAIL"
