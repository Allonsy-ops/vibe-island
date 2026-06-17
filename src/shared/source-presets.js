const PRESETS = {
  codex: {
    source: 'codex',
    sourceType: 'cli',
    sessionPrefix: 'codex',
    waitingTitle: 'Codex 等待处理',
    permissionTitle: 'Codex 请求授权',
    doneTitle: 'Codex 已停下'
  },
  'claude-code': {
    source: 'claude-code',
    sourceType: 'cli',
    sessionPrefix: 'claude-code',
    waitingTitle: 'Claude Code 等待处理',
    permissionTitle: 'Claude Code 请求授权',
    doneTitle: 'Claude Code 已停下'
  },
  qoder: {
    source: 'qoder',
    sourceType: 'desktop',
    sessionPrefix: 'qoder',
    waitingTitle: 'Qoder 等待处理',
    permissionTitle: 'Qoder 请求授权',
    doneTitle: 'Qoder 已停下',
    defaultApp: 'QoderMac'
  },
  trae: {
    source: 'trae',
    sourceType: 'desktop',
    sessionPrefix: 'trae',
    waitingTitle: 'Trae 等待处理',
    permissionTitle: 'Trae 请求授权',
    doneTitle: 'Trae 已停下',
    defaultApp: 'Trae'
  }
};

function getSourcePreset(name) {
  return PRESETS[name] || null;
}

function applySourcePreset(name, payload) {
  const preset = getSourcePreset(name);

  if (!preset) {
    return payload;
  }

  const status = payload.status;
  const title = payload.title || (
    status === 'needs_permission' || status === 'permission'
      ? preset.permissionTitle
      : status === 'waiting_input' || status === 'waiting' || status === 'pause'
        ? preset.waitingTitle
        : preset.doneTitle
  );

  return {
    ...payload,
    source: payload.source || preset.source,
    source_type: payload.source_type || preset.sourceType,
    session: payload.session || `${preset.sessionPrefix}-session`,
    open_app: payload.open_app || preset.defaultApp,
    title
  };
}

module.exports = {
  PRESETS,
  getSourcePreset,
  applySourcePreset
};
