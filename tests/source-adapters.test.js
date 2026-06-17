const test = require('node:test');
const assert = require('node:assert/strict');
const {
  adaptCodexPayload,
  adaptClaudeCodePayload,
  adaptQoderPayload,
  adaptTraePayload
} = require('../src/shared/source-adapters');

test('adaptCodexPayload maps permission_required and command fields', () => {
  const payload = adaptCodexPayload({
    state: 'permission_required',
    permission_command: 'npm run dev',
    permission_approve_cmd: 'echo approve',
    session_url: 'https://example.com/codex/1',
    conversation_id: 'codex-chat-1',
    run_id: 'run-1'
  });

  assert.equal(payload.status, 'permission');
  assert.equal(payload.summary, '准备执行 npm run dev');
  assert.equal(payload.session, 'codex-chat-1');
  assert.equal(payload.task, 'run-1');
  assert.equal(payload.approve_cmd, 'echo approve');
  assert.equal(payload.open_url, 'https://example.com/codex/1');
});

test('adaptClaudeCodePayload maps input_required and desktop app fields', () => {
  const payload = adaptClaudeCodePayload({
    state: 'input_required',
    last_response: '需要确认下一步',
    chat_id: 'claude-chat-1',
    turn_id: 'turn-1',
    desktop_app: 'Claude'
  });

  assert.equal(payload.status, 'waiting_input');
  assert.equal(payload.summary, '需要确认下一步');
  assert.equal(payload.session, 'claude-chat-1');
  assert.equal(payload.task, 'turn-1');
  assert.equal(payload.open_app, 'Claude');
});

test('adaptQoderPayload maps desktop-oriented waiting input fields', () => {
  const payload = adaptQoderPayload({
    state: 'input_required',
    last_response: '需要确认 patch',
    workspace_id: 'qoder-workspace-1',
    run_id: 'run-2'
  });

  assert.equal(payload.status, 'waiting_input');
  assert.equal(payload.summary, '需要确认 patch');
  assert.equal(payload.session, 'qoder-workspace-1');
  assert.equal(payload.task, 'run-2');
  assert.equal(payload.open_app, 'QoderMac');
});

test('adaptTraePayload maps desktop app defaults', () => {
  const payload = adaptTraePayload({
    state: 'permission_required',
    message: '准备执行终端命令',
    workspace_id: 'trae-workspace-1',
    run_id: 'run-3'
  });

  assert.equal(payload.status, 'permission');
  assert.equal(payload.summary, '准备执行终端命令');
  assert.equal(payload.session, 'trae-workspace-1');
  assert.equal(payload.task, 'run-3');
  assert.equal(payload.open_app, 'Trae');
});
