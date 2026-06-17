const path = require('node:path');

module.exports = [
  {
    id: 'inbox:shared',
    kind: 'event_inbox',
    sourceName: 'shared-inbox',
    filePath: path.join(__dirname, '../data/events.jsonl')
  },
  {
    id: 'cli:codex',
    kind: 'cli_json',
    sourceName: 'codex',
    filePath: path.join(__dirname, '../fixtures/codex-permission.json')
  },
  {
    id: 'cli:claude-code',
    kind: 'cli_json',
    sourceName: 'claude-code',
    filePath: path.join(__dirname, '../fixtures/claude-done.json')
  },
  {
    id: 'desktop:trae',
    kind: 'desktop_app',
    appName: 'Trae'
  }
];
