const test = require('node:test');
const assert = require('node:assert/strict');

test('app controller exports a bootstrap function', async () => {
  const controller = require('../src/main/app-controller');
  assert.equal(typeof controller.bootstrapApp, 'function');
});
