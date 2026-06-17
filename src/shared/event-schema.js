const VALID_STATUSES = ['idle', 'running', 'needs_permission', 'waiting_input', 'done', 'error'];

const PRIORITY_BY_STATUS = {
  needs_permission: 100,
  waiting_input: 90,
  error: 80,
  done: 50,
  running: 10,
  idle: 0
};

const REQUIRED_EVENT_FIELDS = [
  'source_id',
  'source_type',
  'session_id',
  'task_id',
  'title',
  'status'
];

function defaultActionsFor(status) {
  if (status === 'needs_permission') {
    return [{ id: 'approve_once' }, { id: 'deny' }, { id: 'open_session' }];
  }
  if (status === 'waiting_input' || status === 'error') {
    return [{ id: 'open_session' }, { id: 'dismiss' }];
  }
  if (status === 'done') {
    return [{ id: 'open_session' }, { id: 'dismiss' }];
  }
  return [{ id: 'open_session' }];
}

function normalizeEvent(input) {
  for (const field of REQUIRED_EVENT_FIELDS) {
    if (!input[field]) {
      throw new Error(`Missing required event field: ${field}`);
    }
  }

  if (!VALID_STATUSES.includes(input.status)) {
    throw new Error(`Unknown status: ${input.status}`);
  }

  return {
    source_id: input.source_id,
    source_type: input.source_type,
    session_id: input.session_id,
    task_id: input.task_id,
    title: input.title,
    summary: input.summary || '',
    status: input.status,
    priority: input.priority ?? PRIORITY_BY_STATUS[input.status],
    timestamp: input.timestamp ?? Date.now(),
    actions: input.actions ?? defaultActionsFor(input.status),
    jump_target: input.jump_target ?? null,
    action_handlers: input.action_handlers ?? null,
    risk_level: input.risk_level ?? null,
    command_preview: input.command_preview ?? null,
    connector_id: input.connector_id ?? `${input.source_type}:${input.source_id}`
  };
}

module.exports = {
  REQUIRED_EVENT_FIELDS,
  VALID_STATUSES,
  PRIORITY_BY_STATUS,
  normalizeEvent
};
