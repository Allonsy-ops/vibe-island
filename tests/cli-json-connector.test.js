const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCliJsonConnector } = require('../src/connectors/cli-json-connector');
const { createConnectors } = require('../src/connectors');

function createTempFile() {
  return path.join(os.tmpdir(), `vibe-island-${Date.now()}-${Math.random()}.json`);
}

test('cli connector reads a JSON fixture and emits a normalized event', async () => {
  const tempFile = createTempFile();
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
  assert.equal(emitted.source_type, 'cli');
  assert.equal(emitted.source_id, 'codex');
  assert.equal('priority' in emitted, false);
  assert.equal('timestamp' in emitted, false);
  assert.equal('actions' in emitted, false);
});

test('cli connector does not re-emit when the parsed payload is unchanged', async () => {
  const tempFile = createTempFile();
  const payload = {
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'abc',
    task_id: 'perm-1',
    title: 'Need approval',
    status: 'needs_permission'
  };
  const events = [];

  fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2));

  const connector = createCliJsonConnector({
    id: 'cli:codex',
    filePath: tempFile,
    onEvent(event) {
      events.push(event);
    }
  });

  const firstResult = await connector.pollOnce();

  fs.writeFileSync(
    tempFile,
    `{"task_id":"perm-1","title":"Need approval","status":"needs_permission","session_id":"abc","source_type":"cli","source_id":"codex"}`
  );

  const secondResult = await connector.pollOnce();

  assert.equal(firstResult.status, 'needs_permission');
  assert.equal(secondResult, null);
  assert.equal(events.length, 1);
});

test('cli connector runAction acknowledges the action', async () => {
  const connector = createCliJsonConnector({
    id: 'cli:codex',
    filePath: createTempFile(),
    onEvent() {}
  });
  const action = {
    connector_id: 'cli:codex',
    id: 'approve_once',
    task_id: 'perm-1'
  };

  const result = await connector.runAction(action);

  assert.deepEqual(result, { ok: true, action });
});

test('createConnectors wires codex and claude CLI connectors', () => {
  const connectors = createConnectors(() => {});

  assert.deepEqual(Object.keys(connectors).sort(), ['cli:claude-code', 'cli:codex']);
  assert.equal(connectors['cli:codex'].id, 'cli:codex');
  assert.equal(connectors['cli:claude-code'].id, 'cli:claude-code');
  assert.equal(typeof connectors['cli:codex'].pollOnce, 'function');
  assert.equal(typeof connectors['cli:claude-code'].runAction, 'function');
});
