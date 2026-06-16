const test = require('node:test');
const assert = require('node:assert/strict');
const { buildViewModel } = require('../src/renderer/view-model');

test('view model promotes waiting items to quick-action mode', () => {
  const vm = buildViewModel({
    items: [{
      connector_id: 'cli:codex',
      source_id: 'codex',
      title: 'Codex wants shell permission',
      summary: 'npm run dev',
      status: 'needs_permission',
      actions: [{ id: 'approve_once' }, { id: 'deny' }]
    }],
    waitingCount: 1
  });

  assert.equal(vm.mode, 'quick-action');
  assert.equal(vm.item.source_id, 'codex');
  assert.equal(vm.actions[0].id, 'approve_once');
});

test('view model uses inbox mode when multiple waiting items exist', () => {
  const vm = buildViewModel({
    items: [
      { source_id: 'codex', title: 'A', status: 'needs_permission', actions: [] },
      { source_id: 'claude-code', title: 'B', status: 'waiting_input', actions: [] }
    ],
    waitingCount: 2
  });

  assert.equal(vm.mode, 'inbox');
  assert.equal(vm.items.length, 2);
});
