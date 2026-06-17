# Vibe Island

[中文说明](./README.zh-CN.md)

Vibe Island is a desktop overlay that gathers AI coding tool status into one place. When Codex, Claude Code, Trae, or another connector asks for permission or finishes a task, the overlay stays near the top of the screen so you can respond without constantly switching sessions.

This repo currently ships a local prototype built with Electron. On macOS it is styled like a Dynamic-Island-adjacent card. On Windows it runs as a top-center floating inbox with the same action flow.

Important platform note:

- macOS does not expose a public API to place third-party UI inside the real system Dynamic Island or notch. Vibe Island therefore uses a notch-adjacent always-on-top overlay that behaves like a Dynamic-Island companion, not a true system island extension.

## Product status

- Shared Electron codebase for macOS and Windows
- Config-driven connector registry for easier expansion
- Local demo fixtures included for Codex and Claude Code
- Desktop activation path included for Trae
- GitHub issue templates included for product feedback

## What it does

- Shows waiting approvals and completed tasks in one overlay
- Supports quick actions such as `允许一次`, `拒绝`, `前往会话`, and `关闭`
- Supports a shared event inbox so any CLI or desktop app can emit a stop event
- Runs on macOS and Windows from the same codebase

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Electron-compatible desktop environment

## Install

### macOS

```bash
git clone https://github.com/Allonsy-ops/vibe-island.git
cd vibe-island
npm install
```

### Windows PowerShell

```powershell
git clone https://github.com/Allonsy-ops/vibe-island.git
cd vibe-island
npm install
```

## Run

### 1. Start a demo event

Permission request demo:

```bash
npm run demo:permission
```

Task completed demo:

```bash
npm run demo:done
```

On Windows PowerShell the same commands work unchanged:

```powershell
npm run demo:permission
npm run demo:done
```

### 1b. Emit a stop event into the shared inbox

Any model CLI or desktop helper can append a stop event through the shared inbox:

```bash
npm run emit:event -- --source codex --status needs_permission --title "Codex 请求授权" --summary "准备执行 npm run dev"
```

Windows PowerShell:

```powershell
npm run emit:event -- --source codex --status needs_permission --title "Codex 请求授权" --summary "准备执行 npm run dev"
```

You can also attach local handlers so island actions perform real work:

```bash
npm run emit:event -- --source codex --status needs_permission --title "Codex 请求授权" --summary "准备执行 npm run dev" --approve-cmd "echo approve" --deny-cmd "echo deny" --open-app "Trae"
```

### 1c. Bridge external JSON into a stop event

If another model tool can write a plain JSON payload, you can bridge it into the shared inbox:

```bash
npm run bridge:event -- --json '{"source":"codex","status":"permission","title":"Codex 请求授权","summary":"准备执行 npm run dev","approve_cmd":"echo approve","open_app":"Trae"}'
```

Tool-specific adapters are also available:

```bash
npm run bridge:codex -- --file /path/to/codex-status.json
npm run bridge:claude-code -- --file /path/to/claude-code-status.json
npm run bridge:qoder -- --file /path/to/qoder-status.json
npm run bridge:trae -- --file /path/to/trae-status.json
```

### 1d. Watch an external status file continuously

If a model tool keeps rewriting a JSON file, you can keep a bridge process running:

```bash
npm run watch:bridge -- --file /path/to/model-status.json
```

Preset helpers are also available:

```bash
npm run watch:codex -- --file /path/to/codex-status.json
npm run watch:claude-code -- --file /path/to/claude-code-status.json
npm run watch:qoder -- --file /path/to/qoder-status.json
npm run watch:trae -- --file /path/to/trae-status.json
```

For a more product-like local startup flow, you can launch the watcher plus desktop app together:

```bash
npm run start:codex
npm run start:claude-code
npm run start:qoder
npm run start:trae
```

Starter integration templates are included for both macOS/Linux shell and Windows PowerShell:

- `examples/integrations/codex-hook.sh`
- `examples/integrations/codex-hook.ps1`
- `examples/integrations/claude-code-hook.sh`
- `examples/integrations/claude-code-hook.ps1`

You can also generate source-shaped raw status files directly:

```bash
npm run write:source-status -- --source codex --file ./data/codex-status.json
npm run write:source-status -- --source qoder --file ./data/qoder-status.json
```

