const fs = require('node:fs');
const path = require('node:path');

const eventType = process.argv[2] || 'permission';
const fixturePaths = {
  permission: path.join(__dirname, 'fixtures/codex-permission.json'),
  done: path.join(__dirname, 'fixtures/claude-done.json')
};

const outputPath = fixturePaths[eventType] || fixturePaths.permission;
const fixture = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

fs.writeFileSync(
  outputPath,
  JSON.stringify(fixture, null, 2)
);
