const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createPresetBridge } = require('../scripts/watch-source');

function createTempFile(name) {
  return path.join(os.tmpdir(), `vibe-island-${name}-${Date.now()}-${Math.random()}.json`);
}

test('createPresetBridge applies source preset before bridging', () => {
  const sourceFile = createTempFile('preset-source');
  const outputFile = createTempFile('preset-out');

  fs.writeFileSync(sourceFile, JSON.stringify({
    state: 'permission_required',
    permission_command: 'npm run dev'
  }));

  const bridge = createPresetBridge('codex', {
    file: sourceFile,
    out: outputFile
  });

  const event = bridge.bridgeOnce();
  const written = JSON.parse(fs.readFileSync(outputFile, 'utf8').trim());

  assert.equal(event.source_id, 'codex');
  assert.equal(event.title, 'Codex 请求授权');
  assert.equal(event.summary, '准备执行 npm run dev');
  assert.equal(written.source_id, 'codex');
});