If your tool has a web session URL or deep link, you can attach it too:

```bash
npm run emit:event -- --source codex --status waiting_input --open-url "https://example.com/session/123"
```

### 2. Launch the desktop overlay

macOS:

```bash
npm run ui
```

Windows PowerShell:

```powershell
npm run ui
```

## How to use

1. Trigger a demo event or wire one of the connectors to your own local source.
2. Launch the overlay with `npm run ui`.
3. When a card appears, click:
   - `允许一次`: accept the pending action
   - `拒绝`: reject the pending action
   - `前往会话`: bring the related desktop app forward
   - `关闭`: hide the overlay window
4. Press `Esc` to close the overlay quickly.
5. If you close the overlay manually, it stays hidden for the current snapshot only. A newer stop event will bring the window back automatically.

For real local integrations, the simplest contract is:

1. Your model CLI or desktop helper detects that the model stopped, completed, or needs permission.
2. It appends one JSON line into `data/events.jsonl`.
3. Vibe Island polls that inbox and surfaces the newest unseen event near the notch area.

Example JSON line:

```json
{"source_id":"codex","source_type":"cli","session_id":"codex-session","task_id":"task-123","title":"Codex 请求授权","summary":"准备执行 npm run dev","status":"needs_permission"}
```

Example with action handlers:

```json
{"source_id":"codex","source_type":"cli","session_id":"codex-session","task_id":"task-123","title":"Codex 请求授权","summary":"准备执行 npm run dev","status":"needs_permission","action_handlers":{"approve_once":{"kind":"command","command":"echo approve"},"deny":{"kind":"command","command":"echo deny"},"open_session":{"kind":"app","app":"Trae"}}}
```

The bridge script accepts either:

- `--json '{...}'`
- `--file /path/to/external-payload.json`

The watch bridge accepts:

- `--file /path/to/model-status.json`
- optional `--out /path/to/events.jsonl`

Sample payloads are included in `examples/`.

The shared inbox connector reads incrementally and tolerates source-file truncation or rewrite, which makes it safer for long-running local agents.

## Built-in source presets

- `codex`: CLI-oriented preset for permission and stop events
- `claude-code`: CLI-oriented preset for waiting-input and completion events
- `qoder`: desktop-oriented preset with `QoderMac` as the default jump target
- `trae`: desktop-oriented preset with `Trae` as the default jump target

## Current connectors

- `inbox:shared`: reads appended stop events from `data/events.jsonl`
- `cli:codex`: reads the local Codex permission fixture
- `cli:claude-code`: reads the local Claude completion fixture
- `desktop:trae`: brings the Trae desktop app to the foreground

Connector definitions live in `config/connectors.js`. Adding a new source is meant to be a config change plus a connector kind, not a rewrite of the app shell.

## Development

Run tests:

```bash
npm test
```

Windows PowerShell:

```powershell
npm test
```

## Packaging

Build an unpacked app directory:

```bash
npm run pack:dir
```

Build a macOS zip:

```bash
npm run pack:mac
```

Build a Windows installer:

```powershell
npm run pack:win
```

Build both targets from one machine when the host supports it:

```bash
npm run pack:all
```

Artifacts are written to `dist/`.

For repeatable release output, use GitHub Actions. This repo includes a workflow that runs tests and builds macOS plus Windows artifacts on their native runners.

Notes:

- macOS release signing and notarization are not configured in this prototype.
- The Windows build target is included in source and CI, but final runtime verification still needs a real Windows machine before calling it production-ready.

## Feedback

Yes, this project should have a feedback channel. The simplest product-friendly setup is GitHub Issues:

- Bug reports: use the bug template
- Product ideas: use the feature request template
- Usage questions: open a regular issue with reproduction steps and screenshots

The desktop overlay now includes a `问题反馈` entry that opens the GitHub issue chooser directly.

If you are using this internally later, you can also add:

- An in-app “Report issue” button that opens the repo issues page
- A shared feedback email such as `support@...`
- Optional telemetry for crash/error reporting

## Notes on platform behavior

- macOS uses AppleScript to bring a desktop app to the foreground.
- Windows uses PowerShell `Start-Process` for desktop app activation.
- Windows installers are best produced on Windows CI or a Windows host.
- Linux is not a target yet, but the activation helper falls back to `xdg-open` for development completeness.
