(function initViewModel(globalScope) {
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
        message: 'Waiting for AI activity',
        actions: [],
        item: null
      };
    }

    if (waitingCount > 1) {
      return {
        mode: 'inbox',
        title: `${waitingCount} agents need attention`,
        message: topItem.title,
        items,
        item: topItem,
        actions: topItem.actions || []
      };
    }

    if (topItem.status === 'needs_permission' || topItem.status === 'waiting_input') {
      return {
        mode: 'quick-action',
        title: topItem.title,
        message: topItem.summary || topItem.status,
        item: topItem,
        actions: topItem.actions || []
      };
    }

    return {
      mode: 'compact',
      title: topItem.title,
      message: topItem.summary || topItem.status,
      item: topItem,
      actions: topItem.actions || []
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
