const test = require('node:test');
const assert = require('node:assert/strict');
const { bridgePayloadToEvent, normalizeBridgeStatus } = require('../src/shared/bridge-schema');

test('normalizeBridgeStatus maps common stop aliases', () => {
  assert.equal(normalizeBridgeStatus('permission'), 'needs_permission');
  assert.equal(normalizeBridgeStatus('pause'), 'waiting_input');
  assert.equal(normalizeBridgeStatus('complete'), 'done');
});

test('bridgePayloadToEvent normalizes bridge input into event protocol', () => {
  const event = bridgePayloadToEvent({
    source: 'codex',
    status: 'permission',
    title: 'Codex 请求授权',
    summary: '准备执行 npm run dev',
    approve_cmd: 'echo approve',
    open_url: 'https://example.com/session/123'
  });

  assert.equal(event.source_id, 'codex');
  assert.equal(event.status, 'needs_permission');
  assert.equal(event.action_handlers.approve_once.command, 'echo approve');
  assert.equal(event.action_handlers.open_session.url, 'https://example.com/session/123');
});
