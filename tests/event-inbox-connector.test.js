const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createEventInboxConnector,
  buildOpenUrlCommand
} = require('../src/connectors/event-inbox-connector');

function createTempFile() {
  return path.join(os.tmpdir(), `vibe-island-inbox-${Date.now()}-${Math.random()}.jsonl`);
}

test('event inbox connector emits new jsonl events and skips duplicates', async () => {
  const tempFile = createTempFile();
  const events = [];
  const connector = createEventInboxConnector({
    id: 'inbox:shared',
    filePath: tempFile,
    onEvent(event) {
      events.push(event);
    }
  });

  fs.writeFileSync(tempFile, `${JSON.stringify({
    event_id: 'evt-1',
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's1',
    task_id: 't1',
    title: 'Need approval',
    status: 'needs_permission'
  })}\n`);

  const first = await connector.pollOnce();
  fs.appendFileSync(tempFile, `${JSON.stringify({
    event_id: 'evt-2',
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's1',
    task_id: 't2',
    title: 'Need review',
    status: 'waiting_input'
  })}\n`);
  const second = await connector.pollOnce();
  const third = await connector.pollOnce();

  assert.equal(first.length, 1);
  assert.equal(first[0].connector_id, 'inbox:shared');
  assert.equal(second.length, 1);
  assert.equal(second[0].task_id, 't2');
  assert.equal(third.length, 0);
  assert.equal(events.length, 2);
});

test('event inbox connector ignores missing files', async () => {
  const connector = createEventInboxConnector({
    id: 'inbox:shared',
    filePath: createTempFile(),
    onEvent() {}
  });

  const result = await connector.pollOnce();

  assert.deepEqual(result, []);
});

test('event inbox connector runs command and app action handlers', async () => {
  const tempFile = createTempFile();
  const executed = [];
  const activated = [];

  fs.writeFileSync(tempFile, `${JSON.stringify({
    event_id: 'evt-2',
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's2',
    task_id: 't2',
    title: 'Need approval',
    status: 'needs_permission',
    action_handlers: {
      approve_once: {
        kind: 'command',
        command: 'echo approved'
      },
      open_session: {
        kind: 'app',
        app: 'Trae'
      }
    }
  })}\n`);

  const connector = createEventInboxConnector({
    id: 'inbox:shared',
    filePath: tempFile,
    onEvent() {},
    executeCommand(command) {
      executed.push(command);
      return Promise.resolve();
    },
    activateApp(appName) {
      activated.push(appName);
      return Promise.resolve();
    }
  });

  await connector.pollOnce();
  await connector.runAction({
    connector_id: 'inbox:shared',
    task_id: 't2',
    id: 'approve_once'
  });
  await connector.runAction({
    connector_id: 'inbox:shared',
    task_id: 't2',
    id: 'open_session'
  });

  assert.deepEqual(executed, ['echo approved']);
  assert.deepEqual(activated, ['Trae']);
});

test('event inbox connector opens url handlers and session jump targets', async () => {
  const tempFile = createTempFile();
  const opened = [];

  fs.writeFileSync(tempFile, `${JSON.stringify({
    event_id: 'evt-3',
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's3',
    task_id: 't3',
    title: 'Need review',
    status: 'waiting_input',
    jump_target: {
      kind: 'session',
      value: 'https://example.com/session/123'
    },
    action_handlers: {
      open_session: {
        kind: 'url',
        url: 'https://example.com/session/123'
      }
    }
  })}\n`);

  const connector = createEventInboxConnector({
    id: 'inbox:shared',
    filePath: tempFile,
    onEvent() {},
    openTargetUrl(url) {
      opened.push(url);
      return Promise.resolve();
    }
  });

  await connector.pollOnce();
  await connector.runAction({
    connector_id: 'inbox:shared',
    task_id: 't3',
    id: 'open_session'
  });

  assert.deepEqual(opened, ['https://example.com/session/123']);
});

test('buildOpenUrlCommand emits platform-specific url launch commands', () => {
  assert.deepEqual(buildOpenUrlCommand('https://example.com', 'darwin'), {
    command: 'open',
    args: ['https://example.com']
  });
  assert.deepEqual(buildOpenUrlCommand('https://example.com', 'win32'), {
    command: 'powershell.exe',
    args: ['-NoProfile', '-Command', "Start-Process 'https://example.com'"]
  });
});

test('event inbox connector recovers after source file is truncated and rewritten', async () => {
  const tempFile = createTempFile();
  const connector = createEventInboxConnector({
    id: 'inbox:shared',
    filePath: tempFile,
    onEvent() {}
  });

  fs.writeFileSync(tempFile, `${JSON.stringify({
    event_id: 'evt-10',
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's10',
    task_id: 't10',
    title: 'First',
    status: 'waiting_input'
  })}\n`);

  const first = await connector.pollOnce();

  fs.writeFileSync(tempFile, `${JSON.stringify({
    event_id: 'evt-11',
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's11',
    task_id: 't11',
    title: 'Second',
    status: 'needs_permission'
  })}\n`);

  const second = await connector.pollOnce();

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(second[0].task_id, 't11');
});
