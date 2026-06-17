const path = require('node:path');
const { createWatchBridge } = require('./watch-bridge');
const { bridgePayloadToEvent } = require('../src/shared/bridge-schema');
const { adaptSourcePayload } = require('../src/shared/source-adapters');

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    result[key] = value;
    index += 1;
  }

  return result;
}

function createPresetBridge(presetName, args) {
  if (!args.file) {
    throw new Error(`watch:${presetName} requires --file`);
  }

  return createWatchBridge({
    inputFile: path.resolve(args.file),
    outputFile: args.out ? path.resolve(args.out) : undefined,
    toEvent(payload) {
      return bridgePayloadToEvent(adaptSourcePayload(presetName, payload));
    }
  });
}

function main() {
  const presetName = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  const bridge = createPresetBridge(presetName, args);
  bridge.start();
  process.stdout.write(`Watching ${path.resolve(args.file)} as ${presetName}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  createPresetBridge
};
