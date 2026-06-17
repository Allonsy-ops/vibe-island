const path = require('node:path');
const { BrowserWindow, screen } = require('electron');

function computeOverlayBounds(display, platform = process.platform) {
  const width = platform === 'win32' ? 376 : 360;
  const height = 146;
  const availableBounds = display.workArea || display.bounds;

  return {
    width,
    height,
    x: Math.floor(availableBounds.x + availableBounds.width / 2 - width / 2),
    y: platform === 'win32' ? availableBounds.y + 10 : availableBounds.y - 4
  };
}

function createOverlayWindow() {
  const display = screen.getPrimaryDisplay();
  const bounds = computeOverlayBounds(display);

  const win = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    }
  });

  if (typeof win.setVisibleOnAllWorkspaces === 'function') {
    win.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    });
  }

  if (typeof win.setAlwaysOnTop === 'function') {
    win.setAlwaysOnTop(true, 'screen-saver');
  }

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  return win;
}

module.exports = {
  createOverlayWindow,
  computeOverlayBounds
};
