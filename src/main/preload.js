const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibeIsland', {
  getSnapshot() {
    return ipcRenderer.invoke('vibe:get-snapshot');
  },
  runAction(action) {
    return ipcRenderer.invoke('vibe:run-action', action);
  },
  closeWindow() {
    return ipcRenderer.invoke('vibe:close-window');
  },
  openFeedback() {
    return ipcRenderer.invoke('vibe:open-feedback');
  },
  onSnapshot(listener) {
    ipcRenderer.on('vibe:snapshot', (_event, snapshot) => listener(snapshot));
  }
});
