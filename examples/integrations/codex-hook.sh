#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
STATUS_FILE="${1:-$PROJECT_DIR/data/codex-status.json}"

node "$PROJECT_DIR/scripts/write-source-status.js" \
  --source codex \
  --file "$STATUS_FILE" \
  --state permission_required \
  --command "npm run dev" \
  --approve-cmd "echo approve" \
  --deny-cmd "echo deny"
