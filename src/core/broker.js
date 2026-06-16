const { EventEmitter } = require('node:events');
const { normalizeEvent } = require('../shared/event-schema');

function createBroker() {
  const emitter = new EventEmitter();
  const items = new Map();

  function sortItems(list) {
    return list.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.timestamp - a.timestamp;
    });
  }

  return {
    onUpdate(listener) {
      emitter.on('update', listener);
    },
    upsert(event) {
      const normalized = normalizeEvent(event);
      items.set(`${normalized.connector_id}:${normalized.task_id}`, normalized);
      emitter.emit('update', this.getSnapshot());
      return normalized;
    },
    dismiss(taskKey) {
      items.delete(taskKey);
      emitter.emit('update', this.getSnapshot());
    },
    getSnapshot() {
      const list = sortItems([...items.values()]);
      return {
        items: list,
        topItem: list[0] || null,
        waitingCount: list.filter((item) => ['needs_permission', 'waiting_input'].includes(item.status)).length,
        updatedAt: Date.now()
      };
    }
  };
}

module.exports = {
  createBroker
};
