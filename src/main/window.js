const path = require('node:path');
const { BrowserWindow, screen } = require('electron');

function createOverlayWindow() {
  const display = screen.getPrimaryDisplay();
  const width = 440;
  const height = 180;
  const x = Math.floor(display.bounds.width / 2 - width / 2);
  const y = 10;

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload.js')
    }
  });

  win.loadFile('index.html');
  return win;
}

module.exports = {
  createOverlayWindow
};
