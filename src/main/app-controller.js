const { createBroker } = require('../core/broker');
const { createActionRunner } = require('../core/action-runner');
const { createConnectors } = require('../connectors');
const { createOverlayWindow } = require('./window');
const { registerIpc } = require('./ipc');

function bootstrapApp(deps = {}) {
  const broker = (deps.createBroker || createBroker)();
  const connectors = (deps.createConnectors || createConnectors)((event) => broker.upsert(event));
  const actionRunner = (deps.createActionRunner || createActionRunner)(connectors);
  const createWindow = deps.createWindow || createOverlayWindow;
  const registerIpcImpl = deps.registerIpc || registerIpc;
  const setIntervalImpl = deps.setIntervalImpl || setInterval;
  const pollIntervalMs = deps.pollIntervalMs || 1000;
  const win = createWindow();

  async function runAction(action) {
    const result = await actionRunner.run(action);

    if (action.id === 'dismiss' && result && result.ok) {
      broker.dismiss(`${action.connector_id}:${action.task_id}`);
    }

    return result;
  }

  broker.onUpdate((snapshot) => {
    if (win && win.webContents && typeof win.webContents.send === 'function') {
      win.webContents.send('vibe:snapshot', snapshot);
    }
  });

  registerIpcImpl({
    getSnapshot: () => broker.getSnapshot(),
    runAction
  });

  async function pollConnectors() {
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

  return {
    started: true,
    broker,
    connectors,
    pollHandle,
    getSnapshot() {
      return broker.getSnapshot();
    },
    runAction
  };
}

module.exports = {
  bootstrapApp
};
