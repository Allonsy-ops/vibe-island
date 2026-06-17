const test = require('node:test');
const assert = require('node:assert/strict');

test('app controller exports a bootstrap function', async () => {
  const controller = require('../src/main/app-controller');
  assert.equal(typeof controller.bootstrapApp, 'function');
});

test('bootstrapApp returns broker-backed methods', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  const shell = bootstrapApp({
    createWindow() {
      return { webContents: { send() {} } };
    },
    registerIpc() {},
    createConnectors() {
      return {};
    },
    setIntervalImpl() {
      return { mocked: true };
    },
    clearIntervalImpl() {}
  });

  assert.equal(typeof shell.getSnapshot, 'function');
  assert.equal(typeof shell.runAction, 'function');
  assert.equal(typeof shell.shutdown, 'function');
});

test('bootstrapApp shutdown clears polling and unregisters ipc', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let cleared = null;
  let ipcDisposed = 0;
  const pollHandle = { mocked: true };
  const shell = bootstrapApp({
    createWindow() {
      return { webContents: { send() {} } };
    },
    registerIpc() {
      return () => {
        ipcDisposed += 1;
      };
    },
    createConnectors() {
      return {};
    },
    setIntervalImpl() {
      return pollHandle;
    },
    clearIntervalImpl(handle) {
      cleared = handle;
    }
  });

  shell.shutdown();

  assert.equal(cleared, pollHandle);
  assert.equal(ipcDisposed, 1);
});

test('bootstrapApp exposes feedback opener', async () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let opened = null;
  const shell = bootstrapApp({
    createWindow() {
      return { webContents: { send() {} } };
    },
    registerIpc() {
      return () => {};
    },
    createConnectors() {
      return {};
    },
    setIntervalImpl() {
      return null;
    },
    clearIntervalImpl() {},
    openExternal(url) {
      opened = url;
      return Promise.resolve();
    }
  });

  const result = await shell.openFeedback();

  assert.deepEqual(result, { ok: true });
  assert.match(opened, /github\.com\/Allonsy-ops\/vibe-island\/issues\/new\/choose/);
});

test('bootstrapApp dismisses successful actions from the broker snapshot', async () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let dismissKey = null;
  let snapshotSent = null;
  const shell = bootstrapApp({
    createWindow() {
      return {
        webContents: {
          send(_channel, snapshot) {
            snapshotSent = snapshot;
          }
        }
      };
    },
    registerIpc() {},
    setIntervalImpl() {
      return null;
    },
    createBroker() {
      return {
        onUpdate() {},
        upsert() {},
        dismiss(key) {
          dismissKey = key;
        },
        getSnapshot() {
          return { items: [], waitingCount: 0, topItem: null };
        }
      };
    },
    createConnectors() {
      return {
        'cli:codex': {
          runAction() {
            return { ok: true };
          }
        }
      };
    }
  });

  await shell.runAction({
    id: 'approve_once',
    connector_id: 'cli:codex',
    task_id: 'codex-perm-1'
  });

  assert.equal(dismissKey, 'cli:codex:codex-perm-1');
  assert.equal(snapshotSent, null);
});

test('bootstrapApp re-shows the window when a newer snapshot arrives after manual close', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let brokerListener = null;
  let snapshot = {
    items: [],
    waitingCount: 0,
    topItem: null,
    updatedAt: 10
  };
  let showInactiveCount = 0;
  let hideCount = 0;

  const shell = bootstrapApp({
    createWindow() {
      return {
        webContents: { send() {} },
        showInactive() {
          showInactiveCount += 1;
        },
        hide() {
          hideCount += 1;
        },
        isDestroyed() {
          return false;
        }
      };
    },
    registerIpc() {},
    setIntervalImpl() {
      return null;
    },
    createBroker() {
      return {
        onUpdate(listener) {
          brokerListener = listener;
        },
        upsert() {},
        dismiss() {},
        getSnapshot() {
          return snapshot;
        },
        dispose() {}
      };
    },
    createConnectors() {
      return {};
    }
  });

  shell.closeWindow();
  assert.equal(hideCount, 1);

  brokerListener({
    items: [{
      source_id: 'codex',
      source_type: 'cli',
      session_id: 's1',
      task_id: 't1',
      title: '首次事件',
      status: 'needs_permission'
    }],
    waitingCount: 1,
    topItem: {
      source_id: 'codex',
      source_type: 'cli',
      session_id: 's1',
      task_id: 't1',
      title: '首次事件',
      status: 'needs_permission'
    },
    updatedAt: 10
  });
  assert.equal(showInactiveCount, 0);

  brokerListener({
    items: [{
      source_id: 'codex',
      source_type: 'cli',
      session_id: 's2',
      task_id: 't2',
      title: '新事件',
      status: 'waiting_input'
    }],
    waitingCount: 1,
    topItem: {
      source_id: 'codex',
      source_type: 'cli',
      session_id: 's2',
      task_id: 't2',
      title: '新事件',
      status: 'waiting_input'
    },
    updatedAt: 11
  });
  assert.equal(showInactiveCount, 1);
});

