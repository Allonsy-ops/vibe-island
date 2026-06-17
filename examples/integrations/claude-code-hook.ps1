$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$StatusFile = if ($args.Length -gt 0) { $args[0] } else { Join-Path $ProjectDir "data/claude-code-status.json" }

node (Join-Path $ProjectDir "scripts/write-source-status.js") `
  --source claude-code `
  --file $StatusFile `
  --state input_required `
  --message "需要确认下一步" `
  --open-app "Claude"
