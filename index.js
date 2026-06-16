const fs = require('node:fs');
const path = require('node:path');

const eventType = process.argv[2] || 'permission';

const fixtures = {
  permission: {
    source_id: 'codex',
    source_type: 'cli',
    session_id: 'codex-session-1',
    task_id: 'codex-perm-1',
    title: 'Codex wants shell permission',
    summary: 'npm run dev in /Users/runze/vibe-island',
    status: 'needs_permission',
    command_preview: 'npm run dev',
    jump_target: {
      kind: 'terminal',
      value: 'Codex'
    }
  },
  done: {
    source_id: 'claude-code',
    source_type: 'cli',
    session_id: 'claude-session-1',
    task_id: 'claude-done-1',
    title: 'Claude Code finished task',
    summary: 'Spec review completed',
    status: 'done',
    jump_target: {
      kind: 'terminal',
      value: 'Claude Code'
    }
  }
};

const outputPath = eventType === 'done'
  ? path.join(__dirname, 'fixtures/claude-done.json')
  : path.join(__dirname, 'fixtures/codex-permission.json');

fs.writeFileSync(
  outputPath,
  JSON.stringify(fixtures[eventType] || fixtures.permission, null, 2)
);
