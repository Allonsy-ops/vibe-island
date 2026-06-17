#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
STATUS_FILE="${1:-$PROJECT_DIR/data/claude-code-status.json}"

node "$PROJECT_DIR/scripts/write-source-status.js" \
  --source claude-code \
  --file "$STATUS_FILE" \
  --state input_required \
  --message "需要确认下一步" \
  --open-app "Claude"
