const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    result[key] = value;
    index += 1;
  }

  return result;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function buildSourceStatus(args) {
  const source = args.source || 'codex';

  if (source === 'codex') {
    return {
      state: args.state || 'permission_required',
      permission_command: args.command || 'npm run dev',
      permission_approve_cmd: args['approve-cmd'] || 'echo approve',
      permission_deny_cmd: args['deny-cmd'] || 'echo deny',
      session_url: args['open-url'] || '',
      conversation_id: args.session || 'codex-session',
      run_id: args.task || `codex-${Date.now()}`
    };
  }

  if (source === 'claude-code') {
    return {
      state: args.state || 'input_required',
      last_response: args.message || '需要确认下一步',
      chat_url: args['open-url'] || '',
      chat_id: args.session || 'claude-session',
      turn_id: args.task || `claude-${Date.now()}`,
      desktop_app: args['open-app'] || 'Claude'
    };
  }

  if (source === 'qoder') {
    return {
      state: args.state || 'input_required',
      last_response: args.message || '需要确认下一步',
      session_url: args['open-url'] || '',
      workspace_id: args.session || 'qoder-session',
      run_id: args.task || `qoder-${Date.now()}`,
      desktop_app: args['open-app'] || 'QoderMac'
    };
  }

  if (source === 'trae') {
    return {
      state: args.state || 'input_required',
      last_response: args.message || '需要确认下一步',
      session_url: args['open-url'] || '',
      workspace_id: args.session || 'trae-session',
      run_id: args.task || `trae-${Date.now()}`,
      desktop_app: args['open-app'] || 'Trae'
    };
  }

  return {
    status: args.state || 'waiting',
    summary: args.message || '模型已停下',
    session_id: args.session || `${source}-session`,
    task_id: args.task || `${source}-${Date.now()}`
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    throw new Error('write-source-status requires --file');
  }

  const payload = buildSourceStatus(args);
  const outputFile = path.resolve(args.file);

  ensureParentDir(outputFile);
  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2));
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSourceStatus
};
