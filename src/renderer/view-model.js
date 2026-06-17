(function initViewModel(globalScope) {
  function actionLabel(actionId) {
    return {
      approve_once: '允许一次',
      deny: '拒绝',
      open_session: '前往会话',
      dismiss: '关闭',
      snooze: '稍后提醒'
    }[actionId] || actionId;
  }

  function sourceLabel(sourceId) {
    return {
      codex: 'Codex',
      'claude-code': 'Claude Code',
      qoder: 'Qoder',
      trae: 'Trae',
      Trae: 'Trae',
      QoderMac: 'Qoder',
      Qoder: 'Qoder',
      hub: '消息中心'
    }[sourceId] || sourceId;
  }

  function modeLabel(mode) {
    return {
      idle: '待命',
      inbox: '待处理',
      compact: '状态提醒',
      'quick-action': '快速处理'
    }[mode] || mode;
  }

  function localizeTitle(item) {
    if (!item) {
      return 'Vibe Island';
    }

    if (item.status === 'needs_permission') {
      return `${sourceLabel(item.source_id)} 请求授权`;
    }

    if (item.status === 'waiting_input') {
      return `${sourceLabel(item.source_id)} 等待处理`;
    }

    if (item.status === 'done') {
      return `${sourceLabel(item.source_id)} 已完成`;
    }

    if (item.status === 'error') {
      return `${sourceLabel(item.source_id)} 出错了`;
    }

    return item.title;
  }

  function localizeMessage(item) {
    if (!item) {
      return '等待 AI 状态更新';
    }

    if (item.summary) {
      return item.summary;
    }

    return {
      needs_permission: '请确认是否继续执行',
      waiting_input: '需要你继续处理',
      done: '这项任务已经处理完成',
      error: '请回到会话查看详情',
      running: '正在执行中'
    }[item.status] || item.status;
  }

  function decorateActions(actions) {
    return (actions || []).map((action) => ({
      ...action,
      label: actionLabel(action.id)
    }));
  }

  function buildViewModel(snapshot) {
    const items = snapshot && Array.isArray(snapshot.items) ? snapshot.items : [];
    const waitingCount = snapshot && typeof snapshot.waitingCount === 'number'
      ? snapshot.waitingCount
      : 0;
    const topItem = snapshot && snapshot.topItem
      ? snapshot.topItem
      : items[0] || null;

    if (!topItem) {
      return {
        mode: 'idle',
        title: 'Vibe Island',
        message: '等待 AI 状态更新',
        actions: [],
        item: null,
        modeLabel: modeLabel('idle')
      };
    }

    if (waitingCount > 1) {
      return {
        mode: 'inbox',
        title: `有 ${waitingCount} 个会话需要处理`,
        message: localizeTitle(topItem),
        items: items.map((item) => ({
          ...item,
          sourceLabel: sourceLabel(item.source_id)
        })),
        item: topItem,
        actions: decorateActions(topItem.actions),
        modeLabel: modeLabel('inbox')
      };
    }

    if (topItem.status === 'needs_permission' || topItem.status === 'waiting_input') {
      return {
        mode: 'quick-action',
        title: localizeTitle(topItem),
        message: localizeMessage(topItem),
        item: topItem,
        actions: decorateActions(topItem.actions),
        modeLabel: modeLabel('quick-action')
      };
    }

    return {
      mode: 'compact',
      title: localizeTitle(topItem),
      message: localizeMessage(topItem),
      item: topItem,
      actions: decorateActions(topItem.actions),
      modeLabel: modeLabel('compact')
    };
  }

  const api = {
    buildViewModel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.VibeIslandViewModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
