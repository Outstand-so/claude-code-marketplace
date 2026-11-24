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
INTERNAL_NAMES='^(outstand-docs|outstand-integration|outstand-platforms|outstand-publish|outstand-review|outstand-reviewer|outstand-troubleshooting)$'

# API `network` values that look like slugs (hyphenated) but are not doc pages.
NETWORK_VALUES='^(tiktok-business)$'

# Known-broken upstream doc links, excluded from the check. Empty pattern = none.
# (configurations/vimeo used to 404; it resolves as of 2026-11-24, so it is checked again.)
KNOWN_BROKEN='^$'

SLUGS=$(
  grep -rhoE '`[a-zA-Z0-9/_-]+`' plugins/outstand \
    | tr -d '`' \
    | grep -vE '^(TODO|GET|POST|PUT|PATCH|DELETE)$' \
    | grep -vE "$INTERNAL_NAMES" \
    | grep -vE "$KNOWN_BROKEN" \
    | grep -vE "$NETWORK_VALUES" \
    | grep -vE '^/' \
    | grep -vE '^(skills|templates|references|commands|agents)/' \
    | grep -vE '/$' \
    | grep -vE '^X-[A-Za-z-]+$' \
    | grep -vE '^(Idempotency-Key|Retry-After|Content-Type)$' \
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
