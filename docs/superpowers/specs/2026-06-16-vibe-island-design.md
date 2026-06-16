# Vibe Island Design

## Overview

Vibe Island is a cross-platform AI status hub for desktop apps and CLI agents.
The macOS shell presents a Dynamic Island-like overlay near the top of the screen.
The Windows shell will later present the same interaction model through a native floating bar or taskbar-adjacent panel.

The product goal is not to mimic a specific OS affordance. The goal is to reduce window switching while multiple AI tools are running by:

- aggregating status across multiple AI tools
- surfacing high-priority requests immediately
- allowing quick handling of supported permission prompts
- jumping back to the original session when deeper context is needed

The first product version targets:

- macOS only
- desktop apps and CLI agents
- no browser-session integration

## Product Positioning

Vibe Island is an AI status hub, not just a notification widget.

It provides one consistent interaction surface for:

- `needs_permission`
- `waiting_input`
- `running`
- `done`
- `error`

On macOS, these states appear through a compact top overlay that can expand into quick actions and a small inbox panel.
On Windows, the same state and action model will map to a native floating shell without requiring the same visual shape.

## Scope

### In scope for V1

- Unified status aggregation for CLI agents and selected desktop apps
- A macOS top overlay with island-style compact and expanded states
- Quick actions for supported CLI permission requests
- Jump-back actions to the original app or session
- Multi-source waiting queue with prioritization
- Local-only architecture with connectors running on the user's machine

### Out of scope for V1

- Browser session integration
- Cloud-hosted sync
- Team features or remote collaboration
- Full action parity across every supported desktop app
- Visual pixel-matching to the real iPhone Dynamic Island

## Primary Users

The initial user is a power user running multiple AI tools at once, including tools such as Codex, Claude Code, Trae, Qoder, and similar desktop or CLI agents.

Their main pain points are:

- missing completion events while focused elsewhere
- constant switching between AI sessions to check status
- losing flow when a tool requests permission or input
- not knowing which agent needs attention first

## Core Jobs To Be Done

1. When one of my AI tools needs my attention, show me immediately without forcing me to hunt for the session.
2. When the request is simple, let me resolve it from the overlay.
3. When the request needs more context, take me directly back to the correct app or terminal session.
4. When several tools are active at once, help me see which one matters most.

## Platform Strategy

### Product strategy

The product should be designed as a shared core plus platform-specific shells.

- Shared across macOS and Windows:
  - connector model
  - event schema
  - broker logic
  - prioritization
  - action routing
  - inbox model
- Platform-specific:
  - overlay shell
  - native windowing behavior
  - app activation and deep-link behavior
  - notification polish

### Why this approach

This keeps the core product portable while allowing each platform to feel native.
The product does not depend on the existence of a Dynamic Island. The island-style shell is only the macOS expression of the product.

## System Architecture

Vibe Island is split into three layers.

### 1. Connector layer

Each source gets its own connector.

Examples:

- Codex connector
- Claude Code connector
- Trae connector
- Qoder connector
- generic CLI connector

Connector responsibilities:

- detect source-specific events
- normalize them into the common event schema
- expose supported actions
- provide enough metadata for jump-back behavior

Connectors must not contain UI logic.

### 2. Core broker layer

The broker is the product core and main long-term moat.

Broker responsibilities:

- maintain current state for all connected agents
- deduplicate repeated events
- prioritize waiting items
- fan out updates to the UI shell
- dispatch actions back to the correct connector
- maintain a recent event history

The broker owns the shared source-of-truth state model.

### 3. Shell UI layer

The shell renders product state and captures user actions.

macOS shell responsibilities:

- render compact island state
- expand into a single-request quick action card
- expand further into a small inbox panel when needed
- animate between idle, alert, and queue states

Windows shell responsibilities later:

- render equivalent compact alert affordance
- show quick action panel
- provide inbox access

The shell should depend only on broker state and action APIs, never on source-specific logic.

## Event Model

All connectors normalize into a shared event model.

Required event states:

- `running`
- `needs_permission`
- `waiting_input`
- `done`
- `error`
- `idle`

Required event fields:

- `source_id`
- `source_type`
- `session_id`
- `task_id`
- `title`
- `summary`
- `status`
- `priority`
- `timestamp`
- `actions[]`
- `jump_target`

Optional fields:

- `risk_level`
- `command_preview`
- `reason`
- `history_context`

## Action Model

Actions must be explicit and source-aware.

Common actions:

- `approve_once`
- `deny`
- `open_session`
- `dismiss`
- `snooze`

Not every source must support every action.

V1 rule:

- CLI sources should support real quick-action authorization where technically safe
- desktop app sources may initially support only `open_session` and passive status display

## Integration Strategy

### V1 priority order

