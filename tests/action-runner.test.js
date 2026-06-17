const test = require('node:test');
const assert = require('node:assert/strict');
const { createActionRunner, validateAction } = require('../src/core/action-runner');

test('action runner dispatches to the correct connector', async () => {
  let seen = null;
  const runner = createActionRunner({
    'cli:codex': {
      runAction(action) {
        seen = action;
      }
    }
  });

  await runner.run({
    connector_id: 'cli:codex',
    id: 'approve_once',
    task_id: 'perm-1'
  });

  assert.deepEqual(seen, {
    connector_id: 'cli:codex',
    id: 'approve_once',
    task_id: 'perm-1'
  });
});

test('action runner throws when the connector is missing', async () => {
  const runner = createActionRunner({});

  await assert.rejects(
    runner.run({
      connector_id: 'cli:missing',
      id: 'approve_once',
      task_id: 'perm-1'
    }),
    /Missing connector: cli:missing/
  );
});

test('validateAction rejects malformed actions', () => {
  assert.throws(() => validateAction(null), /must be an object/);
  assert.throws(() => validateAction({ id: 'approve_once' }), /missing connector_id/);
  assert.throws(() => validateAction({ connector_id: 'cli:codex' }), /missing id/);
});
