const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEvent, PRIORITY_BY_STATUS } = require('../src/shared/event-schema');

test('normalizeEvent fills defaults for a CLI permission request', () => {
  const normalized = normalizeEvent({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'abc',
    task_id: 'task-1',
    title: 'Codex wants shell access',
    status: 'needs_permission'
  });

  assert.equal(normalized.priority, PRIORITY_BY_STATUS.needs_permission);
  assert.deepEqual(normalized.actions.map((action) => action.id), ['approve_once', 'deny', 'open_session']);
  assert.equal(typeof normalized.timestamp, 'number');
});

test('normalizeEvent rejects unknown status values', () => {
  assert.throws(
    () => normalizeEvent({ source_id: 'x', source_type: 'cli', session_id: '1', task_id: '1', title: 'bad', status: 'wat' }),
    /Unknown status/
  );
});

test('normalizeEvent rejects missing required fields', () => {
  assert.throws(
    () => normalizeEvent({ source_type: 'cli', session_id: '1', task_id: '1', title: 'bad', status: 'done' }),
    /Missing required event field: source_id/
  );
});

test('normalizeEvent preserves action handlers when provided', () => {
  const normalized = normalizeEvent({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'abc',
    task_id: 'task-2',
    title: 'Codex wants approval',
    status: 'needs_permission',
    action_handlers: {
      approve_once: {
        kind: 'command',
        command: 'echo approved'
      }
    }
  });

  assert.deepEqual(normalized.action_handlers, {
    approve_once: {
      kind: 'command',
      command: 'echo approved'
    }
  });
});
