const { createBroker } = require('../core/broker');
const { createActionRunner } = require('../core/action-runner');
const { createConnectors } = require('../connectors');
const { createOverlayWindow } = require('./window');
const { registerIpc } = require('./ipc');
const appConfig = require('../../config/app');

function bootstrapApp(deps = {}) {
  const broker = (deps.createBroker || createBroker)();
  const connectors = (deps.createConnectors || createConnectors)((event) => broker.upsert(event));
  const actionRunner = (deps.createActionRunner || createActionRunner)(connectors);
  const createWindow = deps.createWindow || createOverlayWindow;
  const registerIpcImpl = deps.registerIpc || registerIpc;
  const setIntervalImpl = deps.setIntervalImpl || setInterval;
  const clearIntervalImpl = deps.clearIntervalImpl || clearInterval;
  const setTimeoutImpl = deps.setTimeoutImpl || setTimeout;
  const clearTimeoutImpl = deps.clearTimeoutImpl || clearTimeout;
  const pollIntervalMs = deps.pollIntervalMs || 1000;
  const autoDismissMs = deps.autoDismissMs || 4000;
  const win = createWindow();
  let stopped = false;
  let hiddenAfterUpdateAt = null;
  const autoDismissHandles = new Map();

  function showWindow() {
    if (!win || win.isDestroyed()) {
      return;
    }

    if (typeof win.showInactive === 'function') {
      win.showInactive();
      return;
    }

    if (typeof win.show === 'function') {
      win.show();
    }
  }

  function hideWindow() {
    if (!win || win.isDestroyed()) {
      return;
    }

    if (typeof win.hide === 'function') {
      win.hide();
    }
  }

  function shouldShowSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.items) || snapshot.items.length === 0) {
      return false;
    }

    if (hiddenAfterUpdateAt == null) {
      return true;
    }

    return snapshot.updatedAt > hiddenAfterUpdateAt;
  }

  function clearAutoDismiss(taskKey) {
    const handle = autoDismissHandles.get(taskKey);
    if (handle) {
      clearTimeoutImpl(handle);
      autoDismissHandles.delete(taskKey);
    }
  }

  function syncAutoDismiss(snapshot) {
    const visibleKeys = new Set();

    for (const item of snapshot.items || []) {
      const taskKey = `${item.connector_id}:${item.task_id}`;
      visibleKeys.add(taskKey);

      const shouldAutoDismiss =
        snapshot.waitingCount === 0 &&
        (item.status === 'done' || item.status === 'error');

      if (!shouldAutoDismiss) {
        clearAutoDismiss(taskKey);
        continue;
      }

      if (autoDismissHandles.has(taskKey)) {
        continue;
      }

      const handle = setTimeoutImpl(() => {
        autoDismissHandles.delete(taskKey);
        broker.dismiss(taskKey);
      }, autoDismissMs);
      autoDismissHandles.set(taskKey, handle);
    }

    for (const taskKey of autoDismissHandles.keys()) {
      if (!visibleKeys.has(taskKey)) {
        clearAutoDismiss(taskKey);
      }
    }
  }

  async function runAction(action) {
    const result = await actionRunner.run(action);

    if (result && result.ok && action.task_id && !result.keepVisible) {
      broker.dismiss(`${action.connector_id}:${action.task_id}`);
    }

    return result;
  }

  function closeWindow() {
    hiddenAfterUpdateAt = broker.getSnapshot().updatedAt;
    hideWindow();

    return { ok: true };
  }

  async function openFeedback() {
    if (deps.openExternal) {
      await deps.openExternal(appConfig.feedbackUrl);
      return { ok: true };
    }

    return { ok: false, reason: 'feedback_unavailable' };
  }

  const unsubscribeBroker = broker.onUpdate((snapshot) => {
    syncAutoDismiss(snapshot);

    if (win && win.webContents && typeof win.webContents.send === 'function') {
      win.webContents.send('vibe:snapshot', snapshot);
    }

    if (shouldShowSnapshot(snapshot)) {
      showWindow();
      return;
    }

    if (!snapshot || !Array.isArray(snapshot.items) || snapshot.items.length === 0) {
      hideWindow();
    }
  });

  const unregisterIpc = registerIpcImpl({
    getSnapshot: () => broker.getSnapshot(),
    runAction,
    closeWindow,
    openFeedback
  });

  async function pollConnectors() {
    if (stopped) {
      return;
    }

    await Promise.all(
      Object.values(connectors).map(async (connector) => {
        if (typeof connector.pollOnce === 'function') {
          await connector.pollOnce();
        }
      })
    );
  }

  pollConnectors().catch(() => {});
  const pollHandle = setIntervalImpl(() => {
    pollConnectors().catch(() => {});
  }, pollIntervalMs);

  function shutdown() {
    stopped = true;
    if (pollHandle) {
      clearIntervalImpl(pollHandle);
    }
    if (typeof unregisterIpc === 'function') {
      unregisterIpc();
    }
    if (typeof unsubscribeBroker === 'function') {
      unsubscribeBroker();
    }
    for (const taskKey of autoDismissHandles.keys()) {
      clearAutoDismiss(taskKey);
    }
    if (broker && typeof broker.dispose === 'function') {
      broker.dispose();
    }
  }

  return {
    started: true,
    broker,
    connectors,
    pollHandle,
    getSnapshot() {
      return broker.getSnapshot();
    },
    runAction,
    closeWindow,
    openFeedback,
    shutdown
  };
}

module.exports = {
  bootstrapApp
};
