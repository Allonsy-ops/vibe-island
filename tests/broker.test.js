const test = require('node:test');
const assert = require('node:assert/strict');
const { createBroker } = require('../src/core/broker');

test('broker sorts waiting events before done events', () => {
  const broker = createBroker();
  broker.upsert({
    source_id: 'claude',
    source_type: 'cli',
    session_id: 's1',
    task_id: 'done-1',
    title: 'Done',
    status: 'done'
  });
  broker.upsert({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's2',
    task_id: 'perm-1',
    title: 'Need permission',
    status: 'needs_permission'
  });

  const snapshot = broker.getSnapshot();
  assert.equal(snapshot.items[0].status, 'needs_permission');
  assert.equal(snapshot.waitingCount, 1);
});
