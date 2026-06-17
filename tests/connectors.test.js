const test = require('node:test');
const assert = require('node:assert/strict');
const { createConnectors, createConnector } = require('../src/connectors');
const { assertConnectorDefinitions } = require('../src/connectors/definition-schema');

test('createConnectors wires cli and desktop connectors', () => {
  const connectors = createConnectors(() => {});

  assert.deepEqual(Object.keys(connectors).sort(), ['cli:claude-code', 'cli:codex', 'desktop:trae', 'inbox:shared']);
  assert.equal(connectors['cli:codex'].id, 'cli:codex');
  assert.equal(connectors['cli:claude-code'].id, 'cli:claude-code');
  assert.equal(connectors['desktop:trae'].id, 'desktop:trae');
  assert.equal(connectors['inbox:shared'].id, 'inbox:shared');
  assert.equal(typeof connectors['cli:codex'].pollOnce, 'function');
  assert.equal(typeof connectors['cli:claude-code'].runAction, 'function');
  assert.equal(typeof connectors['desktop:trae'].emitWaiting, 'function');
  assert.equal(typeof connectors['inbox:shared'].pollOnce, 'function');
});

test('createConnectors can build connectors from supplied definitions', () => {
  const connectors = createConnectors(() => {}, [
    {
      id: 'cli:test',
      kind: 'cli_json',
      sourceName: 'test',
      filePath: '/tmp/test.json'
    }
  ]);

  assert.deepEqual(Object.keys(connectors), ['cli:test']);
  assert.equal(connectors['cli:test'].id, 'cli:test');
});

test('createConnector rejects unsupported connector kinds', () => {
  assert.throws(
    () => createConnector({ id: 'x', kind: 'wat' }, () => {}),
    /Unsupported connector kind/
  );
});

test('assertConnectorDefinitions rejects duplicate ids and missing fields', () => {
  assert.throws(
    () => assertConnectorDefinitions([{ id: 'x', kind: 'cli_json' }]),
    /missing filePath/
  );

  assert.throws(
    () => assertConnectorDefinitions([
      { id: 'x', kind: 'desktop_app', appName: 'Trae' },
      { id: 'x', kind: 'desktop_app', appName: 'Trae' }
    ]),
    /Duplicate connector definition id/
  );
});
