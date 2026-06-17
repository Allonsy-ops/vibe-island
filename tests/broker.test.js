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

test('broker methods do not depend on this and snapshots retain last mutation time', () => {
  const broker = createBroker();
  const { upsert, dismiss, getSnapshot } = broker;

  upsert({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's2',
    task_id: 'perm-1',
    title: 'Need permission',
    status: 'needs_permission',
    timestamp: 123
  });

  const firstSnapshot = getSnapshot();
  const secondSnapshot = getSnapshot();

  assert.equal(firstSnapshot.updatedAt, secondSnapshot.updatedAt);
  assert.equal(firstSnapshot.items.length, 1);

  dismiss('cli:codex:perm-1');

  const afterDismiss = getSnapshot();
  assert.equal(afterDismiss.items.length, 0);
  assert.ok(afterDismiss.updatedAt >= firstSnapshot.updatedAt);
});

test('broker onUpdate returns an unsubscribe function', () => {
  const broker = createBroker();
  let count = 0;
  const unsubscribe = broker.onUpdate(() => {
    count += 1;
  });

  broker.upsert({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's2',
    task_id: 'perm-1',
    title: 'Need permission',
    status: 'needs_permission'
  });

  unsubscribe();

  broker.upsert({
    source_id: 'codex',
    source_type: 'cli',
    session_id: 's2',
    task_id: 'perm-2',
    title: 'Need permission',
    status: 'needs_permission'
  });

  assert.equal(count, 1);
});
