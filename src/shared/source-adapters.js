const { applySourcePreset } = require('./source-presets');

function adaptCodexPayload(input) {
  const rawStatus = input.status || input.state || input.phase || 'waiting';
  const commandPreview = input.command_preview || input.command || input.permission_command || '';
  const summary = input.summary || input.reason || input.message || (
    commandPreview ? `准备执行 ${commandPreview}` : undefined
  );

  return applySourcePreset('codex', {
    ...input,
    status: rawStatus === 'permission_required' ? 'permission' : rawStatus,
    summary,
    task: input.task || input.task_id || input.run_id,
    session: input.session || input.session_id || input.conversation_id,
    approve_cmd: input.approve_cmd || input.permission_approve_cmd,
    deny_cmd: input.deny_cmd || input.permission_deny_cmd,
    open_app: input.open_app,
    open_url: input.open_url || input.session_url
  });
}

function adaptClaudeCodePayload(input) {
  const rawStatus = input.status || input.state || input.phase || 'waiting';
  const summary = input.summary || input.message || input.last_response || input.reason;

  return applySourcePreset('claude-code', {
    ...input,
    status: rawStatus === 'input_required'
      ? 'waiting_input'
      : rawStatus === 'permission_required'
        ? 'permission'
        : rawStatus,
    summary,
    task: input.task || input.task_id || input.turn_id,
    session: input.session || input.session_id || input.chat_id,
    open_app: input.open_app || input.desktop_app,
    open_url: input.open_url || input.chat_url
  });
}

function adaptQoderPayload(input) {
  const rawStatus = input.status || input.state || input.phase || 'waiting';
  const summary = input.summary || input.message || input.reason || input.last_response;

  return applySourcePreset('qoder', {
    ...input,
    status: rawStatus === 'input_required'
      ? 'waiting_input'
      : rawStatus === 'permission_required'
        ? 'permission'
        : rawStatus,
    summary,
    task: input.task || input.task_id || input.turn_id || input.run_id,
    session: input.session || input.session_id || input.chat_id || input.workspace_id,
    open_app: input.open_app || input.desktop_app || input.app_name,
    open_url: input.open_url || input.session_url || input.chat_url
  });
}

function adaptTraePayload(input) {
  const rawStatus = input.status || input.state || input.phase || 'waiting';
  const summary = input.summary || input.message || input.reason || input.last_response;

  return applySourcePreset('trae', {
    ...input,
    status: rawStatus === 'input_required'
      ? 'waiting_input'
      : rawStatus === 'permission_required'
        ? 'permission'
        : rawStatus,
    summary,
    task: input.task || input.task_id || input.turn_id || input.run_id,
    session: input.session || input.session_id || input.workspace_id || input.chat_id,
    open_app: input.open_app || input.desktop_app || input.app_name,
    open_url: input.open_url || input.session_url || input.chat_url
  });
}

function adaptSourcePayload(sourceName, input) {
  if (sourceName === 'codex') {
    return adaptCodexPayload(input);
  }

  if (sourceName === 'claude-code') {
    return adaptClaudeCodePayload(input);
  }

  if (sourceName === 'qoder') {
    return adaptQoderPayload(input);
  }

  if (sourceName === 'trae') {
    return adaptTraePayload(input);
  }

  return input;
}

module.exports = {
  adaptCodexPayload,
  adaptClaudeCodePayload,
  adaptQoderPayload,
  adaptTraePayload,
  adaptSourcePayload
};
