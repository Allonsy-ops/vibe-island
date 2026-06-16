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
