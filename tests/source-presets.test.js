const test = require('node:test');
const assert = require('node:assert/strict');
const { applySourcePreset } = require('../src/shared/source-presets');

test('applySourcePreset fills codex defaults', () => {
  const payload = applySourcePreset('codex', {
    status: 'permission',
    summary: '准备执行 npm run dev'
  });

  assert.equal(payload.source, 'codex');
  assert.equal(payload.source_type, 'cli');
  assert.equal(payload.session, 'codex-session');
  assert.equal(payload.title, 'Codex 请求授权');
});

test('applySourcePreset preserves explicit values', () => {
  const payload = applySourcePreset('claude-code', {
    source: 'custom',
    source_type: 'desktop',
    session: 'custom-session',
    title: 'Custom title',
    status: 'done'
  });

  assert.equal(payload.source, 'custom');
  assert.equal(payload.source_type, 'desktop');
  assert.equal(payload.session, 'custom-session');
  assert.equal(payload.title, 'Custom title');
});

test('applySourcePreset fills qoder desktop defaults', () => {
  const payload = applySourcePreset('qoder', {
    status: 'waiting_input'
  });

  assert.equal(payload.source, 'qoder');
  assert.equal(payload.source_type, 'desktop');
  assert.equal(payload.session, 'qoder-session');
  assert.equal(payload.open_app, 'QoderMac');
  assert.equal(payload.title, 'Qoder 等待处理');
});
