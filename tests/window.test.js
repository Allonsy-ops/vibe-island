const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

function withWindowModule(run) {
  const originalLoad = Module._load;

  try {
    Module._load = function patchedLoad(request, parent, isMain) {
      if (request === 'electron') {
        return {
          BrowserWindow: function BrowserWindow() {},
          screen: {}
        };
      }

      return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[require.resolve('../src/main/window')];
    return run(require('../src/main/window'));
  } finally {
    Module._load = originalLoad;
  }
}

test('computeOverlayBounds centers macOS overlay at the top edge', () => {
  const bounds = withWindowModule(({ computeOverlayBounds }) => computeOverlayBounds({
    workArea: { x: 0, y: 0, width: 1512, height: 982 }
  }, 'darwin'));

  assert.deepEqual(bounds, {
    width: 360,
    height: 146,
    x: 576,
    y: -4
  });
});

test('computeOverlayBounds offsets Windows overlay below the top edge', () => {
  const bounds = withWindowModule(({ computeOverlayBounds }) => computeOverlayBounds({
    workArea: { x: 0, y: 0, width: 1920, height: 1040 }
  }, 'win32'));

  assert.deepEqual(bounds, {
    width: 376,
    height: 146,
    x: 772,
    y: 10
  });
});
