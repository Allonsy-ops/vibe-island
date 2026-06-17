$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$StatusFile = if ($args.Length -gt 0) { $args[0] } else { Join-Path $ProjectDir "data/codex-status.json" }

node (Join-Path $ProjectDir "scripts/write-source-status.js") `
  --source codex `
  --file $StatusFile `
  --state permission_required `
  --command "npm run dev" `
  --approve-cmd "echo approve" `
  --deny-cmd "echo deny"
