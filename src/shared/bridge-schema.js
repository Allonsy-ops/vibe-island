function normalizeBridgeStatus(input) {
  return {
    permission: 'needs_permission',
    approve: 'needs_permission',
    waiting: 'waiting_input',
    pause: 'waiting_input',
    stopped: 'waiting_input',
    done: 'done',
    complete: 'done',
    error: 'error'
  }[input] || input;
}

function buildActionHandlers(args) {
  return {
    ...(args.approveCmd ? {
      approve_once: {
        kind: 'command',
        command: args.approveCmd
      }
    } : {}),
    ...(args.denyCmd ? {
      deny: {
        kind: 'command',
        command: args.denyCmd
      }
    } : {}),
    ...(args.openApp ? {
      open_session: {
        kind: 'app',
        app: args.openApp
      }
    } : {}),
    ...(args.openUrl ? {
      open_session: {
        kind: 'url',
        url: args.openUrl
      }
    } : {}),
    ...(args.openCmd ? {
      open_session: {
        kind: 'command',
        command: args.openCmd
      }
    } : {})
  };
}

function bridgePayloadToEvent(input) {
  const sourceId = input.source || input.source_id || 'unknown';
  const sourceType = input.type || input.source_type || 'cli';
  const status = normalizeBridgeStatus(input.status || 'waiting_input');
  const taskId = input.task || input.task_id || `${sourceId}-${Date.now()}`;
  const sessionId = input.session || input.session_id || `${sourceId}-session`;

  return {
    event_id: input.event_id || `${taskId}:${status}:${Date.now()}`,
    source_id: sourceId,
    source_type: sourceType,
    session_id: sessionId,
    task_id: taskId,
    title: input.title || (
      status === 'needs_permission'
        ? `${sourceId} 请求授权`
        : status === 'waiting_input'
          ? `${sourceId} 等待处理`
          : `${sourceId} 已停下`
    ),
    summary: input.summary || (
      status === 'done'
        ? '任务已完成，等待你查看结果'
        : status === 'waiting_input'
          ? '需要你返回会话继续处理'
          : '模型已暂停，等待你确认下一步'
    ),
    status,
    action_handlers: input.action_handlers || buildActionHandlers({
      approveCmd: input.approveCmd || input.approve_cmd,
      denyCmd: input.denyCmd || input.deny_cmd,
      openApp: input.openApp || input.open_app,
      openUrl: input.openUrl || input.open_url,
      openCmd: input.openCmd || input.open_cmd
    }),
    jump_target: input.jump_target || (
      input.jump
        ? { kind: sourceType === 'desktop' ? 'app' : 'session', value: input.jump }
        : null
    )
  };
}

module.exports = {
  normalizeBridgeStatus,
  bridgePayloadToEvent,
  buildActionHandlers
};
