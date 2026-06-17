const fs = require('node:fs');
const path = require('node:path');

const eventType = process.argv[2] || 'permission';
const fixturePaths = {
  permission: path.join(__dirname, '../fixtures/codex-permission.json'),
  done: path.join(__dirname, '../fixtures/claude-done.json')
};

const outputPath = fixturePaths[eventType] || fixturePaths.permission;
const fixture = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

if (eventType === 'permission') {
  fixture.title = 'Codex 请求执行命令';
  fixture.summary = '准备执行 npm run dev';
}

if (eventType === 'done') {
  fixture.title = 'Claude Code 已完成任务';
  fixture.summary = '规格审查已完成';
}

fs.writeFileSync(
  outputPath,
  JSON.stringify(fixture, null, 2)
);
