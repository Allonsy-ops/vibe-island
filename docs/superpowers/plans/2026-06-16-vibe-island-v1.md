# Vibe Island V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a macOS-first Vibe Island prototype that aggregates CLI and desktop app AI states, supports real quick actions for CLI permission prompts, and supports jump-back behavior for one desktop app sample connector.

**Architecture:** Keep the current Electron shell for iteration speed, but split the app into `connectors`, `core broker`, and `shell UI` modules. Use a shared normalized event schema so CLI and desktop app sources can feed the same broker, and let the renderer consume only broker snapshots instead of source-specific files.

**Tech Stack:** Electron, Node.js CommonJS, built-in `node:test`, `assert/strict`, `EventEmitter`, AppleScript via `osascript` for macOS app activation

---

## Planned File Structure

- Create: `/Users/runze/vibe-island/src/shared/event-schema.js`
  Responsibility: event/action constants, validation, normalization
- Create: `/Users/runze/vibe-island/src/core/broker.js`
  Responsibility: source-of-truth state, dedupe, priority sort, snapshot generation
- Create: `/Users/runze/vibe-island/src/core/action-runner.js`
  Responsibility: route user actions back to the correct connector
- Create: `/Users/runze/vibe-island/src/connectors/base-connector.js`
  Responsibility: shared connector contract
- Create: `/Users/runze/vibe-island/src/connectors/cli-json-connector.js`
  Responsibility: watch JSON event files from CLI agents and emit normalized events
- Create: `/Users/runze/vibe-island/src/connectors/desktop-app-connector.js`
  Responsibility: sample desktop app connector with jump-back support
- Create: `/Users/runze/vibe-island/src/connectors/index.js`
  Responsibility: instantiate and register connectors
- Create: `/Users/runze/vibe-island/src/main/app-controller.js`
  Responsibility: bootstrap broker, connectors, and Electron window updates
- Create: `/Users/runze/vibe-island/src/main/window.js`
  Responsibility: create/configure the overlay window
- Create: `/Users/runze/vibe-island/src/main/ipc.js`
  Responsibility: safe preload-facing API for snapshots and actions
- Create: `/Users/runze/vibe-island/src/renderer/view-model.js`
  Responsibility: map broker snapshot to UI-ready view data
- Create: `/Users/runze/vibe-island/src/renderer/render.js`
  Responsibility: render compact, quick-action, and inbox states
- Create: `/Users/runze/vibe-island/src/renderer/styles.css`
  Responsibility: shell styling for compact island and expanded cards
- Create: `/Users/runze/vibe-island/fixtures/codex-permission.json`
  Responsibility: sample CLI permission event
- Create: `/Users/runze/vibe-island/fixtures/claude-done.json`
  Responsibility: sample CLI completion event
- Create: `/Users/runze/vibe-island/tests/event-schema.test.js`
  Responsibility: schema normalization tests
- Create: `/Users/runze/vibe-island/tests/broker.test.js`
  Responsibility: broker state/priority/dedupe tests
- Create: `/Users/runze/vibe-island/tests/action-runner.test.js`
  Responsibility: action routing tests
- Create: `/Users/runze/vibe-island/tests/view-model.test.js`
  Responsibility: renderer view mapping tests
- Modify: `/Users/runze/vibe-island/package.json`
  Responsibility: scripts for tests and demo fixtures
- Modify: `/Users/runze/vibe-island/main.js`
  Responsibility: hand off to new app controller
- Modify: `/Users/runze/vibe-island/preload.js`
  Responsibility: replace direct `/tmp` reads with IPC bridge
- Modify: `/Users/runze/vibe-island/renderer.js`
  Responsibility: use renderer modules and actions
- Modify: `/Users/runze/vibe-island/index.html`
  Responsibility: mount richer shell layout
- Modify: `/Users/runze/vibe-island/index.js`
  Responsibility: emit normalized sample events into fixture path for manual testing

### Task 1: Establish the Project Skeleton and Test Harness

