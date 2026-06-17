const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { BaseConnector } = require('./base-connector');
const { defaultActivateApp } = require('./desktop-app-connector');

function executeShellCommand(command, spawnImpl = spawn) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(command, {
      shell: true,
      stdio: 'ignore'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`command exited with ${code}`));
    });
  });
}

function buildOpenUrlCommand(url, platform = process.platform) {
  if (platform === 'darwin') {
    return {
      command: 'open',
      args: [url]
    };
  }

  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', `Start-Process '${url.replace(/'/g, "''")}'`]
    };
  }

  return {
    command: 'xdg-open',
    args: [url]
  };
}

function openUrl(url, spawnImpl = spawn, platform = process.platform) {
  return new Promise((resolve, reject) => {
    const launch = buildOpenUrlCommand(url, platform);
    const child = spawnImpl(launch.command, launch.args);

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`open url exited with ${code}`));
    });
  });
}

function createEventInboxConnector({
  id,
  filePath,
  sourceName = 'shared-inbox',
  onEvent,
  executeCommand = executeShellCommand,
  activateApp = defaultActivateApp,
  openTargetUrl = openUrl,
  maxSeenKeys = 500
}) {
  const base = new BaseConnector({
    id,
    sourceType: 'cli',
    sourceName,
    onEvent
  });

  const seenKeys = new Map();
  const eventsByTaskKey = new Map();
  let readOffset = 0;
  let pendingLine = '';
  let lastStatFingerprint = null;

  function rememberKey(key) {
    seenKeys.set(key, true);

    while (seenKeys.size > maxSeenKeys) {
      const oldestKey = seenKeys.keys().next().value;
      seenKeys.delete(oldestKey);
    }
  }

  return {
    id,
    async pollOnce(retried = false) {
      if (!fs.existsSync(filePath)) {
        readOffset = 0;
        pendingLine = '';
        lastStatFingerprint = null;
        return [];
      }

      const stats = fs.statSync(filePath);
      const statFingerprint = `${stats.dev}:${stats.ino}:${stats.size}:${stats.mtimeMs}`;

      if (
        stats.size < readOffset ||
        (lastStatFingerprint && statFingerprint !== lastStatFingerprint && stats.size <= readOffset)
      ) {
        readOffset = 0;
        pendingLine = '';
      }

      lastStatFingerprint = statFingerprint;

      const fd = fs.openSync(filePath, 'r');
      let chunk = '';

      try {
        const bytesToRead = stats.size - readOffset;
        if (bytesToRead <= 0) {
          return [];
        }

        const buffer = Buffer.alloc(bytesToRead);
        const bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, readOffset);
        readOffset += bytesRead;
        chunk = pendingLine + buffer.toString('utf8', 0, bytesRead);
      } finally {
        fs.closeSync(fd);
      }

      const segments = chunk.split(/\r?\n/u);
      pendingLine = segments.pop() || '';
      const lines = segments
        .map((line) => line.trim())
        .filter(Boolean);

      const emitted = [];

      try {
        for (const line of lines) {
          const parsed = JSON.parse(line);
          const key = parsed.event_id || `${parsed.source_id}:${parsed.session_id}:${parsed.task_id}:${parsed.status}`;

          if (seenKeys.has(key)) {
            continue;
          }

          rememberKey(key);
          const event = base.emit(parsed);
          eventsByTaskKey.set(`${event.connector_id}:${event.task_id}`, event);
          emitted.push(event);
        }
      } catch (error) {
        if (retried || error.name !== 'SyntaxError') {
          throw error;
        }

        readOffset = 0;
        pendingLine = '';
        lastStatFingerprint = null;
        return this.pollOnce(true);
      }

      return emitted;
    },
    async runAction(action) {
      if (action.id === 'dismiss') {
        return { ok: true, dismissed: true };
      }

      const taskKey = `${action.connector_id}:${action.task_id}`;
      const event = eventsByTaskKey.get(taskKey);
      const handler = event && event.action_handlers ? event.action_handlers[action.id] : null;

      if (handler && handler.kind === 'command' && handler.command) {
        await executeCommand(handler.command);
        return { ok: true };
      }

      if (handler && handler.kind === 'app' && handler.app) {
        await activateApp(handler.app);
        return { ok: true };
      }

      if (handler && handler.kind === 'url' && handler.url) {
        await openTargetUrl(handler.url);
        return { ok: true };
      }

      if (action.id === 'open_session' && event && event.jump_target && event.jump_target.kind === 'app') {
        await activateApp(event.jump_target.value);
        return { ok: true };
      }

      if (
        action.id === 'open_session' &&
        event &&
        event.jump_target &&
        ['url', 'session'].includes(event.jump_target.kind) &&
        event.jump_target.value
      ) {
        await openTargetUrl(event.jump_target.value);
        return { ok: true };
      }

      return { ok: true, action };
    }
  };
}

module.exports = {
  createEventInboxConnector,
  executeShellCommand,
  buildOpenUrlCommand,
  openUrl
};
