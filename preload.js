const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibeIsland', {
  getSnapshot() {
    return ipcRenderer.invoke('vibe:get-snapshot');
  },
  runAction(action) {
    return ipcRenderer.invoke('vibe:run-action', action);
  },
  onSnapshot(listener) {
    ipcRenderer.on('vibe:snapshot', (_event, snapshot) => listener(snapshot));
  }
});
