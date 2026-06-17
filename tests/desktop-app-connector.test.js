const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const {
  createDesktopAppConnector,
  defaultActivateApp,
  buildActivateCommand
} = require('../src/connectors/desktop-app-connector');

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
  assert.deepEqual(seen.jump_target, {
    kind: 'app',
    value: 'Trae'
  });
  assert.deepEqual(seen.actions.map((action) => action.id), ['open_session', 'dismiss']);
  await connector.runAction({ id: 'open_session' });
  assert.equal(activated, 'Trae');
  assert.deepEqual(await connector.runAction({ id: 'dismiss' }), { ok: true, dismissed: true });
});

test('defaultActivateApp rejects spawned osascript errors', async () => {
  const spawned = new EventEmitter();
  const spawnImpl = () => spawned;

  const promise = defaultActivateApp('Trae', spawnImpl, 'darwin');
  spawned.emit('error', new Error('spawn failed'));

  await assert.rejects(promise, /spawn failed/);
});

test('buildActivateCommand emits platform-specific commands', () => {
  assert.deepEqual(buildActivateCommand('Trae', 'darwin'), {
    command: 'osascript',
    args: ['-e', 'tell application "Trae" to activate']
  });

  assert.deepEqual(buildActivateCommand('Trae.exe', 'win32'), {
    command: 'powershell.exe',
    args: ['-NoProfile', '-Command', "Start-Process -FilePath 'Trae.exe'"]
  });

  assert.deepEqual(buildActivateCommand('trae', 'linux'), {
    command: 'xdg-open',
    args: ['trae']
  });
});

test('desktop connector returns unsupported for unknown actions', async () => {
  const connector = createDesktopAppConnector({
    id: 'desktop:trae',
    appName: 'Trae',
    onEvent() {},
    activateApp() {}
  });

  const result = await connector.runAction({ id: 'deny' });

  assert.deepEqual(result, { ok: false, reason: 'unsupported_action' });
});
