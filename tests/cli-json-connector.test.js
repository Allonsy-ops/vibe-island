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
  assert.equal(emitted.source_type, 'cli');
  assert.equal(emitted.source_id, 'codex');
  assert.equal('priority' in emitted, false);
  assert.equal('timestamp' in emitted, false);
  assert.equal('actions' in emitted, false);
});
