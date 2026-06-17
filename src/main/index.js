const { app, shell } = require('electron');
const { bootstrapApp } = require('./app-controller');

let controller = null;

app.whenReady().then(() => {
  controller = bootstrapApp({
    app,
    openExternal(url) {
      return shell.openExternal(url);
    }
  });
});

app.on('before-quit', () => {
  if (controller && typeof controller.shutdown === 'function') {
    controller.shutdown();
  }
});

app.on('activate', () => {
  if (!controller) {
    controller = bootstrapApp({
      app,
      openExternal(url) {
        return shell.openExternal(url);
      }
    });
  }
});
