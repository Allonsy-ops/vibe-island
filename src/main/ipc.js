const { ipcMain } = require('electron');

function registerIpc({ getSnapshot, runAction }) {
  ipcMain.handle('vibe:get-snapshot', () => getSnapshot());
  ipcMain.handle('vibe:run-action', (_event, action) => runAction(action));
}

module.exports = {
  registerIpc
};
