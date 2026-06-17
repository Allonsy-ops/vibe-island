const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSourceStatus } = require('../scripts/write-source-status');

test('buildSourceStatus creates codex-shaped raw status payload', () => {
  const payload = buildSourceStatus({
    source: 'codex',
    state: 'permission_required',
    command: 'npm run dev',
    'approve-cmd': 'echo approve',
    'open-url': 'https://example.com/codex/1',
    session: 'codex-chat-1',
    task: 'run-1'
  });

  assert.equal(payload.state, 'permission_required');
  assert.equal(payload.permission_command, 'npm run dev');
  assert.equal(payload.permission_approve_cmd, 'echo approve');
  assert.equal(payload.session_url, 'https://example.com/codex/1');
  assert.equal(payload.conversation_id, 'codex-chat-1');
  assert.equal(payload.run_id, 'run-1');
});

test('buildSourceStatus creates claude-code-shaped raw status payload', () => {
  const payload = buildSourceStatus({
    source: 'claude-code',
    state: 'input_required',
    message: '需要确认下一步',
    'open-app': 'Claude',
    session: 'claude-chat-1',
    task: 'turn-1'
  });

  assert.equal(payload.state, 'input_required');
  assert.equal(payload.last_response, '需要确认下一步');
  assert.equal(payload.desktop_app, 'Claude');
  assert.equal(payload.chat_id, 'claude-chat-1');
  assert.equal(payload.turn_id, 'turn-1');
});

test('buildSourceStatus creates qoder-shaped raw status payload', () => {
  const payload = buildSourceStatus({
    source: 'qoder',
    state: 'input_required',
    message: '需要确认 patch',
    session: 'qoder-workspace-1',
    task: 'run-2'
  });

  assert.equal(payload.state, 'input_required');
  assert.equal(payload.last_response, '需要确认 patch');
  assert.equal(payload.desktop_app, 'QoderMac');
  assert.equal(payload.workspace_id, 'qoder-workspace-1');
  assert.equal(payload.run_id, 'run-2');
});

test('buildSourceStatus creates trae-shaped raw status payload', () => {
  const payload = buildSourceStatus({
    source: 'trae',
    state: 'input_required',
    message: '需要确认下一步',
    session: 'trae-workspace-1',
    task: 'run-3'
  });

  assert.equal(payload.state, 'input_required');
  assert.equal(payload.last_response, '需要确认下一步');
  assert.equal(payload.desktop_app, 'Trae');
  assert.equal(payload.workspace_id, 'trae-workspace-1');
  assert.equal(payload.run_id, 'run-3');
});
