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

  return {
    id,
    async pollOnce() {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const payloadKey = JSON.stringify(canonicalize(parsed));
      if (payloadKey === lastPayload) return null;

      lastPayload = payloadKey;
      return base.emit(parsed);
    },
    async runAction(action) {
      return { ok: true, action };
    }
  };
}

module.exports = {
  createCliJsonConnector
};
