const test = require('node:test');
const assert = require('node:assert/strict');

test('app controller exports a bootstrap function', async () => {
  const controller = require('../src/main/app-controller');
  assert.equal(typeof controller.bootstrapApp, 'function');
});

test('bootstrapApp returns broker-backed methods', () => {
  const { bootstrapApp } = require('../src/main/app-controller');
  const shell = bootstrapApp({
    createWindow() {
      return { webContents: { send() {} } };
    },
    registerIpc() {},
    createConnectors() {
      return {};
    },
    setIntervalImpl() {
      return { mocked: true };
    }
  });

  assert.equal(typeof shell.getSnapshot, 'function');
  assert.equal(typeof shell.runAction, 'function');
});
