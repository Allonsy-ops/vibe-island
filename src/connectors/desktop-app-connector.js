const { spawn } = require('node:child_process');
const { BaseConnector } = require('./base-connector');

function buildActivateCommand(appName, platform = process.platform) {
  if (platform === 'darwin') {
    const safeAppName = appName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return {
      command: 'osascript',
      args: ['-e', `tell application "${safeAppName}" to activate`]
    };
  }

  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-Command',
        `Start-Process -FilePath '${appName.replace(/'/g, "''")}'`
      ]
    };
  }

  return {
    command: 'xdg-open',
    args: [appName]
  };
}

function defaultActivateApp(appName, spawnImpl = spawn, platform = process.platform) {
  return new Promise((resolve, reject) => {
    const activation = buildActivateCommand(appName, platform);
    const child = spawnImpl(activation.command, activation.args);

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`osascript exited with ${code}`));
    });
  });
}

function createDesktopAppConnector({ id, appName, onEvent, activateApp = defaultActivateApp }) {
  const base = new BaseConnector({
    id,
    sourceType: 'desktop',
    sourceName: appName,
    onEvent
  });

  return {
    id,
    emitWaiting(payload) {
      base.emit({
        ...payload,
        source_id: appName,
        source_type: 'desktop',
        status: 'waiting_input',
        jump_target: {
          kind: 'app',
          value: appName
        },
        actions: [{ id: 'open_session' }, { id: 'dismiss' }]
      });
    },
    async runAction(action) {
      if (action.id === 'open_session') {
        await activateApp(appName);
        return { ok: true };
      }

      if (action.id === 'dismiss') {
        return { ok: true, dismissed: true };
      }

      return { ok: false, reason: 'unsupported_action' };
    }
  };
}

module.exports = {
  createDesktopAppConnector,
  defaultActivateApp,
  buildActivateCommand
};