test('bootstrapApp hides the window when all items are cleared', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let brokerListener = null;
  let hideCount = 0;

  bootstrapApp({
    createWindow() {
      return {
        webContents: { send() {} },
        showInactive() {},
        hide() {
          hideCount += 1;
        },
        isDestroyed() {
          return false;
        }
      };
    },
    registerIpc() {},
    setIntervalImpl() {
      return null;
    },
    createBroker() {
      return {
        onUpdate(listener) {
          brokerListener = listener;
        },
        upsert() {},
        dismiss() {},
        getSnapshot() {
          return { items: [], waitingCount: 0, topItem: null, updatedAt: 1 };
        },
        dispose() {}
      };
    },
    createConnectors() {
      return {};
    }
  });

  brokerListener({
    items: [],
    waitingCount: 0,
    topItem: null,
    updatedAt: 2
  });

  assert.equal(hideCount, 1);
});

test('bootstrapApp auto-dismisses done snapshots after a delay', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let brokerListener = null;
  let dismissKey = null;
  let scheduled = null;

  bootstrapApp({
    autoDismissMs: 2500,
    createWindow() {
      return {
        webContents: { send() {} },
        showInactive() {},
        hide() {},
        isDestroyed() {
          return false;
        }
      };
    },
    registerIpc() {},
    setIntervalImpl() {
      return null;
    },
    setTimeoutImpl(fn, ms) {
      scheduled = { fn, ms };
      return { scheduled: true };
    },
    clearTimeoutImpl() {},
    createBroker() {
      return {
        onUpdate(listener) {
          brokerListener = listener;
        },
        upsert() {},
        dismiss(key) {
          dismissKey = key;
        },
        getSnapshot() {
          return { items: [], waitingCount: 0, topItem: null, updatedAt: 1 };
        },
        dispose() {}
      };
    },
    createConnectors() {
      return {};
    }
  });

  brokerListener({
    items: [{
      connector_id: 'cli:claude-code',
      source_id: 'claude-code',
      source_type: 'cli',
      session_id: 's1',
      task_id: 'done-1',
      title: '已完成',
      status: 'done'
    }],
    waitingCount: 0,
    topItem: {
      connector_id: 'cli:claude-code',
      source_id: 'claude-code',
      source_type: 'cli',
      session_id: 's1',
      task_id: 'done-1',
      title: '已完成',
      status: 'done'
    },
    updatedAt: 2
  });

  assert.equal(scheduled.ms, 2500);
  scheduled.fn();
  assert.equal(dismissKey, 'cli:claude-code:done-1');
});

test('bootstrapApp cancels auto-dismiss when a waiting item appears', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  let brokerListener = null;
  let clearedHandle = null;
  const handle = { scheduled: true };

  bootstrapApp({
    createWindow() {
      return {
        webContents: { send() {} },
        showInactive() {},
        hide() {},
        isDestroyed() {
          return false;
        }
      };
    },
    registerIpc() {},
    setIntervalImpl() {
      return null;
    },
    setTimeoutImpl() {
      return handle;
    },
    clearTimeoutImpl(arg) {
      clearedHandle = arg;
    },
    createBroker() {
      return {
        onUpdate(listener) {
          brokerListener = listener;
        },
        upsert() {},
        dismiss() {},
        getSnapshot() {
          return { items: [], waitingCount: 0, topItem: null, updatedAt: 1 };
        },
        dispose() {}
      };
    },
    createConnectors() {
      return {};
    }
  });

  brokerListener({
    items: [{
      connector_id: 'cli:claude-code',
      source_id: 'claude-code',
      source_type: 'cli',
      session_id: 's1',
      task_id: 'done-1',
      title: '已完成',
      status: 'done'
    }],
    waitingCount: 0,
    topItem: {
      connector_id: 'cli:claude-code',
      source_id: 'claude-code',
      source_type: 'cli',
      session_id: 's1',
      task_id: 'done-1',
      title: '已完成',
      status: 'done'
    },
    updatedAt: 2
  });

  brokerListener({
    items: [{
      connector_id: 'cli:codex',
      source_id: 'codex',
      source_type: 'cli',
      session_id: 's2',
      task_id: 'perm-1',
      title: '请求授权',
      status: 'needs_permission'
    }],
    waitingCount: 1,
    topItem: {
      connector_id: 'cli:codex',
      source_id: 'codex',
      source_type: 'cli',
      session_id: 's2',
      task_id: 'perm-1',
      title: '请求授权',
      status: 'needs_permission'
    },
    updatedAt: 3
  });

  assert.equal(clearedHandle, handle);
});
