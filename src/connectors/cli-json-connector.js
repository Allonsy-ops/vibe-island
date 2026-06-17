const fs = require('node:fs');
const { BaseConnector } = require('./base-connector');

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }

  return value;
}

function createCliJsonConnector({ id, filePath, sourceName = 'cli', onEvent }) {
  const base = new BaseConnector({
    id,
    sourceType: 'cli',
    sourceName,
    onEvent
  });

  let lastPayload = null;
  let lastErrorKey = null;

  return {
    id,
    async pollOnce() {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const payloadKey = JSON.stringify(canonicalize(parsed));
        if (payloadKey === lastPayload) return null;

        lastPayload = payloadKey;
        lastErrorKey = null;
        return base.emit(parsed);
      } catch (error) {
        const errorKey = `${error.code || error.name}:${error.message}`;
        if (errorKey === lastErrorKey) {
          return null;
        }

        lastErrorKey = errorKey;
        return base.emit({
          session_id: `${id}:connector`,
          task_id: `${id}:connector-error`,
          title: `${sourceName} 连接异常`,
          summary: error.code === 'ENOENT'
            ? `未找到事件文件：${filePath}`
            : `读取事件失败：${error.message}`,
          status: 'error',
          actions: [{ id: 'dismiss' }]
        });
      }
    },
    async runAction(action) {
      if (action.id === 'dismiss') {
        return { ok: true, dismissed: true };
      }

      return { ok: true, action };
    }
  };
}

module.exports = {
  createCliJsonConnector
};
