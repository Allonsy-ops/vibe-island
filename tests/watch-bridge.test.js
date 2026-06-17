const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createWatchBridge } = require('../scripts/watch-bridge');

function createTempFile(name) {
  return path.join(os.tmpdir(), `vibe-island-${name}-${Date.now()}-${Math.random()}.json`);
}

test('watch bridge converts source json into inbox event and skips unchanged payloads', () => {
  const sourceFile = createTempFile('source');
  const outputFile = createTempFile('out');

  fs.writeFileSync(sourceFile, JSON.stringify({
    source: 'codex',
    status: 'permission',
    title: 'Codex 请求授权',
    summary: '准备执行 npm run dev'
  }));

  const bridge = createWatchBridge({
    inputFile: sourceFile,
    outputFile
  });

  const first = bridge.bridgeOnce();
  const second = bridge.bridgeOnce();
  const written = fs.readFileSync(outputFile, 'utf8').trim().split(/\r?\n/u);

  assert.equal(first.status, 'needs_permission');
  assert.equal(second, null);
  assert.equal(written.length, 1);
});

test('watch bridge falls back to polling when fs.watch hits EMFILE', () => {
  const sourceFile = createTempFile('fallback-source');
  const outputFile = createTempFile('fallback-out');
  const watched = [];
  const unwatched = [];

  fs.writeFileSync(sourceFile, JSON.stringify({
    source: 'codex',
    status: 'permission',
    title: 'Codex 请求授权'
  }));

  const bridge = createWatchBridge({
    inputFile: sourceFile,
    outputFile,
    watchImpl() {
      const error = new Error('too many open files');
      error.code = 'EMFILE';
      throw error;
    },
    watchFileImpl(filePath) {
      watched.push(filePath);
    },
    unwatchFileImpl(filePath) {
      unwatched.push(filePath);
    }
  });

  const running = bridge.start();
  running.close();

  assert.deepEqual(watched, [sourceFile]);
  assert.deepEqual(unwatched, [sourceFile]);
});
