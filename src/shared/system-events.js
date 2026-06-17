(function initSystemEvents(globalScope) {
  function createSystemItem({
    taskId = 'system-message',
    title,
    summary,
    status = 'error',
    actions = [{ id: 'dismiss' }]
  }) {
    return {
      source_id: 'hub',
      source_type: 'system',
      session_id: 'system',
      task_id: taskId,
      title,
      summary,
      status,
      actions,
      connector_id: 'system:hub',
      timestamp: Date.now(),
      priority: 999
    };
  }

  function createSystemSnapshot(item) {
    return {
      items: [item],
      waitingCount: ['needs_permission', 'waiting_input'].includes(item.status) ? 1 : 0,
      topItem: item,
      updatedAt: Date.now()
    };
  }

  const api = {
    createSystemItem,
    createSystemSnapshot
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.VibeIslandSystemEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