1. Codex and Claude Code
2. one representative desktop app connector
3. additional CLI connectors
4. additional desktop app connectors

The first desktop app connector should be whichever app the user relies on most often. Based on current discussion, Trae is a strong default candidate if no other app overtakes it.

### Integration principles

- prefer official local hooks, IPC, stdin/stdout, logs, or documented automation paths
- avoid screen scraping as a primary integration path
- avoid mouse/keyboard simulation as a primary authorization path
- allow brittle fallback methods only as temporary experiments, not product foundations

## Interaction Design

The macOS V1 interaction has three levels.

### Level 1: Compact island

This appears only when something needs attention or has just completed.

Compact contents may include:

- source name
- short task summary
- waiting count
- completion hint

Behavior:

- auto-appears for high-priority events
- auto-hides for low-priority completion events
- remains visible longer for waiting states

### Level 2: Quick action card

This is the primary V1 interaction surface.

Shown when:

- a single high-priority item needs attention
- the user clicks the compact island

Displayed information:

- source
- task title or short summary
- current state
- risk level if relevant
- available actions

Examples:

- `Allow once`
- `Deny`
- `Open session`

### Level 3: Inbox panel

This is used when multiple sources need attention or when the user wants recent history.

Displayed information:

- sorted waiting items
- recent completions
- source grouping
- latest action taken

This panel is not the main focus of V1, but it should exist in a minimal form if multiple concurrent sources are supported.

## Prioritization Rules

V1 prioritization should be simple and explicit.

Suggested priority order:

1. `needs_permission`
2. `waiting_input`
3. `error`
4. `done`
5. `running`

Within the same status, newer events sort ahead of older events.
Repeated duplicate alerts from the same task should be collapsed.

## Jump-Back Behavior

Every connector should provide the best available jump target.

Examples:

- focus the correct terminal window or tab
- focus the correct desktop app window
- open the relevant local context if the source supports deep linking

If precise session focus is unavailable, V1 may fall back to focusing the source app itself.

## Security and Safety

This product handles approval workflows, so safety matters.

V1 requirements:

- all permission actions must clearly identify the requesting source
- risky actions should show a short command or summary when available
- actions must be routed only to the originating connector
- the product should keep a local action history for auditability

Non-goal for V1:

- building a policy engine

However, the architecture should leave room for future features such as approval rules, trusted sources, and per-source allowlists.

## Failure Modes and Error Handling

The product must degrade cleanly when connectors are partial or unstable.

Expected failure cases:

- connector temporarily offline
- desktop app not running
- action unsupported for a source
- stale waiting event that already resolved
- jump-back target no longer exists

Handling principles:

- show passive fallback states instead of failing silently
- offer `Open session` when direct action is unavailable
- allow stale items to expire or be dismissed
- keep connector failures isolated from the rest of the product

## Initial Technical Direction

The current project is an Electron-based macOS prototype.
That is acceptable for fast iteration on V1 shell behavior, event flows, and connector contracts.

Recommended near-term direction:

- keep iterating in Electron for prototype speed
- structure the project as if broker and connectors could later be separated
- avoid coupling source logic directly into the renderer

Likely future evolution:

- maintain a shared core runtime
- consider a more native shell implementation later if Electron constraints become noticeable

This keeps the V1 learning loop fast without committing the long-term product to the same shell technology forever.

## V1 Success Criteria

V1 is successful if it can demonstrate all of the following:

- at least two CLI sources can publish live state into one unified shell
- at least one source can complete a real permission action from the overlay
- at least one desktop app source can be surfaced and jumped back into reliably
- the user can tell which source needs attention first without switching windows manually

## Open Decisions Resolved For This Spec

The following decisions are intentionally fixed for this design:

- no browser integrations in V1
- product target is desktop app plus CLI only
- V1 ships on macOS first
- Windows is a planned follow-on platform using the same core model
- first deep quick-action support focuses on CLI integrations
- desktop apps may launch with alert plus jump-back support before direct action support

## Testing Strategy

Testing should cover three layers.

### Connector tests

- source event parsing
- action routing correctness
- stale session handling

### Broker tests

- priority ordering
- de-duplication
- state transitions
- multi-source queue behavior

### Shell tests

- compact to expanded transitions
- correct rendering for each status
- safe action labeling
- multi-item inbox behavior

Manual validation for V1 should include concurrent agent scenarios, since that is the core user pain the product is solving.

## Implementation Guidance For Next Phase

The implementation plan should begin with:

1. a shared event schema and broker contract
2. a first-class CLI connector path
3. a macOS overlay shell that consumes normalized events
4. one real quick-action loop for a CLI permission request
5. one desktop app sample connector with jump-back behavior

This sequence validates the hardest product claim early: reducing context switching across multiple AI tools.
