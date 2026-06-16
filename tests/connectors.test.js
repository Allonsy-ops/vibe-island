const test = require('node:test');
const assert = require('node:assert/strict');
const { createConnectors } = require('../src/connectors');

test('createConnectors wires cli and desktop connectors', () => {
  const connectors = createConnectors(() => {});

  assert.deepEqual(Object.keys(connectors).sort(), ['cli:claude-code', 'cli:codex', 'desktop:trae']);
  assert.equal(connectors['cli:codex'].id, 'cli:codex');
  assert.equal(connectors['cli:claude-code'].id, 'cli:claude-code');
  assert.equal(connectors['desktop:trae'].id, 'desktop:trae');
  assert.equal(typeof connectors['cli:codex'].pollOnce, 'function');
  assert.equal(typeof connectors['cli:claude-code'].runAction, 'function');
  assert.equal(typeof connectors['desktop:trae'].emitWaiting, 'function');
});
