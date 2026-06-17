const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { defaultStatusFileFor, buildIntegrationLaunchPlan } = require('../src/shared/integration-runtime');

test('defaultStatusFileFor resolves source status path under data directory', () => {
  const cwd = '/tmp/vibe-island';
  assert.equal(defaultStatusFileFor('codex', cwd), path.join(cwd, 'data', 'codex-status.json'));
});

test('buildIntegrationLaunchPlan includes watcher and ui by default', () => {
  const cwd = '/tmp/vibe-island';
  const plan = buildIntegrationLaunchPlan({
    source: 'codex',
    cwd
  });

  assert.equal(plan.statusFile, path.join(cwd, 'data', 'codex-status.json'));
  assert.equal(plan.commands.length, 2);
  assert.equal(plan.commands[0].name, 'watch:codex');
  assert.equal(plan.commands[1].name, 'ui');
});
