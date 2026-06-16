const fs = require('node:fs');
const { BaseConnector } = require('./base-connector');

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
      if (raw === lastPayload) return null;

      lastPayload = raw;
      const parsed = JSON.parse(raw);
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
