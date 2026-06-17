const { ipcMain } = require('electron');

function registerIpc({ getSnapshot, runAction, closeWindow, openFeedback }) {
  const handlers = [
    ['vibe:get-snapshot', () => getSnapshot()],
    ['vibe:run-action', (_event, action) => runAction(action)],
    ['vibe:close-window', () => closeWindow()],
    ['vibe:open-feedback', () => openFeedback()]
  ];

  for (const [channel, handler] of handlers) {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
  }

  return () => {
    for (const [channel] of handlers) {
      ipcMain.removeHandler(channel);
    }
  };
}

module.exports = {
  registerIpc
};