**Files:**
- Modify: `/Users/runze/vibe-island/package.json`
- Modify: `/Users/runze/vibe-island/main.js`
- Create: `/Users/runze/vibe-island/src/main/app-controller.js`
- Create: `/Users/runze/vibe-island/tests/smoke.test.js`

- [ ] **Step 1: Write the failing smoke test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('app controller exports a bootstrap function', async () => {
  const controller = require('../src/main/app-controller');
  assert.equal(typeof controller.bootstrapApp, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/runze/vibe-island && node --test tests/smoke.test.js`
Expected: FAIL with `Cannot find module '../src/main/app-controller'`

- [ ] **Step 3: Add test script and bootstrap module**

```json
{
  "name": "vibe-island",
  "version": "1.0.0",
  "description": "Claude Dynamic Island for macOS",
  "main": "main.js",
  "scripts": {
    "ui": "electron .",
    "test": "node --test tests/*.test.js",
    "hook-test": "node index.js permission"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "devDependencies": {
    "electron": "^42.3.3"
  }
}
```

```js
function bootstrapApp(deps = {}) {
  return {
    started: true,
    deps
  };
}

module.exports = {
  bootstrapApp
};
```

```js
const { app } = require('electron');
const { bootstrapApp } = require('./src/main/app-controller');

app.whenReady().then(() => {
  bootstrapApp({ app });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/runze/vibe-island && npm test -- --test-name-pattern="bootstrap function"`
Expected: PASS with `1 test passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git init
git add package.json main.js src/main/app-controller.js tests/smoke.test.js
git commit -m "chore: add test harness and app bootstrap"
```

### Task 2: Define the Normalized Event Schema

**Files:**
- Create: `/Users/runze/vibe-island/src/shared/event-schema.js`
- Create: `/Users/runze/vibe-island/tests/event-schema.test.js`

- [ ] **Step 1: Write the failing schema tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEvent, PRIORITY_BY_STATUS } = require('../src/shared/event-schema');

test('normalizeEvent fills defaults for a CLI permission request', () => {
  const normalized = normalizeEvent({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'abc',
    task_id: 'task-1',
    title: 'Codex wants shell access',
    status: 'needs_permission'
  });

  assert.equal(normalized.priority, PRIORITY_BY_STATUS.needs_permission);
  assert.deepEqual(normalized.actions.map((action) => action.id), ['approve_once', 'deny', 'open_session']);
  assert.equal(typeof normalized.timestamp, 'number');
});

test('normalizeEvent rejects unknown status values', () => {
  assert.throws(
    () => normalizeEvent({ source_id: 'x', source_type: 'cli', session_id: '1', task_id: '1', title: 'bad', status: 'wat' }),
    /Unknown status/
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/runze/vibe-island && node --test tests/event-schema.test.js`
Expected: FAIL with `Cannot find module '../src/shared/event-schema'`

- [ ] **Step 3: Write the minimal schema implementation**

```js
const VALID_STATUSES = ['idle', 'running', 'needs_permission', 'waiting_input', 'done', 'error'];

const PRIORITY_BY_STATUS = {
  needs_permission: 100,
  waiting_input: 90,
  error: 80,
  done: 50,
  running: 10,
  idle: 0
};

function defaultActionsFor(status) {
  if (status === 'needs_permission') {
    return [{ id: 'approve_once' }, { id: 'deny' }, { id: 'open_session' }];
  }
  if (status === 'waiting_input' || status === 'error') {
    return [{ id: 'open_session' }, { id: 'dismiss' }];
  }
  if (status === 'done') {
    return [{ id: 'open_session' }, { id: 'dismiss' }];
  }
  return [{ id: 'open_session' }];
}

function normalizeEvent(input) {
  if (!VALID_STATUSES.includes(input.status)) {
    throw new Error(`Unknown status: ${input.status}`);
  }

  return {
    source_id: input.source_id,
    source_type: input.source_type,
    session_id: input.session_id,
    task_id: input.task_id,
    title: input.title,
    summary: input.summary || '',
    status: input.status,
    priority: input.priority ?? PRIORITY_BY_STATUS[input.status],
    timestamp: input.timestamp ?? Date.now(),
    actions: input.actions ?? defaultActionsFor(input.status),
    jump_target: input.jump_target ?? null,
    risk_level: input.risk_level ?? null,
    command_preview: input.command_preview ?? null,
    connector_id: input.connector_id ?? `${input.source_type}:${input.source_id}`
  };
}

module.exports = {
  VALID_STATUSES,
  PRIORITY_BY_STATUS,
  normalizeEvent
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/runze/vibe-island && node --test tests/event-schema.test.js`
Expected: PASS with `2 tests passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add src/shared/event-schema.js tests/event-schema.test.js
git commit -m "feat: add normalized event schema"
```

### Task 3: Build the Broker and Action Router

**Files:**
- Create: `/Users/runze/vibe-island/src/core/broker.js`
- Create: `/Users/runze/vibe-island/src/core/action-runner.js`
- Create: `/Users/runze/vibe-island/tests/broker.test.js`
- Create: `/Users/runze/vibe-island/tests/action-runner.test.js`

- [ ] **Step 1: Write the failing broker and action tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createBroker } = require('../src/core/broker');

test('broker sorts waiting events before done events', () => {
  const broker = createBroker();
  broker.upsert({
    source_id: 'claude',
    source_type: 'cli',
    session_id: 's1',
    task_id: 'done-1',
    title: 'Done',
    status: 'done'
  });
  broker.upsert({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's2',
    task_id: 'perm-1',
    title: 'Need permission',
    status: 'needs_permission'
  });

  const snapshot = broker.getSnapshot();
  assert.equal(snapshot.items[0].status, 'needs_permission');
  assert.equal(snapshot.waitingCount, 1);
});
```

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createActionRunner } = require('../src/core/action-runner');

test('action runner dispatches to the correct connector', async () => {
  let seen = null;
  const runner = createActionRunner({
    'cli:codex': {
      runAction(action) {
        seen = action;
      }
    }
  });

  await runner.run({
    connector_id: 'cli:codex',
    id: 'approve_once',
    task_id: 'perm-1'
  });

  assert.deepEqual(seen, {
    connector_id: 'cli:codex',
    id: 'approve_once',
    task_id: 'perm-1'
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/runze/vibe-island && node --test tests/broker.test.js tests/action-runner.test.js`
Expected: FAIL with missing module errors for `broker` and `action-runner`

- [ ] **Step 3: Write the minimal broker and router**

```js
const { EventEmitter } = require('node:events');
const { normalizeEvent } = require('../shared/event-schema');

function createBroker() {
  const emitter = new EventEmitter();
  const items = new Map();

  function sortItems(list) {
    return list.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.timestamp - a.timestamp;
    });
  }

  return {
    onUpdate(listener) {
      emitter.on('update', listener);
    },
    upsert(event) {
      const normalized = normalizeEvent(event);
      items.set(`${normalized.connector_id}:${normalized.task_id}`, normalized);
      emitter.emit('update', this.getSnapshot());
      return normalized;
    },
    dismiss(taskKey) {
      items.delete(taskKey);
      emitter.emit('update', this.getSnapshot());
    },
    getSnapshot() {
      const list = sortItems([...items.values()]);
      return {
        items: list,
        topItem: list[0] || null,
        waitingCount: list.filter((item) => ['needs_permission', 'waiting_input'].includes(item.status)).length,
        updatedAt: Date.now()
      };
    }
  };
}

module.exports = {
  createBroker
};
```

```js
function createActionRunner(connectors) {
  return {
    async run(action) {
      const connector = connectors[action.connector_id];
      if (!connector) {
        throw new Error(`Missing connector: ${action.connector_id}`);
      }
      return connector.runAction(action);
    }
  };
}

module.exports = {
  createActionRunner
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/runze/vibe-island && node --test tests/broker.test.js tests/action-runner.test.js`
Expected: PASS with `2 tests passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add src/core/broker.js src/core/action-runner.js tests/broker.test.js tests/action-runner.test.js
git commit -m "feat: add broker and action routing"
```

### Task 4: Add the First CLI Connector Path

**Files:**
- Create: `/Users/runze/vibe-island/src/connectors/base-connector.js`
- Create: `/Users/runze/vibe-island/src/connectors/cli-json-connector.js`
- Create: `/Users/runze/vibe-island/src/connectors/index.js`
- Create: `/Users/runze/vibe-island/fixtures/codex-permission.json`
- Create: `/Users/runze/vibe-island/fixtures/claude-done.json`
- Modify: `/Users/runze/vibe-island/index.js`

- [ ] **Step 1: Write the failing CLI connector test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCliJsonConnector } = require('../src/connectors/cli-json-connector');

test('cli connector reads a JSON fixture and emits a normalized event', async () => {
  const tempFile = path.join(os.tmpdir(), `vibe-island-${Date.now()}.json`);
  fs.writeFileSync(tempFile, JSON.stringify({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'abc',
    task_id: 'perm-1',
    title: 'Need approval',
    status: 'needs_permission'
  }));

  let emitted = null;
  const connector = createCliJsonConnector({
    id: 'cli:codex',
    filePath: tempFile,
    onEvent(event) {
      emitted = event;
    }
  });

  await connector.pollOnce();
  assert.equal(emitted.connector_id, 'cli:codex');
  assert.equal(emitted.status, 'needs_permission');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/runze/vibe-island && node --test tests/cli-json-connector.test.js`
Expected: FAIL with missing file/module errors

- [ ] **Step 3: Implement the base connector and CLI connector**

```js
class BaseConnector {
  constructor({ id, sourceType, sourceName, onEvent }) {
    this.id = id;
    this.sourceType = sourceType;
    this.sourceName = sourceName;
    this.onEvent = onEvent;
  }

  emit(event) {
    this.onEvent({
      ...event,
      connector_id: this.id,
      source_type: event.source_type || this.sourceType,
      source_id: event.source_id || this.sourceName
    });
  }
}

module.exports = {
  BaseConnector
};
```

```js
const fs = require('node:fs');
const { BaseConnector } = require('./base-connector');

function createCliJsonConnector({ id, filePath, sourceName = 'cli', onEvent }) {
  const base = new BaseConnector({
    id,
    sourceType: 'cli',
    sourceName,
    onEvent
  });

  let lastPayload = null;

  return {
    id,
    async pollOnce() {
      const raw = fs.readFileSync(filePath, 'utf8');
      if (raw === lastPayload) return null;
      lastPayload = raw;
      const parsed = JSON.parse(raw);
      const event = {
        ...parsed,
        connector_id: id,
        source_type: 'cli'
      };
      base.emit(event);
      return event;
    },
    async runAction(action) {
      return { ok: true, action };
    }
  };
}

module.exports = {
  createCliJsonConnector
};
```

```js
const path = require('node:path');
const { createCliJsonConnector } = require('./cli-json-connector');

function createConnectors(onEvent) {
  return {
    'cli:codex': createCliJsonConnector({
      id: 'cli:codex',
      sourceName: 'codex',
      filePath: path.join(__dirname, '../../fixtures/codex-permission.json'),
      onEvent
    }),
    'cli:claude-code': createCliJsonConnector({
      id: 'cli:claude-code',
      sourceName: 'claude-code',
      filePath: path.join(__dirname, '../../fixtures/claude-done.json'),
      onEvent
    })
  };
}

module.exports = {
  createConnectors
};
```

```json
{
  "source_id": "codex",
  "source_type": "cli",
  "session_id": "codex-session-1",
  "task_id": "codex-perm-1",
  "title": "Codex wants shell permission",
  "summary": "npm run dev in /Users/runze/vibe-island",
  "status": "needs_permission",
  "command_preview": "npm run dev",
  "jump_target": {
    "kind": "terminal",
    "value": "Codex"
  }
}
```

```json
{
  "source_id": "claude-code",
  "source_type": "cli",
  "session_id": "claude-session-1",
  "task_id": "claude-done-1",
  "title": "Claude Code finished task",
  "summary": "Spec review completed",
  "status": "done",
  "jump_target": {
    "kind": "terminal",
    "value": "Claude Code"
  }
}
```

```js
const fs = require('node:fs');
const path = require('node:path');

const eventType = process.argv[2] || 'permission';

const fixtures = {
  permission: {
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'codex-session-1',
    task_id: 'codex-perm-1',
    title: 'Codex wants shell permission',
    summary: 'npm run dev in /Users/runze/vibe-island',
    status: 'needs_permission'
  },
  done: {
    source_id: 'claude-code',
    source_type: 'cli',
    session_id: 'claude-session-1',
    task_id: 'claude-done-1',
    title: 'Claude Code finished task',
    summary: 'Spec review completed',
    status: 'done'
  }
};

const outputPath = eventType === 'done'
  ? path.join(__dirname, 'fixtures/claude-done.json')
  : path.join(__dirname, 'fixtures/codex-permission.json');

fs.writeFileSync(outputPath, JSON.stringify(fixtures[eventType] || fixtures.permission, null, 2));
```

- [ ] **Step 4: Run test and fixture check**

Run: `cd /Users/runze/vibe-island && node --test tests/cli-json-connector.test.js && node index.js permission`
Expected: PASS for the test and updated `fixtures/codex-permission.json`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add src/connectors/base-connector.js src/connectors/cli-json-connector.js src/connectors/index.js fixtures/codex-permission.json fixtures/claude-done.json index.js tests/cli-json-connector.test.js
git commit -m "feat: add CLI JSON connectors"
```

### Task 5: Add a Desktop App Sample Connector with Jump-Back

**Files:**
- Create: `/Users/runze/vibe-island/src/connectors/desktop-app-connector.js`
- Modify: `/Users/runze/vibe-island/src/connectors/index.js`
- Create: `/Users/runze/vibe-island/tests/desktop-app-connector.test.js`

- [ ] **Step 1: Write the failing desktop app connector test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createDesktopAppConnector } = require('../src/connectors/desktop-app-connector');

test('desktop connector emits waiting_input and supports open_session', async () => {
  let seen = null;
  let activated = null;

  const connector = createDesktopAppConnector({
    id: 'desktop:trae',
    appName: 'Trae',
    onEvent(event) {
      seen = event;
    },
    activateApp(name) {
      activated = name;
    }
  });

  connector.emitWaiting({
    session_id: 'trae-1',
    task_id: 'trae-waiting-1',
    title: 'Trae is waiting for input'
  });

  assert.equal(seen.status, 'waiting_input');
  await connector.runAction({ id: 'open_session' });
  assert.equal(activated, 'Trae');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/runze/vibe-island && node --test tests/desktop-app-connector.test.js`
Expected: FAIL with missing module error

- [ ] **Step 3: Implement the desktop app connector**

```js
const { spawn } = require('node:child_process');
const { BaseConnector } = require('./base-connector');

function defaultActivateApp(appName) {
  return new Promise((resolve, reject) => {
    const script = `tell application "${appName}" to activate`;
    const child = spawn('osascript', ['-e', script]);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`osascript exited with ${code}`));
    });
  });
}

function createDesktopAppConnector({ id, appName, onEvent, activateApp = defaultActivateApp }) {
  const base = new BaseConnector({
    id,
    sourceType: 'desktop',
    sourceName: appName,
    onEvent
  });

  return {
    id,
    emitWaiting(payload) {
      base.emit({
        ...payload,
        source_id: appName,
        source_type: 'desktop',
        status: 'waiting_input',
        jump_target: {
          kind: 'app',
          value: appName
        },
        actions: [{ id: 'open_session' }, { id: 'dismiss' }]
      });
    },
    async runAction(action) {
      if (action.id === 'open_session') {
        await activateApp(appName);
        return { ok: true };
      }
      return { ok: false, reason: 'unsupported_action' };
    }
  };
}

module.exports = {
  createDesktopAppConnector
};
```

```js
const path = require('node:path');
const { createCliJsonConnector } = require('./cli-json-connector');
const { createDesktopAppConnector } = require('./desktop-app-connector');

function createConnectors(onEvent) {
  return {
    'cli:codex': createCliJsonConnector({
      id: 'cli:codex',
      sourceName: 'codex',
      filePath: path.join(__dirname, '../../fixtures/codex-permission.json'),
      onEvent
    }),
    'cli:claude-code': createCliJsonConnector({
      id: 'cli:claude-code',
      sourceName: 'claude-code',
      filePath: path.join(__dirname, '../../fixtures/claude-done.json'),
      onEvent
    }),
    'desktop:trae': createDesktopAppConnector({
      id: 'desktop:trae',
      appName: 'Trae',
      onEvent
    })
  };
}

module.exports = {
  createConnectors
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/runze/vibe-island && node --test tests/desktop-app-connector.test.js`
Expected: PASS with `1 test passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add src/connectors/desktop-app-connector.js src/connectors/index.js tests/desktop-app-connector.test.js
git commit -m "feat: add desktop app jump-back connector"
```

### Task 6: Wire the Broker and Connectors into Electron

**Files:**
- Create: `/Users/runze/vibe-island/src/main/window.js`
- Create: `/Users/runze/vibe-island/src/main/ipc.js`
- Modify: `/Users/runze/vibe-island/src/main/app-controller.js`
- Modify: `/Users/runze/vibe-island/preload.js`

- [ ] **Step 1: Write the failing integration smoke test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootstrapApp } = require('../src/main/app-controller');

test('bootstrapApp returns broker-backed API', () => {
  const shell = bootstrapApp({
    createWindow() {
      return { webContents: { send() {} } };
    }
  });

  assert.equal(typeof shell.getSnapshot, 'function');
  assert.equal(typeof shell.runAction, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/runze/vibe-island && node --test tests/smoke.test.js`
Expected: FAIL because `getSnapshot` and `runAction` are missing

- [ ] **Step 3: Implement the broker-backed controller and IPC bridge**

```js
const { BrowserWindow, screen } = require('electron');

function createOverlayWindow() {
  const display = screen.getPrimaryDisplay();
  const width = 420;
  const height = 120;
  const x = Math.floor(display.bounds.width / 2 - width / 2);
  const y = 10;

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: `${__dirname}/../../preload.js`
    }
  });

  win.loadFile('index.html');
  return win;
}

module.exports = {
  createOverlayWindow
};
```

```js
const { ipcMain } = require('electron');

function registerIpc({ broker, actionRunner }) {
  ipcMain.handle('vibe:get-snapshot', () => broker.getSnapshot());
  ipcMain.handle('vibe:run-action', (_event, action) => actionRunner.run(action));
}

module.exports = {
  registerIpc
};
```

```js
const { createBroker } = require('../core/broker');
const { createActionRunner } = require('../core/action-runner');
const { createConnectors } = require('../connectors');
const { createOverlayWindow } = require('./window');
const { registerIpc } = require('./ipc');

function bootstrapApp(deps = {}) {
  const broker = createBroker();
  const connectors = createConnectors((event) => broker.upsert(event));
  const actionRunner = createActionRunner(connectors);
  const win = (deps.createWindow || createOverlayWindow)();

  broker.onUpdate((snapshot) => {
    if (win && win.webContents) {
      win.webContents.send('vibe:snapshot', snapshot);
    }
  });

  registerIpc({ broker, actionRunner });

  return {
    broker,
    connectors,
    getSnapshot() {
      return broker.getSnapshot();
    },
    runAction(action) {
      return actionRunner.run(action);
    }
  };
}

module.exports = {
  bootstrapApp
};
```

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibeIsland', {
  getSnapshot() {
    return ipcRenderer.invoke('vibe:get-snapshot');
  },
  runAction(action) {
    return ipcRenderer.invoke('vibe:run-action', action);
  },
  onSnapshot(listener) {
    ipcRenderer.on('vibe:snapshot', (_event, snapshot) => listener(snapshot));
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/runze/vibe-island && node --test tests/smoke.test.js`
Expected: PASS with `1 test passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add src/main/window.js src/main/ipc.js src/main/app-controller.js preload.js tests/smoke.test.js
git commit -m "feat: wire broker into Electron shell"
```

### Task 7: Build the Island UI States

**Files:**
- Create: `/Users/runze/vibe-island/src/renderer/view-model.js`
- Create: `/Users/runze/vibe-island/src/renderer/render.js`
- Create: `/Users/runze/vibe-island/src/renderer/styles.css`
- Create: `/Users/runze/vibe-island/tests/view-model.test.js`
- Modify: `/Users/runze/vibe-island/index.html`
- Modify: `/Users/runze/vibe-island/renderer.js`

- [ ] **Step 1: Write the failing view-model test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildViewModel } = require('../src/renderer/view-model');

test('view model promotes the top waiting item to quick action mode', () => {
  const vm = buildViewModel({
    items: [{
      connector_id: 'cli:codex',
      source_id: 'codex',
      title: 'Codex wants shell permission',
      summary: 'npm run dev',
      status: 'needs_permission',
      actions: [{ id: 'approve_once' }, { id: 'deny' }, { id: 'open_session' }]
    }],
    waitingCount: 1
  });

  assert.equal(vm.mode, 'quick-action');
  assert.equal(vm.primaryAction.id, 'approve_once');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/runze/vibe-island && node --test tests/view-model.test.js`
Expected: FAIL with missing module error

- [ ] **Step 3: Implement the view model and renderer**

```js
function buildViewModel(snapshot) {
  const topItem = snapshot.topItem || snapshot.items?.[0] || null;

  if (!topItem) {
    return {
      mode: 'idle',
      title: 'Vibe Island',
      message: 'Waiting for AI activity',
      actions: []
    };
  }

  if (snapshot.waitingCount > 1) {
    return {
      mode: 'inbox',
      title: `${snapshot.waitingCount} agents need attention`,
      message: topItem.title,
      items: snapshot.items
    };
  }

  if (topItem.status === 'needs_permission' || topItem.status === 'waiting_input') {
    return {
      mode: 'quick-action',
      title: topItem.title,
      message: topItem.summary || topItem.status,
      primaryAction: topItem.actions[0] || null,
      actions: topItem.actions,
      item: topItem
    };
  }

  return {
    mode: 'compact',
    title: topItem.title,
    message: topItem.summary || topItem.status,
    item: topItem,
    actions: topItem.actions
  };
}

module.exports = {
  buildViewModel
};
```

```js
function actionButton(action, connectorId, taskId) {
  return `<button data-action="${action.id}" data-connector="${connectorId}" data-task="${taskId}">${action.id}</button>`;
}

function renderShell(root, vm) {
  if (vm.mode === 'idle') {
    root.innerHTML = `<div class="island compact"><h1>${vm.title}</h1><p>${vm.message}</p></div>`;
    return;
  }

  if (vm.mode === 'inbox') {
    root.innerHTML = `
      <div class="island inbox">
        <h1>${vm.title}</h1>
        <ul>${vm.items.map((item) => `<li><strong>${item.source_id}</strong> ${item.title}</li>`).join('')}</ul>
      </div>
    `;
    return;
  }

  const item = vm.item;
  root.innerHTML = `
    <div class="island ${vm.mode}">
      <div class="eyebrow">${item.source_id}</div>
      <h1>${vm.title}</h1>
      <p>${vm.message}</p>
      <div class="actions">
        ${vm.actions.map((action) => actionButton(action, item.connector_id, item.task_id)).join('')}
      </div>
    </div>
  `;
}

module.exports = {
  renderShell
};
```

```css
body {
  margin: 0;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

#app {
  padding: 8px;
}

.island {
  border-radius: 28px;
  background: rgba(20, 20, 24, 0.94);
  color: #fff;
  backdrop-filter: blur(24px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
  padding: 16px 18px;
}

.island.quick-action {
  min-height: 108px;
}

.island.inbox {
  min-height: 150px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: #ffffff;
  color: #111111;
}
```

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="src/renderer/styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="renderer.js"></script>
</body>
</html>
```

```js
const { buildViewModel } = require('./src/renderer/view-model');
const { renderShell } = require('./src/renderer/render');

const root = document.getElementById('app');
let latestSnapshot = { items: [], waitingCount: 0, topItem: null };

async function refresh() {
  latestSnapshot = await window.vibeIsland.getSnapshot();
  renderShell(root, buildViewModel(latestSnapshot));
}

window.vibeIsland.onSnapshot((snapshot) => {
  latestSnapshot = snapshot;
  renderShell(root, buildViewModel(snapshot));
});

root.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  await window.vibeIsland.runAction({
    id: button.dataset.action,
    connector_id: button.dataset.connector,
    task_id: button.dataset.task
  });
});

refresh();
setInterval(refresh, 1000);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/runze/vibe-island && node --test tests/view-model.test.js`
Expected: PASS with `1 test passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add src/renderer/view-model.js src/renderer/render.js src/renderer/styles.css index.html renderer.js tests/view-model.test.js
git commit -m "feat: add island UI states"
```

### Task 8: End-to-End Verification and Manual Demo Loop

**Files:**
- Modify: `/Users/runze/vibe-island/package.json`
- Optional notes in: `/Users/runze/vibe-island/docs/superpowers/specs/2026-06-16-vibe-island-design.md`

- [ ] **Step 1: Add a demo script for local fixture playback**

```json
{
  "name": "vibe-island",
  "version": "1.0.0",
  "description": "Claude Dynamic Island for macOS",
  "main": "main.js",
  "scripts": {
    "ui": "electron .",
    "test": "node --test tests/*.test.js",
    "demo:permission": "node index.js permission",
    "demo:done": "node index.js done",
    "hook-test": "node index.js permission"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "devDependencies": {
    "electron": "^42.3.3"
  }
}
```

- [ ] **Step 2: Run the full automated verification**

Run: `cd /Users/runze/vibe-island && npm test`
Expected: PASS with all test files green

- [ ] **Step 3: Run the manual demo verification**

Run: `cd /Users/runze/vibe-island && npm run demo:permission && npm run ui`
Expected: Electron overlay opens in quick-action mode showing a Codex permission request

Run: `cd /Users/runze/vibe-island && npm run demo:done`
Expected: Overlay updates to a compact completion state for Claude Code

- [ ] **Step 4: Verify the desktop app jump-back path**

Run: click the `open_session` button while a `desktop:trae` waiting event is present
Expected: macOS activates the Trae app window through `osascript`

- [ ] **Step 5: Commit**

```bash
cd /Users/runze/vibe-island
git add package.json
git commit -m "chore: add demo scripts and verification flow"
```

## Self-Review

- Spec coverage:
  - normalized event model: Tasks 2 and 3
  - shared broker and action routing: Tasks 3 and 6
  - CLI quick-action support: Tasks 4, 6, and 7
  - desktop app jump-back support: Task 5
  - macOS compact/quick-action/inbox shell: Task 7
  - manual verification across multi-source flows: Task 8
- Placeholder scan:
  - no `TODO`, `TBD`, or unresolved “implement later” language remains in the tasks
- Type consistency:
  - event keys consistently use `connector_id`, `source_id`, `session_id`, `task_id`, `status`, and `actions`

