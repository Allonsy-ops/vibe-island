const path = require('node:path');
const { createCliJsonConnector } = require('./cli-json-connector');

function createConnectors(onEvent) {
  return {
    'cli:codex': createCliJsonConnector({
      id: 'cli:codex',
      sourceName: 'codex',
      filePath: path.join(__dirname, '../../fixtures/codex-permission.json'),
      onEvent
    }),
    'cli:claude-code': createCliJsonConnector({
      id: 'cli:claude-code',
      sourceName: 'claude-code',
      filePath: path.join(__dirname, '../../fixtures/claude-done.json'),
      onEvent
    })
  };
}

module.exports = {
  createConnectors
};
