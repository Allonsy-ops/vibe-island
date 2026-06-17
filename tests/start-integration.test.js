const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, startIntegration } = require('../scripts/start-integration');

test('parseArgs supports boolean-like flags', () => {
  assert.deepEqual(parseArgs(['--with-ui', 'false']), {
    'with-ui': 'false'
  });
});

test('startIntegration spawns planned commands', () => {
  const calls = [];
  const result = startIntegration({
    source: 'codex',
    cwd: '/tmp/vibe-island',
    withUi: false,
    spawnImpl(cmd, args, options) {
      calls.push({ cmd, args, options });
      return { pid: calls.length };
    }
  });

  assert.equal(result.plan.source, 'codex');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args[1], 'watch:codex');
  assert.equal(calls[0].options.cwd, '/tmp/vibe-island');
});
